import { Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { 
  getMainWindow, 
  getOverlayWindow, 
  showMainWindow, 
  hideMainWindow, 
  showOverlayWindow, 
  hideOverlayWindow 
} from './window-manager';
import { createSettingsWindow } from './window-manager';
import { Settings } from './utils';
import { APP_CONSTANTS } from './utils/constants';

let tray: Tray | null = null;

export function createTray(): Tray {
  // Create tray icon
  const iconPath = path.join(__dirname, '../assets/Vanilla.icns');
  const icon = nativeImage.createFromPath(iconPath);
  
  // Resize icon for tray (16x16 for macOS, 32x32 for Windows)
  const trayIcon = icon.resize({ width: APP_CONSTANTS.TRAY_ICON_SIZE, height: APP_CONSTANTS.TRAY_ICON_SIZE });
  
  tray = new Tray(trayIcon);
  tray.setToolTip(`${APP_CONSTANTS.APP_NAME} - ${APP_CONSTANTS.APP_DESCRIPTION}`);
  
  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Main Window',
      click: () => {
        const mainWindow = getMainWindow();
        const overlayWindow = getOverlayWindow();
        
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.show();
          mainWindow.focus();
        }
        if (overlayWindow) {
          overlayWindow.hide();
        }
      }
    },
    {
      label: 'Show Overlay',
      click: () => {
        const overlayWindow = getOverlayWindow();
        const mainWindow = getMainWindow();
        
        if (overlayWindow) {
          overlayWindow.show();
        }
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    {
      label: 'Show Default Window',
      click: () => {
        showDefaultWindow();
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        createSettingsWindow();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        const { app } = require('electron');
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  // Handle tray icon click (show overlay by default)
  tray.on('click', () => {
    showDefaultWindow();
  });

  return tray;
}

export function showDefaultWindow(): void {
  const defaultWindow = Settings.getDefaultWindow();
  
  if (defaultWindow === 'main') {
    showMainWindow();
    hideOverlayWindow();
  } else if (defaultWindow === 'overlay') {
    showOverlayWindow();
    hideMainWindow();
  }
}

export async function checkDefaultWindowAndShow(): Promise<void> {
  try {
    const defaultWindow = Settings.getDefaultWindow();
    
    if (defaultWindow === 'main') {
      showMainWindow();
      hideOverlayWindow();
    } else if (defaultWindow === 'overlay') {
      showOverlayWindow();
      hideMainWindow();
    }
  } catch (error) {
    // Fallback to overlay
    showOverlayWindow();
    hideMainWindow();
  }
}

export function getTray(): Tray | null {
  return tray;
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
