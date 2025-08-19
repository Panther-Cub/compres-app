import { Menu, shell } from 'electron';
import { getMainWindow, getOverlayWindow, showMainWindow, hideOverlayWindow, createSettingsWindow, createAboutWindow, createUpdateWindow } from './window-manager';
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
            createAboutWindow();
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
              // Check for updates first
              const result = await UpdateManager.getInstance().checkForUpdates(false);
              
              // Get the current status to see if an update is available
              const status = UpdateManager.getInstance().getStatus();
              
              // Only create update window if there's an update available or an error
              if (status.status === 'available' || status.status === 'error') {
                createUpdateWindow();
              } else if (status.status === 'not-available') {
                // Show a simple notification that no update is available
                const mainWindow = getMainWindow();
                if (mainWindow) {
                  mainWindow.webContents.send('show-notification', {
                    title: 'No Updates Available',
                    message: 'You are already running the latest version.',
                    type: 'info'
                  });
                }
              }
            } catch (error: any) {
              // Create update window to show error
              createUpdateWindow();
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
