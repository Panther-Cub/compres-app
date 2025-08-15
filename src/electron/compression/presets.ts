import { VideoPreset } from './types';

// Video presets configuration
export const videoPresets: Record<string, VideoPreset> = {
  'web-hero': {
    name: 'Web Hero',
    description: 'High quality for hero sections and main content',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '2500k',
      audioCodec: 'aac',
      audioBitrate: '128k',
      resolution: '1920x1080',
      fps: 30,
      crf: 22,
      preset: 'slow'
    }
  },
  'web-standard': {
    name: 'Web Standard',
    description: 'Balanced quality and file size for web pages',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '1500k',
      audioCodec: 'aac',
      audioBitrate: '96k',
      resolution: '1280x720',
      fps: 30,
      crf: 25,
      preset: 'medium'
    }
  },
  'web-mobile': {
    name: 'Web Mobile',
    description: 'Optimized for mobile devices and slower connections',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '800k',
      audioCodec: 'aac',
      audioBitrate: '64k',
      resolution: '854x480',
      fps: 24,
      crf: 28,
      preset: 'fast'
    }
  },
  'social-instagram': {
    name: 'Instagram',
    description: 'Optimized for Instagram feed and stories',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '1200k',
      audioCodec: 'aac',
      audioBitrate: '96k',
      resolution: '1080x1080',
      fps: 30,
      crf: 26,
      preset: 'medium'
    }
  },
  'social-tiktok': {
    name: 'TikTok',
    description: 'Optimized for TikTok and vertical video platforms',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '1000k',
      audioCodec: 'aac',
      audioBitrate: '96k',
      resolution: '1080x1920',
      fps: 30,
      crf: 27,
      preset: 'medium'
    }
  },
  'webm-modern': {
    name: 'WebM Modern',
    description: 'Modern WebM format with VP9 for better compression',
    settings: {
      videoCodec: 'libvpx-vp9',
      videoBitrate: '1200k',
      audioCodec: 'libopus',
      audioBitrate: '64k',
      resolution: '1280x720',
      fps: 30,
      crf: 30,
      preset: 'good'
    }
  },
  'hevc-efficient': {
    name: 'HEVC Efficient',
    description: 'H.265/HEVC for maximum compression efficiency',
    settings: {
      videoCodec: 'libx265',
      videoBitrate: '800k',
      audioCodec: 'aac',
      audioBitrate: '64k',
      resolution: '1280x720',
      fps: 30,
      crf: 28,
      preset: 'medium'
    }
  },
  'thumbnail-preview': {
    name: 'Thumbnail',
    description: 'Small file size for thumbnails and previews',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '300k',
      audioCodec: 'aac',
      audioBitrate: '48k',
      resolution: '640x360',
      fps: 24,
      crf: 32,
      preset: 'ultrafast'
    }
  },
  'ultra-compressed': {
    name: 'Ultra Compressed',
    description: 'Maximum compression for minimal file size',
    settings: {
      videoCodec: 'libx264',
      videoBitrate: '150k',
      audioCodec: 'aac',
      audioBitrate: '32k',
      resolution: '480x270',
      fps: 24,
      crf: 35,
      preset: 'ultrafast'
    }
  }
};
