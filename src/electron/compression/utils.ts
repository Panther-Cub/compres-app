import path from 'path';
import fs from 'fs';
import os from 'os';
import { BrowserWindow } from 'electron';
import { 
  CompressionEvent, 
  CompressionProgress,
  CompressionEventData
} from './types';
import { getFileName } from '../../utils/formatters';
import { getPresetFolderName, getPresetSuffix } from '../../shared/presetRegistry';

// Helper function to send compression events
export function sendCompressionEvent(
  eventType: string, 
  data: CompressionEventData, 
  mainWindow: BrowserWindow
): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(eventType, data);
  }
}

// Helper function to get default output directory for Mac
export function getDefaultOutputDirectory(): string {
  const homeDir = os.homedir();
  const desktopDir = path.join(homeDir, 'Desktop');
  const compressedVideosDir = path.join(desktopDir, 'Compressed Videos');
  
  // Create the directory if it doesn't exist
  if (!fs.existsSync(compressedVideosDir)) {
    try {
      fs.mkdirSync(compressedVideosDir, { recursive: true });
      console.log(`Created default output directory: ${compressedVideosDir}`);
    } catch (error) {
      console.warn('Could not create default directory, using Desktop:', error);
      return desktopDir;
    }
  }
  
  return compressedVideosDir;
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

// Helper function to create preset-specific folder with better naming
export function createPresetFolder(outputDirectory: string, presetKey: string): string {
  // Convert preset key to user-friendly folder name
  const folderName = getPresetFolderName(presetKey);
  const presetFolder = path.join(outputDirectory, folderName);
  
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



// Helper function to create user-friendly filename
export function createUserFriendlyFilename(
  originalFile: string, 
  presetKey: string, 
  videoCodec: string,
  keepAudio: boolean,
  index?: number
): string {
  const baseName = path.basename(originalFile, path.extname(originalFile));
  const outputExt = getOutputExtension(videoCodec);
  
  // Clean up the base name (remove special characters, limit length)
  let cleanName = baseName
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  // Limit length to 50 characters
  if (cleanName.length > 50) {
    cleanName = cleanName.substring(0, 47) + '...';
  }
  
  // Add preset suffix for clarity
  const presetSuffix = getPresetSuffix(presetKey);
  
  // Add audio setting suffix
  const audioSuffix = keepAudio ? ' - audio' : ' - muted';
  
  // Add index if provided (for multiple files with same name)
  const indexSuffix = index !== undefined ? ` (${index + 1})` : '';
  
  return `${cleanName}${presetSuffix}${audioSuffix}${indexSuffix}.${outputExt}`;
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
  videoCodec: string,
  keepAudio: boolean,
  index?: number
): string {
  // Create preset-specific folder for better organization
  const presetFolder = createPresetFolder(outputDirectory, presetKey);
  
  // Create user-friendly filename
  const outputFileName = createUserFriendlyFilename(file, presetKey, videoCodec, keepAudio, index);
  
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
  return `${fileName}::${presetKey}`;
}

// Re-export getFileName from formatters for convenience
export { getFileName };
