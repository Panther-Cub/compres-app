import { ipcMain, dialog, shell, app } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import { 
  videoPresets, 
  CompressionManager,
  getAllPresets,
  isCustomPreset,
  getCustomPresets
} from './compression';
import { 
  addCustomPresetWithPersistence, 
  removeCustomPresetWithPersistence 
} from './compression/custom-preset-manager';
import { getDefaultOutputDirectory } from './compression/utils';
import { 
  getMainWindow, 
  showMainWindow, 
  hideMainWindow, 
  showOverlayWindow, 
  hideOverlayWindow,
  createDefaultsWindow,
  createBatchRenameWindow
} from './window-manager';

import { FileValidation, Settings } from './utils';
import { APP_CONSTANTS, ERROR_MESSAGES } from './utils/constants';

// Global compression manager instance
let compressionManager: CompressionManager | null = null;

export function setupIpcHandlers(): void {
  // Initialize compression manager
  ipcMain.handle('initialize-compression-manager', async () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) {
      throw new Error(ERROR_MESSAGES.WINDOW.NOT_AVAILABLE);
    }
    
    compressionManager = new CompressionManager(mainWindow);
    return { success: true };
  });

  // Compression limits and recommendations
  ipcMain.handle('get-compression-limits', async () => {
    if (!compressionManager) {
      throw new Error('Compression manager not initialized');
    }
    
    const recommendations = await compressionManager.getSystemRecommendations();
    return {
      maxConcurrent: compressionManager.getMaxConcurrentCompressions(),
      maxVideosPerBatch: compressionManager.getMaxVideosPerBatch(),
      recommendations
    };
  });

  ipcMain.handle('set-max-videos-per-batch', async (event, maxVideos: number) => {
    if (!compressionManager) {
      throw new Error('Compression manager not initialized');
    }
    
    compressionManager.setMaxVideosPerBatch(maxVideos);
    return { success: true, maxVideos: compressionManager.getMaxVideosPerBatch() };
  });

  ipcMain.handle('get-system-recommendations', async () => {
    if (!compressionManager) {
      throw new Error('Compression manager not initialized');
    }
    
    return await compressionManager.getSystemRecommendations();
  });

  // Custom preset management
  ipcMain.handle('add-custom-preset', async (event, presetId: string, preset: any) => {
    try {
      addCustomPresetWithPersistence(presetId, preset);
      return { success: true, presetId };
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('remove-custom-preset', async (event, presetId: string) => {
    try {
      removeCustomPresetWithPersistence(presetId);
      return { success: true, presetId };
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('get-all-presets', async () => {
    try {
      return getAllPresets();
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('get-custom-presets', async () => {
    try {
      return getCustomPresets();
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('is-custom-preset', async (event, presetId: string) => {
    try {
      return isCustomPreset(presetId);
    } catch (error) {
      throw error;
    }
  });

  // App information
  ipcMain.handle('get-app-version', async () => {
    return app.getVersion();
  });

  // Theme management
  ipcMain.handle('get-current-theme', async () => {
    // Get the current theme from the main window's webContents
    const mainWindow = getMainWindow();
    if (mainWindow) {
      try {
        // Execute script in main window to get current theme
        const theme = await mainWindow.webContents.executeJavaScript(`
          (() => {
            const themeManager = window.themeManager;
            return themeManager ? themeManager.getCurrentTheme() : 'system';
          })()
        `);
        return theme;
      } catch (error) {
        return 'system';
      }
    }
    return 'system';
  });

  // Overlay window communication
  ipcMain.handle('overlay-file-drop', async (event, filePaths: string[]) => {
    // Validate and filter files using the utility
    const { validFiles } = FileValidation.validateVideoFiles(filePaths);
    
    // Send files to main window if any are valid
    if (validFiles.length > 0) {
      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('overlay-files-dropped', validFiles);
        
        // Show main window and bring to front
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
        
        // Hide the overlay window
        hideOverlayWindow();
      }
    }
    
    return { success: true, validFiles };
  });

  ipcMain.handle('toggle-overlay', async (event, show: boolean) => {
    if (show) {
      showOverlayWindow();
    } else {
      hideOverlayWindow();
    }
    return { success: true };
  });

  ipcMain.handle('show-overlay', async () => {
    showOverlayWindow();
    return { success: true };
  });

  ipcMain.handle('hide-overlay', async () => {
    hideOverlayWindow();
    return { success: true };
  });

  ipcMain.handle('hide-main-window', async () => {
    hideMainWindow();
    return { success: true };
  });

  ipcMain.handle('show-main-window', async () => {
    showMainWindow();
    return { success: true };
  });

  // Note: Update manager IPC handlers are now handled by the UpdateManager class

  // File operations
  ipcMain.handle('select-files', async () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) {
      throw new Error(ERROR_MESSAGES.WINDOW.NOT_AVAILABLE);
    }
    
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v'] }
        ]
      });
      
      if (result.canceled) {
        return [];
      }
      
      // Validate selected files using the utility
      const { validFiles, errors } = FileValidation.validateVideoFiles(result.filePaths);
      
      // Log any validation errors
      if (errors.length > 0) {
        console.warn('File validation errors:', errors);
      }
      
      return validFiles;
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('get-default-output-directory', async (event, folderName?: string) => {
    try {
      const homeDir = os.homedir();
      const desktopDir = path.join(homeDir, 'Desktop');
      const folderToUse = folderName || APP_CONSTANTS.DEFAULT_OUTPUT_DIR;
      const compressedVideosDir = path.join(desktopDir, folderToUse);
      
      // Create the directory if it doesn't exist
      if (!fs.existsSync(compressedVideosDir)) {
        try {
          fs.mkdirSync(compressedVideosDir, { recursive: true });
        } catch (error) {
          return desktopDir;
        }
      }
      
      // Verify the directory is writable using the utility
      const validation = FileValidation.validateDirectory(compressedVideosDir);
      if (!validation.isValid) {
        return desktopDir;
      }
      
      return compressedVideosDir;
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('select-output-directory', async () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) {
      throw new Error(ERROR_MESSAGES.WINDOW.NOT_AVAILABLE);
    }
    
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        defaultPath: getDefaultOutputDirectory()
      });
      
      if (result.canceled || result.filePaths.length === 0) {
        return '';
      }
      
      const selectedDir = result.filePaths[0];
      
      // Validate the selected directory using the utility
      const validation = FileValidation.validateDirectory(selectedDir);
      if (!validation.isValid) {
        throw new Error(validation.error || ERROR_MESSAGES.DIRECTORY.VALIDATION_FAILED);
      }
      
      return selectedDir;
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('get-presets', () => {
    // Convert the nested preset structure to the flat structure expected by the frontend
    const flatPresets: Record<string, any> = {};
    for (const [key, preset] of Object.entries(videoPresets)) {
      flatPresets[key] = {
        id: key,
        name: preset.name,
        description: preset.description,
        crf: preset.settings.crf,
        videoBitrate: preset.settings.videoBitrate,
        audioBitrate: preset.settings.audioBitrate,
        fps: preset.settings.fps,
        resolution: preset.settings.resolution,
        keepAudio: true // Default to true, will be overridden by user setting
      };
    }
    return flatPresets;
  });

  ipcMain.handle('get-file-info', async (event, filePath: string) => {
    // Validate file using the utility
    const validation = FileValidation.validateVideoFile(filePath);
    if (!validation.isValid) {
      throw new Error(validation.error || ERROR_MESSAGES.FILE.VALIDATION_FAILED);
    }
    
    try {
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            console.error('FFprobe error:', err);
            reject(new Error(`Failed to read video metadata: ${err.message}`));
            return;
          }
          
          if (!metadata || !metadata.format) {
            reject(new Error('Invalid video file or no metadata found'));
            return;
          }
          
          const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');
          if (!videoStream) {
            reject(new Error('No video stream found in file'));
            return;
          }
          
          // Validate metadata values
          const duration = metadata.format.duration;
          if (!duration || duration <= 0) {
            reject(new Error('Invalid video duration'));
            return;
          }
          
          const width = videoStream.width;
          const height = videoStream.height;
          if (!width || !height || width <= 0 || height <= 0) {
            reject(new Error('Invalid video dimensions'));
            return;
          }
          
          const fileStats = fs.statSync(filePath);
          resolve({
            duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
            size: fileStats.size,
            width: width,
            height: height,
            codec: videoStream.codec_name || 'unknown'
          });
        });
      });
    } catch (error) {
      throw error;
    }
  });

  // Compression operations
  ipcMain.handle('compress-videos', async (event, data: any) => {
    if (!compressionManager) {
      throw new Error('Compression manager not initialized');
    }
    
    try {
      const { files, presetConfigs, outputDirectory, advancedSettings } = data;
      
      if (advancedSettings) {
        return await compressionManager.compressVideosAdvanced(files, presetConfigs, outputDirectory, advancedSettings);
      } else {
        return await compressionManager.compressVideos(files, presetConfigs, outputDirectory);
      }
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('cancel-compression', async () => {
    if (!compressionManager) {
      throw new Error('Compression manager not initialized');
    }
    
    return compressionManager.cancelCompression();
  });

  ipcMain.handle('get-compression-status', async () => {
    if (!compressionManager) {
      throw new Error('Compression manager not initialized');
    }
    
    return {
      isCompressing: compressionManager.isCompressing(),
      concurrencyStatus: compressionManager.getConcurrencyStatus(),
      batchProgress: compressionManager.getBatchProgress()
    };
  });

  ipcMain.handle('batch-rename-files', async (event, { files, newNames }: {
    files: string[];
    newNames: Record<string, string>;
  }) => {
    
    const results: { success: boolean; oldPath: string; newPath?: string; error?: string }[] = [];
    
    // Validate input parameters
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided for renaming');
    }
    
    if (!newNames || typeof newNames !== 'object') {
      throw new Error('Invalid new names object provided');
    }
    
    // Check for duplicate new names
    const newNameValues = Object.values(newNames);
    const duplicateNames = newNameValues.filter((name, index) => newNameValues.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      throw new Error(`Duplicate new names found: ${duplicateNames.join(', ')}`);
    }
    
    for (const oldPath of files) {
      try {
        // Validate old path using the utility
        const oldPathValidation = FileValidation.validateVideoFile(oldPath);
        if (!oldPathValidation.isValid) {
          results.push({ success: false, oldPath: String(oldPath), error: oldPathValidation.error! });
          continue;
        }
        
        const newName = newNames[oldPath];
        if (!newName) {
          results.push({ success: false, oldPath, error: 'No new name provided' });
          continue;
        }
        
        // Validate new name using the utility
        const newNameValidation = FileValidation.validateFilename(newName);
        if (!newNameValidation.isValid) {
          results.push({ success: false, oldPath, error: newNameValidation.error! });
          continue;
        }
        
        const directory = path.dirname(oldPath);
        const newPath = path.join(directory, newName);
        
        // Check if new file already exists (and it's not the same file)
        if (fs.existsSync(newPath) && newPath !== oldPath) {
          results.push({ success: false, oldPath, error: 'File already exists' });
          continue;
        }
        
        // Check if directory is writable using the utility
        const directoryValidation = FileValidation.validateDirectory(directory);
        if (!directoryValidation.isValid) {
          results.push({ success: false, oldPath, error: directoryValidation.error! });
          continue;
        }
        
        // Rename the file
        fs.renameSync(oldPath, newPath);
        
        // Verify the rename was successful
        if (!fs.existsSync(newPath)) {
          results.push({ success: false, oldPath, error: 'Rename failed - new file not found' });
          continue;
        }
        
        if (fs.existsSync(oldPath)) {
          results.push({ success: false, oldPath, error: 'Rename failed - old file still exists' });
          continue;
        }
        
        results.push({ success: true, oldPath, newPath });
        
      } catch (error) {
        console.error(`Error renaming file ${oldPath}:`, error);
        results.push({ 
          success: false, 
          oldPath, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return results;
  });

  // Generate thumbnail for video file
  ipcMain.handle('generate-thumbnail', async (event, filePath: string) => {
    // Validate file using the utility
    const validation = FileValidation.validateVideoFile(filePath);
    if (!validation.isValid) {
      throw new Error(validation.error || ERROR_MESSAGES.FILE.VALIDATION_FAILED);
    }
    
    try {
      // Create thumbnails directory in app data
      const appDataPath = Settings.getAppDataPath();
      const thumbnailsDir = path.join(appDataPath, 'thumbnails');
      
      if (!fs.existsSync(thumbnailsDir)) {
        fs.mkdirSync(thumbnailsDir, { recursive: true });
      }
      
      // Generate unique filename for thumbnail
      const fileHash = require('crypto').createHash('md5').update(filePath).digest('hex');
      const thumbnailPath = path.join(thumbnailsDir, `${fileHash}.jpg`);
      
      // Check if thumbnail already exists
      if (fs.existsSync(thumbnailPath)) {
        return thumbnailPath;
      }
      
      return new Promise((resolve, reject) => {
        // Generate thumbnail at 50% into the video
        ffmpeg(filePath)
          .screenshots({
            timestamps: [APP_CONSTANTS.THUMBNAIL.TIMESTAMP],
            filename: path.basename(thumbnailPath),
            folder: path.dirname(thumbnailPath),
            size: APP_CONSTANTS.THUMBNAIL.SIZE // Maintain original video aspect ratio
          })
        .on('end', () => {
          if (fs.existsSync(thumbnailPath)) {
            resolve(thumbnailPath);
          } else {
            reject(new Error('Thumbnail generation failed'));
          }
        })
        .on('error', (err) => {
          reject(new Error(`Failed to generate thumbnail: ${err.message}`));
        });
    });
  } catch (error) {
    throw error;
  }
});

  // Convert thumbnail file to data URL for secure loading
  ipcMain.handle('get-thumbnail-data-url', async (event, filePath: string) => {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error(ERROR_MESSAGES.FILE.INVALID_PATH);
    }
    
    // Handle both file paths and file:// URLs
    let actualFilePath = filePath;
    if (filePath.startsWith('file://')) {
      actualFilePath = filePath.replace('file://', '');
    }
    
    if (!fs.existsSync(actualFilePath)) {
      throw new Error(ERROR_MESSAGES.FILE.NOT_FOUND);
    }
    
    try {
      // Read the file as a buffer
      const fileBuffer = fs.readFileSync(actualFilePath);
      
      // Convert to base64
      const base64 = fileBuffer.toString('base64');
      
      // Return as data URL
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      throw error;
    }
  });

  // Open file in Finder
  ipcMain.handle('show-in-finder', async (event, filePath: string) => {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error(ERROR_MESSAGES.FILE.INVALID_PATH);
    }
    
    if (!fs.existsSync(filePath)) {
      throw new Error(ERROR_MESSAGES.FILE.NOT_FOUND);
    }
    
    try {
      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

  // Open file with default application
  ipcMain.handle('open-file', async (event, filePath: string) => {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error(ERROR_MESSAGES.FILE.INVALID_PATH);
    }
    
    if (!fs.existsSync(filePath)) {
      throw new Error(ERROR_MESSAGES.FILE.NOT_FOUND);
    }
    
    try {
      shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

  // Settings management IPC handlers
  ipcMain.handle('get-startup-settings', async () => {
    try {
      return Settings.getStartupSettings();
    } catch (error) {
      return Settings.getDefaultSettings();
    }
  });

  ipcMain.handle('save-startup-settings', async (event, settings: { openAtLogin: boolean; defaultWindow: string; performanceSettings?: { maxConcurrentCompressions: number } }) => {
    try {
      // Save settings using the utility
      Settings.saveStartupSettings(settings);
      
      // Configure startup behavior
      if (process.platform === 'darwin') {
        const { app } = require('electron');
        app.setLoginItemSettings({
          openAtLogin: settings.openAtLogin,
          openAsHidden: false
        });
      }
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('get-default-window', async () => {
    try {
      return Settings.getDefaultWindow();
    } catch (error) {
      return APP_CONSTANTS.DEFAULT_WINDOW;
    }
  });

  ipcMain.handle('create-defaults-window', async () => {
    try {
      createDefaultsWindow();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('create-batch-rename-window', async () => {
    try {
      createBatchRenameWindow();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
