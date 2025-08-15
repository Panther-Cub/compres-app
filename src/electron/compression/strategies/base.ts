import ffmpeg from 'fluent-ffmpeg';
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

// Track active compression processes for cancellation
const activeCompressions = new Map<string, FFmpegCommand>();

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
    const { preset, settings } = this.context;
    
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
    const { fileName, presetKey, outputPath, mainWindow, taskKey } = this.context;

    // Store the command for potential cancellation
    activeCompressions.set(taskKey, command);

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
    const { fileName, presetKey, outputPath, mainWindow } = this.context;
    
    console.log(`Starting compression: ${fileName} with preset ${presetKey}`);
    console.log(`Output path: ${outputPath}`);
    console.log(`FFmpeg command: ${command._getArguments().join(' ')}`);
    
    sendCompressionEvent('compression-started', {
      file: fileName,
      preset: presetKey,
      outputPath
    }, mainWindow);
  }

  /**
   * Handle compression progress event
   */
  protected handleProgress(progress: FFmpegProgress): void {
    const { fileName, presetKey, mainWindow } = this.context;
    
    const rawPercent = progress.percent || 0;
    const adjustedPercent = this.progressHandler.calculateAdjustedProgress(rawPercent);
    
    // Only send progress updates if there's a meaningful change
    if (this.progressHandler.hasMeaningfulChange(adjustedPercent)) {
      console.log(`Progress for ${fileName}-${presetKey}: ${adjustedPercent}%`);
      sendCompressionEvent('compression-progress', {
        file: fileName,
        preset: presetKey,
        percent: adjustedPercent,
        timemark: progress.timemark
      }, mainWindow);
    }
  }

  /**
   * Handle compression end event
   */
  protected handleEnd(): void {
    const { fileName, presetKey, outputPath, mainWindow, taskKey } = this.context;
    
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
      throw new Error(`Output verification failed: ${verifyError}`);
    }
    
    // Send final 100% progress before completion
    sendCompressionEvent('compression-progress', {
      file: fileName,
      preset: presetKey,
      percent: 100,
      timemark: '00:00:00'
    }, mainWindow);
    
    sendCompressionEvent('compression-complete', {
      file: fileName,
      preset: presetKey,
      outputPath
    }, mainWindow);
    
    activeCompressions.delete(taskKey);
  }

  /**
   * Handle compression error event
   */
  protected handleError(err: FFmpegError): void {
    const { fileName, presetKey, file, outputPath, taskKey } = this.context;
    
    console.error(`Error compressing ${fileName} with preset ${presetKey}:`, err.message);
    console.error(`Full error details:`, err);
    console.error(`Input file: ${file}`);
    console.error(`Output path: ${outputPath}`);
    
    activeCompressions.delete(taskKey);
    throw new Error(err.message);
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
