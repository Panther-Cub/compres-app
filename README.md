# FFmpeg Video Compressor

A simple Mac app built with React.js and Electron that compresses videos using FFmpeg for web usage.

## Features

- **Drag & Drop Interface**: Simply drag and drop video files into the app
- **Optimized for Web**: Uses settings optimized for web playback with fast loading
- **Progress Tracking**: Real-time progress updates during compression
- **Multiple Formats**: Supports MP4, MOV, AVI, MKV, WMV, FLV, WebM
- **Modern UI**: Clean, modern interface with Mac-style design

## Compression Settings

The app uses the following FFmpeg settings for optimal web performance:

- Scale video to 1280px width (maintains aspect ratio)
- Remove audio track for faster loading
- H.264 codec with CRF 28 (good quality/size balance)
- Optimized for web streaming (`faststart` flag)
- Compatible pixel format (yuv420p)

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

1. Launch the app
2. Either drag and drop a video file into the drop zone or click "Select Video File"
3. Review the file information and compression settings
4. Click "Compress Video" to start the process
5. Wait for compression to complete
6. The compressed video will be saved to your Desktop with "_compressed" suffix

## Requirements

- macOS
- Node.js 16 or higher
- FFmpeg (included via ffmpeg-static)

## Built With

- **React.js** - Frontend framework
- **Electron** - Desktop app wrapper
- **FFmpeg** - Video processing
- **fluent-ffmpeg** - FFmpeg wrapper for Node.js

## Scripts

- `npm start` - Start React development server
- `npm run electron-dev` - Run Electron app in development mode
- `npm run build` - Build React app for production
- `npm run dist` - Build and package the app for distribution

## Output

Compressed videos are saved to your Desktop with the following naming convention:
`original_filename_compressed.mp4`

The app is optimized to create web-ready videos that:
- Load quickly
- Have good quality
- Are properly formatted for autoplay
- Work across different browsers and devices 