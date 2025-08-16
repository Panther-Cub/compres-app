import { VideoPreset } from './types';

// Video presets configuration
export const videoPresets: Record<string, VideoPreset> = {
  'web-optimized': {
    name: 'Web Optimized',
    description: 'Optimized for web streaming with good quality and small file size',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '1000k',
      audioCodec: 'aac',
      audioBitrate: '64k',
      resolution: '1280x720',
      fps: 30,
      crf: 27,
      preset: 'medium'
    }
  },
  'mac-hardware': {
    name: 'Mac Hardware Accelerated',
    description: 'Uses Mac VideoToolbox for faster encoding',
    settings: {
      videoCodec: 'h264_videotoolbox',
      videoBitrate: '1000k',
      audioCodec: 'aac',
      audioBitrate: '64k',
      resolution: '1280x720',
      fps: 30,
      crf: 27,
      preset: 'medium'
    }
  },
  'mac-hevc': {
    name: 'Mac HEVC Hardware',
    description: 'Hardware-accelerated HEVC encoding for maximum efficiency',
    settings: {
      videoCodec: 'hevc_videotoolbox',
      videoBitrate: '800k',
      audioCodec: 'aac',
      audioBitrate: '64k',
      resolution: '1280x720',
      fps: 30,
      crf: 28,
      preset: 'medium'
    }
  },
  'mac-ultra-fast': {
    name: 'Mac Ultra Fast',
    description: 'Maximum speed with hardware acceleration for quick previews',
    settings: {
      videoCodec: 'h264_videotoolbox',
      videoBitrate: '500k',
      audioCodec: 'aac',
      audioBitrate: '48k',
      resolution: '1280x720',
      fps: 30,
      crf: 30,
      preset: 'ultrafast'
    }
  },
  'mac-high-quality': {
    name: 'Mac High Quality',
    description: 'High quality with hardware acceleration for professional use',
    settings: {
      videoCodec: 'hevc_videotoolbox',
      videoBitrate: '2000k',
      audioCodec: 'aac',
      audioBitrate: '128k',
      resolution: '1920x1080',
      fps: 30,
      crf: 23,
      preset: 'slow'
    }
  },
  'webm-modern': {
    name: 'WebM Modern',
    description: 'Modern WebM format with VP9 for better compression',
    settings: {
      videoCodec: 'libvpx-vp9',
      videoBitrate: '800k',
      audioCodec: 'libopus',
      audioBitrate: '64k',
      resolution: '1280x720',
      fps: 30,
      crf: 30,
      preset: 'medium'
    }
  },
  'hevc-efficient': {
    name: 'HEVC Efficient',
    description: 'H.265/HEVC for maximum compression efficiency',
    settings: {
      videoCodec: 'libx265',
      videoBitrate: '600k',
      audioCodec: 'aac',
      audioBitrate: '64k',
      resolution: '1280x720',
      fps: 30,
      crf: 28,
      preset: 'medium'
    }
  },
  'thumbnail-preview': {
    name: 'Thumbnail Preview',
    description: 'Small file size for thumbnails and previews',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '200k',
      audioCodec: 'aac',
      audioBitrate: '32k',
      resolution: '640x360',
      fps: 15,
      crf: 35,
      preset: 'ultrafast'
    }
  },
  'ultra-compressed': {
    name: 'Ultra Compressed',
    description: 'Maximum compression for very small file sizes',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '400k',
      audioCodec: 'aac',
      audioBitrate: '48k',
      resolution: '1280x720',
      fps: 24,
      crf: 35,
      preset: 'slow'
    }
  }
};

// In-memory custom presets storage (will be replaced with file-based storage in main process)
const customPresets: Record<string, VideoPreset> = {};

// Function to add a custom preset (in-memory only for now)
export const addCustomPreset = (presetId: string, preset: VideoPreset): void => {
  // Ensure preset ID starts with 'custom-' to avoid conflicts with built-in presets
  const safePresetId = presetId.startsWith('custom-') ? presetId : `custom-${presetId}`;
  
  // Check if this would conflict with a built-in preset (excluding custom presets)
  if (videoPresets[safePresetId] && !safePresetId.startsWith('custom-')) {
    throw new Error(`Cannot create custom preset with ID '${safePresetId}' as it conflicts with a built-in preset`);
  }
  
  videoPresets[safePresetId] = preset;
  customPresets[safePresetId] = preset;
  
  console.log(`Custom preset added: ${safePresetId}`);
};

// Function to remove a custom preset
export const removeCustomPreset = (presetId: string): void => {
  if (videoPresets[presetId] && presetId.startsWith('custom-')) {
    delete videoPresets[presetId];
    delete customPresets[presetId];
    
    console.log(`Custom preset removed: ${presetId}`);
  }
};

// Function to get all presets (built-in + custom)
export const getAllPresets = (): Record<string, VideoPreset> => {
  return { ...videoPresets };
};

// Function to check if a preset is custom
export const isCustomPreset = (presetId: string): boolean => {
  return presetId.startsWith('custom-');
};
