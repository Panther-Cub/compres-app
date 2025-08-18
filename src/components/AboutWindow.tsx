import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import AppIcon from './AppIcon';
import { macAnimations } from '../lib/animations';
import { themeManager } from '../lib/theme';
import type { Theme } from '../types';

interface AboutWindowProps {
  onClose: () => void;
}

const AboutWindow: React.FC<AboutWindowProps> = ({ onClose }) => {
  const [appVersion, setAppVersion] = useState<string>('0.0.0');

  // Force theme application when AboutWindow loads
  useEffect(() => {
    // Force apply theme immediately to ensure it's correct
    themeManager.forceApplyTheme();
    
    // Expose themeManager globally for IPC access
    (window as any).themeManager = themeManager;
    
    // Also get the current theme from the main window if available
    const getCurrentTheme = async () => {
      try {
        if (window.electronAPI && window.electronAPI.getCurrentTheme) {
          const currentTheme = await window.electronAPI.getCurrentTheme();
          if (currentTheme && ['light', 'dark', 'system'].includes(currentTheme)) {
            themeManager.setTheme(currentTheme as Theme);
          }
        }
      } catch (error) {
        console.error('Failed to get current theme:', error);
      }
    };
    
    getCurrentTheme();
    
    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe(() => {
      // Force re-application of theme when it changes
      setTimeout(() => {
        themeManager.forceApplyTheme();
      }, 50);
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    const getVersion = async () => {
      try {
        const version = await window.electronAPI.getAppVersion();
        setAppVersion(version);
      } catch (error) {
        console.error('Failed to get app version:', error);
        setAppVersion('0.0.0');
      }
    };

    getVersion();
  }, []);

  return (
    <motion.div 
      className="h-full flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Draggable Title Bar */}
              <div className="draggable-region sticky top-0 z-50 h-10 border-b border-border flex items-center justify-between px-4 select-none flex-shrink-0">
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
        <motion.div 
          className="space-y-6"
          variants={macAnimations.slideUp}
          initial="initial"
          animate="animate"
        >
          {/* App Header */}
          <div className="flex items-center gap-3">
            <AppIcon size={24} className="text-foreground/70" />
            <h2 className="text-base font-medium text-foreground">About Compres</h2>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Version</h3>
            <p className="text-xs text-muted-foreground">{appVersion}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-xs text-muted-foreground">
              A minimalistic video compression app designed for web optimization. 
              Batch process multiple videos with different presets for various use cases.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Developer</h3>
            <p className="text-xs text-muted-foreground">Panther & Cub</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Credits</h3>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Built with React, Electron, and FFmpeg
              </p>
              <p className="text-xs text-muted-foreground">
                UI components by Radix UI
              </p>
              <p className="text-xs text-muted-foreground">
                Icons by Lucide React
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Heart className="w-4 h-4 text-destructive" />
            </motion.div>
            <p className="text-xs text-muted-foreground">
              Made with love for the web community
            </p>
          </div>
        </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AboutWindow;
