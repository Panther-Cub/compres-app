import { ipcRenderer } from 'electron';
import type { ElectronAPI } from './api-interface';

export function createElectronAPI(): ElectronAPI {
  return {
    // File selection
    selectFiles: () => ipcRenderer.invoke('select-files'),
    selectOutputDirectory: () => ipcRenderer.invoke('select-output-directory'),
    getDefaultOutputDirectory: (folderName?: string) => ipcRenderer.invoke('get-default-output-directory', folderName),
    batchRenameFiles: (data: any) => ipcRenderer.invoke('batch-rename-files', data),
    
    // Video compression - FIXED: Updated to match backend signatures
    initializeCompressionManager: () => ipcRenderer.invoke('initialize-compression-manager'),
    compressVideos: (data: any) => ipcRenderer.invoke('compress-videos', data),
    compressVideosAdvanced: (data: any) => ipcRenderer.invoke('compress-videos-advanced', data),
    getPresets: () => ipcRenderer.invoke('get-presets'),
    getAllPresets: () => ipcRenderer.invoke('get-all-presets'),
    getCustomPresets: () => ipcRenderer.invoke('get-custom-presets'),
    addCustomPreset: (presetId: string, preset: any) => ipcRenderer.invoke('add-custom-preset', presetId, preset),
    removeCustomPreset: (presetId: string) => ipcRenderer.invoke('remove-custom-preset', presetId),
    isCustomPreset: (presetId: string) => ipcRenderer.invoke('is-custom-preset', presetId),
    getFileInfo: (filePath: string) => ipcRenderer.invoke('get-file-info', filePath),
    cancelCompression: () => ipcRenderer.invoke('cancel-compression'),
    
    // Thumbnails and file operations
    generateThumbnail: (filePath: string) => ipcRenderer.invoke('generate-thumbnail', filePath),
    getThumbnailDataUrl: (filePath: string) => ipcRenderer.invoke('get-thumbnail-data-url', filePath),
    showInFinder: (filePath: string) => ipcRenderer.invoke('show-in-finder', filePath),
    openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
    
    // Overlay window functionality
    overlayFileDrop: (filePaths: string[]) => ipcRenderer.invoke('overlay-file-drop', filePaths),
    toggleOverlay: (show: boolean) => ipcRenderer.invoke('toggle-overlay', show),
    showOverlay: () => ipcRenderer.invoke('show-overlay'),
    hideOverlay: () => ipcRenderer.invoke('hide-overlay'),
    hideMainWindow: () => ipcRenderer.invoke('hide-main-window'),
    showMainWindow: () => ipcRenderer.invoke('show-main-window'),
    
    // Settings management
    getStartupSettings: () => ipcRenderer.invoke('get-startup-settings'),
    saveStartupSettings: (settings: any) => ipcRenderer.invoke('save-startup-settings', settings),
    getDefaultWindow: () => ipcRenderer.invoke('get-default-window'),
    
    // App information
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // Theme management
    getCurrentTheme: () => ipcRenderer.invoke('get-current-theme'),
    
    // Window management
    createDefaultsWindow: () => ipcRenderer.invoke('create-defaults-window'),
    createBatchRenameWindow: () => ipcRenderer.invoke('create-batch-rename-window'),
    
    // Event listeners - FIXED: Added missing compression event handlers
    onCompressionStarted: (callback: (data: any) => void) => {
      ipcRenderer.on('compression-started', (event, data) => callback(data));
    },
    
    onCompressionProgress: (callback: (data: any) => void) => {
      ipcRenderer.on('compression-progress', (event, data) => callback(data));
    },
    
    onCompressionComplete: (callback: (data: any) => void) => {
      ipcRenderer.on('compression-complete', (event, data) => callback(data));
    },
    
    onOverlayFilesDropped: (callback: (filePaths: string[]) => void) => {
      ipcRenderer.on('overlay-files-dropped', (event, filePaths) => callback(filePaths));
    },
    
    // Menu events
    onShowAboutModal: (callback: () => void) => {
    
    },
    
    onTriggerFileSelect: (callback: () => void) => {
      ipcRenderer.on('trigger-file-select', () => callback());
    },
    
    onTriggerOutputSelect: (callback: () => void) => {
      ipcRenderer.on('trigger-output-select', () => callback());
    },
    
    // Remove listeners
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
    
      // Update manager
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  getUpdateStatus: () => ipcRenderer.invoke('update:get-status'),
  getUpdateSettings: () => ipcRenderer.invoke('update:get-settings'),
  saveUpdateSettings: (settings: any) => ipcRenderer.invoke('update:save-settings', settings),

  onUpdateStatus: (callback: (data: any) => void) => {
    ipcRenderer.on('update-status', (_, data) => callback(data));
  }
  };
}
