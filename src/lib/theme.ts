import type { Theme } from '../types';

// Shared theme utility for consistent theme handling across windows
export class ThemeManager {
  private static instance: ThemeManager;
  private listeners: Set<(theme: Theme) => void> = new Set();

  private constructor() {
    this.initializeTheme();
    this.setupEventListeners();
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private initializeTheme(): void {
    const savedTheme = (localStorage.getItem('compress-theme') as Theme) || 'system';
    this.applyTheme(savedTheme);
  }

  private setupEventListeners(): void {
    // Listen for theme changes from localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'compress-theme') {
        const newTheme = (e.newValue as Theme) || 'system';
        this.applyTheme(newTheme);
        this.notifyListeners(newTheme);
      }
    });

    // Listen for system theme changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      const savedTheme = (localStorage.getItem('compress-theme') as Theme) || 'system';
      if (savedTheme === 'system') {
        this.applyTheme('system');
        this.notifyListeners('system');
      }
    });
  }

  private applyTheme(themeMode: Theme): void {
    let isDark = false;
    
    if (themeMode === 'system') {
      // Check system preference
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = themeMode === 'dark';
    }
    
    // Remove existing dark class first
    document.documentElement.classList.remove('dark');
    
    // Add dark class if needed
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    
    // Force a repaint to ensure theme is applied
    document.documentElement.style.display = 'none';
    void document.documentElement.offsetHeight; // Trigger reflow
    document.documentElement.style.display = '';
    
    // Also apply to body as backup
    document.body.classList.remove('dark');
    if (isDark) {
      document.body.classList.add('dark');
    }
  }

  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => listener(theme));
  }

  // Public methods
  getCurrentTheme(): Theme {
    return (localStorage.getItem('compress-theme') as Theme) || 'system';
  }

  setTheme(theme: Theme): void {
    localStorage.setItem('compress-theme', theme);
    this.applyTheme(theme);
    this.notifyListeners(theme);
  }

  toggleTheme(): void {
    const themes: Theme[] = ['system', 'light', 'dark'];
    const currentTheme = this.getCurrentTheme();
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    this.setTheme(newTheme);
  }

  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Force immediate theme application (useful for overlay windows)
  forceApplyTheme(): void {
    const theme = this.getCurrentTheme();
    this.applyTheme(theme);
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();
