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
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>,
    outputDirectory: string,
    advancedSettings?: AdvancedCompressionSettings
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    const compressionPromises: Promise<CompressionResult>[] = [];
    
    console.log(`Starting compression of ${files.length} files with ${presetConfigs.length} presets each`);
    console.log('Files:', files);
    console.log('Preset configs:', presetConfigs);
    console.log('Advanced settings:', advancedSettings);
    console.log('Output directory:', outputDirectory);
    
    // Validate and ensure output directory exists
    try {
      ensureOutputDirectory(outputDirectory);
    } catch (error) {
      console.error('Output directory validation failed:', error);
      throw error;
    }
    
    // Track file indices to handle duplicate filenames
    const fileIndices = new Map<string, number>();
    
    // Create all compression tasks upfront
    for (const file of files) {
      for (const presetConfig of presetConfigs) {
        const preset = videoPresets[presetConfig.presetId];
        if (!preset) {
          console.warn(`Preset ${presetConfig.presetId} not found, skipping`);
          continue;
        }
        
        // Get file index for duplicate filename handling
        const fileName = getFileName(file);
        const currentIndex = fileIndices.get(fileName) || 0;
        fileIndices.set(fileName, currentIndex + 1);
        
        // Send initial progress for all files (0%)
        const taskKey = createTaskKey(fileName, presetConfig.presetId);
        const outputPath = buildOutputPath(file, presetConfig.presetId, outputDirectory, preset.settings.videoCodec, presetConfig.keepAudio, currentIndex);
        sendCompressionEvent('compression-started', {
          file: fileName,
          preset: presetConfig.presetId,
          outputPath
        }, this.mainWindow);
        
        // Add to promises array for parallel processing
        compressionPromises.push(
          compressFileWithPreset(file, presetConfig.presetId, preset, presetConfig.keepAudio, outputDirectory, taskKey, this.mainWindow, advancedSettings)
            .then(result => {
              getBasicActiveCompressions().delete(taskKey);
              results.push(result);
              return result;
            })
            .catch(error => {
              getBasicActiveCompressions().delete(taskKey);
              const errorResult: CompressionResult = { 
                file: getFileName(file), 
                preset: presetConfig.presetId, 
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
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>,
    outputDirectory: string,
    advancedSettings: AdvancedCompressionSettings
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    const compressionPromises: Promise<CompressionResult>[] = [];
    
    console.log(`Starting advanced compression of ${files.length} files with ${presetConfigs.length} presets each`);
    console.log('Files:', files);
    console.log('Presets:', presetConfigs);
    console.log('Advanced settings:', advancedSettings);
    console.log('Output directory:', outputDirectory);
    
    // Validate and ensure output directory exists
    try {
      ensureOutputDirectory(outputDirectory);
    } catch (error) {
      console.error('Output directory validation failed:', error);
      throw error;
    }
    
    // Track file indices to handle duplicate filenames
    const fileIndices = new Map<string, number>();
    
    // Create all compression tasks upfront
    for (const file of files) {
      for (const presetConfig of presetConfigs) {
        const preset = videoPresets[presetConfig.presetId];
        if (!preset) {
          console.warn(`Preset ${presetConfig.presetId} not found, skipping`);
          continue;
        }
        
        // Get file index for duplicate filename handling
        const fileName = getFileName(file);
        const currentIndex = fileIndices.get(fileName) || 0;
        fileIndices.set(fileName, currentIndex + 1);
        
        // Send initial progress for all files (0%)
        const taskKey = createTaskKey(fileName, presetConfig.presetId);
        const outputPath = buildOutputPath(file, presetConfig.presetId, outputDirectory, preset.settings.videoCodec, presetConfig.keepAudio, currentIndex);
        sendCompressionEvent('compression-started', {
          file: fileName,
          preset: presetConfig.presetId,
          outputPath
        }, this.mainWindow);
        
        // Add to promises array for parallel processing
        compressionPromises.push(
          this.compressFileWithAdvancedSettings(file, presetConfig.presetId, preset, presetConfig.keepAudio, outputDirectory, advancedSettings, taskKey, currentIndex)
            .then(result => {
              this.cleanupTask(taskKey);
              results.push(result);
              return result;
            })
            .catch(error => {
              this.cleanupTask(taskKey);
              const errorResult: CompressionResult = { 
                file: getFileName(file), 
                preset: presetConfig.presetId, 
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
    taskKey: string,
    fileIndex: number
  ): Promise<CompressionResult> {
    const fileName = getFileName(file);
    const outputPath = buildOutputPath(file, presetKey, outputDirectory, preset.settings.videoCodec, keepAudio, fileIndex);
    
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
