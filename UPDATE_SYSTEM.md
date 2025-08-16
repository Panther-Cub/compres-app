# Update System for Unsigned Applications

## Overview

The update system has been designed specifically for unsigned applications that cannot use automatic installation. Instead of trying to install updates directly, the system downloads the zip file to the user's Downloads folder and provides clear instructions for manual installation.

## What Changed

### Before (Signed App Approach)
- Attempted automatic installation using electron-updater
- Failed for unsigned applications due to macOS security restrictions
- Complex error handling for installation failures

### After (Unsigned App Approach)
- Downloads zip file to user's Downloads folder
- Provides step-by-step installation instructions
- Works reliably for unsigned applications
- Clear user guidance throughout the process

## How It Works

### Update Check
- Uses GitHub API to check for latest releases
- Compares current version with latest available version
- Works in both development and production environments
- Provides immediate feedback on update availability

### Download Process
- Downloads the macOS zip file from GitHub releases
- Saves to user's Downloads folder for easy access
- Shows real-time download progress
- Handles network errors gracefully

### Installation Process
- Shows dialog with clear installation instructions
- Opens Downloads folder and zip file automatically
- Guides user through manual app replacement
- No automatic installation attempts

## Features

### Automatic Updates
- ✅ Checks for updates on app startup (5 second delay)
- ✅ Works in development and production
- ✅ GitHub releases integration
- ✅ User-friendly notifications

### Manual Updates
- ✅ Manual check button in settings
- ✅ Progress tracking for downloads
- ✅ Clear installation instructions
- ✅ Downloads to accessible location

### User Experience
- ✅ Simple, clean interface
- ✅ Clear status indicators
- ✅ Progress bars for downloads
- ✅ Informative error messages
- ✅ Step-by-step installation guidance

## Configuration

The update system uses these settings:

```typescript
// GitHub integration
provider: 'github'
owner: 'Panther-Cub'
repo: 'compress-app'

// Download settings
downloadPath: '~/Downloads' // User's Downloads folder
autoDownload: false // User chooses when to download
```

## Installation Instructions

When an update is downloaded, users receive these instructions:

1. **Open Downloads folder** - The system opens the folder containing the downloaded zip file
2. **Extract the zip file** - Right-click the zip file and select "Open With" → "Archive Utility"
3. **Replace the app** - Drag the extracted .app file to your Applications folder
4. **Confirm replacement** - Click "Replace" when prompted to overwrite the old version

**Note**: If you get an "unsupported format" error when double-clicking the zip file, use Archive Utility instead.

**Note**: If macOS blocks the app (unidentified developer):
- Right-click the app and select "Open"
- Click "Open" in the security dialog
- Or go to System Preferences → Security & Privacy → General → "Allow Anyway"

## API Methods

### Available Methods
- `checkForUpdates()` - Check for available updates
- `downloadUpdate()` - Download update to Downloads folder
- `installUpdate()` - Show installation instructions
- `getUpdateStatus()` - Get current update status
- `getUpdateSettings()` - Get update settings
- `saveUpdateSettings()` - Save update settings

### Status Types
- `idle` - No update activity
- `checking` - Checking for updates
- `available` - Update is available
- `not-available` - No updates available
- `downloading` - Downloading update
- `downloaded` - Update downloaded and ready
- `error` - Error occurred

## Error Handling

### Common Issues
1. **Network connectivity** - Retry download option
2. **File permissions** - Clear instructions for manual download
3. **GitHub API limits** - Graceful fallback to manual check

### Debug Mode

The update system logs detailed information to the console. Check the console output for debugging information.

## GitHub Releases

When publishing updates:

1. Create a new release on GitHub
2. Upload the built `.zip` file with macOS in the filename
3. Tag the release with the version number (e.g., `v0.2.0`)
4. The app will automatically detect and download the update

## File Structure

```
dist/
├── Compress-0.2.0-mac.zip          # Main app bundle
└── latest-mac.yml                  # Update metadata (optional)
```

The system looks for zip files containing "mac" in the filename for macOS updates.

## Benefits for Unsigned Apps

### Reliability
- No dependency on code signing
- Works consistently across macOS versions
- No Gatekeeper issues

### User Control
- Users choose when to install
- Clear visibility of what's being installed
- Familiar installation process

### Security
- No automatic code execution
- Users can verify the download
- Standard macOS app installation flow
