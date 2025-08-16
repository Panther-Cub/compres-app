import ffmpeg from 'fluent-ffmpeg';
import { BrowserWindow } from 'electron';
import { CompressionResult, AdvancedCompressionSettings } from '../types';
import { BaseCompressionStrategy, CompressionContext } from './base';

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
  mainWindow: BrowserWindow,
  batchProgressManager?: any
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
    settings,
    batchProgressManager
  };

  const strategy = new TwoPassCompressionStrategy(context);
  return await strategy.execute();
}

class TwoPassCompressionStrategy extends BaseCompressionStrategy {
  async execute(): Promise<CompressionResult> {
    return new Promise((resolve, reject) => {
      try {
        // Validate all inputs
        this.validateInputs();
        
        // Create and configure FFmpeg command for first pass
        let firstPassCommand = ffmpeg(this.context.file);
        firstPassCommand = this.configureFFmpegCommand(firstPassCommand);
        
        // Add two-pass specific options for first pass
        const firstPassOptions = [
          '-pass 1',
          '-f null'
        ];
        firstPassCommand = firstPassCommand.outputOptions(firstPassOptions);
        
        // Setup event handlers for first pass
        this.setupEventHandlers(firstPassCommand);
        
        // Execute first pass
        firstPassCommand
          .on('end', () => {
            console.log(`First pass completed for ${this.context.fileName}`);
            
            // Execute second pass
            this.executeSecondPass(resolve, reject);
          })
          .on('error', (err) => {
            reject({ 
              file: this.context.fileName, 
              preset: this.context.presetKey, 
              error: `First pass failed: ${err.message}`, 
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

  private executeSecondPass(resolve: (result: CompressionResult) => void, reject: (error: any) => void): void {
    try {
      // Create and configure FFmpeg command for second pass
      let secondPassCommand = ffmpeg(this.context.file);
      secondPassCommand = this.configureFFmpegCommand(secondPassCommand);
      
      // Add two-pass specific options for second pass
      const secondPassOptions = [
        '-pass 2'
      ];
      secondPassCommand = secondPassCommand.outputOptions(secondPassOptions);
      
      // Setup event handlers for second pass
      this.setupEventHandlers(secondPassCommand);
      
      // Execute second pass
      secondPassCommand
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
            error: `Second pass failed: ${err.message}`, 
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
  }
}
