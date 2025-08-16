import { BrowserWindow } from 'electron';
import { FfmpegCommand } from 'fluent-ffmpeg';

// Compression types
export interface CompressionSettings {
  videoCodec: string;
  videoBitrate: string;
  audioCodec: string;
  audioBitrate: string;
  resolution: string;
  fps: number;
  crf: number;
  preset: string;
}

export interface VideoPreset {
  name: string;
  description: string;
  category?: 'web' | 'social' | 'mac' | 'custom';
  settings: CompressionSettings;
}

export interface CompressionTask {
  file: string;
  presetKey: string;
  preset: VideoPreset;
  keepAudio: boolean;
  outputDirectory: string;
  taskKey: string;
  mainWindow: BrowserWindow;
}

export interface CompressionResult {
  file: string;
  preset: string;
  outputPath?: string;
  success: boolean;
  error?: string;
}

export interface CompressionProgress {
  file: string;
  preset: string;
  percent: number;
  timemark: string;
}

export interface CompressionEvent {
  file: string;
  preset: string;
  outputPath?: string;
}

// Extended event types for new features
export interface HardwareDetectionEvent {
  hasVideoToolbox: boolean;
  recommendedCodec: string;
  chipType: string;
}

export interface BatchProgressEvent {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  overallProgress: number;
  estimatedTimeRemaining: number;
}

export interface CompressionCancelledEvent {
  message: string;
  killedProcesses: number;
}

export interface CompressionStartedEvent {
  type: 'compression-started';
  taskKey?: string;
  file: string;
  preset: string;
  outputPath: string;
}

export interface CompressionProgressEvent {
  type: 'compression-progress';
  taskKey?: string;
  file: string;
  preset: string;
  percent?: number;
  progress?: number;
  timemark: string;
}

export interface CompressionCompleteEvent {
  type: 'compression-complete';
  taskKey?: string;
  file: string;
  preset: string;
  outputPath?: string;
  success: boolean;
  error?: string;
}

export interface CompressionErrorEvent {
  type: 'compression-error';
  file: string;
  preset: string;
  error: string;
}

// Union type for all compression events
export type CompressionEventData = 
  | CompressionStartedEvent
  | CompressionProgressEvent
  | CompressionCompleteEvent
  | CompressionErrorEvent
  | CompressionProgress 
  | HardwareDetectionEvent 
  | BatchProgressEvent 
  | CompressionCancelledEvent
  | CompressionWarningEvent;

export interface AdvancedCompressionSettings {
  crf?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  fps?: number;
  resolution?: string;
  preserveAspectRatio?: boolean;
  twoPass?: boolean;
  fastStart?: boolean;
  optimizeForWeb?: boolean;
  maxConcurrentCompressions?: number;
}

export interface CompressionOptions {
  files: string[];
  presets: string[];
  keepAudio: boolean;
  outputDirectory: string;
  advancedSettings?: AdvancedCompressionSettings;
}

// FFmpeg command types
export type FFmpegCommand = FfmpegCommand;

export interface FFmpegProgress {
  percent?: number;
  timemark: string;
}

export interface FFmpegError {
  message: string;
}

export interface CompressionWarningEvent {
  type: 'compression-warning';
  message: string;
  totalTasks: number;
  estimatedTimeMinutes: number;
  maxConcurrent: number;
}
