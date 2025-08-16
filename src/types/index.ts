// Core application types
export interface FileInfo {
  size: number;
  duration: number;
  width: number;
  height: number;
  thumbnail?: string;
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
  onSelectOutputDirectory: () => void;
  defaultOutputDirectory: string;
  onSetDefaultOutputDirectory: (directory: string) => void;
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onSaveCustomPreset: () => void;
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
}

export interface AppHeaderProps {
  selectedFilesCount: number;
  onBuyCoffee: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onShowAbout: () => void;
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

export interface CustomPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preset: any) => void;
  advancedSettings: AdvancedSettings;
}

export interface SettingsDrawerProps {
  presets: Record<string, Preset>;
  selectedPresets: string[];
  onPresetToggle: (presetId: string) => void;
  presetSettings: Record<string, PresetSettings>;
  onPresetSettingsChange: (presetId: string, settings: PresetSettings) => void;
  outputDirectory: string;
  onSelectOutputDirectory: () => void;
  defaultOutputDirectory: string;
  onSetDefaultOutputDirectory: (directory: string) => void;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onSaveCustomPreset: () => void;
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

export interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

// Hook return types
export interface UseVideoCompressionReturn {
  selectedFiles: string[];
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
}

export interface UseSettingsReturn {
  selectedPresets: string[];
  presetSettings: Record<string, PresetSettings>;
  setPresetSettings: (presetId: string, settings: PresetSettings) => void;
  outputDirectory: string;
  defaultOutputDirectory: string;
  presets: Record<string, Preset>;
  drawerOpen: boolean;
  showAdvanced: boolean;
  showCustomPresetModal: boolean;
  advancedSettings: AdvancedSettings;
  handlePresetToggle: (presetId: string) => void;
  handleSelectOutputDirectory: () => void;
  setDefaultOutputDirectory: (directory: string) => void;
  toggleDrawer: () => void;
  toggleAdvanced: () => void;
  handleAdvancedSettingsChange: (settings: AdvancedSettings) => void;
  handleSaveCustomPreset: () => void;
  handleCustomPresetSave: () => void;
  setShowCustomPresetModal: (show: boolean) => void;
  // New persistent settings methods
  defaultPresets: string[];
  setDefaultPresets: (presets: string[]) => void;
  defaultPresetSettings: Record<string, PresetSettings>;
  setDefaultPresetSettings: (settings: Record<string, PresetSettings>) => void;
  defaultAdvancedSettings: AdvancedSettings;
  setDefaultAdvancedSettings: (settings: AdvancedSettings) => void;
  saveUserDefaults: () => void;
  resetToDefaults: () => void;
}

// New interface for persistent user settings
export interface UserDefaults {
  defaultPresets: string[];
  defaultOutputDirectory: string;
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
