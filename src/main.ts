import { app, Menu } from 'electron';
import {
  setupFFmpeg,
  UpdateManager,
  createMainWindow,
  createOverlayWindow,
  destroyAllWindows,
  createTray,
  destroyTray,
  checkDefaultWindowAndShow,
  setupIpcHandlers,
  createApplicationMenu
} from './electron';
import { initializeCustomPresets } from './electron/compression/custom-preset-manager';

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

// Initialize the application with all required setup
function initializeApp() {
  startSystemMonitoring();
  
  // Setup FFmpeg
  setupFFmpeg();
  
  // Initialize custom presets (load from file)
  initializeCustomPresets();
  
  // Create windows
  const mainWindow = createMainWindow();
  createOverlayWindow();
  
  // Create tray
  const tray = createTray();
  
  // Setup update manager
  UpdateManager.getInstance().initialize(mainWindow, tray);
  
  // Setup IPC handlers
  setupIpcHandlers();
  
  // Create application menu
  const menu = createApplicationMenu();
  Menu.setApplicationMenu(menu);
  
  // Check default window setting and show appropriate window
  checkDefaultWindowAndShow();
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
    initializeApp();
  }).catch((err: any) => {
    console.warn('Failed to clear service worker storage:', err);
    initializeApp();
  });
});

app.on('window-all-closed', () => {
  stopSystemMonitoring();
  console.log('All windows closed, quitting app...');
  app.quit();
});

app.on('activate', () => {
  const { BrowserWindow } = require('electron');
  if (BrowserWindow.getAllWindows().length === 0) {
    initializeApp();
  }
});

// Clean up when app is about to quit
app.on('before-quit', () => {
  console.log('App is quitting, cleaning up...');
  
  // Clean up tray
  destroyTray();
  
  // Destroy all windows
  destroyAllWindows();
});
