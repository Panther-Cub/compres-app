import ffmpeg from 'fluent-ffmpeg';
import { BrowserWindow } from 'electron';
import { CompressionResult } from '../types';
import { buildOutputPath, getFileName } from '../utils';
import { BaseCompressionStrategy, CompressionContext } from './base';

export async function compressFileWithPreset(
  file: string,
  presetKey: string,
  preset: any,
  keepAudio: boolean,
  outputDirectory: string,
  taskKey: string,
  mainWindow: BrowserWindow,
  advancedSettings?: any,
  batchProgressManager?: any
): Promise<CompressionResult> {
  const fileName = getFileName(file);
  const outputPath = buildOutputPath(file, presetKey, outputDirectory, preset.settings.videoCodec, keepAudio);
  
  const context: CompressionContext = {
    file,
    presetKey,
    preset,
    keepAudio,
    outputDirectory,
    taskKey,
    fileName,
    outputPath,
    mainWindow,
    settings: advancedSettings,
    batchProgressManager
  };

  const strategy = new BasicCompressionStrategy(context);
  return await strategy.execute();
}

class BasicCompressionStrategy extends BaseCompressionStrategy {
  async execute(): Promise<CompressionResult> {
    return new Promise((resolve, reject) => {
      try {
        // Validate all inputs
        this.validateInputs();
        
        // Create and configure FFmpeg command
        let command = ffmpeg(this.context.file);
        command = this.configureFFmpegCommand(command);
        
        // Setup event handlers
        this.setupEventHandlers(command);
        
        // Execute compression
        command
          .on('end', () => {
            resolve({ 
              file: this.context.fileName, 
              preset: this.context.presetKey, 
              outputPath: this.context.outputPath, 
              success: true 
            });
          })
          .on('error', (err) => {
            reject({ 
              file: this.context.fileName, 
              preset: this.context.presetKey, 
              error: err.message, 
              success: false 
            });
          })
          .run();
      } catch (error) {
        reject({ 
          file: this.context.fileName, 
          preset: this.context.presetKey, 
          error: error instanceof Error ? error.message : 'Unknown error', 
          success: false 
        });
      }
    });
  }
}
