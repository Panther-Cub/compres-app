import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Volume2, VolumeX } from 'lucide-react';
import type { CompressionStatus } from '../types';
import { getPresetMetadata } from '../shared/presetRegistry';

interface CompressionProgressBarProps {
  status: CompressionStatus;
  onRecompress?: () => void;
  className?: string;
}

const CompressionProgressBar: React.FC<CompressionProgressBarProps> = ({
  status,
  onRecompress,
  className = ''
}) => {
  const getStatusContent = () => {
    switch (status.status) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Waiting to compress...</span>
          </div>
        );

      case 'compressing':
        return (
          <div className="w-full">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Compressing...</span>
              <span>{Math.round(status.progress)}%</span>
            </div>
            <div className="w-full bg-muted/20 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${status.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        );

      case 'completed':
        const presetMetadata = getPresetMetadata(status.presetId);
        const presetName = presetMetadata?.name || status.presetId;
        const hasAudio = status.keepAudio ?? presetMetadata?.defaultKeepAudio ?? true;
        
        return (
          <motion.div
            className="flex items-center gap-2 text-xs text-success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Check className="w-3 h-3" />
            <span>Compression completed</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{presetName}</span>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1">
              {hasAudio ? (
                <Volume2 className="w-3 h-3 text-muted-foreground" />
              ) : (
                <VolumeX className="w-3 h-3 text-muted-foreground" />
              )}
              <span className="text-muted-foreground">
                {hasAudio ? 'Audio' : 'Muted'}
              </span>
            </div>

          </motion.div>
        );

      case 'error':
      case 'failed':
        return (
          <motion.div
            className="flex items-center gap-2 text-xs text-destructive"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span>Compression failed</span>
            {onRecompress && (
              <button
                onClick={onRecompress}
                className="text-primary hover:text-primary/80 underline text-xs"
              >
                Retry
              </button>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${className}`}>
      {getStatusContent()}
    </div>
  );
};

export default CompressionProgressBar;
