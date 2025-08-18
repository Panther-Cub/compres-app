import { BrowserWindow } from 'electron';
import fs from 'fs';
import { 
  CompressionResult, 
  AdvancedCompressionSettings
} from './types';
import { videoPresets } from './presets';
import {
  sendCompressionEvent,
  createTaskKey,
  getFileName,
  buildOutputPath
} from './utils';
import {
  compressFileWithPreset,
  compressWithSinglePass,
  compressWithTwoPass,
  BaseCompressionStrategy
} from './strategies';
import { HardwareDetection } from './hardware-detection';
import { BatchProgressManager } from './batch-progress-manager';
import { CompressionErrorHandler } from './error-handler';
import { Settings } from '../utils/settings';
import { MemoryManager, MemoryUtils } from './memory-manager';
import { ThermalMonitor, ThermalStatus } from './thermal-monitor';

// Manager class to handle compression operations
export class CompressionManager {
  private mainWindow: BrowserWindow;
  private maxConcurrentCompressions: number;
  private maxVideosPerBatch: number = 10; // Configurable maximum videos per batch
  private batchProgressManager: BatchProgressManager;
  private isCancelled: boolean = false;
  private compressionQueue: Promise<CompressionResult>[] = [];
  private runningCompressions: number = 0;
  private userSetConcurrency: boolean = false; // Track if user explicitly set concurrency
  private memoryManager: MemoryManager;
  private memoryMonitorInterval: NodeJS.Timeout | null = null;
  private thermalMonitor: ThermalMonitor;
  private isPausedForThermal: boolean = false;
  private thermalInitialized: boolean = false;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.batchProgressManager = new BatchProgressManager(mainWindow);
    this.maxConcurrentCompressions = Math.max(1, Math.min(4, require('os').cpus().length - 1));
    this.memoryManager = MemoryManager.getInstance();
    this.memoryManager.initialize(mainWindow);
    this.thermalMonitor = ThermalMonitor.getInstance();
    this.initializeThermalMonitoring();
  }

  /**
   * Initialize thermal monitoring
   */
  private initializeThermalMonitoring(): void {
    try {
      if (this.thermalInitialized) {
        return;
      }
      // Load thermal settings from user preferences
      const startupSettings = Settings.getStartupSettings();
      if (startupSettings.performanceSettings) {
        this.thermalMonitor.updateSettings(startupSettings.performanceSettings);
      }

      // Set up thermal monitoring event handlers
      this.thermalMonitor.on('throttling-changed', (isThrottling: boolean) => {
        this.handleThermalThrottlingChange(isThrottling);
      });

      this.thermalMonitor.on('action-recommended', (action: ThermalStatus['recommendedAction']) => {
        this.handleThermalActionRecommendation(action);
      });

      this.thermalMonitor.on('thermal-pressure-updated', (pressure: number) => {
        this.handleThermalPressureUpdate(pressure);
      });

      // Start thermal monitoring
      this.thermalMonitor.startMonitoring();

      this.thermalInitialized = true;

    } catch (error) {
      console.error('Error initializing thermal monitoring:', error);
    }
  }

  /**
   * Handle thermal throttling changes
   */
  private handleThermalThrottlingChange(isThrottling: boolean): void {
    console.log(`Thermal throttling ${isThrottling ? 'enabled' : 'disabled'}`);
    
    if (isThrottling) {
      this.adjustConcurrencyForThermal();
    }
  }

  /**
   * Handle thermal action recommendations
   */
  private async handleThermalActionRecommendation(action: ThermalStatus['recommendedAction']): Promise<void> {
    switch (action) {
      case 'pause':
        if (!this.isPausedForThermal) {
          console.log('Thermal action: Pausing compression due to high temperature/CPU usage');
          await this.pauseCompressionForThermal();
        }
        break;
      case 'resume':
        if (this.isPausedForThermal) {
          console.log('Thermal action: Resuming compression after thermal issues resolved');
          await this.resumeCompressionFromThermal();
        }
        break;
      case 'reduce_concurrency':
        console.log('Thermal action: Reducing compression concurrency due to thermal pressure');
        this.adjustConcurrencyForThermal();
        break;
      case 'normal':
        // No action needed, no logging
        break;
    }
  }

  /**
   * Handle thermal pressure updates
   */
  private async handleThermalPressureUpdate(pressure: number): Promise<void> {
    // Send thermal status to UI
    try {
      const status = await this.thermalMonitor.getCurrentStatus();
      sendCompressionEvent('thermal-status-updated', {
        type: 'thermal-status-updated',
        thermalPressure: pressure,
        isThrottling: status.isThrottling,
        recommendedAction: status.recommendedAction
      }, this.mainWindow);
    } catch (error) {
      console.warn('Error sending thermal status update:', error);
    }
  }

  /**
   * Pause compression due to thermal issues
   */
  private async pauseCompressionForThermal(): Promise<void> {
    if (this.isPausedForThermal) return;
    
    this.isPausedForThermal = true;
    console.log('Pausing compression due to thermal issues');
    
    try {
      const status = await this.thermalMonitor.getCurrentStatus();
      sendCompressionEvent('compression-paused-thermal', {
        type: 'compression-paused-thermal',
        reason: 'System temperature too high',
        thermalStatus: status
      }, this.mainWindow);
    } catch (error) {
      console.warn('Error sending thermal pause event:', error);
    }
  }

  /**
   * Resume compression after thermal issues resolve
   */
  private async resumeCompressionFromThermal(): Promise<void> {
    if (!this.isPausedForThermal) return;
    
    this.isPausedForThermal = false;
    console.log('Resuming compression after thermal issues resolved');
    
    try {
      const status = await this.thermalMonitor.getCurrentStatus();
      sendCompressionEvent('compression-resumed-thermal', {
        type: 'compression-resumed-thermal',
        thermalStatus: status
      }, this.mainWindow);
    } catch (error) {
      console.warn('Error sending thermal resume event:', error);
    }
  }

  /**
   * Adjust concurrency based on thermal status
   */
  private adjustConcurrencyForThermal(): void {
    if (!this.userSetConcurrency) {
      const recommendedConcurrency = this.thermalMonitor.getRecommendedConcurrency(this.maxConcurrentCompressions);
      if (recommendedConcurrency !== this.maxConcurrentCompressions) {
        console.log(`Adjusting concurrency from ${this.maxConcurrentCompressions} to ${recommendedConcurrency} due to thermal pressure`);
        this.maxConcurrentCompressions = recommendedConcurrency;
      }
    }
  }

  /**
   * Set maximum videos per batch (user configurable)
   */
  setMaxVideosPerBatch(maxVideos: number): void {
    this.maxVideosPerBatch = Math.max(1, Math.min(20, maxVideos)); // Limit between 1-20
  }

  /**
   * Get current maximum videos per batch
   */
  getMaxVideosPerBatch(): number {
    return this.maxVideosPerBatch;
  }

  /**
   * Get current maximum concurrent compressions
   */
  getMaxConcurrentCompressions(): number {
    return this.maxConcurrentCompressions;
  }

  /**
   * Get system recommendations for optimal performance
   */
  async getSystemRecommendations(): Promise<{
    maxConcurrent: number;
    maxVideosPerBatch: number;
    recommendedMaxVideos: number;
    hardwareAccelerated: boolean;
    chipType: string;
    memoryGB: number;
  }> {
    const capabilities = await HardwareDetection.detectCapabilities();
    const memoryGB = Math.round(require('os').totalmem() / (1024 * 1024 * 1024));
    
    // Calculate recommended max videos based on system capabilities
    let recommendedMaxVideos = 10; // Default
    if (capabilities.hasVideoToolbox) {
      if (memoryGB >= 16) {
        recommendedMaxVideos = 15;
      } else if (memoryGB >= 8) {
        recommendedMaxVideos = 10;
      } else {
        recommendedMaxVideos = 6;
      }
    } else {
      if (memoryGB >= 16) {
        recommendedMaxVideos = 8;
      } else if (memoryGB >= 8) {
        recommendedMaxVideos = 6;
      } else {
        recommendedMaxVideos = 4;
      }
    }
    
    return {
      maxConcurrent: this.maxConcurrentCompressions,
      maxVideosPerBatch: this.maxVideosPerBatch,
      recommendedMaxVideos,
      hardwareAccelerated: capabilities.hasVideoToolbox,
      chipType: capabilities.chipType,
      memoryGB
    };
  }

  /**
   * Initialize hardware detection and optimize settings
   */
  private async initializeHardwareOptimization(): Promise<void> {
    try {
      const capabilities = await HardwareDetection.detectCapabilities();
      const recommendedConcurrency = await HardwareDetection.getRecommendedConcurrency();
      
      // Only set maxConcurrentCompressions if user hasn't explicitly set it
      // This preserves user preferences while still providing hardware recommendations
      if (!this.userSetConcurrency) {
        this.maxConcurrentCompressions = recommendedConcurrency;
      }
      
      // Send hardware info to UI
      sendCompressionEvent('hardware-detected', {
        hasVideoToolbox: capabilities.hasVideoToolbox,
        recommendedCodec: capabilities.recommendedCodec,
        chipType: capabilities.chipType
      }, this.mainWindow);
    } catch (error) {
      // Hardware detection failed, using default settings
    }
  }

  /**
   * Process compression tasks with proper concurrency control
   * This ensures we don't overwhelm the system while maintaining parallelism
   */
  private async processWithConcurrencyControl<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
    const results: T[] = [];
    const maxConcurrent = this.maxConcurrentCompressions;
    
    // Process tasks in batches
    for (let i = 0; i < tasks.length; i += maxConcurrent) {
      const batch = tasks.slice(i, i + maxConcurrent);
      
      // Execute batch concurrently
      const batchPromises = batch.map((task) => {
        return task().catch(error => {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          } as T;
        });
      });
      
      // Wait for all tasks in this batch to complete
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j];
          
          if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
          } else if (result.status === 'rejected') {
            results.push({
              success: false,
              error: result.reason instanceof Error ? result.reason.message : 'Task rejected'
            } as T);
          }
        }
        
      } catch (error) {
        // Error in batch processing
      }
    }
    return results;
  }

  // Basic compression for multiple files
  async compressVideos(
    files: string[],
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>,
    outputDirectory: string,
    advancedSettings?: AdvancedCompressionSettings
  ): Promise<CompressionResult[]> {
    return this.compressVideosWithProgress(files, presetConfigs, outputDirectory, advancedSettings, false);
  }

  // Advanced compression for multiple files
  async compressVideosAdvanced(
    files: string[],
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>,
    outputDirectory: string,
    advancedSettings: AdvancedCompressionSettings
  ): Promise<CompressionResult[]> {
    return this.compressVideosWithProgress(files, presetConfigs, outputDirectory, advancedSettings, true);
  }

  /**
   * Unified compression method with progress tracking and error handling
   */
  private async compressVideosWithProgress(
    files: string[],
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>,
    outputDirectory: string,
    advancedSettings?: AdvancedCompressionSettings,
    isAdvanced: boolean = false
  ): Promise<CompressionResult[]> {
    // Reset cancellation state
    this.isCancelled = false;
    this.runningCompressions = 0;
    this.userSetConcurrency = false; // Reset user concurrency flag for new session
    
    // Get max concurrent compressions from system settings
    try {
      const startupSettings = Settings.getStartupSettings();
      if (startupSettings.performanceSettings?.maxConcurrentCompressions) {
        this.maxConcurrentCompressions = Math.max(1, Math.min(6, startupSettings.performanceSettings.maxConcurrentCompressions));
        this.userSetConcurrency = true;
      }
    } catch (error) {
      // Could not load performance settings, using default
    }
    
    // Validate batch size
    if (files.length > this.maxVideosPerBatch) {
      const error = `Too many videos selected (${files.length}). Maximum allowed is ${this.maxVideosPerBatch}. Please select fewer videos or increase the limit in settings.`;
      throw new Error(error);
    }
    
    // Validate that all files exist before starting compression
    const missingFiles: string[] = [];
    for (const file of files) {
      if (!fs.existsSync(file)) {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length > 0) {
      const error = `The following files no longer exist and cannot be compressed:\n${missingFiles.join('\n')}\n\nPlease re-select the files and try again.`;
      throw new Error(error);
    }
    
    // Calculate total tasks and validate
    const totalTasks = files.length * presetConfigs.length;
    const estimatedTimeMinutes = Math.ceil(totalTasks / this.maxConcurrentCompressions) * 2; // Rough estimate: 2 minutes per task
    
    // Warn about large task counts
    if (totalTasks > 20) {
      const warning = `Warning: You're about to create ${totalTasks} compression tasks. This may take a very long time (~${estimatedTimeMinutes} minutes). Consider reducing the number of files or presets.`;
      
      // Send warning to UI
      sendCompressionEvent('compression-warning', {
        type: 'compression-warning',
        message: warning,
        totalTasks,
        estimatedTimeMinutes,
        maxConcurrent: this.maxConcurrentCompressions
      }, this.mainWindow);
    }
    
    // Hard limit to prevent system overload (raised for larger batch operations)
    if (totalTasks > 500) {
      const error = `Too many compression tasks (${totalTasks}). Maximum allowed is 500. Please select fewer files or presets.`;
      throw new Error(error);
    }
    
    // Initialize hardware optimization
    await this.initializeHardwareOptimization();
    

    
    // Log memory usage before compression
    MemoryUtils.logMemoryUsage('Before compression batch');
    
    // Clean up any existing batch progress before initializing new one
    try {
      this.batchProgressManager.cleanup();
      // Add a small delay to ensure cleanup is complete before starting new batch
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Error cleaning up previous batch progress
    }
    
    // Initialize batch progress tracking
    this.batchProgressManager.initializeBatch(files, presetConfigs);
    
    // Start memory monitoring
    this.startMemoryMonitoring();
    
    // Track file indices for duplicate filename handling
    const fileIndices = new Map<string, number>();
    
    // Create compression tasks (not promises yet)
    const compressionTasks: (() => Promise<CompressionResult>)[] = [];
    
    // Deduplicate inputs to avoid duplicate tasks
    const uniqueFiles = Array.from(new Set(files));
    const uniquePresetConfigs = Array.from(
      new Map(presetConfigs.map(pc => [pc.presetId, pc])).values()
    );

    // Track created task keys to ensure tasks are enqueued only once
    const createdTaskKeys = new Set<string>();

    // Create all compression tasks upfront with hardware optimization
    for (const file of uniqueFiles) {
      for (const presetConfig of uniquePresetConfigs) {
        const preset = videoPresets[presetConfig.presetId];
        if (!preset) {
          continue;
        }
        
        // Get file index for duplicate filename handling
        const fileName = getFileName(file);
        const currentIndex = fileIndices.get(fileName) || 0;
        fileIndices.set(fileName, currentIndex + 1);
        
        // Optimize codec based on hardware capabilities
        const optimizedPreset = await this.optimizePresetForHardware(preset);
        
        // Send initial progress for all files (0%)
        const taskKey = createTaskKey(fileName, presetConfig.presetId);

        // Skip if we already created this exact task
        if (createdTaskKeys.has(taskKey)) {
          continue;
        }
        
        // Check for custom output naming preferences
        let customOutputName = null;
        try {
          customOutputName = await this.getCustomOutputName(file);
          if (customOutputName) {
            // Found custom output name
          }
        } catch (_) {}
        
        const outputPath = buildOutputPath(file, presetConfig.presetId, outputDirectory, optimizedPreset.settings.videoCodec, presetConfig.keepAudio, currentIndex, customOutputName || undefined);
        if (customOutputName) {
          console.log(`Final output path: ${outputPath}`);
        }
        
        sendCompressionEvent('compression-started', {
          type: 'compression-started',
          taskKey: taskKey,
          file: fileName,
          preset: presetConfig.presetId,
          outputPath
        }, this.mainWindow);
        
        // Mark as created so we do not enqueue duplicates
        createdTaskKeys.add(taskKey);

        // Create task function (not executing yet)
        const compressionTask = () => this.compressFileWithErrorHandling(
          file, 
          presetConfig.presetId, 
          optimizedPreset, 
          presetConfig.keepAudio, 
          outputDirectory, 
          advancedSettings, 
          taskKey, 
          currentIndex,
          isAdvanced
        );
        
        compressionTasks.push(compressionTask);
      }
    }
    
    // Process compressions with proper concurrency control
    try {
      const results = await this.processWithConcurrencyControl(compressionTasks);
      // All compressions completed
      return results;
    } catch (error) {
      console.error('Batch compression failed:', error);
      const compressionError = CompressionErrorHandler.handleSystemError(error as Error, {});
      CompressionErrorHandler.logError(compressionError, {});
      throw error;
    } finally {
      // Cleanup batch progress manager
      try {
        this.batchProgressManager.cleanup();
      } catch (error) {
        console.error('Error cleaning up batch progress manager:', error);
      }
      
      this.runningCompressions = 0;
      
      // Clean up memory using centralized memory manager
      try {
        this.memoryManager.cleanupCompression();
      } catch (error) {
        console.error('Error cleaning up memory manager:', error);
      }
      
      // Check for memory leaks
      try {
        this.memoryManager.checkForLeaks();
      } catch (error) {
        console.error('Error checking for memory leaks:', error);
      }
      
      // Log memory usage after cleanup
      MemoryUtils.logMemoryUsage('After compression batch');
      this.stopMemoryMonitoring(); // Stop monitoring after compression
    }
  }

  /**
   * Compress a single file with comprehensive error handling
   */
  private async compressFileWithErrorHandling(
    file: string,
    presetKey: string,
    preset: any,
    keepAudio: boolean,
    outputDirectory: string,
    advancedSettings: any,
    taskKey: string,
    fileIndex: number,
    isAdvanced: boolean
  ): Promise<CompressionResult> {
    const fileName = getFileName(file);
    
    // Check if task is already being executed to prevent duplicates
    if (this.batchProgressManager.isTaskExecuting(taskKey)) {
      console.warn(`Task ${taskKey} is already being executed, skipping duplicate`);
      return {
        file: fileName,
        preset: presetKey,
        error: 'Task already being executed',
        success: false
      };
    }
    
    // Mark task as executing to prevent duplicates
    if (!this.batchProgressManager.markTaskExecuting(taskKey)) {
      return {
        file: fileName,
        preset: presetKey,
        error: 'Task already being executed',
        success: false
      };
    }
    
    // Check for custom output naming preferences
    let customOutputName = null;
    try {
      customOutputName = await this.getCustomOutputName(file);
      if (customOutputName) {
        // Found custom output name
      }
    } catch (_) {}
    
    try {
      // Track running compressions with better synchronization
      this.runningCompressions++;
      // Starting compression
      
      // Mark task as started in batch progress
      try {
        this.batchProgressManager.markTaskStarted(taskKey);
      } catch (error) {
        console.warn(`Failed to mark task started: ${error}`);
      }
      
      // Validate codec support
      let isCodecSupported = true;
      try {
        isCodecSupported = await HardwareDetection.isCodecSupported(preset.settings.videoCodec);
        if (!isCodecSupported) {
          const fallbackCodec = await HardwareDetection.getFallbackCodec(preset.settings.videoCodec);
          console.warn(`Codec ${preset.settings.videoCodec} not supported, using fallback: ${fallbackCodec}`);
          preset.settings.videoCodec = fallbackCodec;
        }
      } catch (error) {
        console.warn(`Hardware detection failed for ${fileName}:`, error);
        // Continue with current codec
      }
      
      // Perform compression
      let result: CompressionResult;
      try {
        if (isAdvanced) {
          result = await this.compressFileWithAdvancedSettings(file, presetKey, preset, keepAudio, outputDirectory, advancedSettings, taskKey, fileIndex);
        } else {
          result = await compressFileWithPreset(file, presetKey, preset, keepAudio, outputDirectory, taskKey, this.mainWindow, advancedSettings, this.batchProgressManager, customOutputName || undefined);
        }
      } catch (compressionError) {
        console.error(`Compression failed for ${fileName}:`, compressionError);
        throw compressionError;
      }
      
      // Mark task as completed
      try {
        this.batchProgressManager.markTaskCompleted(taskKey, result.outputPath);
      } catch (error) {
        console.warn(`Failed to mark task completed: ${error}`);
      }
      
      // Compression completed successfully
      return result;
      
    } catch (error) {
      console.error(`Error compressing ${fileName} with preset ${presetKey}:`, error);
      
      // Handle different types of errors
      let compressionError;
      try {
        if (error instanceof Error) {
          if (error.message.includes('cancelled') || this.isCancelled) {
            compressionError = CompressionErrorHandler.handleCancellationError({ fileName, presetKey });
            try {
              this.batchProgressManager.markTaskCancelled(taskKey);
            } catch (cancelError) {
              console.warn(`Failed to mark task cancelled: ${cancelError}`);
            }
          } else if (error.message.includes('ffmpeg')) {
            compressionError = CompressionErrorHandler.handleFFmpegError(error as any, { 
              fileName, 
              presetKey, 
              codec: preset.settings.videoCodec 
            });
          } else {
            compressionError = CompressionErrorHandler.handleSystemError(error, { fileName, presetKey });
          }
        } else {
          compressionError = CompressionErrorHandler.handleUnknownError(error as Error, { fileName, presetKey });
        }
      } catch (errorHandlerError) {
        console.error('Error in error handler:', errorHandlerError);
        compressionError = {
          type: 'unknown' as const,
          message: `Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          recoverable: true
        };
      }
      
      // Log error and mark task as failed
      try {
        CompressionErrorHandler.logError(compressionError, { fileName, presetKey, codec: preset.settings.videoCodec });
        this.batchProgressManager.markTaskFailed(taskKey, compressionError.message);
      } catch (error) {
        console.warn(`Failed to log error or mark task failed: ${error}`);
      }
      
      const errorResult: CompressionResult = { 
        file: fileName, 
        preset: presetKey, 
        error: compressionError.message, 
        success: false 
      };
      
      return errorResult;
    } finally {
      // Cleanup task from active compressions
      try {
        this.cleanupTask(taskKey);
      } catch (error) {
        console.warn(`Failed to cleanup task: ${error}`);
      }
      
      // Decrement running compressions with bounds checking
      this.runningCompressions = Math.max(0, this.runningCompressions - 1);
      // Compression task completed
    }
  }

  /**
   * Optimize preset based on hardware capabilities
   */
  private async optimizePresetForHardware(preset: any): Promise<any> {
    try {
      const capabilities = await HardwareDetection.detectCapabilities();
      
      // If hardware acceleration is available and preset doesn't use it, suggest hardware codec
      if (capabilities.hasVideoToolbox && !preset.settings.videoCodec.includes('videotoolbox')) {
        const optimizedPreset = { ...preset };
        
        if (capabilities.hasHEVC && preset.settings.videoCodec === 'libx265') {
          optimizedPreset.settings.videoCodec = 'hevc_videotoolbox';
          // Optimized preset to use HEVC hardware acceleration
        } else if (capabilities.hasH264 && preset.settings.videoCodec === 'libx264') {
          optimizedPreset.settings.videoCodec = 'h264_videotoolbox';
                      // Optimized preset to use H.264 hardware acceleration
        }
        
        return optimizedPreset;
      }
    } catch (error) {
      console.warn('Hardware optimization failed, using original preset:', error);
    }
    
    return preset;
  }

  // Helper method to compress a single file with advanced settings
  private async compressFileWithAdvancedSettings(
    file: string,
    presetKey: string,
    preset: any,
    keepAudio: boolean,
    outputDirectory: string,
    advancedSettings: AdvancedCompressionSettings,
    taskKey: string,
    fileIndex: number
  ): Promise<CompressionResult> {
    const fileName = getFileName(file);
    
    // Check for custom output naming preferences
    let customOutputName = null;
    try {
      customOutputName = await this.getCustomOutputName(file);
      if (customOutputName) {
        // Found custom output name
      }
    } catch (_) {}
    
    const outputPath = buildOutputPath(file, presetKey, outputDirectory, preset.settings.videoCodec, keepAudio, fileIndex, customOutputName || undefined);
    if (customOutputName) {
      // Final output path calculated
    }
    
    // Use advanced settings if provided, otherwise use preset defaults
    const settings = advancedSettings || preset.settings;
    
    // Handle two-pass encoding
    if (settings.twoPass) {
      return compressWithTwoPass(file, presetKey, preset, keepAudio, outputDirectory, settings, taskKey, fileName, outputPath, this.mainWindow, this.batchProgressManager);
    } else {
      return compressWithSinglePass(file, presetKey, preset, keepAudio, outputDirectory, settings, taskKey, fileName, outputPath, this.mainWindow, this.batchProgressManager);
    }
  }

  /**
   * Get custom output name for a file from the renderer process
   */
  private async getCustomOutputName(file: string): Promise<string | null> {
    try {
      const escapedFilePath = file.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`');
      const customNaming = await this.mainWindow.webContents.executeJavaScript(`
        (() => {
          try {
            const filePath = '${escapedFilePath}';
            // Try exact match first
            if (window.compressionOutputNaming && window.compressionOutputNaming[filePath]) {
              return window.compressionOutputNaming[filePath];
            }
            // Try with normalized path
            const normalizedPath = filePath.replace(/\\\\/g, '/');
            if (window.compressionOutputNaming && window.compressionOutputNaming[normalizedPath]) {
              return window.compressionOutputNaming[normalizedPath];
            }
            // Try with basename as fallback
            const basename = filePath.split('/').pop();
            for (const [key, value] of Object.entries(window.compressionOutputNaming || {})) {
              if (key.split('/').pop() === basename) {
                return value;
              }
            }
            return null;
          } catch (e) {
            return null;
          }
        })()
      `);
      return customNaming;
    } catch (_) {
      return null;
    }
  }

  // Helper method to cleanup task from all strategy maps
  private cleanupTask(taskKey: string): void {
    // All strategies now use the same map from the base class
    BaseCompressionStrategy.getActiveCompressions().delete(taskKey);
    this.memoryManager.removeCompression(taskKey);
  }

  /**
   * Start memory monitoring during compression
   */
  private startMemoryMonitoring(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
    
    this.memoryMonitorInterval = setInterval(() => {
      try {
        this.memoryManager.checkForLeaks();
      } catch (error) {
        console.warn('Error in memory monitoring:', error);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Stop memory monitoring
   */
  private stopMemoryMonitoring(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
    }
  }

  /**
   * Stop thermal monitoring
   */
  private stopThermalMonitoring(): void {
    this.thermalMonitor.stopMonitoring();
  }

  // Cancel all active compressions with proper cleanup
  cancelCompression(): { success: boolean } {
    // Cancelling all active compressions
    
    this.isCancelled = true;
    
    // Cancel batch progress tracking
    this.batchProgressManager.cancelAllTasks();
    
    // Kill all active FFmpeg processes
    const activeCompressions = BaseCompressionStrategy.getActiveCompressions();
    let killedCount = 0;

    for (const [taskKey, command] of Array.from(activeCompressions.entries())) {
      try {
        command.kill('SIGKILL');
        // Killed compression process: ${taskKey}
        killedCount++;
      } catch (err) {
        console.error(`Error killing compression process ${taskKey}:`, err);
      }
    }
    
    // Clear all maps using memory manager
    activeCompressions.clear();
    this.memoryManager.cleanupCompression();
    
    // Stop thermal monitoring
    this.stopThermalMonitoring();
    
    // Send cancellation event to UI
    sendCompressionEvent('compression-cancelled', {
      message: 'Compression cancelled by user',
      killedProcesses: killedCount
    }, this.mainWindow);
    
    // Cancellation complete
    return { success: true };
  }

  /**
   * Get current batch progress state
   */
  getBatchProgress(): any {
    return this.batchProgressManager.getBatchState();
  }

  /**
   * Check if compression is currently running
   */
  isCompressing(): boolean {
    return this.runningCompressions > 0 || BaseCompressionStrategy.getActiveCompressions().size > 0;
  }

  /**
   * Get current concurrency status
   */
  getConcurrencyStatus(): { running: number; max: number; available: number } {
    return {
      running: this.runningCompressions,
      max: this.maxConcurrentCompressions,
      available: this.maxConcurrentCompressions - this.runningCompressions
    };
  }

  /**
   * Check for memory leaks and log warnings
   */
  checkForMemoryLeaks(): void {
    this.memoryManager.checkForLeaks();
    MemoryUtils.logMemoryUsage('Memory leak check');
  }

  /**
   * Update compression statuses for a specific preset
   */
  async updateCompressionStatusesForPreset(presetId: string, keepAudio: boolean): Promise<{ success: boolean }> {
    try {
      // Send custom event to update compression statuses in the UI
      this.mainWindow.webContents.send('update-compression-statuses-for-preset', {
        presetId,
        keepAudio
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating compression statuses for preset:', error);
      return { success: false };
    }
  }
}
