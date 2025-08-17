import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { Environment, Security } from './utils';
import { APP_CONSTANTS, DEV_CONSTANTS } from './utils/constants';

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let aboutWindow: BrowserWindow | null = null;
let defaultsWindow: BrowserWindow | null = null;
let batchRenameWindow: BrowserWindow | null = null;

/**
 * Create and configure a window with common settings
 */
function createWindow(options: Electron.BrowserWindowConstructorOptions): BrowserWindow {
  const window = new BrowserWindow({
    ...options,
    webPreferences: {
      ...Security.getCommonWebPreferences(options.webPreferences?.partition),
      ...options.webPreferences
    }
  });

  // Set up CSP
  Security.setupCsp(window);

  return window;
}

/**
 * Load content into a window based on environment
 */
function loadWindowContent(window: BrowserWindow, route: string = ''): void {
  if (Environment.isDevelopment()) {
    window.loadURL(Environment.getLoadUrl(route));
    if (DEV_CONSTANTS.DEV_TOOLS_ENABLED) {
      window.webContents.openDevTools();
    }
  } else {
    const filePath = path.join(__dirname, '..', 'index.html');
    window.loadFile(filePath, route ? { hash: route } : undefined);
  }
}

export function createMainWindow(): BrowserWindow {
  mainWindow = createWindow({
    width: APP_CONSTANTS.MAIN_WINDOW.WIDTH,
    height: APP_CONSTANTS.MAIN_WINDOW.HEIGHT,
    minWidth: APP_CONSTANTS.MAIN_WINDOW.MIN_WIDTH,
    minHeight: APP_CONSTANTS.MAIN_WINDOW.MIN_HEIGHT,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    transparent: false,
    hasShadow: true,
    backgroundColor: '#00000000',
    show: false
  });

  loadWindowContent(mainWindow);

  mainWindow.once('ready-to-show', () => {
    // Show the main window so we can see the transparency effect
    mainWindow?.show();
  });

  // Ensure overlay is hidden whenever main window is shown
  mainWindow.on('show', () => {
    if (overlayWindow) {
      overlayWindow.hide();
    }
  });

  // Handle main window close - show overlay again
  mainWindow.on('closed', () => {
    if (overlayWindow) {
      overlayWindow.show();
    }
    mainWindow = null;
  });

  return mainWindow;
}

export function createOverlayWindow(): BrowserWindow {
  // Get screen dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // Create overlay window
  overlayWindow = createWindow({
    width: APP_CONSTANTS.OVERLAY_WINDOW.WIDTH,
    height: APP_CONSTANTS.OVERLAY_WINDOW.HEIGHT,
    x: width - APP_CONSTANTS.OVERLAY_WINDOW.OFFSET_X, // Position in bottom right
    y: height - APP_CONSTANTS.OVERLAY_WINDOW.OFFSET_Y,
    frame: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    focusable: false,
    hasShadow: true,
    backgroundColor: '#00000000',
    show: false
  });

  loadWindowContent(overlayWindow, 'overlay');

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

  return overlayWindow;
}

export function createSettingsWindow(): BrowserWindow {
  // Don't create multiple settings windows
  if (settingsWindow) {
    settingsWindow.focus();
    return settingsWindow;
  }
  
  settingsWindow = createWindow({
    width: APP_CONSTANTS.SETTINGS_WINDOW.WIDTH,
    height: APP_CONSTANTS.SETTINGS_WINDOW.HEIGHT,
    minWidth: APP_CONSTANTS.SETTINGS_WINDOW.MIN_WIDTH,
    minHeight: APP_CONSTANTS.SETTINGS_WINDOW.MIN_HEIGHT,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    transparent: false,
    hasShadow: true,
    backgroundColor: '#00000000',
    show: false,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    webPreferences: {
      // Remove separate partition to share theme state with main window
    }
  });

  loadWindowContent(settingsWindow, 'settings');

  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show();
    settingsWindow?.focus();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
    // Ensure main window is focused and restored when settings closes
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
      // Force the main window to be the active window
      mainWindow.moveTop();
    }
  });

  return settingsWindow;
}

