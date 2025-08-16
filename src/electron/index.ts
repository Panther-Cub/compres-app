// ============================================================================
// ELECTRON MAIN PROCESS MODULES - BARREL EXPORTS
// ============================================================================

// Core setup modules
export { setupFFmpeg } from './ffmpeg-setup';
export { UpdateManager } from './update-manager';

// Window management
export {
  createMainWindow,
  createOverlayWindow,
  createSettingsWindow,
  getMainWindow,
  getOverlayWindow,
  getSettingsWindow,
  showMainWindow,
  hideMainWindow,
  showOverlayWindow,
  hideOverlayWindow,
  destroyAllWindows
} from './window-manager';

// Tray management
export {
  createTray,
  destroyTray,
  showDefaultWindow,
  checkDefaultWindowAndShow,
  getTray
} from './tray-manager';

// IPC handlers
export { setupIpcHandlers } from './ipc-handlers';

// Menu management
export { createApplicationMenu } from './menu-manager';

// Utilities
export * from './utils';

// Note: Preload API modules are not exported here to avoid circular dependencies
// They should be imported directly from their specific paths in preload scripts

// Compression module (re-export from existing structure)
export * from './compression';
