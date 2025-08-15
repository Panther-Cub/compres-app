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
