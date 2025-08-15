import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import type { ThemeToggleProps } from '../types';

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const getIcon = (): React.ReactElement => {
    switch (theme) {
      case 'dark':
        return <Sun className="w-3 h-3" />;
      case 'light':
        return <Moon className="w-3 h-3" />;
      case 'system':
        return <Monitor className="w-3 h-3" />;
      default:
        return <Monitor className="w-3 h-3" />;
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="non-draggable text-xs"
        title={`Theme: ${theme} (click to cycle)`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {getIcon()}
          </motion.div>
        </AnimatePresence>
      </Button>
    </motion.div>
  );
};

export default ThemeToggle;
