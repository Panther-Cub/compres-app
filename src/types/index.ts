// Core application types
export interface FileInfo {
  size: number;
  duration: number;
  width: number;
  height: number;
  thumbnail?: string;
}

// New interface for tracking compression status per file and preset
export interface CompressionStatus {
  filePath: string;
  presetId: string;
  status: 'pending' | 'compressing' | 'completed' | 'error' | 'failed';
  progress: number;
  outputPath?: string;
  error?: string;
  completedAt?: number; // timestamp when compression completed
  keepAudio?: boolean; // whether audio was kept for this compression
}

// New interface for overwrite confirmation
export interface OverwriteConfirmation {
  filePath: string;
  presetId: string;
  existingOutputPath: string;
  newOutputPath: string;
}

// New interface for batch overwrite confirmation
export interface BatchOverwriteConfirmation {
  files: Array<{
    filePath: string;
    presetId: string;
    existingOutputPath: string;
    newOutputPath: string;
    fileName: string;
    existingFileName: string;
    newFileName: string;
  }>;
  onConfirm: (filesToOverwrite: string[]) => void;
  onCancel: () => void;
  onClose: () => void;
}

// New interface for compression output naming
export interface CompressionOutputNaming {
  filePath: string;
  customOutputName: string;
}

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

export interface CompressionData {
  file: string;
  preset: string;
  percent?: number;
  outputPath?: string;
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

// New interface for preset-specific settings
export interface PresetSettings {
  keepAudio: boolean;
}

export interface Settings {
  presets: Record<string, Preset>;
  selectedPresets: string[];
  onPresetToggle: (presetId: string) => void;
  // Remove global keepAudio, add per-preset settings
  presetSettings: Record<string, PresetSettings>;
  onPresetSettingsChange: (presetId: string, settings: PresetSettings) => void;
  outputDirectory: string;
  onSelectOutputDirectory: () => Promise<void>;
  defaultOutputDirectory: string;
  onSetDefaultOutputDirectory: (directory: string) => void;
  outputFolderName: string;
  onOutputFolderNameChange: (name: string) => Promise<void>;
  defaultOutputFolderName: string;
  onSetDefaultOutputFolderName: (name: string) => void;
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onSaveCustomPreset: () => void;
  handleCustomPresetRemove: (presetId: string) => Promise<void>;
  selectedFiles: string[];
  fileInfos: Record<string, FileInfo>;
  // New default settings properties
  defaultPresets: string[];
  setDefaultPresets: (presets: string[]) => void;
  defaultPresetSettings: Record<string, PresetSettings>;
  setDefaultPresetSettings: (settings: Record<string, PresetSettings>) => void;
  defaultAdvancedSettings: AdvancedSettings;
  setDefaultAdvancedSettings: (settings: AdvancedSettings) => void;
  saveUserDefaults: () => void;
  resetToDefaults: () => void;
  handleReorderPresets: (newOrder: string[]) => void;
  getFinalOutputPath: () => string;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Component prop types
export interface VideoDropZoneProps {
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onSelectFiles: () => void;
}

export interface VideoWorkspaceProps {
  selectedFiles: string[];
  fileInfos: Record<string, FileInfo>;
  onRemoveFile: (filePath: string) => void;
  onReset: () => void;
  onCompress: () => void;
  isCompressing: boolean;
  selectedPresets: string[];
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  settings: Settings;
  onBatchRename: (newNames: Record<string, string>) => void;
  onGenerateThumbnail: (filePath: string) => Promise<string>;
  onGetThumbnailDataUrl?: (filePath: string) => Promise<string>;
  onShowInFinder: (filePath: string) => Promise<void>;
  onOpenFile: (filePath: string) => Promise<void>;
  onAddMoreVideos: () => void;
  // New compression status tracking
  compressionStatuses: Record<string, CompressionStatus>;
  onRecompressFile: (filePath: string, presetId: string) => void;
}

export interface VideoListProps {
  selectedFiles: string[];
  fileInfos: Record<string, FileInfo>;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onRemoveFile: (filePath: string) => void;
  formatFileSize: (bytes: number) => string;
  formatDuration: (seconds: number) => string;
  onGenerateThumbnail: (filePath: string) => Promise<string>;
  onGetThumbnailDataUrl?: (filePath: string) => Promise<string>;
  onShowInFinder: (filePath: string) => Promise<void>;
  onOpenFile: (filePath: string) => Promise<void>;
  // New compression status tracking
  compressionStatuses: Record<string, CompressionStatus>;
  onRecompressFile: (filePath: string, presetId: string) => void;
}

export interface AppHeaderProps {
  selectedFilesCount: number;
  onBuyCoffee: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onShowDefaults: () => void;
  onToggleOverlay?: () => void;
}

export interface ProgressOverlayProps {
  isCompressing: boolean;
  compressionComplete: boolean;
  compressionProgress: Record<string, number>;
  outputPaths: string[];
  presets: Record<string, Preset>;
  getTotalProgress: () => number;
  onClose: () => void;
  onCancel: () => void;
}

export interface CompressionNotificationProps {
  isVisible: boolean;
  isCompressing: boolean;
  compressionComplete: boolean;
  error: string;
  totalProgress: number;
  onShowProgress: () => void;
}

export interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}



export interface SettingsDrawerProps {
  presets: Record<string, Preset>;
  selectedPresets: string[];
  onPresetToggle: (presetId: string) => void;
  presetSettings: Record<string, PresetSettings>;
  onPresetSettingsChange: (presetId: string, settings: PresetSettings) => void;
  outputDirectory: string;
  onSelectOutputDirectory: () => Promise<void>;
  defaultOutputDirectory: string;
  onSetDefaultOutputDirectory: (directory: string) => void;
  outputFolderName: string;
  onOutputFolderNameChange: (name: string) => Promise<void>;
  defaultOutputFolderName: string;
  onSetDefaultOutputFolderName: (name: string) => void;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onSaveCustomPreset: () => void;
  handleCustomPresetRemove: (presetId: string) => Promise<void>;
  selectedFiles: string[];
  fileInfos: Record<string, FileInfo>;
  // New default settings props
  defaultPresets: string[];
  setDefaultPresets: (presets: string[]) => void;
  defaultPresetSettings: Record<string, PresetSettings>;
  setDefaultPresetSettings: (settings: Record<string, PresetSettings>) => void;
  defaultAdvancedSettings: AdvancedSettings;
  setDefaultAdvancedSettings: (settings: AdvancedSettings) => void;
  saveUserDefaults: () => void;
  resetToDefaults: () => void;
  getFinalOutputPath: () => string;
}

export interface AdvancedSettingsProps {
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onSaveCustomPreset: () => void;
}

export interface PresetRecommendationsProps {
  selectedFiles: string[];
  fileInfos: Record<string, FileInfo>;
  presets: Record<string, Preset>;
  selectedPresets: string[];
  onPresetToggle: (presetId: string) => void;
}



// Hook return types
export interface UseVideoCompressionReturn {
  selectedFiles: string[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;
  fileInfos: Record<string, FileInfo>;
  isCompressing: boolean;
  compressionProgress: Record<string, number>;
  compressionComplete: boolean;
  outputPaths: string[];
  error: string;
  handleFileSelect: (files: string[], addToExisting?: boolean) => Promise<void>;
  removeFile: (filePath: string) => void;
  compressVideos: (
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>, 
    outputDirectory: string, 
    advancedSettings?: AdvancedSettings
  ) => Promise<void>;
  reset: () => void;
  getTotalProgress: () => number;
  closeProgress: () => void;
  cancelCompression: () => void;
  // New compression status tracking
  compressionStatuses: Record<string, CompressionStatus>;
  overwriteConfirmation: OverwriteConfirmation | null;
  batchOverwriteConfirmation: BatchOverwriteConfirmation | null;
  handleRecompressFile: (filePath: string, presetId: string) => Promise<void>;
  confirmOverwrite: () => Promise<void>;
  cancelOverwrite: () => void;
  // Thermal monitoring
  thermalStatus: {
    thermalPressure: number;
    isThrottling: boolean;
    recommendedAction: 'normal' | 'reduce_concurrency' | 'pause' | 'resume';
    cpuTemperature?: number;
    cpuUsage?: number;
  } | null;
}

export interface UseSettingsReturn {
  selectedPresets: string[];
  presetSettings: Record<string, PresetSettings>;
  setPresetSettings: (presetId: string, settings: PresetSettings) => void;
  outputDirectory: string;
  defaultOutputDirectory: string;
  outputFolderName: string;
  defaultOutputFolderName: string;
  presets: Record<string, Preset>;
  drawerOpen: boolean;
  showAdvanced: boolean;
  showCustomPresetModal: boolean;
  advancedSettings: AdvancedSettings;
  handlePresetToggle: (presetId: string) => void;
  handleSelectOutputDirectory: () => Promise<void>;
  handleOutputFolderNameChange: (name: string) => Promise<void>;
  handleSetDefaultOutputDirectory: (directory: string) => void;
  handleSetDefaultOutputFolderName: (name: string) => void;
  toggleDrawer: () => void;
  toggleAdvanced: () => void;
  handleAdvancedSettingsChange: (settings: AdvancedSettings) => void;
  handleSaveCustomPreset: () => void;
  handleCustomPresetSave: (customPreset: Preset) => Promise<void>;
  handleCustomPresetRemove: (presetId: string) => Promise<void>;
  handleReorderPresets: (newOrder: string[]) => void;
  // New default settings properties
  defaultPresets: string[];
  setDefaultPresets: (presets: string[]) => void;
  defaultPresetSettings: Record<string, PresetSettings>;
  setDefaultPresetSettings: (settings: Record<string, PresetSettings>) => void;
  defaultAdvancedSettings: AdvancedSettings;
  setDefaultAdvancedSettings: (settings: AdvancedSettings) => void;
  saveUserDefaults: () => void;
  resetToDefaults: () => void;
  getFinalOutputPath: () => string;
  // Add missing properties that are returned by the hook
  setDefaultOutputDirectory: (directory: string) => void;
  setDefaultOutputFolderName: (name: string) => void;
  setShowCustomPresetModal: (show: boolean) => void;
}

// New interface for persistent user settings
export interface UserDefaults {
  defaultPresets: string[];
  defaultOutputDirectory: string;
  defaultOutputFolderName: string;
  defaultPresetSettings: Record<string, PresetSettings>;
  defaultAdvancedSettings: AdvancedSettings;
  drawerOpen: boolean;
}

export interface UseFileHandlingReturn {
  isDragOver: boolean;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleSelectFiles: () => void;
}

export interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
}

// Update manager types
export interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  progress?: number;
  version?: string;
  releaseNotes?: string;
  error?: string;
  currentVersion?: string;
}

// Electron API types are now defined in src/types/electron.d.ts
