import React from 'react';
import { Zap, Coffee, Info, Star, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import ThemeToggle from './ThemeToggle';
import { macAnimations } from '../lib/animations';
import type { AppHeaderProps } from '../types';

const AppHeader: React.FC<AppHeaderProps> = ({ 
  selectedFilesCount, 
  onBuyCoffee, 
  theme, 
  onToggleTheme, 
  onShowAbout,
  onShowDefaults,
  onToggleOverlay
}) => {
  return (
    <motion.header 
      className="draggable-region fixed top-0 left-0 right-0 z-50 h-10 glass border-b border-border/20 flex items-center justify-between px-4 select-none"
      variants={macAnimations.fadeIn}
      initial="initial"
      animate="animate"
    >
      <motion.div 
        className="flex items-center gap-3 pl-20"
        variants={macAnimations.slideUp}
      >
        <motion.div 
          className="w-6 h-6 bg-foreground/10 rounded-md flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <Zap className="w-3 h-3 text-foreground/70" />
        </motion.div>
        <span className="text-[0.625rem] font-normal text-foreground/70">Compress</span>
      </motion.div>
      <motion.div 
        className="flex items-center gap-2"
        variants={macAnimations.slideUp}
      >
        <motion.span 
          className="text-[0.625rem] text-muted-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {selectedFilesCount > 0 ? `${selectedFilesCount} file${selectedFilesCount > 1 ? 's' : ''}` : 'Drop videos'}
        </motion.span>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowDefaults}
            className="non-draggable text-[0.625rem]"
          >
            <Star className="w-3 h-3" />
          </Button>
        </motion.div>
        {onToggleOverlay && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleOverlay}
              className="non-draggable text-[0.625rem]"
              title="Show overlay"
            >
              <Monitor className="w-3 h-3" />
            </Button>
          </motion.div>
        )}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowAbout}
            className="non-draggable text-[0.625rem]"
          >
            <Info className="w-3 h-3" />
          </Button>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.05, y: -1 }} 
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onBuyCoffee}
            className="non-draggable text-[0.625rem]"
          >
            <Coffee className="w-3 h-3 mr-1" />
            Buy Coffee
          </Button>
        </motion.div>
      </motion.div>
    </motion.header>
  );
};

export default AppHeader;
