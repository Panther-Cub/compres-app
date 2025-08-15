const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

// Use ffmpeg-static for cross-platform compatibility
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

// Set ffmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

let mainWindow;

function createWindow() {
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
    mainWindow.show();
  });

  // Create native menu
  const { Menu } = require('electron');
  
  const template = [
    {
      label: 'Compress',
      submenu: [
        {
          label: 'About Compress',
          click: () => {
            mainWindow.webContents.send('show-about-modal');
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
            mainWindow.webContents.send('trigger-file-select');
          }
        },
        { type: 'separator' },
        {
          label: 'Select Output Directory',
          accelerator: 'Cmd+Shift+O',
          click: () => {
            mainWindow.webContents.send('trigger-output-select');
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
        { role: 'selectall' }
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

// Video presets
const videoPresets = {
  'web-hero': {
    name: 'Web Hero',
    description: 'High quality for hero sections and main content',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '2500k',
      audioCodec: 'aac',
      audioBitrate: '128k',
      resolution: '1920x1080',
      fps: 30,
      crf: 22,
      preset: 'slow'
    }
  },
  'web-standard': {
    name: 'Web Standard',
    description: 'Balanced quality and file size for web pages',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '1500k',
      audioCodec: 'aac',
      audioBitrate: '96k',
      resolution: '1280x720',
      fps: 30,
      crf: 25,
      preset: 'medium'
    }
  },
  'web-mobile': {
    name: 'Web Mobile',
    description: 'Optimized for mobile devices and slower connections',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '800k',
      audioCodec: 'aac',
      audioBitrate: '64k',
      resolution: '854x480',
      fps: 24,
      crf: 28,
      preset: 'fast'
    }
  },
  'social-instagram': {
    name: 'Instagram',
    description: 'Optimized for Instagram feed and stories',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '1200k',
      audioCodec: 'aac',
      audioBitrate: '96k',
      resolution: '1080x1080',
      fps: 30,
      crf: 26,
      preset: 'medium'
    }
  },
  'social-tiktok': {
    name: 'TikTok',
    description: 'Optimized for TikTok and vertical video platforms',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '1000k',
      audioCodec: 'aac',
      audioBitrate: '96k',
      resolution: '1080x1920',
      fps: 30,
      crf: 27,
      preset: 'medium'
    }
  },
  'webm-modern': {
    name: 'WebM Modern',
    description: 'Modern WebM format with VP9 for better compression',
    settings: {
      videoCodec: 'libvpx-vp9',
      videoBitrate: '1200k',
      audioCodec: 'libopus',
      audioBitrate: '64k',
      resolution: '1280x720',
      fps: 30,
      crf: 30,
      preset: 'good'
    }
  },
  'hevc-efficient': {
    name: 'HEVC Efficient',
    description: 'H.265/HEVC for maximum compression efficiency',
    settings: {
      videoCodec: 'libx265',
      videoBitrate: '800k',
      audioCodec: 'aac',
      audioBitrate: '64k',
      resolution: '1280x720',
      fps: 30,
      crf: 28,
      preset: 'medium'
    }
  },
  'thumbnail-preview': {
    name: 'Thumbnail',
    description: 'Small file size for thumbnails and previews',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '300k',
      audioCodec: 'aac',
      audioBitrate: '48k',
      resolution: '640x360',
      fps: 24,
      crf: 32,
      preset: 'ultrafast'
    }
  },
  'ultra-compressed': {
    name: 'Ultra Compressed',
    description: 'Maximum compression for minimal file size',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '150k',
      audioCodec: 'aac',
      audioBitrate: '32k',
      resolution: '480x270',
      fps: 24,
      crf: 35,
      preset: 'ultrafast'
    }
  }
};

// Helper function to send compression events
function sendCompressionEvent(eventType, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(eventType, data);
  }
}

// Helper function to compress a single file with a preset
async function compressFileWithPreset(file, presetKey, preset, keepAudio, outputDirectory) {
  const fileName = path.basename(file, path.extname(file));
  
  // Determine output extension based on codec
  let outputExt = 'mp4';
  if (preset.settings.videoCodec === 'libvpx-vp9') {
    outputExt = 'webm';
  }
  
  const outputFileName = `${fileName}_${presetKey}.${outputExt}`;
  const outputPath = path.join(outputDirectory, outputFileName);
  
  return new Promise((resolve, reject) => {
    let command = ffmpeg(file)
      .videoCodec(preset.settings.videoCodec)
      .videoBitrate(preset.settings.videoBitrate)
      .outputOptions([
        `-crf ${preset.settings.crf}`,
        `-preset ${preset.settings.preset}`,
        `-vf scale=${preset.settings.resolution}:force_original_aspect_ratio=decrease,pad=${preset.settings.resolution}:(ow-iw)/2:(oh-ih)/2`
      ])
      .fps(preset.settings.fps);
    
    if (keepAudio) {
      command = command
        .audioCodec(preset.settings.audioCodec)
        .audioBitrate(preset.settings.audioBitrate);
    } else {
      command = command.noAudio();
    }
    
    command
      .output(outputPath)
      .on('start', () => {
        sendCompressionEvent('compression-started', {
          file: fileName,
          preset: presetKey,
          outputPath
        });
      })
      .on('progress', (progress) => {
        sendCompressionEvent('compression-progress', {
          file: fileName,
          preset: presetKey,
          percent: progress.percent || 0,
          timemark: progress.timemark
        });
      })
      .on('end', () => {
        sendCompressionEvent('compression-complete', {
          file: fileName,
          preset: presetKey,
          outputPath
        });
        resolve({ file: fileName, preset: presetKey, outputPath, success: true });
      })
      .on('error', (err) => {
        reject({ file: fileName, preset: presetKey, error: err.message, success: false });
      })
      .run();
  });
}

