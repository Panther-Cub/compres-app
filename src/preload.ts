import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface for type safety
interface ElectronAPI {
  // File selection
  selectFiles: () => Promise<string[]>;
  selectOutputDirectory: () => Promise<string>;
  getDefaultOutputDirectory: () => Promise<string>;
  batchRenameFiles: (data: { files: string[]; newNames: Record<string, string> }) => Promise<Array<{
    success: boolean;
    oldPath: string;
    newPath?: string;
    error?: string;
  }>>;
  
  // Video compression
  compressVideos: (data: {
    files: string[];
    presets: string[];
    keepAudio: boolean;
    outputDirectory: string;
    advancedSettings?: any;
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
  
  // Thumbnails and file operations
  generateThumbnail: (filePath: string) => Promise<string>;
  showInFinder: (filePath: string) => Promise<{ success: boolean }>;
  openFile: (filePath: string) => Promise<{ success: boolean }>;
  
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
  getDefaultOutputDirectory: () => ipcRenderer.invoke('get-default-output-directory'),
  batchRenameFiles: (data) => ipcRenderer.invoke('batch-rename-files', data),
  
  // Video compression
  compressVideos: (data) => ipcRenderer.invoke('compress-videos', data),
  compressVideosAdvanced: (data) => ipcRenderer.invoke('compress-videos-advanced', data),
  getPresets: () => ipcRenderer.invoke('get-presets'),
  getFileInfo: (filePath: string) => ipcRenderer.invoke('get-file-info', filePath),
  cancelCompression: () => ipcRenderer.invoke('cancel-compression'),
  
  // Thumbnails and file operations
  generateThumbnail: (filePath: string) => ipcRenderer.invoke('generate-thumbnail', filePath),
  showInFinder: (filePath: string) => ipcRenderer.invoke('show-in-finder', filePath),
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  
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
