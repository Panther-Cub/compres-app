import path from 'path';
import fs from 'fs';
import { BrowserWindow } from 'electron';
import { 
  CompressionEvent, 
  CompressionProgress
} from './types';
import { getFileName } from '../../utils/formatters';

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

// Helper function to validate and create output directory
export function ensureOutputDirectory(outputDirectory: string): void {
  if (!outputDirectory) {
    throw new Error('Output directory is required');
  }
  
  if (!fs.existsSync(outputDirectory)) {
    try {
      fs.mkdirSync(outputDirectory, { recursive: true });
      console.log(`Created output directory: ${outputDirectory}`);
    } catch (error) {
      throw new Error(`Failed to create output directory: ${outputDirectory}`);
    }
  }
  
  // Check if directory is writable
  try {
    const testFile = path.join(outputDirectory, '.test-write');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
  } catch (error) {
    throw new Error(`Output directory is not writable: ${outputDirectory}`);
  }
}

// Helper function to create preset-specific folder
export function createPresetFolder(outputDirectory: string, presetKey: string): string {
  const presetFolder = path.join(outputDirectory, presetKey);
  if (!fs.existsSync(presetFolder)) {
    try {
      fs.mkdirSync(presetFolder, { recursive: true });
      console.log(`Created preset folder: ${presetFolder}`);
    } catch (error) {
      console.warn(`Failed to create preset folder: ${presetFolder}, using base directory`);
      return outputDirectory;
    }
  }
  return presetFolder;
}

// Helper function to determine output extension based on codec
export function getOutputExtension(videoCodec: string): string {
  return videoCodec === 'libvpx-vp9' ? 'webm' : 'mp4';
}

// Helper function to build output path with organized folder structure
export function buildOutputPath(
  file: string, 
  presetKey: string, 
  outputDirectory: string, 
  videoCodec: string
): string {
  const fileName = path.basename(file, path.extname(file));
  const outputExt = getOutputExtension(videoCodec);
  
  // Create preset-specific folder for better organization
  const presetFolder = createPresetFolder(outputDirectory, presetKey);
  
  // Use a cleaner naming convention
  const outputFileName = `${fileName}.${outputExt}`;
  return path.join(presetFolder, outputFileName);
}

// Helper function to build resolution scaling filter
export function buildResolutionFilter(
  resolution: string, 
  preserveAspectRatio: boolean = true
): string {
  if (!resolution || resolution === 'original') {
    return '';
  }
  
  if (preserveAspectRatio) {
    return `scale=${resolution}:force_original_aspect_ratio=decrease`;
  }
  return `scale=${resolution}`;
}

// Helper function to build scale filter for advanced settings
export function buildScaleFilterFromSettings(
  settings: any,
  preserveAspectRatio: boolean = true
): string {
  const resolution = settings?.resolution;
  if (!resolution || resolution === 'original') {
    return '';
  }
  
  const shouldPreserveAspect = settings?.preserveAspectRatio !== false && preserveAspectRatio;
  return buildResolutionFilter(resolution, shouldPreserveAspect);
}

// Helper function to create task key
export function createTaskKey(fileName: string, presetKey: string): string {
  return `${fileName}-${presetKey}`;
}

// Re-export getFileName from formatters for convenience
export { getFileName };
