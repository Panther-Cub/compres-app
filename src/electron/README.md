# Electron Main Process Modules

This directory contains the refactored Electron main process code, organized into smaller, more manageable modules following the Single Responsibility Principle.

## Structure

```
src/electron/
├── index.ts                    # Main exports for all modules
├── ffmpeg-setup.ts             # FFmpeg binary setup and validation
├── auto-updater.ts             # Auto-updater configuration and event handling
├── window-manager.ts           # Window creation and management
├── tray-manager.ts             # System tray functionality
├── ipc-handlers.ts             # All IPC communication handlers
├── menu-manager.ts             # Application menu creation
├── compression/                # Video compression functionality (existing)
│   ├── index.ts
│   ├── types.ts
│   ├── presets.ts
│   ├── utils.ts
│   ├── compressor.ts
│   ├── manager.ts
│   └── strategies/
└── preload/                    # Preload script modules
    ├── api-interface.ts        # TypeScript interface definitions
    └── api-implementation.ts   # API implementation
```

## Modules

### `ffmpeg-setup.ts`
Handles FFmpeg binary setup and validation:
- Path resolution for development and production
- Binary existence and executable permission checks
- FFmpeg path configuration

### `auto-updater.ts`
Manages auto-updater functionality:
- GitHub release configuration
- Update checking and downloading
- Event handling for update status
- IPC handlers for update operations

### `window-manager.ts`
Manages all application windows:
- Main window creation and configuration
- Overlay window creation and positioning
- Settings window creation
- Window state management (show/hide/focus)
- Content Security Policy setup

### `tray-manager.ts`
Handles system tray functionality:
- Tray icon creation and configuration
- Context menu creation
- Default window behavior
- Tray event handling

### `ipc-handlers.ts`
Contains all IPC communication handlers:
- File operations (select, validate, rename)
- Video compression operations
- Thumbnail generation
- Settings management
- Overlay window communication
- Auto-updater operations

### `menu-manager.ts`
Creates and manages the application menu:
- Menu template definition
- Menu item event handlers
- Keyboard shortcuts

### `preload/`
Contains preload script modules:

#### `api-interface.ts`
Defines the TypeScript interface for the Electron API exposed to the renderer process.

#### `api-implementation.ts`
Implements the Electron API with IPC communication.

## Benefits of This Structure

1. **Modularity**: Each module has a single, well-defined responsibility
2. **Maintainability**: Easier to locate and modify specific functionality
3. **Testability**: Individual modules can be tested in isolation
4. **Reusability**: Modules can be reused across different parts of the application
5. **Readability**: Smaller files are easier to understand and navigate
6. **Type Safety**: Clear interfaces and type definitions
7. **Separation of Concerns**: Clear boundaries between different functionalities

## Usage

### Main Process
```typescript
import { 
  setupFFmpeg, 
  setupAutoUpdater, 
  createMainWindow, 
  createTray, 
  setupIpcHandlers,
  createApplicationMenu 
} from './electron';

// Setup FFmpeg
setupFFmpeg();

// Create windows
const mainWindow = createMainWindow();
const tray = createTray();

// Setup auto-updater
setupAutoUpdater(mainWindow, tray);

// Setup IPC handlers
setupIpcHandlers();

// Create menu
const menu = createApplicationMenu();
Menu.setApplicationMenu(menu);
```

### Preload Script
```typescript
import { contextBridge } from 'electron';
import { createElectronAPI } from './electron/preload/api-implementation';

contextBridge.exposeInMainWorld('electronAPI', createElectronAPI());
```

## Migration from Monolithic Files

The original `main.ts` (1532 lines) and `preload.ts` (153 lines) have been broken down into:

- **main.ts**: Now ~100 lines, focused on app lifecycle
- **preload.ts**: Now ~5 lines, focused on API exposure
- **8 focused modules**: Each handling specific functionality
- **Clear interfaces**: TypeScript interfaces for type safety

This refactoring maintains all existing functionality while making the codebase much more maintainable and easier to work with.
