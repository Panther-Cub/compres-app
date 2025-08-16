import { app } from 'electron';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';

// Use ffmpeg-static for cross-platform compatibility
let ffmpegPath: string;
let ffprobePath: string;

export function setupFFmpeg(): void {
  // Handle path resolution for both development and production
  if (app.isPackaged) {
    // In production, binaries are unpacked from asar
    ffmpegPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', 'ffmpeg');
    
    // Detect architecture dynamically
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    ffprobePath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffprobe-static', 'bin', 'darwin', arch, 'ffprobe');
  } else {
    // In development, use the regular require paths
    ffmpegPath = require('ffmpeg-static');
    ffprobePath = require('ffprobe-static').path;
  }

  // Verify paths exist and are executable
  if (!fs.existsSync(ffmpegPath)) {
    console.error('FFmpeg binary not found at:', ffmpegPath);
    console.error('Current working directory:', process.cwd());
    console.error('App is packaged:', app.isPackaged);
    console.error('Resources path:', process.resourcesPath);
    throw new Error(`FFmpeg binary not found at: ${ffmpegPath}`);
  }

  if (!fs.existsSync(ffprobePath)) {
    console.error('FFprobe binary not found at:', ffprobePath);
    console.error('Current working directory:', process.cwd());
    console.error('App is packaged:', app.isPackaged);
    console.error('Resources path:', process.resourcesPath);
    throw new Error(`FFprobe binary not found at: ${ffprobePath}`);
  }

  // Check if binaries are executable
  try {
    fs.accessSync(ffmpegPath, fs.constants.X_OK);
    fs.accessSync(ffprobePath, fs.constants.X_OK);
  } catch (error) {
    console.error('FFmpeg binaries are not executable:', error);
    throw new Error('FFmpeg binaries are not executable');
  }

  console.log('FFmpeg path:', ffmpegPath);
  console.log('FFprobe path:', ffprobePath);
  console.log('FFmpeg binary exists and is executable');

  // Set ffmpeg paths
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);
}
