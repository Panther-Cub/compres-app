import React from 'react';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { macAnimations, overlayVariants } from '../lib/animations';
import type { ProgressOverlayProps } from '../types';

const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
  isCompressing,
  compressionComplete,
  compressionProgress,
  outputPaths,
  presets,
  getTotalProgress,
  onClose,
  onCancel
}) => {
  if (!isCompressing && !compressionComplete) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {/* Allow clicking outside to minimize */}
      <div className="absolute inset-0" onClick={() => !isCompressing && onClose?.()} />
      <motion.div 
        className="w-full max-w-md p-6 space-y-6 relative bg-background border border-border/20 rounded-lg" 
        onClick={(e) => e.stopPropagation()}
        variants={macAnimations.modal}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Close button */}
        <AnimatePresence>
          {(compressionComplete || !isCompressing) && onClose && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-2 right-2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div 
          className="text-center space-y-2"
          variants={macAnimations.slideUp}
        >
          <div className="flex items-center justify-center gap-2">
            <AnimatePresence mode="wait">
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
              {isCompressing && (
                <motion.div
                  key="spinner"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
            <h3 className="text-base font-light">
              {isCompressing ? 'Compressing videos...' : 'Complete!'}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground/60">
            {isCompressing ? `${getTotalProgress()}% complete` : 'All videos have been compressed'}
          </p>
          {isCompressing && (
            <p className="text-xs text-muted-foreground/40">
              Processing {Object.keys(compressionProgress).length} files in parallel
            </p>
          )}
        </motion.div>
        
        <motion.div
          variants={macAnimations.slideUp}
          initial="initial"
          animate="animate"
        >
          <Progress value={getTotalProgress()} className="w-full" />
        </motion.div>
        
        {/* Individual Progress */}
        {Object.keys(compressionProgress).length > 0 && (
          <motion.div 
            className="space-y-2 max-h-48 overflow-auto"
            variants={macAnimations.slideUp}
            initial="initial"
            animate="animate"
          >
            <div className="text-xs text-muted-foreground/60 mb-2">
              {Object.values(compressionProgress).filter(p => p === 100).length} of {Object.keys(compressionProgress).length} completed
            </div>
            <AnimatePresence>
              {Object.entries(compressionProgress).map(([key, progress], index) => {
                // Handle preset keys that contain hyphens (like 'social-instagram')
                const [fileName, presetKey] = key.split('::');
                const preset = presetKey ? (presets as Record<string, any>)[presetKey] : undefined;
                
                return (
                  <motion.div 
                    key={key} 
                    className="flex items-center gap-3 text-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <span className="w-20 truncate font-light">{fileName}</span>
                    <span className="w-16 text-muted-foreground/60">{preset?.name || presetKey}</span>
                    <Progress value={progress} className="flex-1 h-1" />
                    <span className="w-8 text-right font-light">{Math.round(progress)}%</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
        
        <AnimatePresence>
          {compressionComplete && outputPaths.length > 0 && (
            <motion.div 
              className="p-3 bg-accent/20 rounded-lg border border-border/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm font-light mb-2">Output saved to:</p>
              <div className="space-y-1">
                {outputPaths.map((path, index) => (
                  <motion.p 
                    key={index} 
                    className="text-sm text-muted-foreground/60 break-all"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {path}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Action buttons */}
        <motion.div 
          className="flex gap-2"
          variants={macAnimations.slideUp}
        >
          {isCompressing && onCancel && (
            <motion.div 
              className="flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                onClick={onCancel}
                className="w-full"
                size="sm"
              >
                Cancel
              </Button>
            </motion.div>
          )}
          {compressionComplete && onClose && (
            <motion.div 
              className="flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onClose}
                className="w-full"
                size="sm"
              >
                Done
              </Button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ProgressOverlay;
