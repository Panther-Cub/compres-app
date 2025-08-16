import fs from 'fs';
import path from 'path';

export class ValidationUtils {
  /**
   * Validate input file exists and is accessible
   */
  static validateInputFile(file: string): void {
    if (!file || typeof file !== 'string') {
      throw new Error('Invalid file path provided');
    }

    if (!fs.existsSync(file)) {
      throw new Error(`Input file does not exist: ${file}`);
    }

    try {
      fs.accessSync(file, fs.constants.R_OK);
    } catch (accessError) {
      throw new Error(`Input file is not readable: ${file}`);
    }
  }

  /**
   * Validate output directory exists and is writable
   */
  static validateOutputDirectory(outputPath: string): void {
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      try {
        fs.mkdirSync(outputDir, { recursive: true });
      } catch (mkdirError) {
        throw new Error(`Cannot create output directory: ${outputDir}`);
      }
    }

    // Check if output directory is writable
    try {
      const testFile = path.join(outputDir, '.test-write');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (writeError) {
      throw new Error(`Output directory is not writable: ${outputDir}`);
    }
  }

  /**
   * Validate preset configuration
   */
  static validatePreset(preset: any, presetKey: string): void {
    if (!preset || !preset.settings) {
      throw new Error(`Invalid preset configuration for: ${presetKey}`);
    }

    // Validate required preset settings
    const requiredSettings = ['videoCodec', 'videoBitrate', 'fps', 'crf', 'preset'];
    for (const setting of requiredSettings) {
      if (!preset.settings[setting]) {
        throw new Error(`Missing required preset setting: ${setting} for preset: ${presetKey}`);
      }
    }
  }

  /**
   * Validate advanced settings if provided
   */
  static validateAdvancedSettings(advancedSettings?: any): void {
    if (!advancedSettings) return;

    if (advancedSettings.crf && (advancedSettings.crf < 0 || advancedSettings.crf > 51)) {
      throw new Error(`Invalid CRF value: ${advancedSettings.crf}. Must be between 0-51`);
    }

    if (advancedSettings.fps && (advancedSettings.fps < 1 || advancedSettings.fps > 120)) {
      throw new Error(`Invalid FPS value: ${advancedSettings.fps}. Must be between 1-120`);
    }

    if (advancedSettings.videoBitrate && !/^\d+k$/.test(advancedSettings.videoBitrate)) {
      throw new Error(`Invalid video bitrate format: ${advancedSettings.videoBitrate}. Must be in format: 1000k`);
    }

    if (advancedSettings.audioBitrate && !/^\d+k$/.test(advancedSettings.audioBitrate)) {
      throw new Error(`Invalid audio bitrate format: ${advancedSettings.audioBitrate}. Must be in format: 96k`);
    }

    if (advancedSettings.maxConcurrentCompressions && (advancedSettings.maxConcurrentCompressions < 1 || advancedSettings.maxConcurrentCompressions > 6)) {
      throw new Error(`Invalid max concurrent compressions value: ${advancedSettings.maxConcurrentCompressions}. Must be between 1-6`);
    }
  }

  /**
   * Validate output file was created successfully
   */
  static validateOutputFile(outputPath: string): void {
    if (!fs.existsSync(outputPath)) {
      throw new Error('Output file was not created');
    }

    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error('Output file is empty (0 bytes)');
    }
  }
}
