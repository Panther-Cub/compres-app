import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { 
  videoPresets, 
  compressVideos, 
  compressVideosAdvanced, 
  cancelCompression 
} from './electron/compression';
import { getDefaultOutputDirectory } from './electron/compression/utils';
import os from 'os';

// Use ffmpeg-static for cross-platform compatibility
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

// Set ffmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// System resource monitoring
let systemMonitorInterval: NodeJS.Timeout | null = null;

function startSystemMonitoring() {
  // Disabled for now - causing too much noise
  console.log('System monitoring disabled');
  return;
}

function stopSystemMonitoring() {
  if (systemMonitorInterval) {
    clearInterval(systemMonitorInterval);
    systemMonitorInterval = null;
  }
}

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;

function createOverlayWindow(): void {
  // Get screen dimensions
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // Create overlay window
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 300,
    x: width - 420, // Position in bottom right
    y: height - 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    focusable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      partition: 'persist:main'
    },
    show: false
  });

  // Set Content Security Policy for overlay
  overlayWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
        ]
      }
    });
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    overlayWindow.loadURL('http://localhost:3000/overlay');
  } else {
    overlayWindow.loadFile(path.join(__dirname, 'index.html'), { hash: 'overlay' });
  }

  // Handle overlay window close
  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  // Prevent overlay from being closed
  overlayWindow.on('close', (event) => {
    event.preventDefault();
  });

  // Ensure main window is hidden whenever overlay is shown
  overlayWindow.on('show', () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      partition: 'persist:main'
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    transparent: false,
    show: false
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
        ]
      }
    });
  });

  const isDev = process.env.NODE_ENV === 'development';
  console.log('isDev:', isDev);

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    // Don't show main window initially - keep it hidden
    // mainWindow.show();
  });

  // Ensure overlay is hidden whenever main window is shown
  mainWindow.on('show', () => {
    if (overlayWindow) {
      overlayWindow.hide();
    }
  });

  // Create overlay window after main window is ready
  mainWindow.once('ready-to-show', () => {
    createOverlayWindow();
    if (overlayWindow) {
      overlayWindow.show();
    }
  });

  // Handle main window close - show overlay again
  mainWindow.on('closed', () => {
    if (overlayWindow) {
      overlayWindow.show();
    }
    mainWindow = null;
  });

  // Create native menu
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Compress',
      submenu: [
        {
          label: 'About Compress',
          click: async () => {
            // If overlay is visible, switch to main window first
            if (overlayWindow && overlayWindow.isVisible()) {
              if (mainWindow) {
                if (mainWindow.isMinimized()) {
                  mainWindow.restore();
                }
                mainWindow.show();
                mainWindow.focus();
              }
              overlayWindow.hide();
            }
            
            // Show about modal on main window
            if (mainWindow) {
              mainWindow.webContents.send('show-about-modal');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Cmd+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Select Videos',
          accelerator: 'Cmd+O',
          click: async () => {
            // If overlay is visible, switch to main window first
            if (overlayWindow && overlayWindow.isVisible()) {
              if (mainWindow) {
                if (mainWindow.isMinimized()) {
                  mainWindow.restore();
                }
                mainWindow.show();
                mainWindow.focus();
              }
              overlayWindow.hide();
            }
            
            // Trigger file select on main window
            if (mainWindow) {
              mainWindow.webContents.send('trigger-file-select');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Select Output Directory',
          accelerator: 'Cmd+Shift+O',
          click: async () => {
            // If overlay is visible, switch to main window first
            if (overlayWindow && overlayWindow.isVisible()) {
              if (mainWindow) {
                if (mainWindow.isMinimized()) {
                  mainWindow.restore();
                }
                mainWindow.show();
                mainWindow.focus();
              }
              overlayWindow.hide();
            }
            
            // Trigger output select on main window
            if (mainWindow) {
              mainWindow.webContents.send('trigger-output-select');
            }
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Buy Me a Coffee',
          click: () => {
            shell.openExternal('https://buymeacoffee.com/pantherandcub');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Configure app session to prevent service worker database issues
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');

// Mac-specific performance optimizations for video processing
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

// Memory management for video processing
app.commandLine.appendSwitch('max-old-space-size', '4096');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

app.whenReady().then(() => {
  // Clear any existing service worker data on startup
  const session = require('electron').session;
  session.defaultSession.clearStorageData({
    storages: ['serviceworkers']
  }).then(() => {
    console.log('Service worker storage cleared');
    startSystemMonitoring();
    createWindow();
  }).catch((err: any) => {
    console.warn('Failed to clear service worker storage:', err);
    startSystemMonitoring();
    createWindow();
  });
});

app.on('window-all-closed', () => {
  stopSystemMonitoring();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for overlay window communication
ipcMain.handle('overlay-file-drop', async (event, filePaths: string[]) => {
  console.log('Overlay received file drop:', filePaths);
  
  // Validate and filter files
  const validFiles = [];
  for (const filePath of filePaths) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.warn(`File does not exist: ${filePath}`);
        continue;
      }
      
      // Check if file is readable
      fs.accessSync(filePath, fs.constants.R_OK);
      
      // Check if file has valid extension
      const ext = path.extname(filePath).toLowerCase();
      const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v'];
      if (!validExtensions.includes(ext)) {
        console.warn(`Invalid file extension: ${filePath}`);
        continue;
      }
      
      // Check file size (skip files larger than 10GB)
      const stats = fs.statSync(filePath);
      if (stats.size > 10 * 1024 * 1024 * 1024) {
        console.warn(`File too large (${stats.size} bytes): ${filePath}`);
        continue;
      }
      
      validFiles.push(filePath);
    } catch (error) {
      console.error(`Error validating file ${filePath}:`, error);
    }
  }
  
  // Send files to main window if any are valid
  if (validFiles.length > 0 && mainWindow) {
    mainWindow.webContents.send('overlay-files-dropped', validFiles);
    
    // Show main window and bring to front
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    
    // Hide the overlay window
    if (overlayWindow) {
      overlayWindow.hide();
    }
  }
  
  return { success: true, validFiles };
});

ipcMain.handle('toggle-overlay', async (event, show: boolean) => {
  if (overlayWindow) {
    if (show) {
      overlayWindow.show();
    } else {
      overlayWindow.hide();
    }
  }
  return { success: true };
});

ipcMain.handle('show-overlay', async () => {
  if (overlayWindow) {
    overlayWindow.show();
  }
  return { success: true };
});

ipcMain.handle('hide-overlay', async () => {
  if (overlayWindow) {
    overlayWindow.hide();
  }
  return { success: true };
});

ipcMain.handle('hide-main-window', async () => {
  if (mainWindow) {
    mainWindow.hide();
  }
  return { success: true };
});

ipcMain.handle('show-main-window', async () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
  return { success: true };
});

// IPC handlers
ipcMain.handle('select-files', async () => {
  if (!mainWindow) {
    throw new Error('Main window not available');
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
    
    // Validate selected files
    const validFiles = [];
    for (const filePath of result.filePaths) {
      try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.warn(`File does not exist: ${filePath}`);
          continue;
        }
        
        // Check if file is readable
        fs.accessSync(filePath, fs.constants.R_OK);
        
        // Check if file has valid extension
        const ext = path.extname(filePath).toLowerCase();
        const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v'];
        if (!validExtensions.includes(ext)) {
          console.warn(`Invalid file extension: ${filePath}`);
          continue;
        }
        
        // Check file size (skip files larger than 10GB)
        const stats = fs.statSync(filePath);
        if (stats.size > 10 * 1024 * 1024 * 1024) {
          console.warn(`File too large (${stats.size} bytes): ${filePath}`);
          continue;
        }
        
        validFiles.push(filePath);
      } catch (error) {
        console.error(`Error validating file ${filePath}:`, error);
      }
    }
    
    return validFiles;
  } catch (error) {
    console.error('Error selecting files:', error);
    throw error;
  }
});

ipcMain.handle('get-default-output-directory', async () => {
  try {
    const homeDir = os.homedir();
    const desktopDir = path.join(homeDir, 'Desktop');
    const compressedVideosDir = path.join(desktopDir, 'Compressed Videos');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(compressedVideosDir)) {
      try {
        fs.mkdirSync(compressedVideosDir, { recursive: true });
        console.log(`Created default output directory: ${compressedVideosDir}`);
      } catch (error) {
        console.warn('Could not create default directory, using Desktop:', error);
        return desktopDir;
      }
    }
    
    // Verify the directory is writable
    try {
      const testFile = path.join(compressedVideosDir, '.test-write');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error) {
      console.warn('Default directory is not writable, using Desktop:', error);
      return desktopDir;
    }
    
    return compressedVideosDir;
  } catch (error) {
    console.error('Error getting default output directory:', error);
    throw error;
  }
});

ipcMain.handle('select-output-directory', async () => {
  if (!mainWindow) {
    throw new Error('Main window not available');
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
    
    // Validate the selected directory
    if (!fs.existsSync(selectedDir)) {
      throw new Error('Selected directory does not exist');
    }
    
    // Check if directory is writable
    try {
      const testFile = path.join(selectedDir, '.test-write');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error) {
      throw new Error('Selected directory is not writable');
    }
    
    return selectedDir;
  } catch (error) {
    console.error('Error selecting output directory:', error);
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
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path provided');
  }
  
  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist');
  }
  
  try {
    // Check if file is readable
    fs.accessSync(filePath, fs.constants.R_OK);
    
    // Check file size
    const fileStats = fs.statSync(filePath);
    if (fileStats.size === 0) {
      throw new Error('File is empty');
    }
    
    if (fileStats.size > 10 * 1024 * 1024 * 1024) {
      throw new Error('File is too large (max 10GB)');
    }
    
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
    console.error('Error getting file info:', error);
    throw error;
  }
});

ipcMain.handle('compress-videos', async (event, { files, presetConfigs, outputDirectory, advancedSettings }: {
  files: string[];
  presetConfigs: Array<{ presetId: string; keepAudio: boolean }>;
  outputDirectory: string;
  advancedSettings?: any;
}) => {
  console.log('Received compress-videos request:', { files, presetConfigs, outputDirectory, advancedSettings });
  if (!mainWindow) {
    throw new Error('Main window not available');
  }
  return await compressVideos(files, presetConfigs, outputDirectory, mainWindow, advancedSettings);
});

ipcMain.handle('compress-videos-advanced', async (event, { files, presetConfigs, outputDirectory, advancedSettings }: {
  files: string[];
  presetConfigs: Array<{ presetId: string; keepAudio: boolean }>;
  outputDirectory: string;
  advancedSettings: any;
}) => {
  console.log('Received compress-videos-advanced request:', { files, presetConfigs, outputDirectory, advancedSettings });
  if (!mainWindow) {
    throw new Error('Main window not available');
  }
  return await compressVideosAdvanced(files, presetConfigs, outputDirectory, advancedSettings, mainWindow);
});

ipcMain.handle('cancel-compression', async () => {
  return cancelCompression();
});

ipcMain.handle('batch-rename-files', async (event, { files, newNames }: {
  files: string[];
  newNames: Record<string, string>;
}) => {
  console.log('Received batch-rename-files request:', { files, newNames });
  
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
      // Validate old path
      if (!oldPath || typeof oldPath !== 'string') {
        results.push({ success: false, oldPath: String(oldPath), error: 'Invalid file path' });
        continue;
      }
      
      // Check if old file exists
      if (!fs.existsSync(oldPath)) {
        results.push({ success: false, oldPath, error: 'File does not exist' });
        continue;
      }
      
      // Check if old file is readable
      try {
        fs.accessSync(oldPath, fs.constants.R_OK);
      } catch (accessError) {
        results.push({ success: false, oldPath, error: 'File is not readable' });
        continue;
      }
      
      const newName = newNames[oldPath];
      if (!newName) {
        results.push({ success: false, oldPath, error: 'No new name provided' });
        continue;
      }
      
      // Validate new name
      if (typeof newName !== 'string' || newName.trim() === '') {
        results.push({ success: false, oldPath, error: 'Invalid new name' });
        continue;
      }
      
      // Check for invalid characters in new name
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(newName)) {
        results.push({ success: false, oldPath, error: 'New name contains invalid characters' });
        continue;
      }
      
      const directory = path.dirname(oldPath);
      const newPath = path.join(directory, newName);
      
      // Check if new file already exists (and it's not the same file)
      if (fs.existsSync(newPath) && newPath !== oldPath) {
        results.push({ success: false, oldPath, error: 'File already exists' });
        continue;
      }
      
      // Check if directory is writable
      try {
        const testFile = path.join(directory, '.test-write');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (writeError) {
        results.push({ success: false, oldPath, error: 'Directory is not writable' });
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
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path provided');
  }
  
  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist');
  }
  
  try {
    // Create thumbnails directory in app data
    const appDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'Compress');
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
            timestamps: ['50%'],
            filename: path.basename(thumbnailPath),
            folder: path.dirname(thumbnailPath),
            size: '480x?' // Maintain original video aspect ratio
          })
        .on('end', () => {
          if (fs.existsSync(thumbnailPath)) {
            resolve(thumbnailPath);
          } else {
            reject(new Error('Thumbnail generation failed'));
          }
        })
        .on('error', (err) => {
          console.error('Thumbnail generation error:', err);
          reject(new Error(`Failed to generate thumbnail: ${err.message}`));
        });
    });
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
});

// Open file in Finder
ipcMain.handle('show-in-finder', async (event, filePath: string) => {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path provided');
  }
  
  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist');
  }
  
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error showing file in Finder:', error);
    throw error;
  }
});

// Open file with default application
ipcMain.handle('open-file', async (event, filePath: string) => {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path provided');
  }
  
  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist');
  }
  
  try {
    shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error opening file:', error);
    throw error;
  }
});
