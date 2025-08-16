// Define the API interface for type safety
export interface ElectronAPI {
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
  
  // Video compression - FIXED API signatures
  initializeCompressionManager: () => Promise<{ success: boolean }>;
  compressVideos: (data: {
    files: string[];
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>;
    outputDirectory: string;
    advancedSettings?: any;
  }) => Promise<any[]>;
  compressVideosAdvanced: (data: {
    files: string[];
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>;
    outputDirectory: string;
    advancedSettings: any;
  }) => Promise<any[]>;
  getPresets: () => Promise<Record<string, any>>;
  getAllPresets: () => Promise<Record<string, any>>;
  addCustomPreset: (presetId: string, preset: any) => Promise<{ success: boolean; presetId: string }>;
  removeCustomPreset: (presetId: string) => Promise<{ success: boolean; presetId: string }>;
  isCustomPreset: (presetId: string) => Promise<boolean>;
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
  getStartupSettings: () => Promise<{ openAtLogin: boolean; defaultWindow: string; performanceSettings?: { maxConcurrentCompressions: number } }>;
  saveStartupSettings: (settings: { openAtLogin: boolean; defaultWindow: string; performanceSettings?: { maxConcurrentCompressions: number } }) => Promise<{ success: boolean }>;
  getDefaultWindow: () => Promise<string>;
  
  // App information
  getAppVersion: () => Promise<string>;
  
  // Event listeners - FIXED: Added missing compression event handlers
  onCompressionStarted: (callback: (data: any) => void) => void;
  onCompressionProgress: (callback: (data: any) => void) => void;
  onCompressionComplete: (callback: (data: any) => void) => void;
  onOverlayFilesDropped: (callback: (filePaths: string[]) => void) => void;
  
  // Menu events
  onShowAboutModal: (callback: () => void) => void;
  onTriggerFileSelect: (callback: () => void) => void;
  onTriggerOutputSelect: (callback: () => void) => void;
  
  // Remove listeners
  removeAllListeners: (channel: string) => void;
  
  // Update manager
  checkForUpdates: () => Promise<{ success: boolean; error?: string; data?: any }>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string; data?: any }>;
  installUpdate: () => Promise<{ success: boolean; error?: string; message?: string }>;
  getUpdateStatus: () => Promise<{ status: string; progress?: number; version?: string; releaseNotes?: string; error?: string; currentVersion?: string }>;
  getUpdateSettings: () => Promise<{ autoUpdateEnabled: boolean; lastUpdateVersion: string | null; lastAppVersion: string | null }>;
  saveUpdateSettings: (settings: { autoUpdateEnabled: boolean; lastUpdateVersion?: string | null; lastAppVersion?: string | null }) => Promise<void>;

  onUpdateStatus: (callback: (data: any) => void) => void;
}
