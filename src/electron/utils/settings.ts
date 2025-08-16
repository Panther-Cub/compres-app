import fs from 'fs';
import path from 'path';
import os from 'os';
import { APP_CONSTANTS } from './constants';

/**
 * Settings management utilities for consistent settings handling
 */
export class Settings {
  private static readonly SETTINGS_FILE = 'settings.json';

  /**
   * Get the app data directory path
   */
  static getAppDataPath(): string {
    return path.join(os.homedir(), 'Library', 'Application Support', APP_CONSTANTS.APP_NAME);
  }

  /**
   * Get the settings file path
   */
  static getSettingsPath(): string {
    return path.join(this.getAppDataPath(), this.SETTINGS_FILE);
  }

  /**
   * Ensure the app data directory exists
   */
  static ensureAppDataDirectory(): void {
    const appDataPath = this.getAppDataPath();
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
    }
  }

  /**
   * Read settings from file
   */
  static readSettings(): Record<string, any> {
    try {
      const settingsPath = this.getSettingsPath();
      if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        return JSON.parse(settingsData);
      }
    } catch (error) {
      console.error('Error reading settings:', error);
    }
    
    return this.getDefaultSettings();
  }

  /**
   * Write settings to file
   */
  static writeSettings(settings: Record<string, any>): void {
    try {
      this.ensureAppDataDirectory();
      const settingsPath = this.getSettingsPath();
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Error writing settings:', error);
      throw error;
    }
  }

  /**
   * Get a specific setting value
   */
  static getSetting<T>(key: string, defaultValue: T): T {
    const settings = this.readSettings();
    return settings[key] !== undefined ? settings[key] : defaultValue;
  }

  /**
   * Set a specific setting value
   */
  static setSetting<T>(key: string, value: T): void {
    const settings = this.readSettings();
    settings[key] = value;
    this.writeSettings(settings);
  }

  /**
   * Get default settings
   */
  static getDefaultSettings(): Record<string, any> {
    return {
      openAtLogin: APP_CONSTANTS.DEFAULT_OPEN_AT_LOGIN,
      defaultWindow: APP_CONSTANTS.DEFAULT_WINDOW,
      autoUpdateEnabled: true,
      lastUpdateVersion: null,
      lastAppVersion: null
    };
  }

  /**
   * Get startup settings
   */
  static getStartupSettings(): { openAtLogin: boolean; defaultWindow: string; performanceSettings?: { maxConcurrentCompressions: number } } {
    return {
      openAtLogin: this.getSetting('openAtLogin', APP_CONSTANTS.DEFAULT_OPEN_AT_LOGIN),
      defaultWindow: this.getSetting('defaultWindow', APP_CONSTANTS.DEFAULT_WINDOW),
      performanceSettings: {
        maxConcurrentCompressions: this.getSetting('maxConcurrentCompressions', 2)
      }
    };
  }

  /**
   * Save startup settings
   */
  static saveStartupSettings(settings: { openAtLogin: boolean; defaultWindow: string; performanceSettings?: { maxConcurrentCompressions: number } }): void {
    this.setSetting('openAtLogin', settings.openAtLogin);
    this.setSetting('defaultWindow', settings.defaultWindow);
    
    if (settings.performanceSettings?.maxConcurrentCompressions) {
      this.setSetting('maxConcurrentCompressions', settings.performanceSettings.maxConcurrentCompressions);
    }
  }

  /**
   * Get default window setting
   */
  static getDefaultWindow(): string {
    return this.getSetting('defaultWindow', APP_CONSTANTS.DEFAULT_WINDOW);
  }

  /**
   * Get update settings
   */
  static getUpdateSettings(): { autoUpdateEnabled: boolean; lastUpdateVersion: string | null; lastAppVersion: string | null } {
    return {
      autoUpdateEnabled: this.getSetting('autoUpdateEnabled', true),
      lastUpdateVersion: this.getSetting('lastUpdateVersion', null),
      lastAppVersion: this.getSetting('lastAppVersion', null)
    };
  }

  /**
   * Save update settings
   */
  static saveUpdateSettings(settings: { autoUpdateEnabled: boolean; lastUpdateVersion?: string | null; lastAppVersion?: string | null }): void {
    if (settings.autoUpdateEnabled !== undefined) {
      this.setSetting('autoUpdateEnabled', settings.autoUpdateEnabled);
    }
    if (settings.lastUpdateVersion !== undefined) {
      this.setSetting('lastUpdateVersion', settings.lastUpdateVersion);
    }
    if (settings.lastAppVersion !== undefined) {
      this.setSetting('lastAppVersion', settings.lastAppVersion);
    }
  }

  /**
   * Check if an automatic update was applied
   */
  static checkForAutomaticUpdate(currentVersion: string): { wasUpdated: boolean; previousVersion: string | null } {
    const lastAppVersion = this.getSetting('lastAppVersion', null);
    const wasUpdated = lastAppVersion !== null && lastAppVersion !== currentVersion;
    
    return {
      wasUpdated,
      previousVersion: lastAppVersion
    };
  }

  /**
   * Update the last app version (called on app startup)
   */
  static updateLastAppVersion(version: string): void {
    this.setSetting('lastAppVersion', version);
  }
}
