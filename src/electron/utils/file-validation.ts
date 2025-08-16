import fs from 'fs';
import path from 'path';
import { APP_CONSTANTS, ERROR_MESSAGES } from './constants';

/**
 * File validation utilities for consistent file checking across the app
 */
export class FileValidation {
  /**
   * Validate a single video file
   */
  static validateVideoFile(filePath: string): { isValid: boolean; error?: string } {
    try {
      // Check if file path is valid
      if (!filePath || typeof filePath !== 'string') {
        return { isValid: false, error: ERROR_MESSAGES.FILE.INVALID_PATH };
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { isValid: false, error: ERROR_MESSAGES.FILE.NOT_FOUND };
      }

      // Check if file is readable
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
      } catch (accessError) {
        return { isValid: false, error: ERROR_MESSAGES.FILE.NOT_READABLE };
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (!APP_CONSTANTS.VALID_VIDEO_EXTENSIONS.includes(ext)) {
        return { isValid: false, error: `${ERROR_MESSAGES.FILE.INVALID_EXTENSION}: ${ext}` };
      }

      // Check file size
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        return { isValid: false, error: ERROR_MESSAGES.FILE.EMPTY };
      }

      if (stats.size > APP_CONSTANTS.MAX_FILE_SIZE_BYTES) {
        return { isValid: false, error: `${ERROR_MESSAGES.FILE.TOO_LARGE} (${stats.size} bytes)` };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: `${ERROR_MESSAGES.FILE.VALIDATION_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Validate multiple video files and return valid ones
   */
  static validateVideoFiles(filePaths: string[]): { validFiles: string[]; errors: Array<{ file: string; error: string }> } {
    const validFiles: string[] = [];
    const errors: Array<{ file: string; error: string }> = [];

    for (const filePath of filePaths) {
      const validation = this.validateVideoFile(filePath);
      if (validation.isValid) {
        validFiles.push(filePath);
      } else {
        errors.push({ file: filePath, error: validation.error! });
      }
    }

    return { validFiles, errors };
  }

  /**
   * Validate a directory for write access
   */
  static validateDirectory(directoryPath: string): { isValid: boolean; error?: string } {
    try {
      if (!directoryPath || typeof directoryPath !== 'string') {
        return { isValid: false, error: ERROR_MESSAGES.DIRECTORY.INVALID_PATH };
      }

      if (!fs.existsSync(directoryPath)) {
        return { isValid: false, error: ERROR_MESSAGES.DIRECTORY.NOT_FOUND };
      }

      // Check if directory is writable
      try {
        const testFile = path.join(directoryPath, '.test-write');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (writeError) {
        return { isValid: false, error: ERROR_MESSAGES.DIRECTORY.NOT_WRITABLE };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: `${ERROR_MESSAGES.DIRECTORY.VALIDATION_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Validate a new filename for invalid characters
   */
  static validateFilename(filename: string): { isValid: boolean; error?: string } {
    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
      return { isValid: false, error: ERROR_MESSAGES.FILENAME.INVALID };
    }

    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(filename)) {
      return { isValid: false, error: ERROR_MESSAGES.FILENAME.INVALID_CHARACTERS };
    }

    return { isValid: true };
  }
}
