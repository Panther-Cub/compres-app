import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { macAnimations } from './lib/animations';
import { themeManager } from './lib/theme';
import { UpdateWindow } from './components';
import type { Theme } from './types';

import './index.css';

function UpdateApp() {
  const [, setCurrentTheme] = useState<Theme>('system');

  // Use the centralized theme system
  useEffect(() => {
    // Get initial theme
    const initialTheme = themeManager.getCurrentTheme();
    setCurrentTheme(initialTheme);

    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe((theme) => {
      setCurrentTheme(theme);
    });

    // Force apply theme immediately and multiple times to ensure it's correct
    themeManager.forceApplyTheme();
    
    // Expose themeManager globally for IPC access
    (window as any).themeManager = themeManager;
    
    // Apply again after a short delay to ensure it sticks
    setTimeout(() => themeManager.forceApplyTheme(), 100);
    setTimeout(() => themeManager.forceApplyTheme(), 500);

    return unsubscribe;
  }, []);

  return (
    <motion.div 
      className="h-full w-full native-vibrancy text-foreground overflow-hidden"
      variants={macAnimations.fadeIn}
      initial="initial"
      animate="animate"
    >
      <UpdateWindow />
    </motion.div>
  );
}

export default UpdateApp;
