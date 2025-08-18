// Shared type definitions used by both React and Electron components
// This file should not import any Node.js modules to avoid webpack compilation issues

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
