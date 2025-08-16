import { BrowserWindow } from 'electron';
import { 
  CompressionResult, 
  AdvancedCompressionSettings
} from './types';
import { videoPresets } from './presets';
import {
  sendCompressionEvent,
  createTaskKey,
  getFileName,
  ensureOutputDirectory,
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

// Manager class to handle compression operations
export class CompressionManager {
  private mainWindow: BrowserWindow;
  private maxConcurrentCompressions: number;
  private batchProgressManager: BatchProgressManager;
  private isCancelled: boolean = false;
  private activeCompressions: Map<string, any> = new Map();
  private compressionQueue: Promise<CompressionResult>[] = [];
  private runningCompressions: number = 0;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.batchProgressManager = new BatchProgressManager(mainWindow);
    this.maxConcurrentCompressions = Math.max(1, Math.min(4, require('os').cpus().length - 1));
    console.log(`Compression manager initialized with max ${this.maxConcurrentCompressions} concurrent compressions`);
  }

  /**
   * Initialize hardware detection and optimize settings
   */
  private async initializeHardwareOptimization(): Promise<void> {
    try {
      const capabilities = await HardwareDetection.detectCapabilities();
      const recommendedConcurrency = await HardwareDetection.getRecommendedConcurrency();
      
      this.maxConcurrentCompressions = recommendedConcurrency;
      console.log(`Hardware optimization applied: ${capabilities.chipType} with ${capabilities.recommendedCodec} codec`);
      console.log(`Optimized concurrency: ${this.maxConcurrentCompressions}`);
      
      // Send hardware info to UI
      sendCompressionEvent('hardware-detected', {
        hasVideoToolbox: capabilities.hasVideoToolbox,
        recommendedCodec: capabilities.recommendedCodec,
        chipType: capabilities.chipType
      }, this.mainWindow);
    } catch (error) {
      console.warn('Hardware detection failed, using default settings:', error);
    }
  }

  /**
   * Process compression tasks with proper concurrency control
   * This ensures we don't overwhelm the system while maintaining parallelism
   */
  private async processWithConcurrencyControl<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
    const results: T[] = [];
    const activePromises: Promise<T>[] = [];
    
    for (const task of tasks) {
      if (this.isCancelled) {
        console.log('Compression cancelled, stopping processing');
        break;
      }
      
      // Wait if we've reached the concurrency limit
      while (activePromises.length >= this.maxConcurrentCompressions) {
        // Wait for any task to complete
        const completedTask = await Promise.race(activePromises.map(p => p.catch(e => e)));
        const index = activePromises.findIndex(p => p === completedTask);
        if (index !== -1) {
          activePromises.splice(index, 1);
        }
      }
      
      // Start new task
      const taskPromise = task().catch(error => {
        console.error('Task failed:', error);
        return error;
      });
      
      activePromises.push(taskPromise);
    }
    
    // Wait for all remaining tasks to complete
    const remainingResults = await Promise.all(activePromises);
    results.push(...remainingResults);
    
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
    
    // Initialize hardware optimization
    await this.initializeHardwareOptimization();
    
    console.log(`Starting ${isAdvanced ? 'advanced' : 'basic'} compression of ${files.length} files with ${presetConfigs.length} presets each`);
    console.log('Files:', files);
    console.log('Preset configs:', presetConfigs);
    console.log('Advanced settings:', advancedSettings);
    console.log('Output directory:', outputDirectory);
    console.log(`Max concurrent compressions: ${this.maxConcurrentCompressions}`);
    
    // Validate and ensure output directory exists
    try {
      ensureOutputDirectory(outputDirectory);
    } catch (error) {
      const compressionError = CompressionErrorHandler.handleValidationError(error as Error, {});
      CompressionErrorHandler.logError(compressionError, {});
      throw new Error(compressionError.message);
    }
    
    // Initialize batch progress tracking
    this.batchProgressManager.initializeBatch(files, presetConfigs);
    
    // Track file indices to handle duplicate filenames
    const fileIndices = new Map<string, number>();
    
    // Create compression tasks (not promises yet)
    const compressionTasks: (() => Promise<CompressionResult>)[] = [];
    
    // Create all compression tasks upfront with hardware optimization
    for (const file of files) {
      for (const presetConfig of presetConfigs) {
        const preset = videoPresets[presetConfig.presetId];
        if (!preset) {
          console.warn(`Preset ${presetConfig.presetId} not found, skipping`);
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
        const outputPath = buildOutputPath(file, presetConfig.presetId, outputDirectory, optimizedPreset.settings.videoCodec, presetConfig.keepAudio, currentIndex);
        
        sendCompressionEvent('compression-started', {
          file: fileName,
          preset: presetConfig.presetId,
          outputPath
        }, this.mainWindow);
        
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
      console.log('All compressions completed:', results);
      return results;
    } catch (error) {
      console.error('Batch compression failed:', error);
      const compressionError = CompressionErrorHandler.handleSystemError(error as Error, {});
      CompressionErrorHandler.logError(compressionError, {});
      throw error;
    } finally {
      // Cleanup batch progress manager
      this.batchProgressManager.cleanup();
      this.runningCompressions = 0;
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
    
    try {
      // Track running compressions
      this.runningCompressions++;
      console.log(`Starting compression ${this.runningCompressions}/${this.maxConcurrentCompressions}: ${fileName}`);
      
      // Mark task as started in batch progress
      this.batchProgressManager.markTaskStarted(taskKey);
      
      // Validate codec support
      const isCodecSupported = await HardwareDetection.isCodecSupported(preset.settings.videoCodec);
      if (!isCodecSupported) {
        const fallbackCodec = await HardwareDetection.getFallbackCodec(preset.settings.videoCodec);
        console.warn(`Codec ${preset.settings.videoCodec} not supported, using fallback: ${fallbackCodec}`);
        preset.settings.videoCodec = fallbackCodec;
      }
      
      // Perform compression
      let result: CompressionResult;
      if (isAdvanced) {
        result = await this.compressFileWithAdvancedSettings(file, presetKey, preset, keepAudio, outputDirectory, advancedSettings, taskKey, fileIndex);
      } else {
        result = await compressFileWithPreset(file, presetKey, preset, keepAudio, outputDirectory, taskKey, this.mainWindow, advancedSettings, this.batchProgressManager);
      }
      
      // Mark task as completed
      this.batchProgressManager.markTaskCompleted(taskKey, result.outputPath);
      
      return result;
      
    } catch (error) {
      console.error(`Error compressing ${fileName} with preset ${presetKey}:`, error);
      
      // Handle different types of errors
      let compressionError;
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || this.isCancelled) {
          compressionError = CompressionErrorHandler.handleCancellationError({ fileName, presetKey });
          this.batchProgressManager.markTaskCancelled(taskKey);
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
      
      // Log error and mark task as failed
      CompressionErrorHandler.logError(compressionError, { fileName, presetKey, codec: preset.settings.videoCodec });
      this.batchProgressManager.markTaskFailed(taskKey, compressionError.message);
      
      const errorResult: CompressionResult = { 
        file: fileName, 
        preset: presetKey, 
        error: compressionError.message, 
        success: false 
      };
      
      return errorResult;
    } finally {
      // Cleanup task from active compressions
      this.cleanupTask(taskKey);
      this.runningCompressions--;
      console.log(`Completed compression ${this.runningCompressions}/${this.maxConcurrentCompressions}: ${fileName}`);
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
          console.log(`Optimized preset to use HEVC hardware acceleration`);
        } else if (capabilities.hasH264 && preset.settings.videoCodec === 'libx264') {
          optimizedPreset.settings.videoCodec = 'h264_videotoolbox';
          console.log(`Optimized preset to use H.264 hardware acceleration`);
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
    const outputPath = buildOutputPath(file, presetKey, outputDirectory, preset.settings.videoCodec, keepAudio, fileIndex);
    
    // Use advanced settings if provided, otherwise use preset defaults
    const settings = advancedSettings || preset.settings;
    
    // Handle two-pass encoding
    if (settings.twoPass) {
      return compressWithTwoPass(file, presetKey, preset, keepAudio, outputDirectory, settings, taskKey, fileName, outputPath, this.mainWindow, this.batchProgressManager);
    } else {
      return compressWithSinglePass(file, presetKey, preset, keepAudio, outputDirectory, settings, taskKey, fileName, outputPath, this.mainWindow, this.batchProgressManager);
    }
  }

  // Helper method to cleanup task from all strategy maps
  private cleanupTask(taskKey: string): void {
    // All strategies now use the same map from the base class
    BaseCompressionStrategy.getActiveCompressions().delete(taskKey);
    this.activeCompressions.delete(taskKey);
  }

  // Cancel all active compressions with proper cleanup
  cancelCompression(): { success: boolean } {
    console.log('Cancelling all active compressions...');
    
    this.isCancelled = true;
    
    // Cancel batch progress tracking
    this.batchProgressManager.cancelAllTasks();
    
    // Kill all active FFmpeg processes
    const activeCompressions = BaseCompressionStrategy.getActiveCompressions();
    let killedCount = 0;

    for (const [taskKey, command] of Array.from(activeCompressions.entries())) {
      try {
        command.kill('SIGKILL');
        console.log(`Killed compression process: ${taskKey}`);
        killedCount++;
      } catch (err) {
        console.error('Error killing compression process:', err);
      }
    }
    
    // Clear all maps
    activeCompressions.clear();
    this.activeCompressions.clear();
    
    // Send cancellation event to UI
    sendCompressionEvent('compression-cancelled', {
      message: 'Compression cancelled by user',
      killedProcesses: killedCount
    }, this.mainWindow);
    
    console.log(`Cancellation complete: ${killedCount} processes killed`);
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
}
