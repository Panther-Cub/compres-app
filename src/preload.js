const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File selection
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectOutputDirectory: () => ipcRenderer.invoke('select-output-directory'),
  
  // Video compression
  compressVideos: (data) => ipcRenderer.invoke('compress-videos', data),
  compressVideosAdvanced: (data) => ipcRenderer.invoke('compress-videos-advanced', data),
  getPresets: () => ipcRenderer.invoke('get-presets'),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  
  // Event listeners
  onCompressionStarted: (callback) => {
    ipcRenderer.on('compression-started', (event, data) => callback(data));
  },
  
  onCompressionProgress: (callback) => {
    ipcRenderer.on('compression-progress', (event, data) => callback(data));
  },
  
  onCompressionComplete: (callback) => {
    ipcRenderer.on('compression-complete', (event, data) => callback(data));
  },
  
  // Menu events
  onShowAboutModal: (callback) => {
    ipcRenderer.on('show-about-modal', () => callback());
  },
  
  onTriggerFileSelect: (callback) => {
    ipcRenderer.on('trigger-file-select', () => callback());
  },
  
  onTriggerOutputSelect: (callback) => {
    ipcRenderer.on('trigger-output-select', () => callback());
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
}); 