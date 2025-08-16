import { BrowserWindow } from 'electron';
import { 
  CompressionResult, 
  AdvancedCompressionSettings,
  FFmpegCommand,
  FFmpegProgress,
  FFmpegError
} from '../types';
import {
  sendCompressionEvent,
  buildScaleFilterFromSettings
} from '../utils';
import { ProgressHandler } from '../progressHandler';
import { ValidationUtils } from '../validation';
import { CompressionErrorHandler } from '../error-handler';
import { MemoryManager } from '../memory-manager';

// Track active compression processes for cancellation
const activeCompressions = new Map<string, FFmpegCommand>();
const memoryManager = MemoryManager.getInstance();

export interface CompressionContext {
  file: string;
  presetKey: string;
  preset: any;
  keepAudio: boolean;
  outputDirectory: string;
  taskKey: string;
  fileName: string;
  outputPath: string;
  mainWindow: BrowserWindow;
  settings?: AdvancedCompressionSettings;
  batchProgressManager?: any; // Optional batch progress manager
}

export abstract class BaseCompressionStrategy {
  protected progressHandler: ProgressHandler;
  protected context: CompressionContext;

  constructor(context: CompressionContext) {
    this.context = context;
    this.progressHandler = new ProgressHandler();
  }

  /**
   * Execute the compression strategy
   */
  abstract execute(): Promise<CompressionResult>;

  /**
   * Validate all inputs consistently
   */
  protected validateInputs(): void {
    const { file, outputPath, preset, presetKey, settings } = this.context;
    
    ValidationUtils.validateInputFile(file);
    ValidationUtils.validateOutputDirectory(outputPath);
    ValidationUtils.validatePreset(preset, presetKey);
    if (settings) {
      ValidationUtils.validateAdvancedSettings(settings);
    }
  }

  /**
   * Configure FFmpeg command with consistent settings
   */
  protected configureFFmpegCommand(command: FFmpegCommand): FFmpegCommand {
    const { preset } = this.context;
    
    // Start with basic configuration
    command = command
      .videoCodec(preset.settings.videoCodec)
      .videoBitrate(this.getVideoBitrate())
      .fps(this.getFps());

    // Build output options array
    const outputOptions = this.buildOutputOptions();
    command = command.outputOptions(outputOptions);

    // Configure audio
    if (this.context.keepAudio) {
      command = command
        .audioCodec(preset.settings.audioCodec)
        .audioBitrate(this.getAudioBitrate());
    } else {
      command = command.noAudio();
    }

    return command;
  }

  /**
   * Build output options consistently
   */
  protected buildOutputOptions(): string[] {
    const { preset, settings } = this.context;
    const outputOptions: string[] = [
      `-crf ${this.getCrf()}`,
      `-preset ${preset.settings.preset}`
    ];

    // Add resolution scaling if specified
    const scaleFilter = buildScaleFilterFromSettings(settings);
    if (scaleFilter) {
      outputOptions.push(`-vf ${scaleFilter}`);
    }

    // Add optimization options
    if (settings?.fastStart) {
      outputOptions.push('-movflags +faststart');
    }

    if (settings?.optimizeForWeb) {
      outputOptions.push('-profile:v baseline');
      outputOptions.push('-level 3.0');
    }

    return outputOptions;
  }

  /**
   * Setup FFmpeg event handlers consistently
   */
  protected setupEventHandlers(command: FFmpegCommand): void {
    const { outputPath, taskKey } = this.context;

    // Store the command for potential cancellation
    activeCompressions.set(taskKey, command);
    memoryManager.trackCompression(taskKey, command);

    command
      .output(outputPath)
      .on('start', () => this.handleStart(command))
      .on('progress', (progress: FFmpegProgress) => this.handleProgress(progress))
      .on('end', () => this.handleEnd())
      .on('error', (err: FFmpegError) => this.handleError(err));
  }

  /**
   * Handle compression start event
   */
  protected handleStart(command: FFmpegCommand): void {
    const { fileName, presetKey, outputPath, mainWindow, taskKey } = this.context;
    
    console.log(`Starting compression: ${fileName} with preset ${presetKey}`);
    console.log(`Output path: ${outputPath}`);
    console.log(`FFmpeg command: ${command._getArguments().join(' ')}`);
    
    // Update batch progress if available
    if (this.context.batchProgressManager) {
      this.context.batchProgressManager.markTaskStarted(taskKey);
    }
    
    sendCompressionEvent('compression-started', {
      type: 'compression-started',
      taskKey: taskKey,
      file: fileName,
      preset: presetKey,
      outputPath
    }, mainWindow);
  }

