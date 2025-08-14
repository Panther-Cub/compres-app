#!/bin/bash

echo "🔧 FFmpeg Video Compressor - Security Fix"
echo "========================================="
echo ""
echo "This script will remove the macOS quarantine attribute from the app."
echo "This is safe and allows the app to run without security warnings."
echo ""

# Find the app in the current directory
APP_PATH=$(find . -name "FFmpeg Video Compressor.app" -type d | head -1)

if [ -z "$APP_PATH" ]; then
    echo "❌ Could not find 'FFmpeg Video Compressor.app' in this folder."
    echo "Please make sure you've extracted the ZIP file and run this script from the same folder."
    exit 1
fi

echo "📱 Found app at: $APP_PATH"
echo ""
echo "🔓 Removing quarantine attributes..."

# Remove quarantine attributes
xattr -cr "$APP_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Success! The app should now open without warnings."
    echo ""
    echo "You can now double-click the app to launch it."
else
    echo "❌ Error removing quarantine attributes."
    echo "You may need to run this script with sudo:"
    echo "sudo ./fix-app.sh"
fi

echo ""
echo "Press any key to close..."
read -n 1 