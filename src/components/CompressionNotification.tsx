import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { macAnimations } from '../lib/animations';
import type { CompressionNotificationProps } from '../types';

const CompressionNotification: React.FC<CompressionNotificationProps> = ({ 
  isVisible, 
  isCompressing, 
  compressionComplete, 
  error, 
  totalProgress,
  onShowProgress 
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed bottom-4 right-4 w-80 p-4 bg-background border border-border/20 rounded-lg z-50"
          variants={macAnimations.slideUp}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AnimatePresence mode="wait">
                {isCompressing && (
                  <motion.div
                    key="spinner"
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    exit={{ scale: 0, rotate: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </motion.div>
                )}
                {compressionComplete && (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </motion.div>
                )}
                {error && (
                  <motion.div
                    key="error"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex-1">
                <motion.p 
                  className="text-sm font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {isCompressing ? 'Compressing videos...' : 
                   compressionComplete ? 'Compression complete!' :
                   error ? 'Compression failed' : ''}
                </motion.p>
                <AnimatePresence>
                  {isCompressing && (
                    <motion.p 
                      className="text-xs text-muted-foreground"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      {totalProgress}% complete
                    </motion.p>
                  )}
                  {error && (
                    <motion.p 
                      className="text-xs text-destructive"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <motion.button
              onClick={onShowProgress}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isCompressing ? 'Show progress' : 'View details'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompressionNotification;
