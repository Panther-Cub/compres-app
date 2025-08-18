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

  // Get current system theme (light/dark)
  getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Check if we're in dark mode
  isDarkMode(): boolean {
    return this.getSystemTheme() === 'dark';
  }

  // Check if we're in light mode
  isLightMode(): boolean {
    return this.getSystemTheme() === 'light';
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();

// Utility functions for semantic colors
export const getSemanticColor = {
  // Text colors
  text: {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    muted: 'text-muted-foreground/60',
    destructive: 'text-destructive',
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-info',
  },
  
  // Background colors
  bg: {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    muted: 'bg-muted',
    accent: 'bg-accent',
    destructive: 'bg-destructive',
    success: 'bg-success',
    warning: 'bg-warning',
    info: 'bg-info',
    card: 'bg-card',
    popover: 'bg-popover',
  },
  
  // Border colors
  border: {
    default: 'border-border',
    input: 'border-input',
    primary: 'border-primary',
    destructive: 'border-destructive',
    success: 'border-success',
    warning: 'border-warning',
    info: 'border-info',
  },
  
  // Ring colors (for focus states)
  ring: {
    default: 'ring-ring',
    primary: 'ring-primary',
    destructive: 'ring-destructive',
    success: 'ring-success',
    warning: 'ring-warning',
    info: 'ring-info',
  }
};

// Utility for getting opacity variants
export const getColorWithOpacity = (color: string, opacity: number) => `${color}/${opacity * 100}`;

// Common color combinations
export const colorCombinations = {
  // Success states
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
    hover: 'hover:bg-success/20',
  },
  
  // Error states
  error: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/20',
    hover: 'hover:bg-destructive/20',
  },
  
  // Warning states
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
    hover: 'hover:bg-warning/20',
  },
  
  // Info states
  info: {
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20',
    hover: 'hover:bg-info/20',
  },
  
  // Primary states
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    hover: 'hover:bg-primary/20',
  },
};
