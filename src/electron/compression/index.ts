// Export all compression functionality
export { CompressionManager } from './manager';
export { videoPresets } from './presets';
export { addCustomPreset, removeCustomPreset, getAllPresets, isCustomPreset, getCustomPresets } from './presets';
export { HardwareDetection } from './hardware-detection';
export { BatchProgressManager } from './batch-progress-manager';
export { CompressionErrorHandler } from './error-handler';
export { MemoryManager, MemoryUtils } from './memory-manager';
export { ThermalMonitor } from './thermal-monitor';
export { ValidationUtils } from './validation';
export { sendCompressionEvent, createTaskKey, getFileName, buildOutputPath, ensureOutputDirectory } from './utils';
export { compressFileWithPreset } from './strategies';
export * from './types';
export * from './utils';
export * from './strategies';

// Custom preset management (main process only)
export * from './custom-preset-manager';
