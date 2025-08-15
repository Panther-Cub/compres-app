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
  getFileName,
  buildScaleFilterFromSettings
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
  mainWindow: BrowserWindow,
  advancedSettings?: any
): Promise<CompressionResult> {
  const fileName = getFileName(file);
  const outputPath = buildOutputPath(file, presetKey, outputDirectory, preset.settings.videoCodec);
  
  return new Promise((resolve, reject) => {
    let command = ffmpeg(file);
    let lastProgressTime = Date.now();
    let lastProgressPercent = 0;
    
    try {
      // Start with basic configuration
      command = command
        .videoCodec(preset.settings.videoCodec)
        .videoBitrate(advancedSettings?.videoBitrate || preset.settings.videoBitrate)
        .fps(advancedSettings?.fps || preset.settings.fps);
      
      // Add CRF and preset
      const outputOptions = [
        `-crf ${advancedSettings?.crf || preset.settings.crf}`,
        `-preset ${preset.settings.preset}`
      ];
      
      // Add resolution scaling if specified
      const scaleFilter = buildScaleFilterFromSettings(advancedSettings);
      if (scaleFilter) {
        outputOptions.push(`-vf ${scaleFilter}`);
      }
      
      // Add optimization options
      if (advancedSettings?.fastStart) {
        outputOptions.push('-movflags +faststart');
      }
      
      if (advancedSettings?.optimizeForWeb) {
        outputOptions.push('-profile:v baseline');
        outputOptions.push('-level 3.0');
      }
      
      command = command.outputOptions(outputOptions);
      
      // Configure audio
      if (keepAudio) {
        command = command
          .audioCodec(preset.settings.audioCodec)
          .audioBitrate(advancedSettings?.audioBitrate || preset.settings.audioBitrate);
      } else {
        command = command.noAudio();
      }
      
      // Store the command for potential cancellation
      activeCompressions.set(taskKey, command);
      
      command
        .output(outputPath)
        .on('start', () => {
          console.log(`Starting compression: ${fileName} with preset ${presetKey}`);
          console.log(`Output path: ${outputPath}`);
          console.log(`FFmpeg command: ${command._getArguments().join(' ')}`);
          sendCompressionEvent('compression-started', {
            file: fileName,
            preset: presetKey,
            outputPath
          }, mainWindow);
        })
        .on('progress', (progress: FFmpegProgress) => {
          const currentTime = Date.now();
          const rawPercent = progress.percent || 0;
          
          // Handle the 99% stuck issue by smoothing progress
          let adjustedPercent = Math.max(0, Math.min(100, rawPercent));
          
          // If we're stuck at 99% for more than 5 seconds, gradually increase to 99.5%
          if (adjustedPercent >= 99 && lastProgressPercent >= 99) {
            const timeStuck = currentTime - lastProgressTime;
            if (timeStuck > 5000) {
              // Gradually increase to 99.5% to show activity
              const additionalProgress = Math.min(0.5, (timeStuck - 5000) / 10000);
              adjustedPercent = 99 + additionalProgress;
            }
          } else if (adjustedPercent < 99) {
            // Reset stuck timer if we're not at 99%
            lastProgressTime = currentTime;
          }
          
          // Only send progress updates if there's a meaningful change
          if (Math.abs(adjustedPercent - lastProgressPercent) >= 0.5) {
            console.log(`Progress for ${fileName}-${presetKey}: ${adjustedPercent.toFixed(1)}%`);
            sendCompressionEvent('compression-progress', {
              file: fileName,
              preset: presetKey,
              percent: adjustedPercent,
              timemark: progress.timemark
            }, mainWindow);
            lastProgressPercent = adjustedPercent;
          }
        })
        .on('end', () => {
          console.log(`Completed compression: ${fileName} with preset ${presetKey}`);
          console.log(`File saved to: ${outputPath}`);
          
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
          console.error(`Error compressing ${fileName} with preset ${presetKey}:`, err.message);
          activeCompressions.delete(taskKey);
          reject({ file: fileName, preset: presetKey, error: err.message, success: false });
        })
        .run();
    } catch (error) {
      console.error(`Error setting up compression for ${fileName} with preset ${presetKey}:`, error);
      activeCompressions.delete(taskKey);
      reject({ file: fileName, preset: presetKey, error: error instanceof Error ? error.message : 'Unknown error', success: false });
    }
  });
}

export function getActiveCompressions(): Map<string, FFmpegCommand> {
  return activeCompressions;
}
