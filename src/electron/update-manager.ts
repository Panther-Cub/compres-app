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
      console.log('UpdateManager already initialized');
      return;
    }

    this.mainWindow = window;
    this.tray = trayInstance;
    
    this.setupIPCHandlers();
    
    this.isInitialized = true;
    console.log('UpdateManager initialized successfully');
    
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
      console.log(`Automatic update detected: ${previousVersion} → ${currentVersion}`);
      
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
      console.log('Auto-update enabled, checking for updates on startup...');
      await this.checkForUpdates(true);
    } else {
      console.log('Auto-update disabled, skipping startup check');
    }
  }

  /**
   * Check for updates using GitHub API
   */
  async checkForUpdates(isAutoCheck = false): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log(`Checking for updates (${isAutoCheck ? 'auto' : 'manual'})...`);
      console.log(`App is packaged: ${app.isPackaged}`);
      console.log(`Current version: ${app.getVersion()}`);
      
      // Always use manual GitHub API check for unsigned applications
      console.log('Using manual GitHub API check for unsigned application...');
      return await this.checkForUpdatesManually();
      
    } catch (error: any) {
      console.error('Update check failed:', error);
      
      // If it's a manual check (not auto), offer to open GitHub releases page
      if (!isAutoCheck) {
        const releasesUrl = `https://github.com/${APP_CONSTANTS.GITHUB_OWNER}/${APP_CONSTANTS.GITHUB_REPO}/releases`;
        console.log(`Opening GitHub releases page as fallback: ${releasesUrl}`);
        
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
      
      console.log(`Checking for updates manually. Current version: ${currentVersion}`);
      console.log(`GitHub repository: ${APP_CONSTANTS.GITHUB_OWNER}/${APP_CONSTANTS.GITHUB_REPO}`);
      
      // Update status to show we're checking
      this.updateStatus({ status: 'checking' });
      
      const url = `https://api.github.com/repos/${APP_CONSTANTS.GITHUB_OWNER}/${APP_CONSTANTS.GITHUB_REPO}/releases/latest`;
      console.log(`GitHub API URL: ${url}`);
      
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
            console.log(`GitHub API response status: ${res.statusCode}`);
            console.log(`GitHub API response headers:`, res.headers);
            
            if (res.statusCode === 200) {
              try {
                const jsonData = JSON.parse(data);
                console.log('GitHub API response data:', jsonData);
                resolve(jsonData);
              } catch (parseError) {
                console.error('Failed to parse GitHub API response:', parseError);
                reject(new Error('Invalid response from GitHub API'));
              }
            } else if (res.statusCode === 403) {
              console.error('GitHub API 403 Forbidden error');
              console.error('Response data:', data);
              
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
          console.error('GitHub API request error:', err);
          reject(new Error(`Network error: ${err.message}`));
        });
        
        // Set timeout
        request.setTimeout(10000, () => {
          request.destroy();
          reject(new Error('GitHub API request timed out'));
        });
      });
      
      const latestVersion = response.tag_name?.replace('v', '');
      console.log(`Latest version on GitHub: ${latestVersion}`);
      
      // Store release info for download
      this.latestReleaseInfo = response;
      
      if (latestVersion && latestVersion !== currentVersion) {
        console.log('Update available!');
        this.updateStatus({
          status: 'available',
          version: latestVersion,
          currentVersion: currentVersion,
          releaseNotes: response.body || undefined
        });
        return { success: true, data: { version: latestVersion, releaseInfo: response } };
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
   * Download update to user's Downloads folder
   */
  async downloadUpdate(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log('Downloading update...');
      
      // Check if update is available
      if (this.currentStatus.status !== 'available') {
        return { success: false, error: 'No update is available for download' };
      }
      
      if (!this.latestReleaseInfo) {
        return { success: false, error: 'No release information available' };
      }
      
      console.log('Release info:', this.latestReleaseInfo);
      console.log('Release assets:', this.latestReleaseInfo.assets);
      
      // Find the macOS zip file in the release assets
      const macZipAsset = this.latestReleaseInfo.assets?.find((asset: any) => 
        asset.name.includes('mac') && asset.name.endsWith('.zip')
      );
      
      if (!macZipAsset) {
        console.error('Available assets:', this.latestReleaseInfo.assets?.map((a: any) => a.name));
        return { success: false, error: 'No macOS zip file found in the release' };
      }
      
      console.log('Found asset:', macZipAsset);
      console.log('Download URL:', macZipAsset.browser_download_url);
      console.log('Asset size:', macZipAsset.size);
      
      // Get user's Downloads folder
      const downloadsPath = path.join(os.homedir(), 'Downloads');
      const fileName = macZipAsset.name;
      const downloadPath = path.join(downloadsPath, fileName);
      
      console.log(`Downloading to: ${downloadPath}`);
      console.log(`Expected file size: ${macZipAsset.size} bytes`);
      
      // Update status to downloading
      this.updateStatus({ status: 'downloading', progress: 0 });
      
      // Download the file
      const result = await this.downloadFile(macZipAsset.browser_download_url, downloadPath, macZipAsset.size);
      
      if (result.success) {
        // Verify the downloaded file size
        const stats = fs.statSync(downloadPath);
        console.log(`Downloaded file size: ${stats.size} bytes`);
        
        if (stats.size < 1000000) { // Less than 1MB is suspicious
          console.error('Downloaded file is too small, likely corrupted');
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
            content: `Version ${this.currentStatus.version} downloaded to Downloads folder. Please install manually.`
          });
        }
        
        return { success: true, data: { downloadPath, version: this.currentStatus.version } };
      } else {
        return result;
      }
      
    } catch (error: any) {
      console.error('Error downloading update:', error);
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
      
      console.log(`Starting download from: ${url}`);
      
      const request = https.get(url, {
        headers: {
          'User-Agent': `${APP_CONSTANTS.APP_NAME}/${app.getVersion()}`,
          'Accept': 'application/octet-stream'
        }
      }, (response) => {
        console.log(`Download response status: ${response.statusCode}`);
        console.log(`Download response headers:`, response.headers);
        
        // Handle redirects
        if ((response.statusCode === 301 || response.statusCode === 302) && redirectCount < 5) {
          const location = response.headers.location;
          if (location) {
            console.log(`Following redirect to: ${location}`);
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
            console.error('Download failed:', errorData);
            resolve({ success: false, error: `Download failed with status ${response.statusCode}: ${errorData}` });
          });
          return;
        }
        
        totalBytes = parseInt(response.headers['content-length'] || '0', 10);
        console.log(`Expected download size: ${totalBytes} bytes`);
        
        if (expectedSize && totalBytes !== expectedSize) {
          console.warn(`Size mismatch: expected ${expectedSize}, got ${totalBytes}`);
        }
        
        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
          
          this.updateStatus({
            status: 'downloading',
            progress: Math.round(progress)
          });
          
          // Log progress every 10%
          if (Math.round(progress) % 10 === 0) {
            console.log(`Download progress: ${Math.round(progress)}% (${downloadedBytes}/${totalBytes} bytes)`);
          }
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`Download completed: ${filePath}`);
          console.log(`Final downloaded size: ${downloadedBytes} bytes`);
          resolve({ success: true });
        });
        
        file.on('error', (err) => {
          fs.unlink(filePath, () => {}); // Delete the file if there was an error
          console.error('File write error:', err);
          resolve({ success: false, error: err.message });
        });
      });
      
      request.on('error', (err) => {
        console.error('Download request error:', err);
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
   * Install update (for unsigned apps, this opens the download location)
   */
  async installUpdate(): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      console.log('Handling update installation for unsigned app...');
      
      // Check if update is downloaded
      if (this.currentStatus.status !== 'downloaded') {
        return { success: false, error: 'No update is ready for installation' };
      }
      
      const downloadPath = this.currentStatus.downloadPath;
      if (!downloadPath) {
        return { success: false, error: 'Download path not found' };
      }
      
      // Show installation instructions dialog
      const result = await dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Install Update',
        message: 'Update Downloaded Successfully',
        detail: `The update has been downloaded to your Downloads folder.\n\nTo install:\n1. Open the Downloads folder\n2. Right-click the downloaded zip file and select "Open With" → "Archive Utility"\n3. This will extract the .app file\n4. Drag the extracted .app file to your Applications folder\n5. Replace the existing app when prompted\n\nNote: If you get an "unsupported format" error, try using Archive Utility instead of double-clicking.\n\nIf macOS blocks the app (unidentified developer):\n- Right-click the app and select "Open"\n- Click "Open" in the security dialog\n- Or go to System Preferences → Security & Privacy → General → "Allow Anyway"\n\nWould you like to open the Downloads folder now?`,
        buttons: ['Open Downloads Folder', 'Cancel'],
        defaultId: 0
      });
      
      if (result.response === 0) {
        // Open Downloads folder
        shell.openPath(path.dirname(downloadPath));
        
        // Also open the zip file
        shell.openPath(downloadPath);
      }
      
      return { 
        success: true, 
        message: 'Update downloaded successfully. Please install manually by replacing the app in your Applications folder.' 
      };
      
    } catch (error: any) {
      console.error('Error during update installation:', error);
      
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
