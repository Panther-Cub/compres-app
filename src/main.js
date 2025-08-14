const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const fs = require('fs');
const os = require('os');

const isDev = !app.isPackaged;

// Set ffmpeg and ffprobe paths based on environment
function setupFFmpegPaths() {
  if (isDev) {
    // Development: use the module paths directly
    ffmpeg.setFfmpegPath(ffmpegStatic);
    ffmpeg.setFfprobePath(ffprobeStatic.path);
  } else {
    // Production: find the binaries in the packaged app
    const ffmpegPath = ffmpegStatic.replace('app.asar', 'app.asar.unpacked');
    const ffprobePath = ffprobeStatic.path.replace('app.asar', 'app.asar.unpacked');
    
    console.log('Setting ffmpeg path to:', ffmpegPath);
    console.log('Setting ffprobe path to:', ffprobePath);
    
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
  }
}

// Initialize ffmpeg paths
setupFFmpegPaths();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    vibrancy: 'sidebar', // Add subtle macOS vibrancy effect
    show: false
  });

  const startUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`;
  
  console.log('isDev:', isDev);
  console.log('Loading URL:', startUrl);
  
  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

// Video presets for different use cases
const videoPresets = {
  hero: { scale: '1280:-2', crf: '23', preset: 'medium', suffix: '_hero' },
  background: { scale: '1080:-2', crf: '28', preset: 'medium', suffix: '_bg' },
  demo: { scale: '1280:-2', crf: '25', preset: 'medium', suffix: '_demo' },
  social: { scale: '720:-2', crf: '28', preset: 'fast', suffix: '_social' }
};

// Handle file compression
ipcMain.handle('compress-video', async (event, filePath, options = {}) => {
  try {
    const fileName = path.basename(filePath, path.extname(filePath));
    const preset = videoPresets[options.preset] || videoPresets.hero;
    const outputDir = options.outputDirectory || path.join(os.homedir(), 'Desktop');
    const suffix = preset.suffix + (options.keepAudio ? '' : '_muted');
    const outputPath = path.join(outputDir, `${fileName}${suffix}.mp4`);
    
    return new Promise((resolve, reject) => {
      let command = ffmpeg(filePath);
      
      // Audio handling
      if (!options.keepAudio) {
        command = command.noAudio(); // Remove audio (-an)
      }
      
      command
        .videoFilters(`scale=${preset.scale}`) // Scale based on preset
        .videoCodec('libx264') // Use H.264 codec
        .addOption('-crf', preset.crf) // Quality based on preset
        .addOption('-preset', preset.preset) // Speed/compression balance
        .addOption('-movflags', '+faststart') // Web optimization
        .addOption('-pix_fmt', 'yuv420p') // Compatibility
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
          event.sender.send('compression-started');
        })
        .on('progress', (progress) => {
          console.log('Progress:', progress.percent);
          event.sender.send('compression-progress', progress.percent);
        })
        .on('end', () => {
          console.log('Compression finished');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });
  } catch (error) {
    console.error('Compression error:', error);
    throw error;
  }
});

// Handle file info
ipcMain.handle('get-file-info', async (event, filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
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

// Handle file selection dialog
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Handle output directory selection
ipcMain.handle('select-output-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Choose Output Folder',
    buttonLabel: 'Select Folder'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
}); 