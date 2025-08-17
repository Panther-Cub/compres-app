import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import AppIcon from './AppIcon';
import { macAnimations } from '../lib/animations';

interface AboutWindowProps {
  onClose: () => void;
}

const AboutWindow: React.FC<AboutWindowProps> = ({ onClose }) => {
  const [appVersion, setAppVersion] = useState<string>('0.0.0');

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
      <div className="draggable-region fixed top-0 left-0 right-0 z-50 h-10 border-b border-border/20 flex items-center justify-between px-4 select-none flex-shrink-0">
        <div className="flex items-center gap-3 pl-20">
          <AppIcon size={20} className="text-foreground/70" />
          <span className="text-[0.625rem] font-normal text-foreground/70">About Compres</span>
        </div>
      </div>

      {/* Content with top padding for fixed header */}
      <div className="flex-1 overflow-y-auto pt-10">
        <div className="p-6">
        <motion.div 
          className="space-y-6"
          variants={macAnimations.slideUp}
          initial="initial"
          animate="animate"
        >
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
              <Heart className="w-4 h-4 text-red-500" />
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
