import { BrowserWindow } from 'electron';
import { sendCompressionEvent } from './utils';

export interface BatchProgressTask {
  taskKey: string;
  fileName: string;
  presetKey: string;
  status: 'pending' | 'compressing' | 'completed' | 'error' | 'cancelled' | 'failed';
  progress: number;
  startTime: number;
  outputPath?: string;
  error?: string;
}

export interface BatchProgressState {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  overallProgress: number;
  estimatedTimeRemaining: number;
  activeTasks: Map<string, BatchProgressTask>;
}

export class BatchProgressManager {
  private state: BatchProgressState;
  private mainWindow: BrowserWindow;
  private progressUpdateInterval: NodeJS.Timeout | null = null;
  private lastProgressUpdate = 0;
  private readonly PROGRESS_UPDATE_THROTTLE = 50; // Reduced from 100ms to 50ms for more fluid updates

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.state = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cancelledTasks: 0,
      overallProgress: 0,
      estimatedTimeRemaining: 0,
      activeTasks: new Map()
    };
  }

  /**
   * Initialize batch progress tracking
   */
  initializeBatch(files: string[], presetConfigs: Array<{ presetId: string; keepAudio: boolean }>): void {
    this.state = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cancelledTasks: 0,
      overallProgress: 0,
      estimatedTimeRemaining: 0,
      activeTasks: new Map()
    };

    // Create tasks for all file/preset combinations
    for (const file of files) {
      for (const presetConfig of presetConfigs) {
        const taskKey = `${file}::${presetConfig.presetId}`;
        const fileName = file.split('/').pop() || file;
        
        this.state.activeTasks.set(taskKey, {
          taskKey,
          fileName,
          presetKey: presetConfig.presetId,
          status: 'pending',
          progress: 0,
          startTime: Date.now()
        });
      }
    }

    this.state.totalTasks = this.state.activeTasks.size;
    console.log(`Batch initialized with ${this.state.totalTasks} total tasks`);
    
    // Start progress update interval with more frequent updates
    this.startProgressUpdates();
  }

  /**
   * Start progress update interval for smooth UI updates
   */
  private startProgressUpdates(): void {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
    }

    // Update more frequently for smoother progress
    this.progressUpdateInterval = setInterval(() => {
      this.updateOverallProgress();
    }, 50); // Reduced from 100ms to 50ms
  }

  /**
   * Stop progress updates
   */
  private stopProgressUpdates(): void {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
      this.progressUpdateInterval = null;
    }
  }

  /**
   * Update individual task progress
   */
  updateTaskProgress(taskKey: string, progress: number): void {
    const task = this.state.activeTasks.get(taskKey);
    if (!task) {
      console.warn(`Task not found for progress update: ${taskKey}`);
      return;
    }

    const now = Date.now();
    // Reduced throttling for more fluid updates
    if (now - this.lastProgressUpdate < this.PROGRESS_UPDATE_THROTTLE) {
      return; // Throttle updates
    }

    task.progress = Math.max(0, Math.min(100, progress));
    task.status = 'compressing';
    this.lastProgressUpdate = now;

    // Send individual task progress with more precision
    sendCompressionEvent('compression-progress', {
      file: task.fileName,
      preset: task.presetKey,
      percent: task.progress,
      timemark: this.formatTime(task.progress)
    }, this.mainWindow);
  }

  /**
   * Mark task as started
   */
  markTaskStarted(taskKey: string): void {
    const task = this.state.activeTasks.get(taskKey);
    if (task) {
      task.status = 'compressing';
      task.startTime = Date.now();
    }
  }

  /**
   * Mark task as completed
   */
  markTaskCompleted(taskKey: string, outputPath?: string): void {
    const task = this.state.activeTasks.get(taskKey);
    if (task) {
      task.status = 'completed';
      task.progress = 100;
      task.outputPath = outputPath;
      this.state.completedTasks++;
    }
  }

  /**
   * Mark task as failed
   */
  markTaskFailed(taskKey: string, error: string): void {
    const task = this.state.activeTasks.get(taskKey);
    if (task) {
      task.status = 'failed';
      task.error = error;
      this.state.failedTasks++;
    }
  }

  /**
   * Mark task as cancelled
   */
  markTaskCancelled(taskKey: string): void {
    const task = this.state.activeTasks.get(taskKey);
    if (task) {
      task.status = 'cancelled';
      this.state.cancelledTasks++;
    }
  }

  /**
   * Update overall batch progress
   */
  private updateOverallProgress(): void {
    let totalProgress = 0;

    for (const task of Array.from(this.state.activeTasks.values())) {
      if (task.status === 'compressing') {
        totalProgress += task.progress;
      } else if (task.status === 'completed') {
        totalProgress += 100;
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
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTimeRemaining(): void {
    const completedTasks = this.state.completedTasks + this.state.failedTasks + this.state.cancelledTasks;
    if (completedTasks === 0) {
      this.state.estimatedTimeRemaining = 0;
      return;
    }

    // Calculate average time per task
    let totalTime = 0;
    let taskCount = 0;

    for (const task of Array.from(this.state.activeTasks.values())) {
      if (task.status === 'completed' || task.status === 'failed') {
        const duration = Date.now() - task.startTime;
        totalTime += duration;
        taskCount++;
      }
    }

    if (taskCount === 0) {
      this.state.estimatedTimeRemaining = 0;
      return;
    }

    const averageTimePerTask = totalTime / taskCount;
    const remainingTasks = this.state.totalTasks - completedTasks;
    this.state.estimatedTimeRemaining = Math.round(averageTimePerTask * remainingTasks);
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
    return this.state.completedTasks + this.state.failedTasks + this.state.cancelledTasks >= this.state.totalTasks;
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
  }

  /**
   * Cancel all active tasks
   */
  cancelAllTasks(): void {
    for (const task of Array.from(this.state.activeTasks.values())) {
      if (task.status === 'compressing' || task.status === 'pending') {
        this.markTaskCancelled(task.taskKey);
      }
    }
  }

  /**
   * Cleanup batch progress manager
   */
  cleanup(): void {
    this.stopProgressUpdates();
    this.state.activeTasks.clear();
  }

  /**
   * Format time for display
   */
  private formatTime(percent: number): string {
    // Simple time formatting - could be enhanced
    const minutes = Math.floor(percent / 20);
    const seconds = Math.floor((percent % 20) * 3);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:00`;
  }
}
