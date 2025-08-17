import type { Theme } from '../types';

// Native macOS vibrancy-aware theme manager
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
    // Always use system theme for native vibrancy
    this.applyNativeTheme();
  }

  private setupEventListeners(): void {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      this.applyNativeTheme();
      this.notifyListeners('system');
    });

    // Listen for vibrancy changes (if supported)
    if ('vibrancy' in window) {
      // Handle any vibrancy-related theme changes
      this.applyNativeTheme();
    }
  }

  private applyNativeTheme(): void {
    // Remove all existing theme classes
    document.documentElement.classList.remove('dark', 'light', 'system');
    document.body.classList.remove('dark', 'light', 'system');
    
    // Check system theme preference
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply appropriate theme class
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    }
    
    // Add native vibrancy class
    document.documentElement.classList.add('native-vibrancy');
    document.body.classList.add('native-vibrancy');
    
    // Force a repaint to ensure native effects are applied
    document.documentElement.style.display = 'none';
    void document.documentElement.offsetHeight; // Trigger reflow
    document.documentElement.style.display = '';
  }

  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => listener(theme));
  }

  // Public methods
  getCurrentTheme(): Theme {
    // Always return system for native vibrancy
    return 'system';
  }

  setTheme(theme: Theme): void {
    // Always use system theme for native vibrancy
    localStorage.setItem('compress-theme', 'system');
    this.applyNativeTheme();
    this.notifyListeners('system');
  }

  toggleTheme(): void {
    // Theme toggle disabled - always follows macOS system
    console.log('Theme toggle disabled - using native macOS vibrancy');
  }

  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Force immediate native theme application
  forceApplyTheme(): void {
    this.applyNativeTheme();
  }

  // Check if native vibrancy is supported
  isNativeVibrancySupported(): boolean {
    return process.platform === 'darwin';
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();
