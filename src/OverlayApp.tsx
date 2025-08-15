import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { macAnimations } from './lib/animations';
import OverlayDropZone from './components/OverlayDropZone';
import './index.css';

function OverlayApp() {
  // Sync theme with main window
  useEffect(() => {
    const syncTheme = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    };

    // Check initial theme
    syncTheme();

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', syncTheme);

    return () => mediaQuery.removeEventListener('change', syncTheme);
  }, []);

  return (
    <motion.div 
      className="h-full w-full bg-transparent overflow-hidden"
      variants={macAnimations.fadeIn}
      initial="initial"
      animate="animate"
    >
      <OverlayDropZone />
    </motion.div>
  );
}

export default OverlayApp;
