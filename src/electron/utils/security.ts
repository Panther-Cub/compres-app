import { BrowserWindow, session } from 'electron';
import { Environment } from './environment';

/**
 * Security utilities for consistent CSP and security policies
 */
export class Security {
  /**
   * Set up Content Security Policy for a window
   */
  static setupCsp(window: BrowserWindow): void {
    window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      const imgSrc = Environment.getCspImageSrc();
      
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src ${imgSrc}; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';`
          ]
        }
      });
    });
  }

  /**
   * Get common web preferences for all windows
   */
  static getCommonWebPreferences(partition: string = 'persist:main'): Electron.WebPreferences {
    // In development: __dirname points to src/electron/utils/
    // In production: __dirname points to build/electron/utils/
    // We need to go up to the build directory to find preload.js
    const preloadPath = require('path').join(__dirname, '..', '..', 'preload.js');
    
    return {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: true,
      allowRunningInsecureContent: false,
      partition
    };
  }
}
