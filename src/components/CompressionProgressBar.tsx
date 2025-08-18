import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import type { CompressionStatus } from '../types';

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
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${status.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        );

      case 'completed':
        return (
          <motion.div
            className="flex items-center gap-2 text-xs text-green-600"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Check className="w-3 h-3" />
            <span>Compression completed</span>
            {onRecompress && (
              <button
                onClick={() => {
                  console.log('Re-compress button clicked!');
                  onRecompress();
                }}
                className="text-blue-500 hover:text-blue-600 underline text-xs"
              >
                Re-compress
              </button>
            )}
          </motion.div>
        );

      case 'error':
      case 'failed':
        return (
          <motion.div
            className="flex items-center gap-2 text-xs text-red-600"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span>Compression failed</span>
            {onRecompress && (
              <button
                onClick={onRecompress}
                className="text-blue-500 hover:text-blue-600 underline text-xs"
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
