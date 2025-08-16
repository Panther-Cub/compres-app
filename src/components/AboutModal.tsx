import React, { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui';
import AppIcon from './AppIcon';
import { macAnimations, overlayVariants } from '../lib/animations';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
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

    if (isOpen) {
      getVersion();
    }
  }, [isOpen]);

  return (
    <motion.div 
      className="fixed inset-0 glass-overlay z-50 flex items-center justify-center"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
          <motion.div 
            className="w-full max-w-md p-6 space-y-6 glass-modal rounded-lg"
            variants={macAnimations.modal}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-8 h-8 bg-foreground/10 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <AppIcon size={26} className="text-foreground/70" />
                </motion.div>
                <h2 className="text-lg font-light">About Compres</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="non-draggable"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <motion.div 
              className="space-y-4"
              variants={macAnimations.slideUp}
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
          </motion.div>
        </motion.div>
  );
};

export default AboutModal;
