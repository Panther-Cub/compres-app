import { BrowserWindow } from 'electron';
import { sendCompressionEvent } from './utils';
import { MemoryManager, MemoryUtils } from './memory-manager';
import { getFileName } from '../../utils/formatters';

export interface BatchProgressTask {
  taskKey: string;
  fileName: string;
  presetKey: string;
  status: 'pending' | 'compressing' | 'completed' | 'error' | 'cancelled' | 'failed';
  progress: number;
  startTime: number;
  outputPath?: string;
  error?: string;
  isExecuting?: boolean; // Track if task is currently being executed
}

export interface BatchProgressState {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  overallProgress: number;
  estimatedTimeRemaining: number;
  activeTasks: Map<string, BatchProgressTask>;
  allTasks: Map<string, BatchProgressTask>; // Track all tasks including completed ones
}

export class BatchProgressManager {
  private state: BatchProgressState;
  private mainWindow: BrowserWindow;
  private progressUpdateInterval: NodeJS.Timeout | null = null;
  private lastProgressUpdate = 0;
  private readonly PROGRESS_UPDATE_THROTTLE = 100; // Increased back to 100ms to reduce memory pressure
  private memoryManager: MemoryManager;
  private isInitialized: boolean = false;
  private isCleaningUp: boolean = false;
  private executingTasks: Set<string> = new Set(); // Track currently executing tasks

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.memoryManager = MemoryManager.getInstance();
    this.state = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cancelledTasks: 0,
      overallProgress: 0,
      estimatedTimeRemaining: 0,
      activeTasks: new Map(),
      allTasks: new Map()
    };
  }

  /**
   * Initialize batch progress tracking
   */
  initializeBatch(files: string[], presetConfigs: Array<{ presetId: string; keepAudio: boolean }>): void {
    try {
      // Stop any existing progress updates before reinitializing
      this.stopProgressUpdates();
      
      // Clear executing tasks set
      this.executingTasks.clear();
      
      // Reset state completely
      this.state = {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        cancelledTasks: 0,
        overallProgress: 0,
        estimatedTimeRemaining: 0,
        activeTasks: new Map(),
        allTasks: new Map()
      };

      // Create tasks for all file/preset combinations
      for (const file of files) {
        for (const presetConfig of presetConfigs) {
          const fileName = getFileName(file);
          const taskKey = `${fileName}::${presetConfig.presetId}`;
          
          console.log(`Creating task with key: ${taskKey}`);
          
          const task: BatchProgressTask = {
            taskKey,
            fileName,
            presetKey: presetConfig.presetId,
            status: 'pending',
            progress: 0,
            startTime: Date.now(),
            isExecuting: false
          };
          
          this.state.activeTasks.set(taskKey, task);
          this.state.allTasks.set(taskKey, task);
        }
      }

      this.state.totalTasks = this.state.activeTasks.size;
      this.isInitialized = true;
      this.isCleaningUp = false;
      
      console.log(`Batch initialized with ${this.state.totalTasks} total tasks`);
      console.log('Active task keys:', Array.from(this.state.activeTasks.keys()));
      
      // Start progress update interval with more frequent updates
      this.startProgressUpdates();
    } catch (error) {
      console.error('Error initializing batch:', error);
      throw error;
    }
  }

  /**
   * Start progress update interval for smooth UI updates
   */
  private startProgressUpdates(): void {
    try {
      if (this.progressUpdateInterval) {
        clearInterval(this.progressUpdateInterval);
        this.progressUpdateInterval = null;
      }

      // Update progress at reasonable intervals to balance smoothness and memory usage
      this.progressUpdateInterval = setInterval(() => {
        if (!this.isCleaningUp && this.isInitialized) {
          this.updateOverallProgress();
        }
      }, 100); // Increased back to 100ms to reduce memory pressure
      
      // Track interval with memory manager
      if (this.progressUpdateInterval) {
        this.memoryManager.trackProgressInterval(this.progressUpdateInterval);
      }
    } catch (error) {
      console.error('Error starting progress updates:', error);
    }
  }

  /**
   * Stop progress updates
   */
  private stopProgressUpdates(): void {
    try {
      if (this.progressUpdateInterval) {
        this.memoryManager.removeProgressInterval(this.progressUpdateInterval);
        clearInterval(this.progressUpdateInterval);
        this.progressUpdateInterval = null;
      }
    } catch (error) {
      console.error('Error stopping progress updates:', error);
    }
  }

  /**
   * Check if a task is already being executed
   */
  isTaskExecuting(taskKey: string): boolean {
    return this.executingTasks.has(taskKey);
  }

  /**
   * Mark task as being executed to prevent duplicates
   */
  markTaskExecuting(taskKey: string): boolean {
    if (this.executingTasks.has(taskKey)) {
      console.warn(`Task ${taskKey} is already being executed, skipping duplicate`);
      return false;
    }
    
    this.executingTasks.add(taskKey);
    return true;
  }

  /**
   * Update individual task progress
   */
  updateTaskProgress(taskKey: string, progress: number): void {
    try {
      if (this.isCleaningUp || !this.isInitialized) {
        return;
      }

      console.log(`Looking for task key: ${taskKey}`);
      console.log('Available task keys:', Array.from(this.state.allTasks.keys()));

      const task = this.state.allTasks.get(taskKey);
      if (!task) {
        console.warn(`Task not found for progress update: ${taskKey}`);
        return;
      }

      this.updateTaskProgressInternal(task, progress);
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  }

  /**
   * Internal method to update task progress
   */
  private updateTaskProgressInternal(task: BatchProgressTask, progress: number): void {
    const now = Date.now();
    // Reduced throttling for more fluid updates
    if (now - this.lastProgressUpdate < this.PROGRESS_UPDATE_THROTTLE) {
      return; // Throttle updates
    }

    task.progress = Math.max(0, Math.min(100, progress));
    task.status = 'compressing';
    this.lastProgressUpdate = now;

    // Send individual task progress with more precision
    try {
      sendCompressionEvent('compression-progress', {
        type: 'compression-progress',
        taskKey: task.taskKey,
        file: task.fileName,
        preset: task.presetKey,
        progress: task.progress,
        timemark: this.formatTime(task.progress)
      }, this.mainWindow);
    } catch (error) {
      console.warn('Error sending compression progress event:', error);
    }
  }

  /**
   * Mark task as started
   */
  markTaskStarted(taskKey: string): void {
    try {
      if (this.isCleaningUp || !this.isInitialized) {
        return;
      }

      const task = this.state.allTasks.get(taskKey);
      if (!task) {
        console.warn(`Task not found for start: ${taskKey}`);
        return;
      }

      task.status = 'compressing';
      task.startTime = Date.now();
      task.isExecuting = true;
      
      // Add to active tasks when it starts
      this.state.activeTasks.set(taskKey, task);
    } catch (error) {
      console.error('Error marking task started:', error);
    }
  }

  /**
   * Mark task as completed
   */
  markTaskCompleted(taskKey: string, outputPath?: string): void {
    try {
      if (this.isCleaningUp || !this.isInitialized) {
        return;
      }

      const task = this.state.allTasks.get(taskKey);
      if (!task) {
        console.warn(`Task not found for completion: ${taskKey}`);
        return;
      }

      task.status = 'completed';
      task.progress = 100;
      task.outputPath = outputPath;
      task.isExecuting = false;
      this.state.completedTasks++;
      console.log(`Task completed: ${taskKey}`);
      
      // Remove from executing tasks set
      this.executingTasks.delete(taskKey);
      
      // Remove from active tasks (no longer running) but keep in allTasks
      this.state.activeTasks.delete(taskKey);
    } catch (error) {
      console.error(`Error marking task completed: ${taskKey}`, error);
    }
  }

  /**
   * Mark task as failed
   */
  markTaskFailed(taskKey: string, error: string): void {
    try {
      if (this.isCleaningUp || !this.isInitialized) {
        return;
      }

      const task = this.state.allTasks.get(taskKey);
      if (!task) {
        console.warn(`Task not found for failure: ${taskKey}`);
        return;
      }

      task.status = 'failed';
      task.error = error;
      task.isExecuting = false;
      this.state.failedTasks++;
      console.log(`Task failed: ${taskKey} - ${error}`);
      
      // Remove from executing tasks set
      this.executingTasks.delete(taskKey);
      
      // Remove from active tasks (no longer running) but keep in allTasks
      this.state.activeTasks.delete(taskKey);
    } catch (error) {
      console.error(`Error marking task failed: ${taskKey}`, error);
    }
  }

  /**
   * Mark task as cancelled
   */
  markTaskCancelled(taskKey: string): void {
    try {
      if (this.isCleaningUp || !this.isInitialized) {
        return;
      }

      const task = this.state.allTasks.get(taskKey);
      if (!task) {
        console.warn(`Task not found for cancellation: ${taskKey}`);
        return;
      }

      task.status = 'cancelled';
      task.isExecuting = false;
      this.state.cancelledTasks++;
      console.log(`Task cancelled: ${taskKey}`);
      
      // Remove from executing tasks set
      this.executingTasks.delete(taskKey);
      
      // Remove from active tasks (no longer running) but keep in allTasks
      this.state.activeTasks.delete(taskKey);
    } catch (error) {
      console.error(`Error marking task cancelled: ${taskKey}`, error);
    }
  }

  /**
   * Update overall batch progress
   */
  private updateOverallProgress(): void {
    try {
      if (this.isCleaningUp || !this.isInitialized) {
        return;
      }

      let totalProgress = 0;

      // Add progress from all tasks (including completed ones)
      for (const task of Array.from(this.state.allTasks.values())) {
        if (task.status === 'compressing') {
          totalProgress += task.progress;
        } else if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
          totalProgress += 100; // Completed tasks count as 100%
        }
      }

      // Calculate overall progress with more precision
      const overallProgress = this.state.totalTasks > 0 
        ? totalProgress / this.state.totalTasks
        : 0;

      this.state.overallProgress = overallProgress;
      this.calculateEstimatedTimeRemaining();

      // Send batch progress update with more precision
      sendCompressionEvent('batch-progress', {
        totalTasks: this.state.totalTasks,
        completedTasks: this.state.completedTasks,
        failedTasks: this.state.failedTasks,
        cancelledTasks: this.state.cancelledTasks,
        overallProgress,
        estimatedTimeRemaining: this.state.estimatedTimeRemaining
      }, this.mainWindow);
    } catch (error) {
      console.error('Error updating overall progress:', error);
    }
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTimeRemaining(): void {
    try {
      const completedTasks = this.state.completedTasks + this.state.failedTasks + this.state.cancelledTasks;
      if (completedTasks === 0) {
        this.state.estimatedTimeRemaining = 0;
        return;
      }

      // For now, use a simple estimation since we don't track completed task times
      // This could be enhanced by storing completion times separately
      const remainingTasks = this.state.totalTasks - completedTasks;
      const estimatedTimePerTask = 30000; // 30 seconds per task as a rough estimate
      this.state.estimatedTimeRemaining = Math.round(estimatedTimePerTask * remainingTasks);
    } catch (error) {
      console.error('Error calculating estimated time:', error);
      this.state.estimatedTimeRemaining = 0;
    }
  }

  /**
   * Get current batch state
   */
  getBatchState(): BatchProgressState {
    return { ...this.state };
  }

  /**
   * Check if batch is complete
   */
  isBatchComplete(): boolean {
    const completedCount = Array.from(this.state.allTasks.values()).filter(task => 
      task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'
    ).length;
    return completedCount >= this.state.totalTasks;
  }

  /**
   * Get batch completion summary
   */
  getBatchSummary(): {
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
    successRate: number;
    errors: string[];
  } {
    try {
      const errors: string[] = [];
      for (const task of Array.from(this.state.activeTasks.values())) {
        if (task.error) {
          errors.push(`${task.fileName} (${task.presetKey}): ${task.error}`);
        }
      }

      const successRate = this.state.totalTasks > 0 
        ? Math.round((this.state.completedTasks / this.state.totalTasks) * 100)
        : 0;

      return {
        total: this.state.totalTasks,
        completed: this.state.completedTasks,
        failed: this.state.failedTasks,
        cancelled: this.state.cancelledTasks,
        successRate,
        errors
      };
    } catch (error) {
      console.error('Error getting batch summary:', error);
      return {
        total: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        successRate: 0,
        errors: []
      };
    }
  }

  /**
   * Cancel all active tasks
   */
  cancelAllTasks(): void {
    try {
      for (const task of Array.from(this.state.activeTasks.values())) {
        if (task.status === 'compressing' || task.status === 'pending') {
          this.markTaskCancelled(task.taskKey);
        }
      }
    } catch (error) {
      console.error('Error cancelling all tasks:', error);
    }
  }

  /**
   * Cleanup batch progress manager
   */
  cleanup(): void {
    try {
      console.log('BatchProgressManager: Starting cleanup...');
      this.isCleaningUp = true;
      this.isInitialized = false;
      
      this.stopProgressUpdates();
      
      // Clear executing tasks set
      this.executingTasks.clear();
      
      // Clear active tasks map
      MemoryUtils.clearMap(this.state.activeTasks, 'batch progress active tasks');
      
      // Clear all tasks map
      MemoryUtils.clearMap(this.state.allTasks, 'batch progress all tasks');
      
      // Reset state
      this.state = {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        cancelledTasks: 0,
        overallProgress: 0,
        estimatedTimeRemaining: 0,
        activeTasks: new Map(),
        allTasks: new Map()
      };
      
      MemoryUtils.logMemoryUsage('After batch progress cleanup');
      console.log('BatchProgressManager: Cleanup completed');
    } catch (error) {
      console.error('Error during batch progress cleanup:', error);
    }
  }

  /**
   * Format time for display
   */
  private formatTime(percent: number): string {
    try {
      // Simple time formatting - could be enhanced
      const minutes = Math.floor(percent / 20);
      const seconds = Math.floor((percent % 20) * 3);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:00`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '00:00:00';
    }
  }
}
