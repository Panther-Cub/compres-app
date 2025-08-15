import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface for type safety
interface ElectronAPI {
  // File selection
  selectFiles: () => Promise<string[]>;
  selectOutputDirectory: () => Promise<string>;
  
  // Video compression
  compressVideos: (data: {
    files: string[];
    presets: string[];
    keepAudio: boolean;
    outputDirectory: string;
  }) => Promise<any[]>;
  compressVideosAdvanced: (data: {
    files: string[];
    presets: string[];
    keepAudio: boolean;
    outputDirectory: string;
    advancedSettings: any;
  }) => Promise<any[]>;
  getPresets: () => Promise<Record<string, any>>;
  getFileInfo: (filePath: string) => Promise<{
    duration: number;
    size: number;
    width: number;
    height: number;
    codec: string;
  }>;
  cancelCompression: () => Promise<{ success: boolean }>;
  
  // Event listeners
  onCompressionStarted: (callback: (data: any) => void) => void;
  onCompressionProgress: (callback: (data: any) => void) => void;
  onCompressionComplete: (callback: (data: any) => void) => void;
  
  // Menu events
  onShowAboutModal: (callback: () => void) => void;
  onTriggerFileSelect: (callback: () => void) => void;
  onTriggerOutputSelect: (callback: () => void) => void;
  
  // Remove listeners
  removeAllListeners: (channel: string) => void;
}

contextBridge.exposeInMainWorld('electronAPI', {
  // File selection
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectOutputDirectory: () => ipcRenderer.invoke('select-output-directory'),
  
  // Video compression
  compressVideos: (data) => ipcRenderer.invoke('compress-videos', data),
  compressVideosAdvanced: (data) => ipcRenderer.invoke('compress-videos-advanced', data),
  getPresets: () => ipcRenderer.invoke('get-presets'),
  getFileInfo: (filePath: string) => ipcRenderer.invoke('get-file-info', filePath),
  cancelCompression: () => ipcRenderer.invoke('cancel-compression'),
  
  // Event listeners
  onCompressionStarted: (callback: (data: any) => void) => {
    ipcRenderer.on('compression-started', (event, data) => callback(data));
  },
  
  onCompressionProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('compression-progress', (event, data) => callback(data));
  },
  
  onCompressionComplete: (callback: (data: any) => void) => {
    ipcRenderer.on('compression-complete', (event, data) => callback(data));
  },
  
  // Menu events
  onShowAboutModal: (callback: () => void) => {
    ipcRenderer.on('show-about-modal', () => callback());
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
  }
} as ElectronAPI);
