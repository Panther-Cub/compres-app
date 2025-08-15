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
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    transparent: false,
    show: false
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
  if (!mainWindow) return [];
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v'] }
    ]
  });
  return result.filePaths;
});

ipcMain.handle('select-output-directory', async () => {
  if (!mainWindow) return '';
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0] || '';
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
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');
      const fileStats = fs.statSync(filePath);
      
      resolve({
        duration: metadata.format.duration,
        size: fileStats.size,
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        codec: videoStream?.codec_name || 'unknown'
      });
    });
  });
});

ipcMain.handle('compress-videos', async (event, { files, presets, keepAudio, outputDirectory }: {
  files: string[];
  presets: string[];
  keepAudio: boolean;
  outputDirectory: string;
}) => {
  console.log('Received compress-videos request:', { files, presets, keepAudio, outputDirectory });
  if (!mainWindow) {
    throw new Error('Main window not available');
  }
  return await compressVideos(files, presets, keepAudio, outputDirectory, mainWindow);
});

ipcMain.handle('compress-videos-advanced', async (event, { files, presets, keepAudio, outputDirectory, advancedSettings }: {
  files: string[];
  presets: string[];
  keepAudio: boolean;
  outputDirectory: string;
  advancedSettings: any;
}) => {
  console.log('Received compress-videos-advanced request:', { files, presets, keepAudio, outputDirectory, advancedSettings });
  if (!mainWindow) {
    throw new Error('Main window not available');
  }
  return await compressVideosAdvanced(files, presets, keepAudio, outputDirectory, advancedSettings, mainWindow);
});

ipcMain.handle('cancel-compression', async () => {
  return cancelCompression();
});
