# Compression Module

This module contains all video compression functionality, organized in a TypeScript structure following DRY principles.

## Structure

```
src/electron/compression/
├── index.ts          # Main exports
├── types.ts          # TypeScript type definitions
├── presets.ts        # Video compression presets
├── utils.ts          # Utility functions (DRY)
├── compressor.ts     # Simplified interface
├── manager.ts        # Compression manager (batch operations)
├── strategies/       # Compression strategies
│   ├── index.ts      # Strategy exports
│   ├── basic.ts      # Basic compression strategy
│   ├── single-pass.ts # Single-pass compression strategy
│   └── two-pass.ts   # Two-pass compression strategy
└── README.md         # This file
```

## Files

### `types.ts`
Contains all TypeScript interfaces and types for the compression module:
- `CompressionSettings` - Basic compression settings
- `VideoPreset` - Preset configuration
- `CompressionTask` - Task information
- `CompressionResult` - Result data
- `AdvancedCompressionSettings` - Advanced options
- `FFmpegCommand` - FFmpeg command type

### `presets.ts`
Contains predefined video compression presets for different use cases:
- Web Hero, Standard, Mobile
- Social media (Instagram, TikTok)
- Modern formats (WebM, HEVC)
- Thumbnail and ultra-compressed options

### `utils.ts`
Utility functions following DRY principles:
- `sendCompressionEvent()` - Send events to main window
- `getOutputExtension()` - Determine file extension
- `buildOutputPath()` - Create output file paths
- `buildResolutionFilter()` - Create resolution scaling filters
- `buildBaseOutputOptions()` - Build FFmpeg options
- `addOptimizationOptions()` - Add optimization flags
- `configureFFmpegCommand()` - Configure FFmpeg commands
- `configureAudioSettings()` - Handle audio settings

### `compressor.ts`
Simplified interface that delegates to the manager:
- `compressVideos()` - Basic batch compression
- `compressVideosAdvanced()` - Advanced batch compression
- `cancelCompression()` - Cancel active compressions

### `manager.ts`
Compression manager for batch operations:
- `CompressionManager` class - Handles batch compression operations
- `compressVideos()` - Basic compression for multiple files
- `compressVideosAdvanced()` - Advanced compression for multiple files
- `cancelCompression()` - Cancel all active compressions

### `strategies/`
Compression strategy modules:
- `basic.ts` - Basic compression strategy
- `single-pass.ts` - Single-pass encoding with advanced settings
- `two-pass.ts` - Two-pass encoding strategy

### `index.ts`
Exports all public functionality from the module.

## Usage

```typescript
import { 
  compressVideos, 
  compressVideosAdvanced, 
  cancelCompression,
  videoPresets 
} from './electron/compression';

// Basic compression
const results = await compressVideos(files, presets, keepAudio, outputDir, mainWindow);

// Advanced compression
const results = await compressVideosAdvanced(
  files, 
  presets, 
  keepAudio, 
  outputDir, 
  advancedSettings, 
  mainWindow
);

// Cancel compression
cancelCompression();
```

## Benefits of This Structure

1. **Type Safety**: Full TypeScript support with proper interfaces
2. **DRY Principles**: Common functionality extracted to utility functions
3. **Modularity**: Clear separation of concerns with strategy pattern
4. **Maintainability**: Easy to update and extend individual strategies
5. **Reusability**: Utility functions can be used across different compression methods
6. **Single Responsibility**: Each module has a focused purpose
7. **Strategy Pattern**: Different compression strategies are isolated and interchangeable
8. **Manager Pattern**: Centralized management of batch operations
