// Simplified preset definitions for React components
// This avoids importing from electron directory to prevent webpack compilation issues

export interface SimplePreset {
  name: string;
  description: string;
  category?: 'web' | 'social' | 'mac' | 'custom';
}

// Basic preset information for UI components
export const simplePresets: Record<string, SimplePreset> = {
  // WEB CATEGORY
  'web-hero': {
    name: 'Web Hero',
    description: 'High quality for hero videos and main content (1080p)',
    category: 'web'
  },
  'web-standard': {
    name: 'Web Standard',
    description: 'Balanced quality and size for general web use (720p)',
    category: 'web'
  },
  'web-light': {
    name: 'Web Light',
    description: 'Small file size for faster loading (720p, compressed)',
    category: 'web'
  },

  // SOCIAL CATEGORY
  'social-vertical': {
    name: 'Social Vertical',
    description: 'Optimized for Instagram, TikTok, and Stories (9:16)',
    category: 'social'
  },
  'social-square': {
    name: 'Social Square',
    description: 'Perfect for Instagram posts and Facebook (1:1)',
    category: 'social'
  },
  'social-horizontal': {
    name: 'Social Horizontal',
    description: 'For YouTube, Facebook, and Twitter (16:9)',
    category: 'social'
  },

  // MAC CATEGORY
  'mac-fast': {
    name: 'Mac Fast',
    description: 'Hardware accelerated for Mac (fast encoding)',
    category: 'mac'
  },
  'mac-efficient': {
    name: 'Mac Efficient',
    description: 'Hardware accelerated for Mac (smaller files)',
    category: 'mac'
  }
};
