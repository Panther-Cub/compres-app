/**
 * Application constants for consistent values across the app
 */
export const APP_CONSTANTS = {
  // App information
  APP_NAME: 'Compres',
  APP_DESCRIPTION: 'Video Compression Tool',
  
  // File validation
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024 * 1024, // 10GB
  VALID_VIDEO_EXTENSIONS: ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v'] as string[],
  
  // Window dimensions
  MAIN_WINDOW: {
    WIDTH: 1200,
    HEIGHT: 800,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600
  },
  
  OVERLAY_WINDOW: {
    WIDTH: 400,
    HEIGHT: 300,
    OFFSET_X: 420,
    OFFSET_Y: 320
  },
  
  SETTINGS_WINDOW: {
    WIDTH: 500,
    HEIGHT: 600,
    MIN_WIDTH: 400,
    MIN_HEIGHT: 500
  },
  
  // Tray icon
  TRAY_ICON_SIZE: 16,
  
  // Thumbnail settings
  THUMBNAIL: {
    SIZE: '480x?',
    TIMESTAMP: '50%'
  },
  
  // Default directories
  DEFAULT_OUTPUT_DIR: 'Compressed Videos',
  
  // Settings
  DEFAULT_WINDOW: 'overlay',
  DEFAULT_OPEN_AT_LOGIN: false,
  
  // Update manager
  UPDATE_CHECK_DELAY_MS: 5000,
  UPDATE_CHECK_TIMEOUT_MS: 30000,
  
  // GitHub
  GITHUB_OWNER: 'Panther-Cub',
  GITHUB_REPO: 'compres-app',
  BUY_ME_COFFEE_URL: 'https://buymeacoffee.com/pantherandcub'
} as const;

/**
 * Error messages for consistent error handling
 */
export const ERROR_MESSAGES = {
  FILE: {
    NOT_FOUND: 'File does not exist',
    NOT_READABLE: 'File is not readable',
    TOO_LARGE: 'File is too large',
    EMPTY: 'File is empty',
    INVALID_EXTENSION: 'Invalid file extension',
    INVALID_PATH: 'Invalid file path provided',
    VALIDATION_FAILED: 'File validation failed'
  },
  
  DIRECTORY: {
    NOT_FOUND: 'Directory does not exist',
    NOT_WRITABLE: 'Directory is not writable',
    INVALID_PATH: 'Invalid directory path provided',
    VALIDATION_FAILED: 'Directory validation failed'
  },
  
  FILENAME: {
    INVALID: 'Invalid filename',
    INVALID_CHARACTERS: 'Filename contains invalid characters'
  },
  
  WINDOW: {
    NOT_AVAILABLE: 'Main window not available'
  },
  
  UPDATE: {
    CHECK_FAILED: 'Failed to check for updates',
    TIMEOUT: 'Update check timed out',
    SERVER_NOT_FOUND: 'Update server not found. Please check your internet connection.',
    INSTALLATION_FAILED: 'Update installation failed. Please restart the app and try again.'
  },
  
  SETTINGS: {
    READ_FAILED: 'Error reading settings',
    WRITE_FAILED: 'Error writing settings'
  }
} as const;

/**
 * Development environment constants
 */
export const DEV_CONSTANTS = {
  DEV_SERVER_URL: 'http://localhost:3000',
  DEV_TOOLS_ENABLED: true
} as const;
