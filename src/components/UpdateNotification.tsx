import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Button } from './ui';
import { macAnimations } from '../lib/animations';
import type { UpdateStatusData } from '../types/shared';

interface UpdateNotificationProps {
  isVisible: boolean;
  updateInfo: UpdateStatusData | null;
  onClose: () => void;
  onDownload: () => void;
  onInstall: () => void;
  onCheckForUpdates: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  isVisible,
  updateInfo,
  onClose,
  onDownload,
  onInstall,
  onCheckForUpdates
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isVisible || !updateInfo) {
    return null;
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await onInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  const getStatusIcon = () => {
    switch (updateInfo.status) {
      case 'available':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'downloading':
        return <Download className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'downloaded':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <Download className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'not-available':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
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
    switch (updateInfo.status) {
      case 'available':
        return (
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Downloading...' : 'Download Update'}
          </Button>
        );
      case 'downloaded':
        return (
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            size="sm"
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isInstalling ? 'Installing...' : 'Install Update'}
          </Button>
        );
      case 'error':
        return (
          <Button
            onClick={onCheckForUpdates}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Check Again
          </Button>
        );
      case 'not-available':
        return (
          <Button
            onClick={onClose}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Close
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-16 right-4 w-80 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg z-50"
          variants={macAnimations.slideInRight}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    {updateInfo.status === 'checking' ? 'Checking for Updates' :
                     updateInfo.status === 'not-available' ? 'No Updates Available' :
                     updateInfo.status === 'error' ? 'Update Error' :
                     'Update Available'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {updateInfo.currentVersion && `Current: ${updateInfo.currentVersion}`}
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <p className="text-sm text-foreground">{getStatusMessage()}</p>
              
              {/* Progress bar for downloading */}
              {updateInfo.status === 'downloading' && updateInfo.progress !== undefined && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${updateInfo.progress}%` }}
                  />
                </div>
              )}

              {/* Progress bar for checking updates */}
              {updateInfo.status === 'checking' && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full animate-pulse" />
                </div>
              )}

              {/* Release notes preview */}
              {updateInfo.releaseNotes && updateInfo.status === 'available' && (
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {updateInfo.releaseNotes}
                  </p>
                </div>
              )}

              {/* Action button */}
              {getActionButton()}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotification;
