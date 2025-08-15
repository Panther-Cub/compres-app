import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor } from 'lucide-react';
import { macAnimations } from '../lib/animations';
import { Button } from './ui/button';

const OverlayDropZone: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const filePaths = files.map(file => file.path);
    
    if (filePaths.length > 0 && window.electronAPI) {
      try {
        await window.electronAPI.overlayFileDrop(filePaths);
        // The main window will handle showing itself and hiding the overlay
      } catch (error) {
        console.error('Error handling file drop:', error);
      }
    }
  }, []);

  const handleClick = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const filePaths = await window.electronAPI.selectFiles();
        if (filePaths && filePaths.length > 0) {
          await window.electronAPI.overlayFileDrop(filePaths);
          // The main window will handle showing itself and hiding the overlay
        }
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  }, []);

  const handleToggleToMain = useCallback(async () => {
    try {
      if (window.electronAPI) {
        // Show main window and hide overlay
        await window.electronAPI.showMainWindow();
        await window.electronAPI.hideOverlay();
      }
    } catch (error) {
      console.error('Error toggling to main window:', error);
    }
  }, []);

  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center pointer-events-auto z-50 draggable-region"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      variants={macAnimations.fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Toggle button to main window */}
      <motion.div 
        className="absolute top-3 right-3 z-10 non-draggable"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleToMain}
          className="text-foreground/70 hover:text-foreground/90 hover:bg-foreground/15 backdrop-blur-sm border border-foreground/10 transition-all"
          title="Switch to main window"
        >
          <Monitor className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/5 via-transparent to-background/5" />
      
      {/* Main content container */}
      <motion.div
        className="relative flex flex-col items-center justify-center"
        animate={{
          scale: isDragOver ? 1.05 : 1
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Pulsing ring animation */}
        <motion.div
          className="absolute w-20 h-20 rounded-full border border-foreground/10"
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
          className="absolute w-16 h-16 rounded-full border border-foreground/20"
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
            className="text-xl font-light text-foreground/80 mb-2"
            animate={{
              color: isDragOver ? "hsl(var(--primary))" : "hsl(var(--foreground)/0.8)"
            }}
            transition={{ duration: 0.3 }}
          >
            Drop in Videos
          </motion.h3>
          
          <motion.button 
            className="text-sm text-foreground/50 hover:text-foreground/70 transition-colors cursor-pointer underline decoration-dotted underline-offset-4 non-draggable"
            onClick={handleClick}
            animate={{
              opacity: isDragOver ? 0.8 : 0.5
            }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            or click here to browse
          </motion.button>
        </motion.div>

        {/* Drag state indicator */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              className="absolute inset-0 bg-primary/5 border-2 border-primary/20 rounded-3xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default OverlayDropZone;
