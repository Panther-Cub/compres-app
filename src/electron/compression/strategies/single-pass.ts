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
  buildBaseOutputOptions,
  addOptimizationOptions,
  configureFFmpegCommand,
  configureAudioSettings
} from '../utils';

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
    
    command = configureFFmpegCommand(command, preset.settings, settings);
    
    // Build output options
    const outputOptions = buildBaseOutputOptions(preset.settings, settings);
    addOptimizationOptions(outputOptions, settings);
    
    command = command.outputOptions(outputOptions);
    command = configureAudioSettings(command, preset.settings, keepAudio, settings);
    
    // Store the command for potential cancellation
    activeCompressions.set(taskKey, command);
    
    command
      .output(outputPath)
      .on('start', () => {
        console.log(`Starting advanced compression: ${fileName} with preset ${presetKey}`);
        sendCompressionEvent('compression-started', {
          file: fileName,
          preset: presetKey,
          outputPath
        }, mainWindow);
      })
      .on('progress', (progress: FFmpegProgress) => {
        console.log(`Progress for ${fileName}-${presetKey}: ${progress.percent}%`);
        sendCompressionEvent('compression-progress', {
          file: fileName,
          preset: presetKey,
          percent: progress.percent || 0,
          timemark: progress.timemark
        }, mainWindow);
      })
      .on('end', () => {
        console.log(`Completed advanced compression: ${fileName} with preset ${presetKey}`);
        sendCompressionEvent('compression-complete', {
          file: fileName,
          preset: presetKey,
          outputPath
        }, mainWindow);
        resolve({ file: fileName, preset: presetKey, outputPath, success: true });
      })
      .on('error', (err: FFmpegError) => {
        console.error(`Error in advanced compression ${fileName} with preset ${presetKey}:`, err.message);
        reject({ file: fileName, preset: presetKey, error: err.message, success: false });
      })
      .run();
  });
}

export function getActiveCompressions(): Map<string, FFmpegCommand> {
  return activeCompressions;
}
