import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
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

  useEffect(() => {
    if (window.electronAPI) {
      const handleUpdateStatus = (data: any) => {
        if (data.status === 'downloading') {
          setIsDownloading(true);
          setDownloadProgress(data.progress || 0);
        } else if (data.status === 'downloaded') {
          setIsDownloading(false);
          setDownloadProgress(100);
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
    onDownload();
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
              onClick={onDismiss}
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

          {isDownloading ? (
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
                onClick={onDismiss}
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
