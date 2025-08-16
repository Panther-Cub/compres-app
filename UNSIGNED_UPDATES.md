# Unsigned Application Updates

## Overview

This application is not code-signed, which means it cannot use automatic update installation on macOS. Instead, the update system downloads the new version to your Downloads folder and provides clear instructions for manual installation.

## How Updates Work

### 1. Update Check
- The app automatically checks for updates on startup
- You can also manually check for updates in Settings
- Updates are detected by comparing the current version with the latest GitHub release

### 2. Download Process
- When an update is available, you can download it
- The zip file is downloaded to your Downloads folder
- Real-time progress is shown during download
- The file is saved with the original filename from GitHub

### 3. Installation Process
- After download, click "Install Update" to get instructions
- The system will open your Downloads folder
- Follow the step-by-step instructions to replace the app

## Installation Instructions

When you click "Install Update", you'll see these instructions:

1. **Open Downloads folder** - The folder containing your downloaded zip file will open
2. **Extract the zip file** - Right-click the zip file and select "Open With" → "Archive Utility"
3. **Replace the app** - Drag the extracted .app file to your Applications folder
4. **Confirm replacement** - Click "Replace" when prompted to overwrite the old version

**Note**: If you get an "unsupported format" error when double-clicking the zip file, use Archive Utility instead.

**Note**: If macOS blocks the app (unidentified developer):
- Right-click the app and select "Open"
- Click "Open" in the security dialog
- Or go to System Preferences → Security & Privacy → General → "Allow Anyway"

## Why Manual Installation?

### macOS Security
- Unsigned apps cannot automatically replace themselves
- Gatekeeper prevents automatic installation
- Manual installation gives you control over the process

### User Control
- You can verify the download before installing
- You choose when to install the update
- You can keep the old version if needed

### Reliability
- No dependency on code signing certificates
- Works consistently across macOS versions
- No complex permission issues

## Troubleshooting

### Common Issues

1. **Download fails**
   - Check your internet connection
   - Try downloading again
   - Check GitHub for the release manually

2. **Can't find the downloaded file**
   - Check your Downloads folder
   - Look for a zip file with the app name
   - The file should be named something like `Compress-0.2.0-mac.zip`

3. **Installation fails**
   - Make sure you're dragging to the Applications folder
   - Check that you have write permissions
   - Try quitting the app before replacing it

4. **App won't open after update**
   - Check Gatekeeper settings in System Preferences
   - Right-click the app and select "Open"
   - You may need to allow the app in Security & Privacy

### Debug Mode

If you're having issues, you can check the console logs for detailed information about the update process.

## GitHub Releases

Updates are distributed through GitHub releases:

1. **Release Process**
   - New versions are published as GitHub releases
   - Each release includes a macOS zip file
   - The app automatically detects new releases

2. **Manual Download**
   - If the in-app update fails, you can download manually
   - Visit the GitHub releases page
   - Download the latest macOS zip file
   - Follow the same installation instructions

## File Locations

### Downloads
- Update files are saved to: `~/Downloads/`
- Files are named: `Compress-{version}-mac.zip`

### Application
- Current app location: `/Applications/Compress.app`
- New app should replace the existing one

## Security Considerations

### Download Verification
- Files are downloaded directly from GitHub
- GitHub provides HTTPS encryption
- You can verify the download on GitHub

### Installation Safety
- Manual installation prevents automatic code execution
- You can inspect the app before installing
- Standard macOS app installation process

## Future Improvements

The update system may be enhanced with:

1. **Checksum verification** - Verify download integrity
2. **Delta updates** - Download only changed files
3. **Background downloads** - Download updates automatically
4. **Rollback support** - Revert to previous version

## Support

If you encounter issues with updates:

1. Check this documentation first
2. Try the troubleshooting steps above
3. Visit the GitHub repository for manual downloads
4. Report issues on the GitHub repository

## Technical Details

### Update Detection
- Uses GitHub API to check for latest releases
- Compares semantic versions
- Ignores pre-release versions by default

### Download Process
- Downloads using Node.js https module
- Shows real-time progress
- Handles network errors gracefully
- Saves to user's Downloads folder

### Installation Flow
- Opens Downloads folder automatically
- Provides clear step-by-step instructions
- No automatic file manipulation
- User maintains full control
