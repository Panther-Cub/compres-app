import { VideoPreset } from './types';

// Video presets configuration - Categorized for different use cases
export const videoPresets: Record<string, VideoPreset> = {
  // WEB CATEGORY - Optimized for web streaming and embedding
  'web-hero': {
    name: 'Web Hero',
    description: 'High quality for hero videos and main content (1080p)',
    category: 'web',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '2000k',
      audioCodec: 'aac',
      audioBitrate: '128k',
      resolution: '1920x1080',
      fps: 30,
      crf: 23,
      preset: 'medium'
    }
  },
  'web-standard': {
    name: 'Web Standard',
    description: 'Balanced quality and size for general web use (720p)',
    category: 'web',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '1000k',
      audioCodec: 'aac',
      audioBitrate: '96k',
      resolution: '1280x720',
      fps: 30,
      crf: 25,
      preset: 'medium'
    }
  },
  'web-light': {
    name: 'Web Light',
    description: 'Small file size for faster loading (720p, compressed)',
    category: 'web',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '600k',
      audioCodec: 'aac',
      audioBitrate: '64k',
      resolution: '1280x720',
      fps: 30,
      crf: 28,
      preset: 'medium'
    }
  },

  // SOCIAL CATEGORY - Optimized for social media platforms
  'social-vertical': {
    name: 'Social Vertical',
    description: 'Optimized for Instagram, TikTok, and Stories (9:16)',
    category: 'social',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '1500k',
      audioCodec: 'aac',
      audioBitrate: '128k',
      resolution: '1080x1920',
      fps: 30,
      crf: 24,
      preset: 'medium'
    }
  },
  'social-square': {
    name: 'Social Square',
    description: 'Perfect for Instagram posts and Facebook (1:1)',
    category: 'social',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '1200k',
      audioCodec: 'aac',
      audioBitrate: '96k',
      resolution: '1080x1080',
      fps: 30,
      crf: 25,
      preset: 'medium'
    }
  },
  'social-horizontal': {
    name: 'Social Horizontal',
    description: 'For YouTube, Facebook, and Twitter (16:9)',
    category: 'social',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '1800k',
      audioCodec: 'aac',
      audioBitrate: '128k',
      resolution: '1920x1080',
      fps: 30,
      crf: 23,
      preset: 'medium'
    }
  },

  // MAC CATEGORY - Hardware accelerated for Mac users
  'mac-fast': {
    name: 'Mac Fast',
    description: 'Hardware accelerated for quick compression (VideoToolbox)',
    category: 'mac',
    settings: {
      videoCodec: 'h264_videotoolbox',
      videoBitrate: '1500k',
      audioCodec: 'aac',
      audioBitrate: '96k',
      resolution: '1280x720',
      fps: 30,
      crf: 25,
      preset: 'medium'
    }
  },
  'mac-efficient': {
    name: 'Mac Efficient',
    description: 'HEVC hardware encoding for maximum compression',
    category: 'mac',
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
  'mac-quality': {
    name: 'Mac Quality',
    description: 'High quality with hardware acceleration',
    category: 'mac',
    settings: {
      videoCodec: 'hevc_videotoolbox',
      videoBitrate: '2500k',
      audioCodec: 'aac',
      audioBitrate: '128k',
      resolution: '1920x1080',
      fps: 30,
      crf: 22,
      preset: 'slow'
    }
  }
};

// In-memory custom presets storage (file operations handled in main process)
let customPresets: Record<string, VideoPreset> = {};
let customPresetsLoaded = false;

// Function to add a custom preset (in-memory only, file operations in main process)
export const addCustomPreset = (presetId: string, preset: VideoPreset): void => {
  // Ensure preset ID starts with 'custom-' to avoid conflicts with built-in presets
  const safePresetId = presetId.startsWith('custom-') ? presetId : `custom-${presetId}`;
  
  // Check if this would conflict with a built-in preset (excluding custom presets)
  if (videoPresets[safePresetId] && !safePresetId.startsWith('custom-')) {
    throw new Error(`Cannot create custom preset with ID '${safePresetId}' as it conflicts with a built-in preset`);
  }
  
  // Ensure custom presets have the 'custom' category
  const customPresetWithCategory = {
    ...preset,
    category: 'custom' as const
  };
  
  videoPresets[safePresetId] = customPresetWithCategory;
  customPresets[safePresetId] = customPresetWithCategory;
  
  console.log(`Custom preset added: ${safePresetId}`);
};

// Function to remove a custom preset (in-memory only, file operations in main process)
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

// Function to get only custom presets
export const getCustomPresets = (): Record<string, VideoPreset> => {
  return { ...customPresets };
};

// Function to load custom presets from data (called by main process)
export const loadCustomPresetsFromData = (customPresetsData: Record<string, VideoPreset>): void => {
  customPresets = { ...customPresetsData };
  
  // Add to main presets object
  Object.entries(customPresets).forEach(([presetId, preset]) => {
    videoPresets[presetId] = preset;
  });
  
  customPresetsLoaded = true;
  console.log(`Loaded ${Object.keys(customPresets).length} custom presets`);
};

// Function to check if custom presets are loaded
export const areCustomPresetsLoaded = (): boolean => {
  return customPresetsLoaded;
};
