import { app } from 'electron';
import { DEV_CONSTANTS } from './constants';

/**
 * Environment utilities for consistent development/production detection
 */
export class Environment {
  /**
   * Check if the app is running in development mode
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.ELECTRON_IS_DEV === 'true' ||
           !app.isPackaged;
  }

  /**
   * Check if the app is running in production mode
   */
  static isProduction(): boolean {
    return !this.isDevelopment();
  }

  /**
   * Get the appropriate image source for CSP based on environment
   */
  static getCspImageSrc(): string {
    return this.isDevelopment() ? "'self' data: https: file:" : "'self' data: https:";
  }

  /**
   * Get the appropriate URL for loading content based on environment
   */
  static getLoadUrl(path: string): string {
    if (this.isDevelopment()) {
      return `${DEV_CONSTANTS.DEV_SERVER_URL}${path ? `#${path}` : ''}`;
    } else {
      return path;
    }
  }

  /**
   * Get the appropriate file path for loading content based on environment
   */
  static getLoadFile(basePath: string, options?: { hash?: string }): string {
    if (this.isDevelopment()) {
      return this.getLoadUrl(options?.hash ? `#${options.hash}` : '');
    } else {
      return basePath + (options?.hash ? `#${options.hash}` : '');
    }
  }
}
