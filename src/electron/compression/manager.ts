import { BrowserWindow } from 'electron';
import { 
  CompressionResult, 
  AdvancedCompressionSettings
} from './types';
import { videoPresets } from './presets';
import {
  sendCompressionEvent,
  createTaskKey,
  getFileName,
  ensureOutputDirectory,
  buildOutputPath
} from './utils';
import {
  compressFileWithPreset,
  getBasicActiveCompressions,
  compressWithSinglePass,
  getSinglePassActiveCompressions,
  compressWithTwoPass,
  getTwoPassActiveCompressions
} from './strategies';

// Manager class to handle compression operations
export class CompressionManager {
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  // Basic compression for multiple files
  async compressVideos(
    files: string[],
    presets: string[],
    keepAudio: boolean,
    outputDirectory: string,
    advancedSettings?: AdvancedCompressionSettings
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    const compressionPromises: Promise<CompressionResult>[] = [];
    
    console.log(`Starting compression of ${files.length} files with ${presets.length} presets each`);
    console.log('Files:', files);
    console.log('Presets:', presets);
    console.log('Advanced settings:', advancedSettings);
    console.log('Output directory:', outputDirectory);
    
    // Validate and ensure output directory exists
    try {
      ensureOutputDirectory(outputDirectory);
    } catch (error) {
      console.error('Output directory validation failed:', error);
      throw error;
    }
    
    // Create all compression tasks upfront
    for (const file of files) {
      for (const presetKey of presets) {
        const preset = videoPresets[presetKey];
        if (!preset) {
          console.warn(`Preset ${presetKey} not found, skipping`);
          continue;
        }
        
        // Send initial progress for all files (0%)
        const fileName = getFileName(file);
        const taskKey = createTaskKey(fileName, presetKey);
        const outputPath = buildOutputPath(file, presetKey, outputDirectory, preset.settings.videoCodec);
        sendCompressionEvent('compression-started', {
          file: fileName,
          preset: presetKey,
          outputPath
        }, this.mainWindow);
        
        // Add to promises array for parallel processing
        compressionPromises.push(
          compressFileWithPreset(file, presetKey, preset, keepAudio, outputDirectory, taskKey, this.mainWindow, advancedSettings)
            .then(result => {
              getBasicActiveCompressions().delete(taskKey);
              results.push(result);
              return result;
            })
            .catch(error => {
              getBasicActiveCompressions().delete(taskKey);
              const errorResult: CompressionResult = { 
                file: getFileName(file), 
                preset: presetKey, 
                error: error.error || error.message || 'Unknown error', 
                success: false 
              };
              results.push(errorResult);
              return errorResult;
            })
        );
      }
    }
    
    // Process all compressions in parallel
    await Promise.all(compressionPromises);
    
    console.log('All compressions completed:', results);
    return results;
  }

  // Advanced compression for multiple files
  async compressVideosAdvanced(
    files: string[],
    presets: string[],
    keepAudio: boolean,
    outputDirectory: string,
    advancedSettings: AdvancedCompressionSettings
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    const compressionPromises: Promise<CompressionResult>[] = [];
    
    console.log(`Starting advanced compression of ${files.length} files with ${presets.length} presets each`);
    console.log('Files:', files);
    console.log('Presets:', presets);
    console.log('Advanced settings:', advancedSettings);
    console.log('Output directory:', outputDirectory);
    
    // Validate and ensure output directory exists
    try {
      ensureOutputDirectory(outputDirectory);
    } catch (error) {
      console.error('Output directory validation failed:', error);
      throw error;
    }
    
    // Create all compression tasks upfront
    for (const file of files) {
      for (const presetKey of presets) {
        const preset = videoPresets[presetKey];
        if (!preset) {
          console.warn(`Preset ${presetKey} not found, skipping`);
          continue;
        }
        
        // Send initial progress for all files (0%)
        const fileName = getFileName(file);
        const taskKey = createTaskKey(fileName, presetKey);
        const outputPath = buildOutputPath(file, presetKey, outputDirectory, preset.settings.videoCodec);
        sendCompressionEvent('compression-started', {
          file: fileName,
          preset: presetKey,
          outputPath
        }, this.mainWindow);
        
        // Add to promises array for parallel processing
        compressionPromises.push(
          this.compressFileWithAdvancedSettings(file, presetKey, preset, keepAudio, outputDirectory, advancedSettings, taskKey)
            .then(result => {
              this.cleanupTask(taskKey);
              results.push(result);
              return result;
            })
            .catch(error => {
              this.cleanupTask(taskKey);
              const errorResult: CompressionResult = { 
                file: getFileName(file), 
                preset: presetKey, 
                error: error.error || error.message || 'Unknown error', 
                success: false 
              };
              results.push(errorResult);
              return errorResult;
            })
        );
      }
    }
    
    // Process all compressions in parallel
    await Promise.all(compressionPromises);
    
    console.log('All advanced compressions completed:', results);
    return results;
  }

  // Helper method to compress a single file with advanced settings
  private async compressFileWithAdvancedSettings(
    file: string,
    presetKey: string,
    preset: any,
    keepAudio: boolean,
    outputDirectory: string,
    advancedSettings: AdvancedCompressionSettings,
    taskKey: string
  ): Promise<CompressionResult> {
    const fileName = getFileName(file);
    const outputPath = buildOutputPath(file, presetKey, outputDirectory, preset.settings.videoCodec);
    
    // Use advanced settings if provided, otherwise use preset defaults
    const settings = advancedSettings || preset.settings;
    
    // Handle two-pass encoding
    if (settings.twoPass) {
      return compressWithTwoPass(file, presetKey, preset, keepAudio, outputDirectory, settings, taskKey, fileName, outputPath, this.mainWindow);
    } else {
      return compressWithSinglePass(file, presetKey, preset, keepAudio, outputDirectory, settings, taskKey, fileName, outputPath, this.mainWindow);
    }
  }

  // Helper method to cleanup task from all strategy maps
  private cleanupTask(taskKey: string): void {
    getBasicActiveCompressions().delete(taskKey);
    getSinglePassActiveCompressions().delete(taskKey);
    getTwoPassActiveCompressions().delete(taskKey);
  }

  // Cancel all active compressions
  cancelCompression(): { success: boolean } {
    console.log('Cancelling all active compressions...');
    
    // Kill all active compression processes from all strategies
    const allActiveCompressions = [
      getBasicActiveCompressions(),
      getSinglePassActiveCompressions(),
      getTwoPassActiveCompressions()
    ];

    for (const activeCompressions of allActiveCompressions) {
      for (const [taskKey, command] of Array.from(activeCompressions.entries())) {
        try {
          command.kill('SIGKILL');
          console.log(`Killed compression process: ${taskKey}`);
        } catch (err) {
          console.error('Error killing compression process:', err);
        }
      }
      activeCompressions.clear();
    }
    
    return { success: true };
  }
}
