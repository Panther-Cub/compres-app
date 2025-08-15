import { BrowserWindow } from 'electron';
import { CompressionManager } from './manager';

// Create a singleton instance of the compression manager
let compressionManager: CompressionManager | null = null;

// Factory function to get or create the compression manager
function getCompressionManager(mainWindow: BrowserWindow): CompressionManager {
  if (!compressionManager) {
    compressionManager = new CompressionManager(mainWindow);
  }
  return compressionManager;
}

// Main compression functions - simplified interface
export async function compressVideos(
  files: string[],
  presets: string[],
  keepAudio: boolean,
  outputDirectory: string,
  mainWindow: BrowserWindow
) {
  const manager = getCompressionManager(mainWindow);
  return await manager.compressVideos(files, presets, keepAudio, outputDirectory);
}

export async function compressVideosAdvanced(
  files: string[],
  presets: string[],
  keepAudio: boolean,
  outputDirectory: string,
  advancedSettings: any,
  mainWindow: BrowserWindow
) {
  const manager = getCompressionManager(mainWindow);
  return await manager.compressVideosAdvanced(files, presets, keepAudio, outputDirectory, advancedSettings);
}

// Cancel compression
export function cancelCompression(): { success: boolean } {
  if (compressionManager) {
    return compressionManager.cancelCompression();
  }
  return { success: true };
}
