import { Menu, shell } from 'electron';
import { getMainWindow, getOverlayWindow, showMainWindow, hideOverlayWindow } from './window-manager';
import { createSettingsWindow } from './window-manager';
import { UpdateManager } from './update-manager';
import { APP_CONSTANTS } from './utils/constants';

export function createApplicationMenu(): Menu {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Compres',
      submenu: [
        {
          label: 'About Compres',
          click: async () => {
            // If overlay is visible, switch to main window first
            const overlayWindow = getOverlayWindow();
            if (overlayWindow && overlayWindow.isVisible()) {
              showMainWindow();
              hideOverlayWindow();
            }
            
            // Show about modal on main window
            const mainWindow = getMainWindow();
            if (mainWindow) {
              mainWindow.webContents.send('show-about-modal');
            }
          }
        },
        {
          label: 'Settings...',
          accelerator: 'Cmd+,',
          click: () => {
            createSettingsWindow();
          }
        },
        {
          label: 'Check for Updates...',
          click: async () => {
            try {
              console.log('Checking for updates from menu...');
              const { app } = require('electron');
              console.log('Current version:', app.getVersion());
              const result = await UpdateManager.getInstance().checkForUpdates(false);
              console.log('Menu update check result:', result);
            } catch (error: any) {
              console.error('Error checking for updates from menu:', error);
              console.error('Error details:', error);
              // Send error status to renderer
              const mainWindow = getMainWindow();
              if (mainWindow) {
                mainWindow.webContents.send('update-status', { 
                  status: 'error', 
                  error: error.message || 'Failed to check for updates' 
                });
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Cmd+Q',
          click: () => {
            const { app } = require('electron');
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
            const overlayWindow = getOverlayWindow();
            if (overlayWindow && overlayWindow.isVisible()) {
              showMainWindow();
              hideOverlayWindow();
            }
            
            // Trigger file select on main window
            const mainWindow = getMainWindow();
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
            const overlayWindow = getOverlayWindow();
            if (overlayWindow && overlayWindow.isVisible()) {
              showMainWindow();
              hideOverlayWindow();
            }
            
            // Trigger output select on main window
            const mainWindow = getMainWindow();
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
            shell.openExternal(APP_CONSTANTS.BUY_ME_COFFEE_URL);
          }
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}
