import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
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

export async function compressWithTwoPass(
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
  const passLogFile = path.join(outputDirectory, `${fileName}_${presetKey}_pass.log`);
  
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`Starting two-pass compression: ${fileName} with preset ${presetKey}`);
      console.log(`Output path: ${outputPath}`);
      
      // First pass
      await executeFirstPass(file, presetKey, preset, keepAudio, settings, taskKey, fileName, outputPath, passLogFile, mainWindow);
      
      // Second pass
      await executeSecondPass(file, presetKey, preset, keepAudio, outputDirectory, settings, taskKey, fileName, outputPath, passLogFile, mainWindow);
      
      activeCompressions.delete(taskKey);
      resolve({ file: fileName, preset: presetKey, outputPath, success: true });
    } catch (err: any) {
      console.error(`Error in two-pass compression for ${fileName} with preset ${presetKey}:`, err.message);
      activeCompressions.delete(taskKey);
      reject({ file: fileName, preset: presetKey, error: err.message, success: false });
    }
  });
}

async function executeFirstPass(
  file: string,
  presetKey: string,
  preset: any,
  keepAudio: boolean,
  settings: AdvancedCompressionSettings,
  taskKey: string,
  fileName: string,
  outputPath: string,
  passLogFile: string,
  mainWindow: BrowserWindow
): Promise<void> {
  return new Promise<void>((passResolve, passReject) => {
    let command = ffmpeg(file);
    const progressHandler = new ProgressHandler();
    
    try {
      // Validate input file, output directory, preset, and advanced settings
      ValidationUtils.validateInputFile(file);
      ValidationUtils.validateOutputDirectory(outputPath);
      ValidationUtils.validatePreset(preset, presetKey);
      ValidationUtils.validateAdvancedSettings(settings);
      
      // Configure video codec and basic settings
      command = command
        .videoCodec(preset.settings.videoCodec)
        .videoBitrate(settings.videoBitrate || preset.settings.videoBitrate)
        .fps(settings.fps || preset.settings.fps);
      
      // First pass options
      const outputOptions = [
        '-pass 1',
        '-passlogfile', passLogFile,
        '-f null',
        '-'
      ];
      
      // Add resolution scaling if specified
      const scaleFilter = buildScaleFilterFromSettings(settings);
      if (scaleFilter) {
        outputOptions.push(`-vf ${scaleFilter}`);
      }
      
      command = command.outputOptions(outputOptions);
      
      // No audio in first pass
      command = command.noAudio();
      
      // Store the command for potential cancellation
      activeCompressions.set(taskKey, command);
      
      command
        .on('start', () => {
          console.log(`Starting first pass for ${fileName}-${presetKey}`);
          sendCompressionEvent('compression-started', {
            file: fileName,
            preset: presetKey,
            outputPath
          }, mainWindow);
        })
        .on('progress', (progress: FFmpegProgress) => {
          const rawPercent = progress.percent || 0;
          
          // First pass is typically 50% of total work
          const adjustedPercent = Math.round(Math.max(0, Math.min(50, rawPercent * 0.5)));
          
          // Only send progress updates if there's a meaningful change
          if (progressHandler.hasMeaningfulChange(adjustedPercent)) {
            console.log(`First pass progress for ${fileName}-${presetKey}: ${adjustedPercent}%`);
            sendCompressionEvent('compression-progress', {
              file: fileName,
              preset: presetKey,
              percent: adjustedPercent,
              timemark: progress.timemark
            }, mainWindow);
          }
        })
        .on('end', () => {
          console.log(`Completed first pass for ${fileName}-${presetKey}`);
          passResolve();
        })
        .on('error', (err: FFmpegError) => {
          console.error(`Error in first pass for ${fileName}-${presetKey}:`, err.message);
          passReject(err);
        })
        .run();
    } catch (error) {
      console.error(`Error setting up first pass for ${fileName}-${presetKey}:`, error);
      passReject(error);
    }
  });
}

async function executeSecondPass(
  file: string,
  presetKey: string,
  preset: any,
  keepAudio: boolean,
  outputDirectory: string,
  settings: AdvancedCompressionSettings,
  taskKey: string,
  fileName: string,
  outputPath: string,
  passLogFile: string,
  mainWindow: BrowserWindow
): Promise<void> {
  return new Promise<void>((passResolve, passReject) => {
    let command = ffmpeg(file);
    const progressHandler = new ProgressHandler();
    
    try {
      // Validate input file, output directory, preset, and advanced settings
      ValidationUtils.validateInputFile(file);
      ValidationUtils.validateOutputDirectory(outputPath);
      ValidationUtils.validatePreset(preset, presetKey);
      ValidationUtils.validateAdvancedSettings(settings);
      
      // Configure video codec and basic settings
      command = command
        .videoCodec(preset.settings.videoCodec)
        .videoBitrate(settings.videoBitrate || preset.settings.videoBitrate)
        .fps(settings.fps || preset.settings.fps);
      
      // Second pass options
      const outputOptions = [
        '-pass 2',
        '-passlogfile', passLogFile,
        `-preset ${preset.settings.preset}`,
        `-crf ${settings.crf || preset.settings.crf}`
      ];
      
      // Add resolution scaling if specified
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
      
      // Configure audio for second pass
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
        .on('progress', (progress: FFmpegProgress) => {
          const rawPercent = progress.percent || 0;
          
          // Second pass is the remaining 50% of total work (50-100%)
          const adjustedPercent = progressHandler.setTwoPassProgress(rawPercent);
          
          // Only send progress updates if there's a meaningful change
          if (progressHandler.hasMeaningfulChange(adjustedPercent)) {
            console.log(`Second pass progress for ${fileName}-${presetKey}: ${adjustedPercent}%`);
            sendCompressionEvent('compression-progress', {
              file: fileName,
              preset: presetKey,
              percent: adjustedPercent,
              timemark: progress.timemark
            }, mainWindow);
          }
        })
        .on('end', () => {
          console.log(`Completed second pass for ${fileName}-${presetKey}`);
          console.log(`File saved to: ${outputPath}`);
          
          // Send final 100% progress before completion
          sendCompressionEvent('compression-progress', {
            file: fileName,
            preset: presetKey,
            percent: 100,
            timemark: '00:00:00'
          }, mainWindow);
          
          // Clean up pass log file
          try {
            require('fs').unlinkSync(passLogFile);
          } catch (err) {
            console.warn('Could not delete pass log file:', err);
          }
          
          sendCompressionEvent('compression-complete', {
            file: fileName,
            preset: presetKey,
            outputPath
          }, mainWindow);
          passResolve();
        })
        .on('error', (err: FFmpegError) => {
          console.error(`Error in second pass for ${fileName}-${presetKey}:`, err.message);
          passReject(err);
        })
        .run();
    } catch (error) {
      console.error(`Error setting up second pass for ${fileName}-${presetKey}:`, error);
      passReject(error);
    }
  });
}

export function getActiveCompressions(): Map<string, FFmpegCommand> {
  return activeCompressions;
}
