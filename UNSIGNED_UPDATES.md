# Unsigned Signature Updates

This document explains how to configure and use unsigned signature updates for the Compress Electron app.

## Overview

By default, Electron apps require code signing for automatic updates. However, for development or internal distribution, you can configure the app to accept unsigned updates.

## Configuration

### 1. Build Configuration

The app is configured with the following settings to allow unsigned updates:

```json
{
  "mac": {
    "identity": null,
    "hardenedRuntime": false,
    "gatekeeperAssess": false,
    "notarize": false,
    "entitlements": null,
    "entitlementsInherit": null
  }
}
```

### 2. Update Manager Configuration

The update manager is configured to:
- Disable signature verification for development builds
- Handle signature-related errors gracefully
- Allow updates in development mode

## Usage

### Development Builds

For development builds with unsigned updates:

```bash
# Build without publishing
npm run dist:dev

# Build and publish to GitHub
npm run publish:dev
```

### Production Builds

For production builds with unsigned updates:

```bash
# Build without publishing
npm run dist:unsigned

# Build and publish to GitHub
npm run publish:unsigned
```

### Environment Variables

You can also set the environment variable manually:

```bash
export ALLOW_UNSIGNED_UPDATES=true
npm run dist
```

## Security Considerations

⚠️ **Warning**: Unsigned updates bypass security checks and should only be used for:
- Development and testing
- Internal distribution
- When you control the update source

For public distribution, always use proper code signing and notarization.

## Troubleshooting

### Common Issues

1. **"Signature verification failed" errors**
   - Ensure `ALLOW_UNSIGNED_UPDATES=true` is set
   - Check that the update manager is properly configured

2. **Updates not downloading**
   - Verify GitHub repository configuration
   - Check network connectivity
   - Ensure release files are properly uploaded

3. **Installation failures**
   - Check macOS Gatekeeper settings
   - Verify app permissions
   - Try manual installation from GitHub releases

### Debug Mode

Enable debug logging by setting:

```bash
export DEBUG=electron-updater
npm run dist:dev
```

## GitHub Releases

When publishing unsigned updates:

1. Create a new release on GitHub
2. Upload the built `.zip` file
3. Tag the release with the version number (e.g., `v0.2.0`)
4. The app will automatically detect and download the update

## File Structure

```
dist/
├── Compress-0.2.0-mac.zip          # Main app bundle
├── latest-mac.yml                  # Update metadata
└── Compress-0.2.0-mac.zip.blockmap # Delta update data
```

The `latest-mac.yml` file contains metadata that the auto-updater uses to check for updates.
