

import type { AdvancedSettings, Preset, CompressionResult, CompressionEventData, CompressionProgressData, CompressionCompleteData, UpdateData, UpdateStatusData } from './shared';

// Define the ElectronAPI interface locally to avoid importing from electron directory
interface ElectronAPI {
  // File selection
  selectFiles: () => Promise<string[]>;
  selectOutputDirectory: () => Promise<string>;
  getDefaultOutputDirectory: (folderName?: string) => Promise<string>;
  batchRenameFiles: (data: { files: string[]; newNames: Record<string, string> }) => Promise<Array<{
    success: boolean;
    oldPath: string;
    newPath?: string;
    error?: string;
  }>>;
  
  // Video compression
  initializeCompressionManager: () => Promise<{ success: boolean }>;
  compressVideos: (data: {
    files: string[];
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>;
    outputDirectory: string;
    advancedSettings?: AdvancedSettings;
  }) => Promise<CompressionResult[]>;
  compressVideosAdvanced: (data: {
    files: string[];
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>;
    outputDirectory: string;
    advancedSettings: AdvancedSettings;
  }) => Promise<CompressionResult[]>;
  getPresets: () => Promise<Record<string, Preset>>;
  getAllPresets: () => Promise<Record<string, Preset>>;
  getCustomPresets: () => Promise<Record<string, Preset>>;
  getPresetMetadata: (presetId: string) => Promise<{
    id: string;
    name: string;
    folderName: string;
    fileSuffix: string;
    defaultKeepAudio: boolean;
    description: string;
  } | undefined>;
  addCustomPreset: (presetId: string, preset: Preset) => Promise<{ success: boolean; presetId: string }>;
  removeCustomPreset: (presetId: string) => Promise<{ success: boolean; presetId: string }>;
  isCustomPreset: (presetId: string) => Promise<boolean>;
  getFileInfo: (filePath: string) => Promise<{
    duration: number;
    size: number;
    width: number;
    height: number;
    codec: string;
  }>;
  checkFileExists: (filePath: string) => Promise<boolean>;
  checkExistingOutputFiles: (data: {
    files: string[];
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>;
    outputDirectory: string;
    customOutputNames?: Record<string, string>;
  }) => Promise<Array<{
    filePath: string;
    presetId: string;
    existingOutputPath: string;
    fileName: string;
    existingFileName: string;
  }>>;
  cancelCompression: () => Promise<{ success: boolean }>;
  
  // Thumbnails and file operations
  generateThumbnail: (filePath: string) => Promise<string>;
  getThumbnailDataUrl: (filePath: string) => Promise<string>;
  showInFinder: (filePath: string) => Promise<{ success: boolean }>;
  openFile: (filePath: string) => Promise<{ success: boolean }>;
  
  // Overlay window functionality
  overlayFileDrop: (filePaths: string[]) => Promise<{ success: boolean; validFiles: string[] }>;
  toggleOverlay: (show: boolean) => Promise<{ success: boolean }>;
  showOverlay: () => Promise<{ success: boolean }>;
  hideOverlay: () => Promise<{ success: boolean }>;
  hideMainWindow: () => Promise<{ success: boolean }>;
  showMainWindow: () => Promise<{ success: boolean }>;
  
  // Settings management
  getStartupSettings: () => Promise<{ openAtLogin: boolean; defaultWindow: string; performanceSettings?: { maxConcurrentCompressions: number }; showRecommendedPresets: boolean }>;
  saveStartupSettings: (settings: { openAtLogin: boolean; defaultWindow: string; performanceSettings?: { maxConcurrentCompressions: number }; showRecommendedPresets?: boolean }) => Promise<{ success: boolean }>;
  getDefaultWindow: () => Promise<string>;
  
  // App information
  getAppVersion: () => Promise<string>;
  
  // Theme management
  getCurrentTheme: () => Promise<string>;
  
  // Window management
  createDefaultsWindow: () => Promise<{ success: boolean }>;
  createBatchRenameWindow: () => Promise<{ success: boolean }>;
  getSelectedFiles: () => Promise<string[]>;
  sendBatchRenameResults: (results: { success: boolean; oldPath: string; newPath?: string; error?: string }[]) => Promise<{ success: boolean }>;
  saveCompressionOutputNaming: (naming: Array<{ filePath: string; customOutputName: string }>) => Promise<{ success: boolean; error?: string }>;
  sendCompressionNamingResults: (results: { success: boolean; error?: string }) => Promise<{ success: boolean }>;
  
  // Defaults sync across windows
  notifyUserDefaultsUpdated: (defaults: { defaultPresets?: string[]; defaultOutputDirectory?: string; defaultOutputFolderName?: string }) => void;
  onUserDefaultsUpdated: (callback: (defaults: { defaultPresets?: string[]; defaultOutputDirectory?: string; defaultOutputFolderName?: string }) => void) => void;
  
  // Event listeners
  onCompressionStarted: (callback: (data: CompressionEventData) => void) => void;
  onCompressionProgress: (callback: (data: CompressionProgressData) => void) => void;
  onCompressionComplete: (callback: (data: CompressionCompleteData) => void) => void;
  onOverlayFilesDropped: (callback: (filePaths: string[]) => void) => void;
  onBatchRenameResults: (callback: (results: { success: boolean; oldPath: string; newPath?: string; error?: string }[]) => void) => void;
  onCompressionNamingResults: (callback: (results: { success: boolean; error?: string }) => void) => void;
  onBatchRenameWindowClosed: (callback: () => void) => void;
  
  // Menu events
  onShowAboutModal: (callback: () => void) => void;
  onTriggerFileSelect: (callback: () => void) => void;
  onTriggerOutputSelect: (callback: () => void) => void;
  
  // Remove listeners
  removeAllListeners: (channel: string) => void;
  
  // Update manager
  checkForUpdates: () => Promise<any>;
  downloadUpdate: () => Promise<any>;
  installUpdate: () => Promise<any>;
  getUpdateStatus: () => Promise<any>;
  getUpdateSettings: () => Promise<any>;
  saveUpdateSettings: (settings: any) => Promise<any>;
  onUpdateStatus: (callback: (data: any) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
