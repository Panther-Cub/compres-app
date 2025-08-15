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

let mainWindow: BrowserWindow | null = null;

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
      allowRunningInsecureContent: false
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
    if (mainWindow) {
      mainWindow.show();
    }
  });

  // Create native menu
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Compress',
      submenu: [
        {
          label: 'About Compress',
          click: () => {
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
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('trigger-file-select');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Select Output Directory',
          accelerator: 'Cmd+Shift+O',
          click: () => {
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

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
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
