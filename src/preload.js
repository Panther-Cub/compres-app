const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  compressVideo: (filePath, options) => ipcRenderer.invoke('compress-video', filePath, options),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectOutputDirectory: () => ipcRenderer.invoke('select-output-directory'),
  
  // Listen for compression events
  onCompressionStarted: (callback) => {
    ipcRenderer.on('compression-started', callback);
  },
  
  onCompressionProgress: (callback) => {
    ipcRenderer.on('compression-progress', (event, progress) => {
      callback(progress);
    });
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
}); 