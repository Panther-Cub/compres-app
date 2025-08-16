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
  },
  'mac-4k-ready': {
    name: 'Mac 4K Ready',
    description: '4K optimized with hardware acceleration for high-resolution content',
    settings: {
      videoCodec: 'hevc_videotoolbox',
      videoBitrate: '4000k',
      audioCodec: 'aac',
      audioBitrate: '128k',
      resolution: '3840x2160',
      fps: 30,
      crf: 25,
      preset: 'medium'
    }
  },
  'mac-mobile-optimized': {
    name: 'Mac Mobile Optimized',
    description: 'Optimized for mobile devices with hardware acceleration',
    settings: {
      videoCodec: 'h264_videotoolbox',
      videoBitrate: '800k',
      audioCodec: 'aac',
      audioBitrate: '64k',
      resolution: '1280x720',
      fps: 30,
      crf: 28,
      preset: 'fast'
    }
  }
};
