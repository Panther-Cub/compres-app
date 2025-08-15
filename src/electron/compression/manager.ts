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
  compressWithSinglePass,
  compressWithTwoPass,
  BaseCompressionStrategy
} from './strategies';

// Manager class to handle compression operations
export class CompressionManager {
  private mainWindow: BrowserWindow;
  private maxConcurrentCompressions: number;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    // Limit concurrent compressions based on system capabilities
    this.maxConcurrentCompressions = Math.max(1, Math.min(4, require('os').cpus().length - 1));
    console.log(`Compression manager initialized with max ${this.maxConcurrentCompressions} concurrent compressions`);
  }

  // Process promises with concurrency control
  private async processWithConcurrencyControl<T>(promises: Promise<T>[]): Promise<T[]> {
    const results: T[] = [];
    const chunks = this.chunkArray(promises, this.maxConcurrentCompressions);
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(chunk);
      results.push(...chunkResults);
    }
    
    return results;
  }

  // Helper to chunk array into smaller arrays
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
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
    
    // Process compressions with concurrency control
    await this.processWithConcurrencyControl(compressionPromises);
    
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
    
    // Process compressions with concurrency control
    await this.processWithConcurrencyControl(compressionPromises);
    
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
    // All strategies now use the same map from the base class
    BaseCompressionStrategy.getActiveCompressions().delete(taskKey);
  }

  // Cancel all active compressions
  cancelCompression(): { success: boolean } {
    console.log('Cancelling all active compressions...');
    
    // All strategies now use the same map from the base class
    const activeCompressions = BaseCompressionStrategy.getActiveCompressions();

    for (const [taskKey, command] of Array.from(activeCompressions.entries())) {
      try {
        command.kill('SIGKILL');
        console.log(`Killed compression process: ${taskKey}`);
      } catch (err) {
        console.error('Error killing compression process:', err);
      }
    }
    activeCompressions.clear();
    
    return { success: true };
  }
}
