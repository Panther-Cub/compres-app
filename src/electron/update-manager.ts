/**
 * Manual Update Manager for Unsigned Applications
 * 
 * This update manager provides a streamlined approach to handling app updates for unsigned applications:
 * 
 * Features:
 * - Automatic update checks on app startup (5 second delay)
 * - Manual update checks via UI or menu
 * - GitHub releases integration
 * - Works in both development and production environments
 * - User-friendly notifications via tray
 * - Progress tracking for downloads
 * - Downloads zip file to user-accessible location for manual installation
 * 
 * Configuration:
 * - Uses GitHub API directly (no electron-updater dependency)
 * - Downloads to Downloads folder for easy access
 * - Provides clear instructions for manual installation
 * 
 * Usage:
 * - Updates are automatically checked on startup
 * - Users can manually check via the Update Settings UI
 * - When updates are available, users are notified
 * - Users can download the zip file to their Downloads folder
 * - Users manually replace the app by dragging the new version to Applications
 */

import { app, BrowserWindow, Tray, shell, ipcMain, dialog } from 'electron';
import { APP_CONSTANTS } from './utils/constants';
import { Settings } from './utils/settings';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';

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
  downloadPath?: string;
}

/**
 * Manual update manager for unsigned applications
 */
export class UpdateManager {
  private static instance: UpdateManager;
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private isInitialized = false;
  private currentStatus: UpdateStatus = { status: 'idle' };
  private latestReleaseInfo: any = null;

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
      return;
    }

    this.mainWindow = window;
    this.tray = trayInstance;
    
    this.setupIPCHandlers();
    
    this.isInitialized = true;
    
    // Check for automatic update on startup
    this.checkForAutomaticUpdateOnStartup();
    
    // Check for updates on startup (with delay) if auto-update is enabled
    setTimeout(() => {
      this.checkForUpdatesOnStartup();
    }, 5000);
  }

  /**
   * Check for automatic update on startup
   */
  private checkForAutomaticUpdateOnStartup(): void {
    const currentVersion = app.getVersion();
    const { wasUpdated, previousVersion } = Settings.checkForAutomaticUpdate(currentVersion);
    
    if (wasUpdated && previousVersion) {
      // Show notification about the automatic update
      if (this.tray) {
        this.tray.displayBalloon({
          title: 'Update Applied',
          content: `Your app has been automatically updated from version ${previousVersion} to ${currentVersion}.`
        });
      }
      
      // Update the last app version
      Settings.updateLastAppVersion(currentVersion);
    } else {
      // Update the last app version even if no update was detected
      Settings.updateLastAppVersion(currentVersion);
    }
  }

  /**
   * Check for updates on startup (respects auto-update setting)
   */
  private async checkForUpdatesOnStartup(): Promise<void> {
    const { autoUpdateEnabled } = Settings.getUpdateSettings();
    
    if (autoUpdateEnabled) {
      await this.checkForUpdates(true);
    }
  }

  /**
   * Check for updates using GitHub API
   */
  async checkForUpdates(isAutoCheck = false): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Always use manual GitHub API check for unsigned applications
      return await this.checkForUpdatesManually();
      
    } catch (error: any) {
      // If it's a manual check (not auto), offer to open GitHub releases page
      if (!isAutoCheck) {
        const releasesUrl = `https://github.com/${APP_CONSTANTS.GITHUB_OWNER}/${APP_CONSTANTS.GITHUB_REPO}/releases`;
        
        // Open GitHub releases page for manual check
        shell.openExternal(releasesUrl);
        
        return { 
          success: false, 
          error: `${error.message}\n\nOpened GitHub releases page for manual update check.` 
        };
      }
      
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Manual update check using GitHub API
   */
  private async checkForUpdatesManually(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const currentVersion = app.getVersion();
      

      
      // Update status to show we're checking
      this.updateStatus({ status: 'checking' });
      
      const url = `https://api.github.com/repos/${APP_CONSTANTS.GITHUB_OWNER}/${APP_CONSTANTS.GITHUB_REPO}/releases/latest`;
      
      const response = await new Promise<any>((resolve, reject) => {
        const request = https.get(url, {
          headers: {
            'User-Agent': `${APP_CONSTANTS.APP_NAME}/${currentVersion}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }, (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const jsonData = JSON.parse(data);
                resolve(jsonData);
              } catch (parseError) {
                reject(new Error('Invalid response from GitHub API'));
              }
            } else if (res.statusCode === 403) {
              
              // Check if it's a rate limit issue
              const rateLimitRemaining = res.headers['x-ratelimit-remaining'];
              const rateLimitReset = res.headers['x-ratelimit-reset'];
              
              if (rateLimitRemaining === '0') {
                const resetTime = new Date(parseInt(rateLimitReset) * 1000);
                reject(new Error(`GitHub API rate limit exceeded. Reset time: ${resetTime.toISOString()}`));
              } else {
                reject(new Error(`GitHub API access forbidden (403). This could be due to:\n- Repository is private\n- Repository doesn't exist\n- Network restrictions\n\nResponse: ${data}`));
              }
            } else if (res.statusCode === 404) {
              reject(new Error(`GitHub repository not found: ${APP_CONSTANTS.GITHUB_OWNER}/${APP_CONSTANTS.GITHUB_REPO}`));
            } else {
              reject(new Error(`GitHub API returned ${res.statusCode}: ${data}`));
            }
          });
        });
        
        request.on('error', (err) => {
          reject(new Error(`Network error: ${err.message}`));
        });
        
        // Set timeout
        request.setTimeout(10000, () => {
          request.destroy();
          reject(new Error('GitHub API request timed out'));
        });
      });
      
      const latestVersion = response.tag_name?.replace('v', '');
      
      // Store release info for download
      this.latestReleaseInfo = response;
      
      if (latestVersion && latestVersion !== currentVersion) {
        this.updateStatus({
          status: 'available',
          version: latestVersion,
          currentVersion: currentVersion,
          releaseNotes: response.body || undefined
        });
        return { success: true, data: { version: latestVersion, releaseInfo: response } };
      } else {
        this.updateStatus({
          status: 'not-available',
          currentVersion: currentVersion
        });
        return { success: true, data: null };
      }
      
    } catch (error: any) {
      this.updateStatus({
        status: 'error',
        error: error.message || 'Failed to check for updates',
        currentVersion: app.getVersion()
      });
      return { success: false, error: error.message || 'Failed to check for updates' };
    }
  }

  /**
   * Download update to user's Downloads folder
   */
  async downloadUpdate(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {

      
      // Check if update is available
      if (this.currentStatus.status !== 'available') {
        return { success: false, error: 'No update is available for download' };
      }
      
      if (!this.latestReleaseInfo) {
        return { success: false, error: 'No release information available' };
      }
      

      
      // Find the macOS pkg file in the release assets
      const macPkgAsset = this.latestReleaseInfo.assets?.find((asset: any) => 
        asset.name.includes('mac') && asset.name.endsWith('.pkg')
      );
      
      if (!macPkgAsset) {
        return { success: false, error: 'No macOS pkg file found in the release' };
      }
      
      // Get user's Downloads folder
      const downloadsPath = path.join(os.homedir(), 'Downloads');
      const fileName = macPkgAsset.name;
      const downloadPath = path.join(downloadsPath, fileName);
      

      
      // Update status to downloading
      this.updateStatus({ status: 'downloading', progress: 0 });
      
      // Download the file
      const result = await this.downloadFile(macPkgAsset.browser_download_url, downloadPath, macPkgAsset.size);
      
      if (result.success) {
        // Verify the downloaded file size
        const stats = fs.statSync(downloadPath);
        
        if (stats.size < 1000000) { // Less than 1MB is suspicious
          fs.unlinkSync(downloadPath);
          return { success: false, error: 'Downloaded file is too small, download may have failed' };
        }
        
        this.updateStatus({
          status: 'downloaded',
          version: this.currentStatus.version,
          currentVersion: app.getVersion(),
          downloadPath: downloadPath
        });
        
        // Show success notification
        if (this.tray) {
          this.tray.displayBalloon({
            title: 'Update Downloaded',
            content: `Version ${this.currentStatus.version} downloaded to Downloads folder. Run the .pkg installer to install.`
          });
        }
        
        return { success: true, data: { downloadPath, version: this.currentStatus.version } };
      } else {
        return result;
      }
      
    } catch (error: any) {
      this.updateStatus({ status: 'error', error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a file with progress tracking
   */
  private async downloadFile(url: string, filePath: string, expectedSize?: number, redirectCount: number = 0): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const file = fs.createWriteStream(filePath);
      let downloadedBytes = 0;
      let totalBytes = 0;
      

      
      const request = https.get(url, {
        headers: {
          'User-Agent': `${APP_CONSTANTS.APP_NAME}/${app.getVersion()}`,
          'Accept': 'application/octet-stream'
        }
      }, (response) => {

        
        // Handle redirects
        if ((response.statusCode === 301 || response.statusCode === 302) && redirectCount < 5) {
          const location = response.headers.location;
          if (location) {
            file.close();
            fs.unlink(filePath, () => {}); // Clean up the partial file
            
            // Recursively call downloadFile with the new URL
            this.downloadFile(location, filePath, expectedSize, redirectCount + 1).then(resolve);
            return;
          }
        }
        
        if (response.statusCode !== 200) {
          let errorData = '';
          response.on('data', (chunk) => errorData += chunk);
          response.on('end', () => {
    
            resolve({ success: false, error: `Download failed with status ${response.statusCode}: ${errorData}` });
          });
          return;
        }
        
        totalBytes = parseInt(response.headers['content-length'] || '0', 10);

        
        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
          
          // Update progress more frequently for better UX
          this.updateStatus({
            status: 'downloading',
            progress: Math.round(progress)
          });
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve({ success: true });
        });
        
        file.on('error', (err) => {
          fs.unlink(filePath, () => {}); // Delete the file if there was an error
          resolve({ success: false, error: err.message });
        });
      });
      
      request.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
      
      // Set timeout
      request.setTimeout(300000, () => { // 5 minutes timeout
        request.destroy();
        resolve({ success: false, error: 'Download timed out' });
      });
    });
  }

  /**
   * Install update (for unsigned apps, this quits the app and opens the installer)
   */
  async installUpdate(): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      
      // Check if update is downloaded
      if (this.currentStatus.status !== 'downloaded') {
        return { success: false, error: 'No update is ready for installation' };
      }
      
      const downloadPath = this.currentStatus.downloadPath;
      if (!downloadPath) {
        return { success: false, error: 'Download path not found' };
      }
      
      // Show installation instructions dialog with quit option
      const result = await dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Install Update',
        message: 'Update Ready to Install',
        detail: `The update has been downloaded to your Downloads folder.\n\nTo install the update:\n1. The app will quit automatically\n2. The installer will open from your Downloads folder\n3. Follow the installation wizard\n4. The installer will replace the current app with the new version\n5. The installer will also remove quarantine attributes automatically\n\nNote: The .pkg installer is designed for unsigned apps and will handle all the necessary setup automatically.\n\nClick "Quit and Install" to proceed with the installation.`,
        buttons: ['Quit and Install', 'Open Downloads Folder', 'Cancel'],
        defaultId: 0
      });
      
      if (result.response === 0) {
        // Quit and install - open the pkg file and quit the app
        
        // Open the pkg file first
        shell.openPath(downloadPath);
        
        // Give a moment for the installer to start, then quit the app
        setTimeout(() => {
          app.quit();
        }, 1000);
        
        return { 
          success: true, 
          message: 'App will quit and installer will open. Please follow the installation wizard.' 
        };
      } else if (result.response === 1) {
        // Just open Downloads folder
        shell.openPath(path.dirname(downloadPath));
        
        return { 
          success: true, 
          message: 'Downloads folder opened. Please quit the app manually before running the installer.' 
        };
      }
      
      return { 
        success: true, 
        message: 'Installation cancelled.' 
      };
      
    } catch (error: any) {

      
      // Fallback: open GitHub releases page for manual download
      const releasesUrl = `https://github.com/${APP_CONSTANTS.GITHUB_OWNER}/${APP_CONSTANTS.GITHUB_REPO}/releases`;
      shell.openExternal(releasesUrl);
      
      return { success: false, error: error.message || 'Installation failed' };
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
   * Set up IPC handlers for renderer process communication
   */
  private setupIPCHandlers(): void {
    ipcMain.handle('update:check', this.handleCheckForUpdates.bind(this));
    ipcMain.handle('update:download', this.handleDownloadUpdate.bind(this));
    ipcMain.handle('update:install', this.handleInstallUpdate.bind(this));
    ipcMain.handle('update:get-status', this.handleGetStatus.bind(this));
    ipcMain.handle('update:get-settings', this.handleGetUpdateSettings.bind(this));
    ipcMain.handle('update:save-settings', this.handleSaveUpdateSettings.bind(this));

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

  private handleGetUpdateSettings(): { autoUpdateEnabled: boolean; lastUpdateVersion: string | null; lastAppVersion: string | null } {
    return Settings.getUpdateSettings();
  }

  private handleSaveUpdateSettings(event: any, settings: { autoUpdateEnabled: boolean; lastUpdateVersion?: string | null; lastAppVersion?: string | null }): void {
    Settings.saveUpdateSettings(settings);
  }



  /**
   * Clean up resources
   */
  cleanup(): void {
    this.isInitialized = false;
  }
}
