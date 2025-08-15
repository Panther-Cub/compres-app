# Always-On-Top Overlay Feature

## Overview

The FFmpeg Mac app now includes an always-on-top overlay window that provides quick access to drag-and-drop functionality for video compression. This feature allows users to drop video files onto the overlay from anywhere on their screen, even when the main app window is minimized or behind other applications.

## Features

### Always-On-Top Window
- **Persistent Visibility**: The overlay window stays on top of all other windows
- **Frameless Design**: Clean, minimal interface that doesn't interfere with other applications
- **Draggable**: Users can move the overlay to any position on their screen
- **Sleek Glass Design**: Premium glass morphism with dynamic borders and glow effects
- **Animated Background**: Subtle floating particles for visual interest

### Drag and Drop Functionality
- **File Validation**: Automatically validates video files (supports mp4, mov, avi, mkv, wmv, flv, webm, m4v)
- **Size Limits**: Handles files up to 10GB
- **Multiple Files**: Supports dropping multiple video files at once
- **File Selection**: Includes a "Select Videos" button for traditional file picker access

### Smart Behavior
- **Primary Interface**: Overlay is the main interface until files are added
- **Mutual Exclusion**: Only one window is visible at a time - overlay OR main window, never both
- **Main Window Integration**: Automatically shows main window and hides overlay when files are dropped
- **Return to Overlay**: Close main window, use header button, or click "Back" button to return to overlay
- **Reset Functionality**: Back button clears all files and returns to overlay interface
- **Robust Window Management**: Multiple safeguards ensure proper window visibility in all scenarios
- **Error Handling**: Gracefully handles invalid files and provides feedback

## Usage

### App Launch Behavior
1. **Launch the FFmpeg Mac app**
2. **Only the overlay window appears** - the main window stays hidden
3. **The overlay is your primary interface** until you add files

### Using the Overlay
1. **Drag and Drop**: Simply drag video files from Finder or any other application onto the overlay
2. **File Selection**: Click the "Select Videos" button to use the traditional file picker
3. **Repositioning**: Click and drag the overlay to move it to a different location on your screen

### After File Drop
- Valid video files are automatically added to the main app
- **The main app window appears** and comes to the front
- **The overlay window disappears** completely
- You can now use the full app interface for compression

### Returning to Overlay
- **Close the main window** to return to the overlay
- **Use the monitor icon (📺)** in the main app's header to show the overlay again and hide the main window
- **Click the "Back" button** in the main app to reset and return to the overlay
- The overlay will reappear in the same position where you left it

## Technical Implementation

### Architecture
- **Separate Window**: The overlay runs as a separate Electron BrowserWindow
- **Always-On-Top**: Uses Electron's `alwaysOnTop: true` property
- **Frameless**: Configured with `frame: false` for a clean appearance
- **Transparent**: Uses `transparent: true` for subtle visual integration

### Communication
- **IPC Communication**: Uses Electron's IPC (Inter-Process Communication) between overlay and main window
- **File Validation**: Validates files in the main process before adding to the app
- **Event Handling**: Proper event cleanup and memory management

### Styling
- **Sleek Glass Morphism**: Advanced backdrop blur with gradient overlays for premium appearance
- **Dynamic Theme Support**: Seamlessly adapts to light/dark themes with proper contrast
- **Floating Particles**: Subtle animated background particles for visual interest
- **Interactive Animations**: Smooth hover, drag, and state transitions with Framer Motion
- **Glow Effects**: Dynamic glow and border effects that respond to user interaction
- **Modern Typography**: Clean, minimalist text with proper spacing and hierarchy

## Configuration

### Window Properties
```javascript
{
  width: 400,
  height: 300,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  skipTaskbar: true,
  resizable: false,
  minimizable: false,
  maximizable: false,
  closable: false,
  focusable: false
}
```

### Supported File Types
- MP4 (.mp4)
- MOV (.mov)
- AVI (.avi)
- MKV (.mkv)
- WMV (.wmv)
- FLV (.flv)
- WebM (.webm)
- M4V (.m4v)

## Benefits

1. **Improved Workflow**: No need to bring the main app to front to add files
2. **Multi-Tasking**: Continue working in other applications while having quick access to video compression
3. **Visual Feedback**: Clear indication when files are being dropped
4. **Non-Intrusive**: Minimal visual footprint that doesn't interfere with other work
5. **Accessibility**: Provides an alternative to traditional file selection methods

## Future Enhancements

Potential improvements for future versions:
- Customizable overlay position and size
- Keyboard shortcuts for showing/hiding overlay
- Drag and drop from web browsers
- Batch processing status in overlay
- Custom themes for overlay appearance
