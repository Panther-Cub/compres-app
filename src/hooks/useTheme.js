import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState('auto');

  useEffect(() => {
    // Check for saved theme preference or default to auto
    const savedTheme = localStorage.getItem('compress-theme') || 'auto';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // Listen for system theme changes when in auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      if (theme === 'auto') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  const applyTheme = (themeMode) => {
    if (themeMode === 'auto') {
      // Check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', themeMode === 'dark');
    }
  };

  const toggleTheme = () => {
    const themes = ['auto', 'light', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    
    setTheme(newTheme);
    localStorage.setItem('compress-theme', newTheme);
    applyTheme(newTheme);
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  };
};
