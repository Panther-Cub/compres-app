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
      defaultWindow: APP_CONSTANTS.DEFAULT_WINDOW
    };
  }

  /**
   * Get startup settings
   */
  static getStartupSettings(): { openAtLogin: boolean; defaultWindow: string } {
    return {
      openAtLogin: this.getSetting('openAtLogin', APP_CONSTANTS.DEFAULT_OPEN_AT_LOGIN),
      defaultWindow: this.getSetting('defaultWindow', APP_CONSTANTS.DEFAULT_WINDOW)
    };
  }

  /**
   * Save startup settings
   */
  static saveStartupSettings(settings: { openAtLogin: boolean; defaultWindow: string }): void {
    this.setSetting('openAtLogin', settings.openAtLogin);
    this.setSetting('defaultWindow', settings.defaultWindow);
  }

  /**
   * Get default window setting
   */
  static getDefaultWindow(): string {
    return this.getSetting('defaultWindow', APP_CONSTANTS.DEFAULT_WINDOW);
  }
}
