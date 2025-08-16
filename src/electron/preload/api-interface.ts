// Define the API interface for type safety
export interface ElectronAPI {
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
  
  // Video compression - FIXED API signatures
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
  
  // Event listeners - FIXED: Added missing compression event handlers
  onCompressionStarted: (callback: (data: CompressionEventData) => void) => void;
  onCompressionProgress: (callback: (data: CompressionProgressData) => void) => void;
  onCompressionComplete: (callback: (data: CompressionCompleteData) => void) => void;
  onOverlayFilesDropped: (callback: (filePaths: string[]) => void) => void;
  
  // Menu events
  onShowAboutModal: (callback: () => void) => void;
  onTriggerFileSelect: (callback: () => void) => void;
  onTriggerOutputSelect: (callback: () => void) => void;
  
  // Remove listeners
  removeAllListeners: (channel: string) => void;
  
  // Update manager
  checkForUpdates: () => Promise<{ success: boolean; error?: string; data?: UpdateData }>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string; data?: UpdateData }>;
  installUpdate: () => Promise<{ success: boolean; error?: string; message?: string }>;
  getUpdateStatus: () => Promise<{ status: string; progress?: number; version?: string; releaseNotes?: string; error?: string; currentVersion?: string }>;
  getUpdateSettings: () => Promise<{ autoUpdateEnabled: boolean; lastUpdateVersion: string | null; lastAppVersion: string | null }>;
  saveUpdateSettings: (settings: { autoUpdateEnabled: boolean; lastUpdateVersion?: string | null; lastAppVersion?: string | null }) => Promise<void>;

  onUpdateStatus: (callback: (data: UpdateStatusData) => void) => void;
}

// Type definitions for better type safety
export interface AdvancedSettings {
  crf: number;
  videoBitrate: string;
  audioBitrate: string;
  fps: number;
  resolution: string;
  preserveAspectRatio: boolean;
  twoPass: boolean;
  fastStart: boolean;
  optimizeForWeb: boolean;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  category?: 'web' | 'social' | 'mac' | 'custom';
  crf: number;
  videoBitrate: string;
  audioBitrate: string;
  fps: number;
  resolution: string;
  keepAudio: boolean;
}

export interface CompressionResult {
  success: boolean;
  file: string;
  preset: string;
  outputPath?: string;
  error?: string;
}

export interface CompressionEventData {
  file: string;
  preset: string;
  taskKey: string;
}

export interface CompressionProgressData {
  // New structure
  taskKey?: string;
  progress?: number;
  file: string;
  preset: string;
  // Old structure (for backward compatibility)
  percent?: number;
}

export interface CompressionCompleteData {
  // New structure
  taskKey?: string;
  success: boolean;
  file: string;
  preset: string;
  outputPath?: string;
  error?: string;
}

export interface UpdateData {
  version: string;
  releaseNotes?: string;
  downloadUrl?: string;
}

export interface UpdateStatusData {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  progress?: number;
  version?: string;
  releaseNotes?: string;
  error?: string;
  currentVersion?: string;
}
