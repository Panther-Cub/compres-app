import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui';
import { macAnimations } from '../lib/animations';
import { themeManager } from '../lib/theme';
import type { UpdateStatusData } from '../types/shared';
import type { Theme } from '../types';

const UpdateWindow: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateStatusData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Force theme application when UpdateWindow loads
  useEffect(() => {
    // Force apply theme immediately to ensure it's correct
    themeManager.forceApplyTheme();
    
    // Expose themeManager globally for IPC access
    (window as any).themeManager = themeManager;
    
    // Also get the current theme from the main window if available
    const getCurrentTheme = async () => {
      try {
        if (window.electronAPI && window.electronAPI.getCurrentTheme) {
          const currentTheme = await window.electronAPI.getCurrentTheme();
          if (currentTheme && ['light', 'dark', 'system'].includes(currentTheme)) {
            themeManager.setTheme(currentTheme as Theme);
          }
        }
      } catch (error) {
        console.error('Failed to get current theme:', error);
      }
    };
    
    getCurrentTheme();
    
    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe(() => {
      // Force re-application of theme when it changes
      setTimeout(() => {
        themeManager.forceApplyTheme();
      }, 50);
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Listen for update status changes from the main process
    const handleUpdateStatus = (data: UpdateStatusData) => {
      console.log('UpdateWindow: Update status received:', data);
      console.log('UpdateWindow: Status:', data.status, 'Progress:', data.progress);
      setUpdateInfo(data);
    };

    if (window.electronAPI) {
      window.electronAPI.onUpdateStatus(handleUpdateStatus);
      
      // Get the current update status immediately
      window.electronAPI.getUpdateStatus().then((status: any) => {
        console.log('UpdateWindow initial status:', status);
        if (status) {
          setUpdateInfo(status);
        }
      }).catch((error: any) => {
        console.error('Error getting update status:', error);
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('update-status');
      }
    };
  }, []);

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeUpdateWindow();
    }
  };

  const handleDownload = async () => {
    if (!window.electronAPI) return;
    
    console.log('UpdateWindow: Starting download...');
    setIsDownloading(true);
    
    try {
      const result = await window.electronAPI.downloadUpdate();
      console.log('UpdateWindow: Download result:', result);
    } catch (error) {
      console.error('UpdateWindow: Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInstall = async () => {
    if (!window.electronAPI) return;
    
    setIsInstalling(true);
    
    // Don't await the installUpdate since it will quit the app
    // The progress bar will show until the app quits
    window.electronAPI.installUpdate().catch((error: any) => {
      console.error('UpdateWindow: Install error:', error);
      setIsInstalling(false);
    });
  };

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.checkForUpdates();
  };

  const getStatusIcon = () => {
    if (!updateInfo) return <Info className="w-4 h-4 text-muted-foreground" />;
    
    switch (updateInfo.status) {
      case 'available':
        return <Download className="w-4 h-4 text-blue-500" />;
      case 'downloading':
        return <Download className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'downloaded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <Download className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'not-available':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    if (!updateInfo) return 'Checking for updates...';
    
    switch (updateInfo.status) {
      case 'available':
        return `Version ${updateInfo.version} is available`;
      case 'downloading':
        return `Downloading update... ${updateInfo.progress || 0}%`;
      case 'downloaded':
        return `Update downloaded and ready to install`;
      case 'error':
        return `Update error: ${updateInfo.error}`;
      case 'checking':
        return 'Checking for updates...';
      case 'not-available':
        return 'You have the latest version';
      default:
        return 'Checking for updates...';
    }
  };

  const getActionButton = () => {
    if (!updateInfo) return null;
    
    switch (updateInfo.status) {
      case 'available':
        return (
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            size="lg"
            className="flex items-center gap-2 w-full"
          >
            <Download className="w-5 h-5" />
            {isDownloading ? 'Downloading...' : 'Download Update'}
          </Button>
        );
      case 'downloaded':
        return (
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            size="lg"
            className="flex items-center gap-2 w-full"
          >
            <CheckCircle className="w-5 h-5" />
            {isInstalling ? 'Installing...' : 'Install Update'}
          </Button>
        );
      case 'error':
        return (
          <Button
            onClick={handleCheckForUpdates}
            size="lg"
            variant="outline"
            className="flex items-center gap-2 w-full"
          >
            <ExternalLink className="w-5 h-5" />
            Check Again
          </Button>
        );
      case 'not-available':
        return (
          <Button
            onClick={handleClose}
            size="lg"
            variant="outline"
            className="flex items-center gap-2 w-full"
          >
            <CheckCircle className="w-5 h-5" />
            Close
          </Button>
        );
      default:
        return null;
    }
  };

    return (
    <motion.div 
      className="h-full w-full native-vibrancy text-foreground flex flex-col overflow-hidden"
      variants={macAnimations.fadeIn}
      initial="initial"
      animate="animate"
    >
      {/* Draggable Title Bar */}
      <div className="draggable-region sticky top-0 z-50 h-10 border-b border-border flex items-center justify-between px-4 select-none flex-shrink-0">
        <div className="flex items-center gap-3 pl-20">
          <Download className="w-3 h-3 text-foreground/70" />
          <span className="text-[0.625rem] font-normal text-foreground/70">
            {updateInfo?.status === 'checking' ? 'Checking for Updates' :
             updateInfo?.status === 'not-available' ? 'No Updates Available' :
             updateInfo?.status === 'error' ? 'Update Error' :
             'Update Available'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <motion.div 
            className="space-y-6"
            variants={macAnimations.slideUp}
            initial="initial"
            animate="animate"
          >
            {/* Update Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  {getStatusIcon()}
                  {updateInfo?.status === 'checking' ? 'Checking for Updates' :
                   updateInfo?.status === 'not-available' ? 'No Updates Available' :
                   updateInfo?.status === 'error' ? 'Update Error' :
                   'Update Available'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {updateInfo?.currentVersion && `Current version: ${updateInfo.currentVersion}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <h2 className="text-lg font-medium text-foreground">
                    {getStatusMessage()}
                  </h2>
                  
                  {updateInfo?.version && updateInfo.status === 'available' && (
                    <p className="text-sm text-muted-foreground">
                      New version: {updateInfo.version}
                    </p>
                  )}

                  {/* Progress bar for installing - highest priority */}
                  {isInstalling && (
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Installing update...</span>
                        <span>Please wait</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <motion.div
                          className="bg-primary h-3 rounded-full"
                          animate={{ width: ['0%', '100%'] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Progress bar for downloading */}
                  {updateInfo?.status === 'downloading' && updateInfo?.progress !== undefined && (
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Downloading...</span>
                        <span>{updateInfo.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <motion.div
                          className="bg-primary h-3 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${updateInfo.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Progress bar for checking updates */}
                  {!isInstalling && updateInfo?.status === 'checking' && (
                    <div className="w-full space-y-2">
                      <div className="w-full bg-muted rounded-full h-3">
                        <motion.div
                          className="bg-primary h-3 rounded-full"
                          animate={{ width: ['0%', '100%'] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action button */}
                  <div className="w-full pt-4">
                    {getActionButton()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Release notes */}
            {updateInfo?.releaseNotes && updateInfo.status === 'available' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">What's New</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {updateInfo.releaseNotes}
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default UpdateWindow;
