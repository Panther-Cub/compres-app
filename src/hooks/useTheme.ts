import { useState, useEffect } from 'react';
import type { UseThemeReturn, Theme } from '../types';

export const useTheme = (): UseThemeReturn => {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    // Check for saved theme preference or default to system
    const savedTheme = (localStorage.getItem('compress-theme') as Theme) || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // Listen for system theme changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent): void => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  const applyTheme = (themeMode: Theme): void => {
    if (themeMode === 'system') {
      // Check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', themeMode === 'dark');
    }
  };

  const toggleTheme = (): void => {
    const themes: Theme[] = ['system', 'light', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    
    setTheme(newTheme);
    localStorage.setItem('compress-theme', newTheme);
    applyTheme(newTheme);
  };

  return {
    theme,
    toggleTheme
  };
};
