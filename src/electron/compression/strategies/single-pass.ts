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

export async function compressWithSinglePass(
  file: string,
  presetKey: string,
  preset: any,
  keepAudio: boolean,
  outputDirectory: string,
  settings: AdvancedCompressionSettings,
  taskKey: string,
  fileName: string,
  outputPath: string,
  mainWindow: BrowserWindow
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(file);
    const progressHandler = new ProgressHandler();
    
    try {
      // Validate input file, output directory, preset, and advanced settings
      ValidationUtils.validateInputFile(file);
      ValidationUtils.validateOutputDirectory(outputPath);
      ValidationUtils.validatePreset(preset, presetKey);
      ValidationUtils.validateAdvancedSettings(settings);
      
      // Start with basic configuration
      command = command
        .videoCodec(preset.settings.videoCodec)
        .videoBitrate(settings.videoBitrate || preset.settings.videoBitrate)
        .fps(settings.fps || preset.settings.fps);
      
      // Build output options array
      const outputOptions: string[] = [
        `-crf ${settings.crf || preset.settings.crf}`,
        `-preset ${preset.settings.preset}`
      ];
      
      // Add resolution scaling if specified and different from original
      const scaleFilter = buildScaleFilterFromSettings(settings);
      if (scaleFilter) {
        outputOptions.push(`-vf ${scaleFilter}`);
      }
      
      // Add optimization options
      if (settings.fastStart) {
        outputOptions.push('-movflags +faststart');
      }
      
      if (settings.optimizeForWeb) {
        outputOptions.push('-profile:v baseline');
        outputOptions.push('-level 3.0');
      }
      
      command = command.outputOptions(outputOptions);
      
      // Configure audio
      if (keepAudio) {
        command = command
          .audioCodec(preset.settings.audioCodec)
          .audioBitrate(settings.audioBitrate || preset.settings.audioBitrate);
      } else {
        command = command.noAudio();
      }
      
      // Store the command for potential cancellation
      activeCompressions.set(taskKey, command);
      
      command
        .output(outputPath)
        .on('start', () => {
          console.log(`Starting advanced single-pass compression: ${fileName} with preset ${presetKey}`);
          console.log(`Output path: ${outputPath}`);
          console.log(`FFmpeg command: ${command._getArguments().join(' ')}`);
          sendCompressionEvent('compression-started', {
            file: fileName,
            preset: presetKey,
            outputPath
          }, mainWindow);
        })
        .on('progress', (progress: FFmpegProgress) => {
          const rawPercent = progress.percent || 0;
          const adjustedPercent = progressHandler.calculateAdjustedProgress(rawPercent);
          
          // Only send progress updates if there's a meaningful change
          if (progressHandler.hasMeaningfulChange(adjustedPercent)) {
            console.log(`Progress for ${fileName}-${presetKey}: ${adjustedPercent}%`);
            sendCompressionEvent('compression-progress', {
              file: fileName,
              preset: presetKey,
              percent: adjustedPercent,
              timemark: progress.timemark
            }, mainWindow);
          }
        })
        .on('end', () => {
          console.log(`Completed advanced single-pass compression: ${fileName} with preset ${presetKey}`);
          console.log(`File saved to: ${outputPath}`);
          
          // Verify output file was created and has size > 0
          try {
            ValidationUtils.validateOutputFile(outputPath);
            const stats = require('fs').statSync(outputPath);
            console.log(`Output file verified: ${outputPath} (${stats.size} bytes)`);
          } catch (verifyError) {
            console.error(`Output file verification failed:`, verifyError);
            activeCompressions.delete(taskKey);
            reject({ file: fileName, preset: presetKey, error: `Output verification failed: ${verifyError}`, success: false });
            return;
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
          resolve({ file: fileName, preset: presetKey, outputPath, success: true });
        })
        .on('error', (err: FFmpegError) => {
          console.error(`Error in advanced single-pass compression ${fileName} with preset ${presetKey}:`, err.message);
          console.error(`Full error details:`, err);
          console.error(`Input file: ${file}`);
          console.error(`Output path: ${outputPath}`);
          console.error(`FFmpeg command: ${command._getArguments().join(' ')}`);
          activeCompressions.delete(taskKey);
          reject({ file: fileName, preset: presetKey, error: err.message, success: false });
        })
        .run();
    } catch (error) {
      console.error(`Error setting up advanced single-pass compression for ${fileName} with preset ${presetKey}:`, error);
      activeCompressions.delete(taskKey);
      reject({ file: fileName, preset: presetKey, error: error instanceof Error ? error.message : 'Unknown error', success: false });
    }
  });
}

export function getActiveCompressions(): Map<string, FFmpegCommand> {
  return activeCompressions;
}
