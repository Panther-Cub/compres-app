import { useState, useEffect } from 'react';
import { themeManager } from '../lib/theme';
import type { UseThemeReturn, Theme } from '../types';

export const useTheme = (): UseThemeReturn => {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    // Get initial theme
    const initialTheme = themeManager.getCurrentTheme();
    setTheme(initialTheme);

    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe((newTheme) => {
      setTheme(newTheme);
    });

    return unsubscribe;
  }, []);

  const toggleTheme = (): void => {
    themeManager.toggleTheme();
  };

  return {
    theme,
    toggleTheme
  };
};
