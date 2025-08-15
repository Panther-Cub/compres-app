import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
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
  buildBaseOutputOptions,
  addOptimizationOptions,
  configureFFmpegCommand,
  configureAudioSettings,
  buildResolutionFilter
} from '../utils';

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
      
      // First pass
      await executeFirstPass(file, presetKey, preset, keepAudio, settings, taskKey, fileName, outputPath, passLogFile, mainWindow);
      
      // Second pass
      await executeSecondPass(file, presetKey, preset, keepAudio, outputDirectory, settings, taskKey, fileName, outputPath, passLogFile, mainWindow);
      
      resolve({ file: fileName, preset: presetKey, outputPath, success: true });
    } catch (err: any) {
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
    
    command = configureFFmpegCommand(command, preset.settings, settings);
    
    const outputOptions = [
      '-pass 1',
      '-passlogfile', passLogFile,
      '-f null',
      '-'
    ];
    
    // Handle resolution scaling
    const resolution = settings.resolution || preset.settings.resolution;
    const preserveAspectRatio = settings.preserveAspectRatio ?? true;
    outputOptions.push(`-vf ${buildResolutionFilter(resolution, preserveAspectRatio)}`);
    
    command = command.outputOptions(outputOptions);
    command = configureAudioSettings(command, preset.settings, keepAudio, settings);
    
    // Store the command for potential cancellation
    activeCompressions.set(taskKey, command);
    
    command
      .on('start', () => {
        sendCompressionEvent('compression-started', {
          file: fileName,
          preset: presetKey,
          outputPath
        }, mainWindow);
      })
      .on('progress', (progress: FFmpegProgress) => {
        // First pass is typically 50% of total work
        const adjustedPercent = Math.round((progress.percent || 0) * 0.5);
        sendCompressionEvent('compression-progress', {
          file: fileName,
          preset: presetKey,
          percent: adjustedPercent,
          timemark: progress.timemark
        }, mainWindow);
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
    
    command = configureFFmpegCommand(command, preset.settings, settings);
    
    const outputOptions = [
      '-pass 2',
      '-passlogfile', passLogFile,
      `-preset ${preset.settings.preset}`
    ];
    
    // Handle resolution scaling
    const resolution = settings.resolution || preset.settings.resolution;
    const preserveAspectRatio = settings.preserveAspectRatio ?? true;
    outputOptions.push(`-vf ${buildResolutionFilter(resolution, preserveAspectRatio)}`);
    
    addOptimizationOptions(outputOptions, settings);
    
    command = command.outputOptions(outputOptions);
    command = configureAudioSettings(command, preset.settings, keepAudio, settings);
    
    // Store the command for potential cancellation
    activeCompressions.set(taskKey, command);
    
    command
      .output(outputPath)
      .on('progress', (progress: FFmpegProgress) => {
        // Second pass is the remaining 50% of total work
        const adjustedPercent = Math.round(50 + (progress.percent || 0) * 0.5);
        sendCompressionEvent('compression-progress', {
          file: fileName,
          preset: presetKey,
          percent: adjustedPercent,
          timemark: progress.timemark
        }, mainWindow);
      })
      .on('end', () => {
        console.log(`Completed second pass for ${fileName}-${presetKey}`);
        // Clean up pass log file
        try {
          fs.unlinkSync(passLogFile);
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
  });
}

export function getActiveCompressions(): Map<string, FFmpegCommand> {
  return activeCompressions;
}
