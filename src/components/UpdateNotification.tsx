import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui';
import { macAnimations } from '../lib/animations';

interface UpdateNotificationProps {
  isVisible: boolean;
  updateInfo: any;
  onDownload: () => void;
  onDismiss: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  isVisible,
  updateInfo,
  onDownload,
  onDismiss
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      const handleUpdateStatus = (data: any) => {
        console.log('UpdateNotification received status:', data);
        
        if (data.status === 'downloading') {
          setIsDownloading(true);
          setDownloadProgress(data.progress || 0);
          setError(null);
        } else if (data.status === 'downloaded') {
          setIsDownloading(false);
          setDownloadProgress(100);
          setIsDownloaded(true);
          setError(null);
        } else if (data.status === 'error') {
          setIsDownloading(false);
          setError(data.error);
          console.error('Update error:', data.error);
        }
      };

      window.electronAPI.onUpdateStatus(handleUpdateStatus);
      
      return () => {
        window.electronAPI.removeAllListeners('update-status');
      };
    }
  }, []);

  const handleDownload = () => {
    setIsDownloading(true);
    setError(null);
    setIsDownloaded(false);
    onDownload();
  };

  const handleDismiss = () => {
    setIsDownloading(false);
    setError(null);
    setIsDownloaded(false);
    setDownloadProgress(0);
    onDismiss();
  };

  const handleInstall = async () => {
    if (window.electronAPI) {
      try {
        // Show installing state
        setIsDownloading(true);
        setError(null);
        
        const result = await window.electronAPI.installUpdate();
        
        if (result.success) {
          // Show restart confirmation
          if (window.confirm('Update installed successfully! The app will restart to apply the changes. Click OK to restart now, or Cancel to restart later.')) {
            // The app should restart automatically, but if it doesn't, we can force it
            window.electronAPI.installUpdate();
          }
        } else {
          setError(result.error || 'Installation failed');
          setIsDownloading(false);
        }
      } catch (error: any) {
        setError(error.message || 'Installation failed');
        setIsDownloading(false);
      }
    }
  };

  if (!isVisible || !updateInfo) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 right-4 z-50 max-w-sm"
        variants={macAnimations.slideInRight}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="bg-background border border-border rounded-lg shadow-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Update Available</span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Version {updateInfo.version} is available
            </p>
            {updateInfo.releaseNotes && (
              <p className="text-xs text-muted-foreground">
                {updateInfo.releaseNotes}
              </p>
            )}
          </div>

          {error ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleDownload}
                  size="sm"
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={handleDismiss}
                  size="sm"
                  variant="outline"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : isDownloading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Downloading...</span>
                <span>{Math.round(downloadProgress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          ) : isDownloaded ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" />
                <span>Update ready to install</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleInstall}
                  size="sm"
                  className="flex-1"
                >
                  Install Update
                </Button>
                <Button 
                  onClick={handleDismiss}
                  size="sm"
                  variant="outline"
                >
                  Later
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handleDownload}
                size="sm"
                className="flex-1"
              >
                Download Update
              </Button>
              <Button 
                onClick={handleDismiss}
                size="sm"
                variant="outline"
              >
                Later
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateNotification;
