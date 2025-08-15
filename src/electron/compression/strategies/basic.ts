import ffmpeg from 'fluent-ffmpeg';
import { BrowserWindow } from 'electron';
import { 
  CompressionResult, 
  FFmpegCommand,
  FFmpegProgress,
  FFmpegError
} from '../types';
import {
  sendCompressionEvent,
  buildOutputPath,
  buildBaseOutputOptions,
  configureFFmpegCommand,
  configureAudioSettings,
  getFileName
} from '../utils';

// Track active compression processes for cancellation
const activeCompressions = new Map<string, FFmpegCommand>();

export async function compressFileWithPreset(
  file: string,
  presetKey: string,
  preset: any,
  keepAudio: boolean,
  outputDirectory: string,
  taskKey: string,
  mainWindow: BrowserWindow
): Promise<CompressionResult> {
  const fileName = getFileName(file);
  const outputPath = buildOutputPath(file, presetKey, outputDirectory, preset.settings.videoCodec);
  
  return new Promise((resolve, reject) => {
    let command = ffmpeg(file);
    
    command = configureFFmpegCommand(command, preset.settings);
    command = command.outputOptions(buildBaseOutputOptions(preset.settings));
    command = configureAudioSettings(command, preset.settings, keepAudio);
    
    // Store the command for potential cancellation
    activeCompressions.set(taskKey, command);
    
    command
      .output(outputPath)
      .on('start', () => {
        console.log(`Starting compression: ${fileName} with preset ${presetKey}`);
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
        console.log(`Completed compression: ${fileName} with preset ${presetKey}`);
        sendCompressionEvent('compression-complete', {
          file: fileName,
          preset: presetKey,
          outputPath
        }, mainWindow);
        resolve({ file: fileName, preset: presetKey, outputPath, success: true });
      })
      .on('error', (err: FFmpegError) => {
        console.error(`Error compressing ${fileName} with preset ${presetKey}:`, err.message);
        reject({ file: fileName, preset: presetKey, error: err.message, success: false });
      })
      .run();
  });
}

export function getActiveCompressions(): Map<string, FFmpegCommand> {
  return activeCompressions;
}
