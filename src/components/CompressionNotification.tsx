import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import type { CompressionNotificationProps } from '../types';

const CompressionNotification: React.FC<CompressionNotificationProps> = ({ 
  isVisible, 
  isCompressing, 
  compressionComplete, 
  error, 
  totalProgress,
  onShowProgress 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 p-4 bg-background border border-border/20 rounded-lg z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isCompressing && (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
          {compressionComplete && <Check className="w-4 h-4 text-green-500" />}
          {error && <AlertCircle className="w-4 h-4 text-destructive" />}
          
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isCompressing ? 'Compressing videos...' : 
               compressionComplete ? 'Compression complete!' :
               error ? 'Compression failed' : ''}
            </p>
            {isCompressing && (
              <p className="text-xs text-muted-foreground">{totalProgress}% complete</p>
            )}
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        </div>
        
        <button
          onClick={onShowProgress}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCompressing ? 'Show progress' : 'View details'}
        </button>
      </div>
    </div>
  );
};

export default CompressionNotification;
