import ffmpeg from 'fluent-ffmpeg';
import { BrowserWindow } from 'electron';
import { CompressionResult, AdvancedCompressionSettings } from '../types';
import { buildOutputPath, getFileName } from '../utils';
import { BaseCompressionStrategy, CompressionContext } from './base';

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
    settings
  };

  const strategy = new SinglePassCompressionStrategy(context);
  return await strategy.execute();
}

class SinglePassCompressionStrategy extends BaseCompressionStrategy {
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
