# Compress App v0.2.0 - Major Update System Overhaul

## 🎉 What's New

This release introduces a complete overhaul of the update system, making Compress App more professional and user-friendly than ever before.

## ✨ Major Features

### 🔄 **Professional Update System**
- **Centralized Update Manager** - Single source of truth for all update operations
- **User-Configurable Updates** - Full control over when and how updates are handled
- **Multiple Update Channels** - Choose between Stable, Beta, and Alpha releases
- **Smart Scheduling** - Configurable auto-check intervals (6h, 12h, 24h, 48h, weekly)
- **Real-time Progress** - Live download progress and status updates

### 🎛️ **Update Configuration Options**
- ✅ **Auto-check enabled/disabled** - Control automatic update checks
- ✅ **Auto-download updates** - Choose whether to automatically download updates
- ✅ **Auto-install updates** - Control automatic installation behavior
- ✅ **Manual check permissions** - Allow or disable manual update checks
- ✅ **Update notifications** - Show or hide update notifications
- ✅ **Update channel selection** - Stable, Beta, or Alpha releases

### 🛡️ **Unsigned App Support**
- **No Code Signing Required** - Works perfectly without Apple Developer certificates
- **Graceful Error Handling** - Handles expected errors for unsigned apps
- **Fallback Mechanisms** - Manual download via GitHub releases if needed
- **Reliable Installation** - Works consistently for unsigned applications

## 🚀 **New Update Settings Interface**

Access the new update settings through:
- **Settings Window** → **Update Settings** tab
- **Menu Bar** → **Compress** → **Check for Updates...**

### **Features:**
- **Real-time Status Display** - See current update status and last check time
- **Progress Tracking** - Visual download progress with percentage
- **Channel Selection** - Easy switching between Stable, Beta, and Alpha
- **Configuration Persistence** - Settings saved between app launches

## 🔧 **Technical Improvements**

### **Architecture**
- **DRY Principles** - No code duplication, single responsibility
- **Type Safety** - Full TypeScript coverage for all update operations
- **Error Handling** - Comprehensive error management and user feedback
- **Testing Ready** - Clean, testable architecture

### **Developer Experience**
- **Advanced Version Management** - Comprehensive CLI tools for version control
- **GitHub Integration** - Automatic release creation and management
- **Debug Support** - Comprehensive logging and error tracking
- **Clean API** - Consistent interface across all components

## 📦 **Version Management Tools**

New npm scripts for easy version management:

```bash
# Version management
npm run bump              # Bump patch version
npm run bump:minor        # Bump minor version  
npm run bump:major        # Bump major version
npm run bump:beta         # Create beta release
npm run bump:alpha        # Create alpha release
npm run bump:prerelease   # Bump prerelease number
npm run release           # Create GitHub release
npm run version:current   # Show current version
npm run version:latest    # Show latest GitHub release
npm run version:help      # Show help
```

## 🎯 **Update Channels**

### **Stable (Default)**
- Production-ready releases
- Recommended for most users
- Thoroughly tested features

### **Beta**
- Pre-release versions with new features
- May contain bugs
- For users who want early access

### **Alpha**
- Early development versions
- May be unstable
- For developers and early adopters

## 🔄 **Migration from Old System**

The old auto-updater system has been completely replaced with:
- ✅ **Centralized Management** - Single UpdateManager instead of scattered functions
- ✅ **Configurable Behavior** - User control over all update aspects
- ✅ **Better Error Handling** - Graceful handling of unsigned app scenarios
- ✅ **Cleaner API** - Consistent interface for all update operations
- ✅ **Improved UX** - Real-time status updates and progress tracking

## 🐛 **Bug Fixes**
- Fixed inconsistent update checking behavior
- Resolved multiple update check locations
- Improved error handling for network issues
- Enhanced user feedback for update operations

## 🔮 **Future Enhancements**
- Delta updates for faster downloads
- Update rollback functionality
- Update history tracking
- Scheduled update installations
- Bandwidth management options

## 📋 **System Requirements**
- macOS 10.15 or later
- No code signing required
- Internet connection for updates

## 🎉 **Getting Started**

1. **Download** the latest version
2. **Install** the application
3. **Open Settings** → **Update Settings** to configure your preferences
4. **Choose your update channel** (Stable recommended for most users)
5. **Enjoy** automatic updates tailored to your preferences!

---

**Thank you for using Compress App!** 🎬

This release represents a major step forward in making Compress App more professional and user-friendly. The new update system provides the reliability and control you expect from a production application.
