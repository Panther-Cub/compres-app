export interface PresetMetadata {
  id: string;
  name: string;
  folderName: string;
  fileSuffix: string;
  defaultKeepAudio: boolean;
  description: string;
}

export const PRESET_REGISTRY: Record<string, PresetMetadata> = {
  'web-hero': {
    id: 'web-hero',
    name: 'Web Hero',
    folderName: 'Web Hero',
    fileSuffix: ' - Hero',
    defaultKeepAudio: true,
    description: 'High quality for hero sections and main content'
  },
  'web-standard': {
    id: 'web-standard',
    name: 'Web Standard',
    folderName: 'Web Standard',
    fileSuffix: ' - Web',
    defaultKeepAudio: true,
    description: 'Balanced quality and file size for web pages'
  },
  'web-mobile': {
    id: 'web-mobile',
    name: 'Web Mobile',
    folderName: 'Web Mobile',
    fileSuffix: ' - Mobile',
    defaultKeepAudio: true,
    description: 'Optimized for mobile devices and slower connections'
  },
  'social-instagram': {
    id: 'social-instagram',
    name: 'Instagram',
    folderName: 'Instagram',
    fileSuffix: ' - IG',
    defaultKeepAudio: true,
    description: 'Optimized for Instagram feed and stories'
  },
  'social-tiktok': {
    id: 'social-tiktok',
    name: 'TikTok',
    folderName: 'TikTok',
    fileSuffix: ' - TikTok',
    defaultKeepAudio: true,
    description: 'Optimized for TikTok and vertical video platforms'
  },
  'webm-modern': {
    id: 'webm-modern',
    name: 'WebM Modern',
    folderName: 'WebM Modern',
    fileSuffix: ' - WebM',
    defaultKeepAudio: true,
    description: 'Modern WebM format with VP9 for better compression'
  },
  'hevc-efficient': {
    id: 'hevc-efficient',
    name: 'HEVC Efficient',
    folderName: 'HEVC Efficient',
    fileSuffix: ' - HEVC',
    defaultKeepAudio: true,
    description: 'H.265/HEVC for maximum compression efficiency'
  },
  'thumbnail-preview': {
    id: 'thumbnail-preview',
    name: 'Thumbnail',
    folderName: 'Thumbnail Preview',
    fileSuffix: ' - Thumb',
    defaultKeepAudio: false,
    description: 'Small file size for thumbnails and previews'
  },
  'ultra-compressed': {
    id: 'ultra-compressed',
    name: 'Ultra Compressed',
    folderName: 'Ultra Compressed',
    fileSuffix: ' - Compressed',
    defaultKeepAudio: false,
    description: 'Maximum compression for minimal file size'
  }
};

// Helper functions for accessing preset metadata
export const getPresetMetadata = (presetKey: string): PresetMetadata | undefined => {
  return PRESET_REGISTRY[presetKey];
};

export const getPresetFolderName = (presetKey: string): string => {
  return PRESET_REGISTRY[presetKey]?.folderName || presetKey;
};

export const getPresetSuffix = (presetKey: string): string => {
  return PRESET_REGISTRY[presetKey]?.fileSuffix || '';
};

export const getPresetDefaultKeepAudio = (presetKey: string): boolean => {
  return PRESET_REGISTRY[presetKey]?.defaultKeepAudio ?? true;
};

export const getAllPresetKeys = (): string[] => {
  return Object.keys(PRESET_REGISTRY);
};

export const getDefaultPresets = (): string[] => {
  return [];
};