  /**
   * Handle compression progress event
   */
  protected handleProgress(progress: FFmpegProgress): void {
    const { taskKey } = this.context;
    
    try {
      const rawPercent = progress.percent || 0;
      const adjustedPercent = this.progressHandler.calculateAdjustedProgress(rawPercent);
      
      // Use the new fluid update system
      if (this.progressHandler.shouldUpdateUI(adjustedPercent)) {
        console.log(`Progress for ${taskKey}: ${adjustedPercent.toFixed(1)}%`);
        
        // Update batch progress if available
        if (this.context.batchProgressManager) {
          try {
            this.context.batchProgressManager.updateTaskProgress(taskKey, adjustedPercent);
          } catch (error) {
            console.warn('Error updating batch progress:', error);
          }
        }
        
        // Send progress event with proper task key
        try {
          sendCompressionEvent('compression-progress', {
            type: 'compression-progress',
            taskKey: this.context.taskKey,
            file: this.context.fileName,
            preset: this.context.presetKey,
            progress: adjustedPercent,
            timemark: progress.timemark
          }, this.context.mainWindow);
        } catch (error) {
          console.warn('Error sending progress event:', error);
        }
      }
    } catch (error) {
      console.error('Error in handleProgress:', error);
    }
  }

  /**
   * Handle compression end event
   */
  protected handleEnd(): void {
    const { fileName, presetKey, outputPath, mainWindow, taskKey } = this.context;
    
    try {
      console.log(`Completed compression: ${fileName} with preset ${presetKey}`);
      console.log(`File saved to: ${outputPath}`);
      
      // Verify output file was created and has size > 0
      try {
        ValidationUtils.validateOutputFile(outputPath);
        const stats = require('fs').statSync(outputPath);
        console.log(`Output file verified: ${outputPath} (${stats.size} bytes)`);
      } catch (verifyError) {
        console.error(`Output file verification failed:`, verifyError);
        activeCompressions.delete(taskKey);
        memoryManager.removeCompression(taskKey);
        throw new Error(`Output verification failed: ${verifyError}`);
      }
      
      // Send final 100% progress before completion
      try {
        sendCompressionEvent('compression-progress', {
          type: 'compression-progress',
          taskKey: taskKey,
          file: fileName,
          preset: presetKey,
          progress: 100,
          timemark: '00:00:00'
        }, mainWindow);
      } catch (progressError) {
        console.warn('Error sending final progress:', progressError);
      }
      
      try {
        sendCompressionEvent('compression-complete', {
          type: 'compression-complete',
          taskKey: taskKey,
          file: fileName,
          preset: presetKey,
          outputPath,
          success: true
        }, mainWindow);
      } catch (completeError) {
        console.warn('Error sending completion event:', completeError);
      }
      
      // Update batch progress if available
      if (this.context.batchProgressManager) {
        try {
          this.context.batchProgressManager.markTaskCompleted(taskKey, outputPath);
        } catch (batchError) {
          console.warn('Error updating batch progress:', batchError);
        }
      }
      
      activeCompressions.delete(taskKey);
      memoryManager.removeCompression(taskKey);
    } catch (error) {
      console.error('Error in handleEnd:', error);
      // Ensure cleanup happens even if there's an error
      try {
        activeCompressions.delete(taskKey);
        memoryManager.removeCompression(taskKey);
      } catch (cleanupError) {
        console.error('Error during cleanup in handleEnd:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Handle compression error event
   */
  protected handleError(err: FFmpegError): void {
    const { fileName, presetKey, file, outputPath, taskKey } = this.context;
    
    try {
      console.error(`Error compressing ${fileName} with preset ${presetKey}:`, err.message);
      console.error(`Full error details:`, err);
      console.error(`Input file: ${file}`);
      console.error(`Output path: ${outputPath}`);
      
      // Handle error with proper error classification
      const compressionError = CompressionErrorHandler.handleFFmpegError(err, {
        fileName,
        presetKey,
        codec: this.context.preset.settings.videoCodec
      });
      
      // Update batch progress if available
      if (this.context.batchProgressManager) {
        try {
          this.context.batchProgressManager.markTaskFailed(taskKey, compressionError.message);
        } catch (batchError) {
          console.warn('Error updating batch progress for failed task:', batchError);
        }
      }
      
      activeCompressions.delete(taskKey);
      memoryManager.removeCompression(taskKey);
      throw new Error(compressionError.message);
    } catch (error) {
      console.error('Error in handleError:', error);
      // Ensure cleanup happens even if there's an error
      try {
        activeCompressions.delete(taskKey);
        memoryManager.removeCompression(taskKey);
      } catch (cleanupError) {
        console.error('Error during cleanup in handleError:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Get video bitrate with consistent fallback logic
   */
  protected getVideoBitrate(): string {
    const { preset, settings } = this.context;
    return settings?.videoBitrate || preset.settings.videoBitrate;
  }

  /**
   * Get audio bitrate with consistent fallback logic
   */
  protected getAudioBitrate(): string {
    const { preset, settings } = this.context;
    return settings?.audioBitrate || preset.settings.audioBitrate;
  }

  /**
   * Get FPS with consistent fallback logic
   */
  protected getFps(): number {
    const { preset, settings } = this.context;
    return settings?.fps || preset.settings.fps;
  }

  /**
   * Get CRF with consistent fallback logic
   */
  protected getCrf(): number {
    const { preset, settings } = this.context;
    return settings?.crf || preset.settings.crf;
  }

  /**
   * Get active compressions map for cancellation
   */
  static getActiveCompressions(): Map<string, FFmpegCommand> {
    return activeCompressions;
  }
}
