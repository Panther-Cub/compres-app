import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle, Play } from 'lucide-react';
import { Tooltip } from './ui';
import type { CompressionStatus } from '../types';

interface CompressionStatusIndicatorProps {
  status: CompressionStatus;
  size?: 'small' | 'medium' | 'large';
  onRecompress?: () => void;
  className?: string;
}

const CompressionStatusIndicator: React.FC<CompressionStatusIndicatorProps> = ({
  status,
  size = 'medium',
  onRecompress,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  const getStatusContent = () => {
    switch (status.status) {
      case 'pending':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-muted/20 flex items-center justify-center`}>
            <Play className={`${iconSizes[size]} text-muted-foreground`} />
          </div>
        );

      case 'compressing':
        return (
          <motion.div
            className={`${sizeClasses[size]} rounded-full bg-blue-500/20 flex items-center justify-center`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className={`${iconSizes[size]} text-blue-500`} />
          </motion.div>
        );

      case 'completed':
        return (
          <motion.div
            className={`${sizeClasses[size]} rounded-full bg-green-500/20 flex items-center justify-center`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Check className={`${iconSizes[size]} text-green-500`} />
          </motion.div>
        );

      case 'error':
      case 'failed':
        return (
          <motion.div
            className={`${sizeClasses[size]} rounded-full bg-red-500/20 flex items-center justify-center`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <AlertCircle className={`${iconSizes[size]} text-red-500`} />
          </motion.div>
        );

      default:
        return null;
    }
  };

  const getTooltipContent = () => {
    switch (status.status) {
      case 'pending':
        return 'Waiting to compress';
      case 'compressing':
        return `Compressing... ${Math.round(status.progress)}%`;
      case 'completed':
        return 'Compression completed';
      case 'error':
      case 'failed':
        return status.error || 'Compression failed';
      default:
        return '';
    }
  };

  const handleClick = () => {
    if (status.status === 'completed' && onRecompress) {
      onRecompress();
    }
  };

  const isClickable = status.status === 'completed' && onRecompress;

  return (
    <Tooltip 
      id={`compression-status-${status.filePath}-${status.presetId}`}
      content={getTooltipContent()}
    >
      <motion.div
        className={`relative ${className}`}
        onClick={handleClick}
        whileHover={isClickable ? { scale: 1.05 } : {}}
        whileTap={isClickable ? { scale: 0.95 } : {}}
      >
        {getStatusContent()}
        
        {/* Progress ring for compressing state */}
        {status.status === 'compressing' && (
          <svg
            className={`absolute inset-0 ${sizeClasses[size]} -rotate-90`}
            viewBox="0 0 32 32"
          >
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-blue-500/20"
            />
            <motion.circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-blue-500"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: status.progress / 100 }}
              transition={{ duration: 0.3 }}
            />
          </svg>
        )}
      </motion.div>
    </Tooltip>
  );
};

export default CompressionStatusIndicator;
