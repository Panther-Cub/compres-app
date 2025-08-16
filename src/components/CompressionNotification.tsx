import React from 'react';
import { AlertTriangle, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui';

interface CompressionNotificationProps {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  showConfirm?: boolean;
  confirmText?: string;
  cancelText?: string;
  totalTasks?: number;
  estimatedTimeMinutes?: number;
  maxConcurrent?: number;
}

const CompressionNotification: React.FC<CompressionNotificationProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  onConfirm,
  showConfirm = false,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  totalTasks,
  estimatedTimeMinutes,
  maxConcurrent
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <Info className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-50 max-w-md"
          initial={{ opacity: 0, x: 300, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className={`${getBgColor()} border rounded-lg shadow-lg p-4`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon()}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground mb-1">
                  {title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {message}
                </p>

                {/* Task count details for warnings */}
                {type === 'warning' && totalTasks && estimatedTimeMinutes && maxConcurrent && (
                  <div className="bg-white/50 dark:bg-black/20 rounded-full p-3 mb-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Tasks:</span>
                        <span className="font-medium">{totalTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Concurrent:</span>
                        <span className="font-medium">{maxConcurrent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Est. Time:</span>
                        <span className="font-medium">~{estimatedTimeMinutes} minutes</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  {showConfirm && onConfirm && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="text-xs"
                      >
                        {cancelText}
                      </Button>
                      <Button
                        size="sm"
                        onClick={onConfirm}
                        className="text-xs"
                      >
                        {confirmText}
                      </Button>
                    </>
                  )}
                  
                  {!showConfirm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="text-xs"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>

              {!showConfirm && (
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompressionNotification;
