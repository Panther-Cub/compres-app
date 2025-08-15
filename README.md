# Video Compressor

A minimalistic Mac app built with React.js and Electron that compresses videos using FFmpeg for optimal web usage.

## Features

- **Multiple File Support**: Add and process multiple videos simultaneously
- **Multiple Preset Export**: Export different video presets at the same time
- **Drag & Drop Interface**: Simply drag and drop video files into the app
- **Web Optimized**: Multiple presets optimized for different web use cases
- **Real-time Progress**: Track compression progress for each file and preset
- **Minimalistic UI**: Clean, modern interface designed for simplicity
- **Multiple Formats**: Supports MP4, MOV, AVI, MKV, WMV, FLV, WebM

## Video Presets

The app includes multiple presets optimized for different web scenarios:

### Web Optimization
- **Web Hero** (1920x1080): High quality for hero sections and main content
- **Web Standard** (1280x720): Balanced quality and file size for web pages
- **Web Mobile** (854x480): Optimized for mobile devices and slower connections
- **WebM Modern** (1280x720): Modern WebM format with VP9 for better compression
- **HEVC Efficient** (1280x720): H.265/HEVC for maximum compression efficiency

### Social Media
- **Instagram** (1080x1080): Optimized for Instagram feed and stories
- **TikTok** (1080x1920): Optimized for TikTok and vertical video platforms

### Utility
- **Thumbnail** (640x360): Small file size for thumbnails and previews
- **Ultra Compressed** (480x270): Maximum compression for minimal file size

### Smart Recommendations
The app analyzes your video characteristics and recommends the best presets based on:
- Video resolution and aspect ratio
- File size and duration
- Intended use case (web, social media, mobile)

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run electron-dev
   ```

3. **Build for production**:
   ```bash
   npm run dist
   ```

## Usage

1. **Launch the app**
2. **Add videos**: Drag and drop multiple video files or click "Select Videos"
3. **Configure settings**: Click the settings button to choose presets and options
4. **Select presets**: Choose which video formats you want to export
5. **Start compression**: Click "Compress Videos" to process all files
6. **Monitor progress**: Watch real-time progress for each file and preset
7. **Get results**: All compressed videos are saved to your chosen output folder

## Settings

- **Video Presets**: Select multiple presets to export simultaneously
- **Smart Recommendations**: Get AI-powered preset suggestions based on your video
- **Advanced Settings**: Fine-tune quality, bitrate, resolution, and optimization options
- **Custom Presets**: Save your favorite settings as reusable presets
- **Audio**: Choose whether to keep or remove audio tracks
- **Output Location**: Select custom output directory (defaults to Desktop)

## Requirements

- macOS
- Node.js 16 or higher
- FFmpeg (included via ffmpeg-static)

## Built With

- **React.js** - Frontend framework
- **Electron** - Desktop app wrapper
- **FFmpeg** - Video processing
- **fluent-ffmpeg** - FFmpeg wrapper for Node.js
- **Tailwind CSS** - Styling

## Scripts

- `npm start` - Start React development server
- `npm run electron-dev` - Run Electron app in development mode
- `npm run build` - Build React app for production
- `npm run dist` - Build and package the app for distribution

## Output

Compressed videos are saved with descriptive suffixes based on the preset used:
- `filename_web-hero.mp4` - Web hero format
- `filename_web-standard.mp4` - Web standard format
- `filename_web-mobile.mp4` - Web mobile format
- `filename_social-instagram.mp4` - Instagram format
- `filename_social-tiktok.mp4` - TikTok format
- `filename_webm-modern.webm` - WebM modern format
- `filename_hevc-efficient.mp4` - HEVC efficient format
- `filename_thumbnail-preview.mp4` - Thumbnail format
- `filename_ultra-compressed.mp4` - Ultra compressed format

Custom presets are saved as `filename_custom-[timestamp].mp4`.

If audio is removed, files include `_muted` suffix.

## Design Philosophy

This app is designed with simplicity in mind:
- **Minimalistic UI**: Clean, uncluttered interface
- **Batch Processing**: Handle multiple files efficiently
- **Web Focused**: Optimized presets for web video delivery
- **Fast Workflow**: Streamlined process from upload to output 