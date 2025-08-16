/**
 * Simplified Update Manager
 * 
 * This update manager provides a streamlined approach to handling app updates:
 * 
 * Features:
 * - Automatic update checks on app startup (5 second delay)
 * - Manual update checks via UI or menu
 * - GitHub releases integration
 * - Works in both development and production environments
 * - User-friendly notifications via tray
 * - Progress tracking for downloads
 * - Error handling with fallback to manual download
 * 
 * Configuration:
 * - forceDevUpdateConfig: true (enables updates in development)
 * - autoDownload: false (user chooses when to download)
 * - autoInstallOnAppQuit: false (user chooses when to install)
 * - allowPrerelease: false (stable releases only)
 * 
 * Usage:
 * - Updates are automatically checked on startup
 * - Users can manually check via the Update Settings UI
 * - When updates are available, users are notified
 * - Users can download and install updates manually
 * - If installation fails, GitHub releases page opens
 */

import { app, BrowserWindow, Tray, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { APP_CONSTANTS } from './utils/constants';

/**
 * Update status types
 */
export interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  progress?: number;
  version?: string;
  releaseNotes?: string;
  error?: string;
  currentVersion?: string;
}

/**
 * Simplified update manager
 */
export class UpdateManager {
  private static instance: UpdateManager;
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private isInitialized = false;
  private currentStatus: UpdateStatus = { status: 'idle' };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): UpdateManager {
    if (!UpdateManager.instance) {
      UpdateManager.instance = new UpdateManager();
    }
    return UpdateManager.instance;
  }

  /**
   * Initialize the update manager
   */
  initialize(window: BrowserWindow, trayInstance: Tray | null): void {
    if (this.isInitialized) {
      console.log('UpdateManager already initialized');
      return;
    }

    this.mainWindow = window;
    this.tray = trayInstance;
    
    this.configureAutoUpdater();
    this.setupEventHandlers();
    this.setupIPCHandlers();
    
    this.isInitialized = true;
    console.log('UpdateManager initialized successfully');
    
    // Check for updates on startup (with delay)
    setTimeout(() => {
      this.checkForUpdates(true);
    }, 5000);
  }

  /**
   * Configure electron-updater
   */
  private configureAutoUpdater(): void {
    // Configure for GitHub releases
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: APP_CONSTANTS.GITHUB_OWNER,
      repo: APP_CONSTANTS.GITHUB_REPO
    });

    // Enable updates in development mode
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.allowDowngrade = false;
    autoUpdater.autoDownload = false; // Let user choose
    autoUpdater.autoInstallOnAppQuit = false; // Let user choose

    // Configure for unsigned updates
    autoUpdater.allowDowngrade = false;
    autoUpdater.allowPrerelease = false;
    
    // Disable signature verification for unsigned builds
    if (!app.isPackaged || process.env.NODE_ENV === 'development' || process.env.ALLOW_UNSIGNED_UPDATES === 'true') {
      // @ts-ignore - Override signature verification
      autoUpdater.verifyUpdateCodeSignature = () => Promise.resolve(null);
    }

    // Override the isPackaged check for development
    if (!app.isPackaged) {
      // @ts-ignore - Override the internal check
      autoUpdater.isUpdaterActive = () => true;
    }

    // Set up logging
    try {
      const electronLog = require('electron-log');
      autoUpdater.logger = electronLog;
      electronLog.transports.file.level = 'info';
    } catch (error) {
      console.log('electron-log not available, using console logging');
    }

    console.log('Auto-updater configuration:', {
      feedURL: autoUpdater.getFeedURL(),
      autoDownload: autoUpdater.autoDownload,
      autoInstallOnAppQuit: autoUpdater.autoInstallOnAppQuit,
      allowPrerelease: autoUpdater.allowPrerelease,
      currentVersion: app.getVersion(),
      isPackaged: app.isPackaged,
      forceDevUpdateConfig: autoUpdater.forceDevUpdateConfig
    });
  }

  /**
   * Set up auto-updater event handlers
   */
  private setupEventHandlers(): void {
    // Only set up electron-updater events in production mode
    if (app.isPackaged) {
      autoUpdater.on('checking-for-update', () => {
        console.log('Checking for updates...');
        this.updateStatus({ status: 'checking' });
      });

      autoUpdater.on('update-available', (info) => {
        console.log('Update available:', info);
        
        // Show notification
        if (this.tray) {
          this.tray.displayBalloon({
            title: 'Update Available',
            content: `Version ${info.version} is available. Click to download.`
          });
        }
        
        this.updateStatus({
          status: 'available',
          version: info.version,
          releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
          currentVersion: app.getVersion()
        });
      });

      autoUpdater.on('update-not-available', () => {
        console.log('No updates available');
        this.updateStatus({ 
          status: 'not-available',
          currentVersion: app.getVersion()
        });
      });

      autoUpdater.on('error', (err) => {
        console.error('Auto-updater error:', err);
        
        // Don't show errors for expected cases
        if (this.isExpectedError(err)) {
          console.log('Expected error:', err.message);
          return;
        }
        
        this.updateStatus({ 
          status: 'error', 
          error: err.message || 'Unknown error occurred'
        });
      });

      autoUpdater.on('download-progress', (progressObj) => {
        console.log('Download progress:', progressObj);
        this.updateStatus({
          status: 'downloading',
          progress: progressObj.percent
        });
      });

      autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded:', info);
        
        // Show notification
        if (this.tray) {
          this.tray.displayBalloon({
            title: 'Update Ready',
            content: `Version ${info.version} is ready to install. Restart the app to apply.`
          });
        }
        
        this.updateStatus({
          status: 'downloaded',
          version: info.version,
          currentVersion: app.getVersion()
        });
      });
    } else {
      console.log('Development mode: Skipping electron-updater event handlers');
    }
  }

  /**
   * Set up IPC handlers for renderer process communication
   */
  private setupIPCHandlers(): void {
    ipcMain.handle('update:check', this.handleCheckForUpdates.bind(this));
    ipcMain.handle('update:download', this.handleDownloadUpdate.bind(this));
    ipcMain.handle('update:install', this.handleInstallUpdate.bind(this));
    ipcMain.handle('update:get-status', this.handleGetStatus.bind(this));
  }

  /**
   * Check for updates
   */
  async checkForUpdates(isAutoCheck = false): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log(`Checking for updates (${isAutoCheck ? 'auto' : 'manual'})...`);
      console.log(`App is packaged: ${app.isPackaged}`);
      
      // Always use manual GitHub API check in development mode
      if (!app.isPackaged) {
        console.log('Running in development mode - using manual GitHub API check...');
        return await this.checkForUpdatesManually();
      }
      
      // In production mode, use electron-updater
      console.log('Running in production mode - using electron-updater...');
      const result = await autoUpdater.checkForUpdates();
      console.log('Update check completed:', result);
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('Update check failed:', error);
      
      // If we're in development mode and electron-updater fails, fall back to manual check
      if (!app.isPackaged) {
        console.log('Falling back to manual GitHub API check...');
        return await this.checkForUpdatesManually();
      }
      
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Manual update check using GitHub API (for development mode)
   */
  private async checkForUpdatesManually(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const https = require('https');
      const currentVersion = app.getVersion();
      
      console.log(`Checking for updates manually. Current version: ${currentVersion}`);
      
      // Update status to show we're checking
      this.updateStatus({ status: 'checking' });
      
      const url = `https://api.github.com/repos/${APP_CONSTANTS.GITHUB_OWNER}/${APP_CONSTANTS.GITHUB_REPO}/releases/latest`;
      
      const response = await new Promise<{ tag_name?: string }>((resolve, reject) => {
        https.get(url, (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`GitHub API returned ${res.statusCode}`));
            }
          });
        }).on('error', reject);
      });
      
      const latestVersion = response.tag_name?.replace('v', '');
      console.log(`Latest version on GitHub: ${latestVersion}`);
      
      if (latestVersion && latestVersion !== currentVersion) {
        console.log('Update available!');
        this.updateStatus({
          status: 'available',
          version: latestVersion,
          currentVersion: currentVersion
        });
        return { success: true, data: { version: latestVersion } };
      } else {
        console.log('No updates available');
        this.updateStatus({
          status: 'not-available',
          currentVersion: currentVersion
        });
        return { success: true, data: null };
      }
      
    } catch (error: any) {
      console.error('Manual update check failed:', error);
      this.updateStatus({
        status: 'error',
        error: error.message || 'Failed to check for updates',
        currentVersion: app.getVersion()
      });
      return { success: false, error: error.message || 'Failed to check for updates' };
    }
  }

  /**
   * Download update
   */
  async downloadUpdate(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log('Downloading update...');
      const result = await autoUpdater.downloadUpdate();
      console.log('Download result:', result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error downloading update:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Install update
   */
  async installUpdate(): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      console.log('Installing update...');
      
      // Set a small delay to ensure the response is sent before the app quits
      setTimeout(() => {
        autoUpdater.quitAndInstall();
      }, 100);

      return { success: true, message: 'Installing update...' };
    } catch (error: any) {
      console.error('Error during update installation:', error);
      
      // Fallback: open GitHub releases page for manual download
      const releasesUrl = `https://github.com/${APP_CONSTANTS.GITHUB_OWNER}/${APP_CONSTANTS.GITHUB_REPO}/releases`;
      shell.openExternal(releasesUrl);
      
      return { success: true, message: 'Opened GitHub releases page for manual download' };
    }
  }

  /**
   * Get current update status
   */
  getStatus(): UpdateStatus {
    return { ...this.currentStatus };
  }

  /**
   * Update status and notify renderer
   */
  private updateStatus(status: Partial<UpdateStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...status };
    
    if (this.mainWindow) {
      this.mainWindow.webContents.send('update-status', this.currentStatus);
    }
  }

  /**
   * Check if an error is expected
   */
  private isExpectedError(err: any): boolean {
    const expectedErrors = [
      'already downloaded',
      'No update available',
      'Code signature',
      'code has no resources but signature indicates they must be present',
      'did not pass validation',
      'signature verification failed',
      'unsigned',
      'not signed',
      'signature not found',
      'signature validation failed'
    ];
    
    return expectedErrors.some(expected => err.message?.includes(expected));
  }

  // IPC Handler methods
  private async handleCheckForUpdates(): Promise<{ success: boolean; error?: string }> {
    return this.checkForUpdates(false);
  }

  private async handleDownloadUpdate(): Promise<{ success: boolean; error?: string }> {
    return this.downloadUpdate();
  }

  private async handleInstallUpdate(): Promise<{ success: boolean; error?: string }> {
    return this.installUpdate();
  }

  private handleGetStatus(): UpdateStatus {
    return this.getStatus();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.isInitialized = false;
  }
}
