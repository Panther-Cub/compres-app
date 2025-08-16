// Export all compression functionality
export { videoPresets } from './presets';
export { 
  compressVideos, 
  compressVideosAdvanced, 
  cancelCompression 
} from './compressor';
export { CompressionManager } from './manager';
export { HardwareDetection } from './hardware-detection';
export { BatchProgressManager } from './batch-progress-manager';
export { CompressionErrorHandler } from './error-handler';
export * from './types';
export * from './utils';
export * from './strategies';
