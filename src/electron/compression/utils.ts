import path from 'path';
import { BrowserWindow } from 'electron';
import { 
  CompressionEvent, 
  CompressionProgress, 
  CompressionSettings, 
  AdvancedCompressionSettings,
  FFmpegCommand 
} from './types';

// Helper function to send compression events
export function sendCompressionEvent(
  eventType: string, 
  data: CompressionEvent | CompressionProgress, 
  mainWindow: BrowserWindow
): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(eventType, data);
  }
}

// Helper function to determine output extension based on codec
export function getOutputExtension(videoCodec: string): string {
  return videoCodec === 'libvpx-vp9' ? 'webm' : 'mp4';
}

// Helper function to build output path
export function buildOutputPath(
  file: string, 
  presetKey: string, 
  outputDirectory: string, 
  videoCodec: string
): string {
  const fileName = path.basename(file, path.extname(file));
  const outputExt = getOutputExtension(videoCodec);
  const outputFileName = `${fileName}_${presetKey}.${outputExt}`;
  return path.join(outputDirectory, outputFileName);
}

// Helper function to build resolution scaling filter
export function buildResolutionFilter(
  resolution: string, 
  preserveAspectRatio: boolean = true
): string {
  if (preserveAspectRatio) {
    return `scale=${resolution}:force_original_aspect_ratio=decrease,pad=${resolution}:(ow-iw)/2:(oh-ih)/2`;
  }
  return `scale=${resolution}`;
}

// Helper function to build base output options
export function buildBaseOutputOptions(
  settings: CompressionSettings,
  advancedSettings?: AdvancedCompressionSettings
): string[] {
  const options = [
    `-crf ${advancedSettings?.crf || settings.crf}`,
    `-preset ${settings.preset}`
  ];

  // Handle resolution scaling
  const resolution = advancedSettings?.resolution || settings.resolution;
  const preserveAspectRatio = advancedSettings?.preserveAspectRatio ?? true;
  options.push(`-vf ${buildResolutionFilter(resolution, preserveAspectRatio)}`);

  return options;
}

// Helper function to add optimization options
export function addOptimizationOptions(
  options: string[], 
  advancedSettings?: AdvancedCompressionSettings
): string[] {
  if (advancedSettings?.fastStart) {
    options.push('-movflags +faststart');
  }

  if (advancedSettings?.optimizeForWeb) {
    options.push('-profile:v baseline');
    options.push('-level 3.0');
  }

  return options;
}

// Helper function to configure FFmpeg command with common settings
export function configureFFmpegCommand(
  command: FFmpegCommand,
  settings: CompressionSettings,
  advancedSettings?: AdvancedCompressionSettings
): FFmpegCommand {
  return command
    .videoCodec(settings.videoCodec)
    .videoBitrate(advancedSettings?.videoBitrate || settings.videoBitrate)
    .fps(advancedSettings?.fps || settings.fps);
}

// Helper function to configure audio settings
export function configureAudioSettings(
  command: FFmpegCommand,
  settings: CompressionSettings,
  keepAudio: boolean,
  advancedSettings?: AdvancedCompressionSettings
): FFmpegCommand {
  if (keepAudio) {
    return command
      .audioCodec(settings.audioCodec)
      .audioBitrate(advancedSettings?.audioBitrate || settings.audioBitrate);
  }
  return command.noAudio();
}

// Helper function to create task key
export function createTaskKey(fileName: string, presetKey: string): string {
  return `${fileName}-${presetKey}`;
}

// Helper function to get file name without extension
export function getFileName(file: string): string {
  return path.basename(file, path.extname(file));
}
