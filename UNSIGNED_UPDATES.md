# Unsigned Application Updates

## Overview

This application is not code-signed, which means it cannot use automatic update installation on macOS. Instead, the update system downloads the new version as a .pkg installer to your Downloads folder and provides clear instructions for installation.

## How Updates Work

### 1. Update Check
- The app automatically checks for updates on startup
- You can also manually check for updates in Settings
- Updates are detected by comparing the current version with the latest GitHub release

### 2. Download Process
- When an update is available, you can download it
- The .pkg installer file is downloaded to your Downloads folder
- Real-time progress is shown during download
- The file is saved with the original filename from GitHub

### 3. Installation Process
- After download, click "Install Update" to get instructions
- The system will open your Downloads folder
- Follow the step-by-step instructions to run the installer

## Installation Instructions

When you click "Quit & Install", you'll see these instructions:

1. **App will quit** - The app will automatically quit to allow installation
2. **Installer opens** - The installer will open automatically from your Downloads folder
3. **Follow the wizard** - The installer will guide you through the installation process
4. **Automatic setup** - The installer automatically handles app replacement and quarantine removal

**Note**: The .pkg installer is specifically designed for unsigned apps and handles all the necessary setup automatically, including removing quarantine attributes. The app must quit before installation to allow the installer to replace the running application.

## Why Manual Installation?

### macOS Security
- Unsigned apps cannot automatically replace themselves
- Gatekeeper prevents automatic installation
- Manual installation gives you control over the process

### User Control
- You can verify the download before installing
- Professional installer experience
- Clear visibility of what's being installed

## Benefits of PKG Installer

### Professional Experience
- Standard macOS installer interface
- Automatic app replacement
- Automatic quarantine attribute removal
- No manual terminal commands required

### Reliability
- Works consistently across macOS versions
- No dependency on code signing
- Handles all edge cases automatically

## Troubleshooting

### If the installer doesn't work:
1. Make sure you have administrator privileges
2. Check that the .pkg file downloaded completely
3. Try downloading the file again from GitHub releases

### If macOS blocks the app after installation:
- The installer should automatically remove quarantine attributes
- If not, you can manually run: `xattr -cr /Applications/Compres.app`

## Manual Download

If the automatic update system doesn't work, you can manually download updates:

1. Go to the [GitHub releases page](https://github.com/Panther-Cub/compres-app/releases)
2. Download the latest `.pkg` file
3. Run the installer manually

## Update Settings

You can configure update behavior in the app settings:

- **Auto-check for updates**: Enable/disable automatic update checks
- **Download location**: Choose where updates are downloaded
- **Update notifications**: Control update notifications
