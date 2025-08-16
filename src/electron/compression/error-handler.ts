import { FFmpegError } from './types';

export interface CompressionError {
  type: 'validation' | 'ffmpeg' | 'system' | 'cancellation' | 'hardware' | 'unknown';
  message: string;
  details?: string;
  recoverable: boolean;
  suggestedAction?: string;
}

export class CompressionErrorHandler {
  /**
   * Handle FFmpeg errors and convert them to user-friendly messages
   */
  static handleFFmpegError(error: FFmpegError, context: {
    fileName: string;
    presetKey: string;
    codec: string;
  }): CompressionError {
    const errorMessage = error.message.toLowerCase();
    
    // Hardware acceleration errors
    if (errorMessage.includes('videotoolbox') || errorMessage.includes('hardware')) {
      return {
        type: 'hardware',
        message: `Hardware acceleration not available for ${context.fileName}`,
        details: `The ${context.codec} codec requires hardware support that's not available on your system.`,
        recoverable: true,
        suggestedAction: 'Try using a software codec like libx264 instead.'
      };
    }

    // Input file errors
    if (errorMessage.includes('no such file') || errorMessage.includes('file not found')) {
      return {
        type: 'validation',
        message: `Input file not found: ${context.fileName}`,
        details: 'The video file may have been moved or deleted.',
        recoverable: false,
        suggestedAction: 'Please select a valid video file.'
      };
    }

    // Permission errors
    if (errorMessage.includes('permission denied') || errorMessage.includes('access denied')) {
      return {
        type: 'system',
        message: `Permission denied for ${context.fileName}`,
        details: 'The app doesn\'t have permission to access this file.',
        recoverable: false,
        suggestedAction: 'Check file permissions or try a different location.'
      };
    }

    // Codec errors
    if (errorMessage.includes('codec') || errorMessage.includes('encoder')) {
      return {
        type: 'ffmpeg',
        message: `Codec error for ${context.fileName}`,
        details: `The ${context.codec} codec is not available or not suitable for this video.`,
        recoverable: true,
        suggestedAction: 'Try a different preset or codec.'
      };
    }

    // Memory/disk space errors
    if (errorMessage.includes('no space') || errorMessage.includes('disk full')) {
      return {
        type: 'system',
        message: 'Insufficient disk space',
        details: 'There\'s not enough space to save the compressed video.',
        recoverable: false,
        suggestedAction: 'Free up disk space or choose a different output location.'
      };
    }

    // Format errors
    if (errorMessage.includes('format') || errorMessage.includes('container')) {
      return {
        type: 'ffmpeg',
        message: `Unsupported format for ${context.fileName}`,
        details: 'The video format is not supported by FFmpeg.',
        recoverable: false,
        suggestedAction: 'Try converting the video to a supported format first.'
      };
    }

    // Generic FFmpeg errors
    return {
      type: 'ffmpeg',
      message: `Compression failed for ${context.fileName}`,
      details: error.message,
      recoverable: true,
      suggestedAction: 'Try different compression settings or check the video file.'
    };
  }

  /**
   * Handle cancellation errors
   */
  static handleCancellationError(context: {
    fileName: string;
    presetKey: string;
  }): CompressionError {
    return {
      type: 'cancellation',
      message: `Compression cancelled for ${context.fileName}`,
      details: 'The compression was cancelled by the user.',
      recoverable: true,
      suggestedAction: 'You can restart the compression when ready.'
    };
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error: Error, context: {
    fileName?: string;
    presetKey?: string;
  }): CompressionError {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('crf') || errorMessage.includes('bitrate')) {
      return {
        type: 'validation',
        message: 'Invalid compression settings',
        details: error.message,
        recoverable: true,
        suggestedAction: 'Please check your compression settings and try again.'
      };
    }

    if (errorMessage.includes('output directory') || errorMessage.includes('directory')) {
      return {
        type: 'validation',
        message: 'Output directory error',
        details: error.message,
        recoverable: true,
        suggestedAction: 'Choose a different output location or create the directory.'
      };
    }

    return {
      type: 'validation',
      message: 'Invalid input',
      details: error.message,
      recoverable: true,
      suggestedAction: 'Please check your settings and try again.'
    };
  }

  /**
   * Handle system errors
   */
  static handleSystemError(error: Error, context: {
    fileName?: string;
    presetKey?: string;
  }): CompressionError {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('memory') || errorMessage.includes('out of memory')) {
      return {
        type: 'system',
        message: 'Insufficient memory',
        details: 'The system ran out of memory during compression.',
        recoverable: true,
        suggestedAction: 'Close other applications or try compressing fewer files at once.'
      };
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return {
        type: 'system',
        message: 'Compression timed out',
        details: 'The compression process took too long and was terminated.',
        recoverable: true,
        suggestedAction: 'Try with lower quality settings or smaller files.'
      };
    }

    return {
      type: 'system',
      message: 'System error occurred',
      details: error.message,
      recoverable: true,
      suggestedAction: 'Try restarting the application or your computer.'
    };
  }

  /**
   * Handle unknown errors
   */
  static handleUnknownError(error: Error, context: {
    fileName?: string;
    presetKey?: string;
  }): CompressionError {
    return {
      type: 'unknown',
      message: 'An unexpected error occurred',
      details: error.message,
      recoverable: true,
      suggestedAction: 'Please try again or contact support if the problem persists.'
    };
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: CompressionError): string {
    return error.message;
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: CompressionError): boolean {
    return error.recoverable;
  }

  /**
   * Get suggested action for error
   */
  static getSuggestedAction(error: CompressionError): string | undefined {
    return error.suggestedAction;
  }

  /**
   * Log error with context
   */
  static logError(error: CompressionError, context: {
    fileName?: string;
    presetKey?: string;
    codec?: string;
  }): void {
    console.error('Compression error:', {
      type: error.type,
      message: error.message,
      details: error.details,
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Aggregate multiple errors into a summary
   */
  static aggregateErrors(errors: CompressionError[]): {
    totalErrors: number;
    recoverableErrors: number;
    nonRecoverableErrors: number;
    errorTypes: Record<string, number>;
    commonSuggestions: string[];
  } {
    const errorTypes: Record<string, number> = {};
    const suggestions = new Set<string>();
    let recoverableCount = 0;
    let nonRecoverableCount = 0;

    for (const error of errors) {
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
      
      if (error.recoverable) {
        recoverableCount++;
      } else {
        nonRecoverableCount++;
      }

      if (error.suggestedAction) {
        suggestions.add(error.suggestedAction);
      }
    }

    return {
      totalErrors: errors.length,
      recoverableErrors: recoverableCount,
      nonRecoverableErrors: nonRecoverableCount,
      errorTypes,
      commonSuggestions: Array.from(suggestions)
    };
  }
}
