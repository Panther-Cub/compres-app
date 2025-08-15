import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { macAnimations } from '../lib/animations';
import type { VideoDropZoneProps } from '../types';

const VideoDropZone: React.FC<VideoDropZoneProps> = ({ 
  isDragOver, 
  onDragOver, 
  onDragLeave, 
  onDrop, 
  onSelectFiles
}) => {
  return (
    <div 
      className="h-full w-full relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag state indicator - covers full window */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            className="fixed inset-0 bg-primary/5 border-4 border-primary/30 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/5 via-transparent to-background/5" />
      
      {/* Centered content */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center p-4"
        variants={macAnimations.fadeIn}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <motion.div
          className="flex flex-col items-center justify-center"
          animate={{
            scale: isDragOver ? 1.05 : 1
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Pulsing ring animation */}
          <motion.div
            className="absolute w-32 h-32 rounded-full border border-foreground/10"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div
            className="absolute w-24 h-24 rounded-full border border-foreground/20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.05, 0.4]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />

          {/* Text container with subtle animation */}
          <motion.div
            className="relative text-center flex flex-col items-center"
            animate={{
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.h3 
              className="text-xl font-light text-foreground mb-2"
              animate={{
                color: isDragOver ? "hsl(var(--primary))" : "hsl(var(--foreground))"
              }}
              transition={{ duration: 0.3 }}
            >
              Drop in Videos
            </motion.h3>
            
            <motion.p 
              className="text-xs text-foreground/60 mb-3"
              animate={{
                opacity: isDragOver ? 0.9 : 0.7
              }}
              transition={{ duration: 0.3 }}
            >
              MP4, MOV, AVI, MKV, WebM, and more
            </motion.p>
            
            <motion.button 
              className="text-sm text-foreground/60 hover:text-foreground transition-colors cursor-pointer underline decoration-dotted underline-offset-4 non-draggable"
              onClick={onSelectFiles}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              or click here to browse
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VideoDropZone;
