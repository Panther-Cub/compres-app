# PKG Distribution for Unsigned Apps

This document explains how to use the new .pkg distribution system for distributing unsigned Electron apps on macOS.

## Overview

The .pkg installer format allows you to distribute unsigned Electron apps while providing users with a proper installation experience. The installer automatically handles the removal of quarantine attributes that would otherwise prevent unsigned apps from running.

## How It Works

1. **Preinstall Script**: Checks system requirements and available disk space
2. **App Installation**: Installs the app to `/Applications`
3. **Postinstall Script**: Automatically removes quarantine attributes using `xattr -cr`

## Building a PKG

To build a .pkg file for distribution:

```bash
npm run publish:unsigned
```

This command will:
- Build the React app
- Compile TypeScript
- Package the Electron app
- Create a .pkg installer
- Upload to GitHub releases

## Installation Process

When users download and run the .pkg file:

1. **System Check**: The installer verifies macOS version and available disk space
2. **Installation**: The app is installed to `/Applications/Compress.app`
3. **Quarantine Removal**: The postinstall script automatically runs `xattr -cr /Applications/Compress.app`
4. **Ready to Use**: The app can now be launched without code signing issues

## Manual Quarantine Removal

If for any reason the automatic removal fails, users can manually remove quarantine attributes:

```bash
xattr -cr /Applications/Compress.app
```

## Configuration Files

- `electron-builder-pkg.yml`: Configuration for pkg builds
- `scripts/preinstall`: Pre-installation checks
- `scripts/postinstall`: Post-installation quarantine removal

## Benefits

- **No Code Signing Required**: Distribute apps without Apple Developer account
- **Professional Installation**: Users get a proper installer experience
- **Automatic Setup**: No manual terminal commands required
- **GitHub Integration**: Automatic uploads to GitHub releases

## Troubleshooting

If the pkg build fails:
1. Ensure all dependencies are installed: `npm install --legacy-peer-deps`
2. Check that scripts have execute permissions: `chmod +x scripts/*`
3. Verify the forge configuration is correct

## File Structure

```
scripts/
├── preinstall     # Pre-installation checks
└── postinstall    # Quarantine attribute removal

electron-builder-pkg.yml  # PKG build configuration
forge.config.js          # Electron Forge configuration
```