// IPC handlers for advanced settings
ipcMain.handle('compress-videos-advanced', async (event, { files, presets, keepAudio, outputDirectory, advancedSettings }) => {
  const results = [];
  const compressionPromises = [];
  
  // Create all compression tasks upfront
  for (const file of files) {
    for (const presetKey of presets) {
      const preset = videoPresets[presetKey];
      if (!preset) continue;
      
      // Send initial progress for all files (0%)
      const fileName = path.basename(file, path.extname(file));
      sendCompressionEvent('compression-started', {
        file: fileName,
        preset: presetKey,
        outputPath: path.join(outputDirectory, `${fileName}_${presetKey}.mp4`)
      });
      
      // Add to promises array for parallel processing
      compressionPromises.push(
        compressFileWithAdvancedSettings(file, presetKey, preset, keepAudio, outputDirectory, advancedSettings)
          .then(result => {
            results.push(result);
            return result;
          })
          .catch(error => {
            const errorResult = { file: path.basename(file, path.extname(file)), preset: presetKey, error: error.message, success: false };
            results.push(errorResult);
            return errorResult;
          })
      );
    }
  }
  
  // Process all compressions in parallel
  await Promise.all(compressionPromises);
  
  return results;
});

// Helper function to compress with advanced settings
async function compressFileWithAdvancedSettings(file, presetKey, preset, keepAudio, outputDirectory, advancedSettings) {
  const fileName = path.basename(file, path.extname(file));
  
  // Determine output extension based on codec
  let outputExt = 'mp4';
  if (preset.settings.videoCodec === 'libvpx-vp9') {
    outputExt = 'webm';
  }
  
  const outputFileName = `${fileName}_${presetKey}.${outputExt}`;
  const outputPath = path.join(outputDirectory, outputFileName);
  
  return new Promise((resolve, reject) => {
    let command = ffmpeg(file);
    
    // Use advanced settings if provided, otherwise use preset defaults
    const settings = advancedSettings || preset.settings;
    
    command = command
      .videoCodec(preset.settings.videoCodec)
      .videoBitrate(settings.videoBitrate || preset.settings.videoBitrate)
      .fps(settings.fps || preset.settings.fps);
    
    // Build output options
    const outputOptions = [
      `-crf ${settings.crf || preset.settings.crf}`,
      `-preset ${preset.settings.preset}`
    ];
    
    // Handle resolution scaling
    if (settings.resolution && settings.resolution !== preset.settings.resolution) {
      if (settings.preserveAspectRatio) {
        outputOptions.push(`-vf scale=${settings.resolution}:force_original_aspect_ratio=decrease,pad=${settings.resolution}:(ow-iw)/2:(oh-ih)/2`);
      } else {
        outputOptions.push(`-vf scale=${settings.resolution}`);
      }
    } else {
      outputOptions.push(`-vf scale=${preset.settings.resolution}:force_original_aspect_ratio=decrease,pad=${preset.settings.resolution}:(ow-iw)/2:(oh-ih)/2`);
    }
    
    // Add optimization options
    if (settings.fastStart) {
      outputOptions.push('-movflags +faststart');
    }
    
    if (settings.optimizeForWeb) {
      outputOptions.push('-profile:v baseline');
      outputOptions.push('-level 3.0');
    }
    
    command = command.outputOptions(outputOptions);
    
    if (keepAudio) {
      command = command
        .audioCodec(preset.settings.audioCodec)
        .audioBitrate(settings.audioBitrate || preset.settings.audioBitrate);
    } else {
      command = command.noAudio();
    }
    
    command
      .output(outputPath)
      .on('start', () => {
        sendCompressionEvent('compression-started', {
          file: fileName,
          preset: presetKey,
          outputPath
        });
      })
      .on('progress', (progress) => {
        sendCompressionEvent('compression-progress', {
          file: fileName,
          preset: presetKey,
          percent: progress.percent || 0,
          timemark: progress.timemark
        });
      })
      .on('end', () => {
        sendCompressionEvent('compression-complete', {
          file: fileName,
          preset: presetKey,
          outputPath
        });
        resolve({ file: fileName, preset: presetKey, outputPath, success: true });
      })
      .on('error', (err) => {
        reject({ file: fileName, preset: presetKey, error: err.message, success: false });
      })
      .run();
  });
}

// IPC handlers
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v'] }
    ]
  });
  return result.filePaths;
});

ipcMain.handle('select-output-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('get-presets', () => {
  return videoPresets;
});

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

ipcMain.handle('compress-videos', async (event, { files, presets, keepAudio, outputDirectory }) => {
  const results = [];
  const compressionPromises = [];
  
  // Create all compression tasks upfront
  for (const file of files) {
    for (const presetKey of presets) {
      const preset = videoPresets[presetKey];
      if (!preset) continue;
      
      // Send initial progress for all files (0%)
      const fileName = path.basename(file, path.extname(file));
      sendCompressionEvent('compression-started', {
        file: fileName,
        preset: presetKey,
        outputPath: path.join(outputDirectory, `${fileName}_${presetKey}.mp4`)
      });
      
      // Add to promises array for parallel processing
      compressionPromises.push(
        compressFileWithPreset(file, presetKey, preset, keepAudio, outputDirectory)
          .then(result => {
            results.push(result);
            return result;
          })
          .catch(error => {
            const errorResult = { file: path.basename(file, path.extname(file)), preset: presetKey, error: error.message, success: false };
            results.push(errorResult);
            return errorResult;
          })
      );
    }
  }
  
  // Process all compressions in parallel
  await Promise.all(compressionPromises);
  
  return results;
}); 