export function createAboutWindow(): BrowserWindow {
  // Don't create multiple about windows
  if (aboutWindow) {
    aboutWindow.focus();
    return aboutWindow;
  }
  
  aboutWindow = createWindow({
    width: APP_CONSTANTS.ABOUT_WINDOW.WIDTH,
    height: APP_CONSTANTS.ABOUT_WINDOW.HEIGHT,
    minWidth: APP_CONSTANTS.ABOUT_WINDOW.MIN_WIDTH,
    minHeight: APP_CONSTANTS.ABOUT_WINDOW.MIN_HEIGHT,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    transparent: false,
    hasShadow: true,
    backgroundColor: '#00000000',
    show: false,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true
  });

  loadWindowContent(aboutWindow, 'about');

  aboutWindow.once('ready-to-show', () => {
    aboutWindow?.show();
    aboutWindow?.focus();
  });

  aboutWindow.on('closed', () => {
    aboutWindow = null;
    // Ensure main window is focused when about closes
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return aboutWindow;
}

export function createDefaultsWindow(): BrowserWindow {
  // Don't create multiple defaults windows
  if (defaultsWindow) {
    defaultsWindow.focus();
    return defaultsWindow;
  }
  
  defaultsWindow = createWindow({
    width: APP_CONSTANTS.DEFAULTS_WINDOW.WIDTH,
    height: APP_CONSTANTS.DEFAULTS_WINDOW.HEIGHT,
    minWidth: APP_CONSTANTS.DEFAULTS_WINDOW.MIN_WIDTH,
    minHeight: APP_CONSTANTS.DEFAULTS_WINDOW.MIN_HEIGHT,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    transparent: false,
    hasShadow: true,
    backgroundColor: '#00000000',
    show: false,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true
  });

  loadWindowContent(defaultsWindow, 'defaults');

  defaultsWindow.once('ready-to-show', () => {
    defaultsWindow?.show();
    defaultsWindow?.focus();
  });

  defaultsWindow.on('closed', () => {
    defaultsWindow = null;
    // Ensure main window is focused when defaults closes
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return defaultsWindow;
}

export function createBatchRenameWindow(): BrowserWindow {
  // Don't create multiple batch rename windows
  if (batchRenameWindow) {
    batchRenameWindow.focus();
    return batchRenameWindow;
  }
  
  batchRenameWindow = createWindow({
    width: APP_CONSTANTS.BATCH_RENAME_WINDOW.WIDTH,
    height: APP_CONSTANTS.BATCH_RENAME_WINDOW.HEIGHT,
    minWidth: APP_CONSTANTS.BATCH_RENAME_WINDOW.MIN_WIDTH,
    minHeight: APP_CONSTANTS.BATCH_RENAME_WINDOW.MIN_HEIGHT,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    transparent: false,
    hasShadow: true,
    backgroundColor: '#00000000',
    show: false,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true
  });

  loadWindowContent(batchRenameWindow, 'batch-rename');

  batchRenameWindow.once('ready-to-show', () => {
    batchRenameWindow?.show();
    batchRenameWindow?.focus();
  });

  batchRenameWindow.on('closed', () => {
    batchRenameWindow = null;
    // Ensure main window is focused when batch rename closes
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return batchRenameWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function getOverlayWindow(): BrowserWindow | null {
  return overlayWindow;
}

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow;
}

export function getAboutWindow(): BrowserWindow | null {
  return aboutWindow;
}

export function getDefaultsWindow(): BrowserWindow | null {
  return defaultsWindow;
}

export function getBatchRenameWindow(): BrowserWindow | null {
  return batchRenameWindow;
}

export function showMainWindow(): void {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
}

export function hideMainWindow(): void {
  if (mainWindow) {
    mainWindow.hide();
  }
}

export function showOverlayWindow(): void {
  if (overlayWindow) {
    overlayWindow.show();
  }
}

export function hideOverlayWindow(): void {
  if (overlayWindow) {
    overlayWindow.hide();
  }
}

export function destroyAllWindows(): void {
  if (mainWindow) {
    mainWindow.destroy();
    mainWindow = null;
  }
  
  if (overlayWindow) {
    overlayWindow.destroy();
    overlayWindow = null;
  }
  
  if (settingsWindow) {
    settingsWindow.destroy();
    settingsWindow = null;
  }
  
  if (aboutWindow) {
    aboutWindow.destroy();
    aboutWindow = null;
  }
  
  if (defaultsWindow) {
    defaultsWindow.destroy();
    defaultsWindow = null;
  }
  
  if (batchRenameWindow) {
    batchRenameWindow.destroy();
    batchRenameWindow = null;
  }
}
