import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Theme utility functions
export const themeUtils = {
  // Get semantic color classes
  colors: {
    text: {
      primary: 'text-foreground',
      secondary: 'text-muted-foreground',
      muted: 'text-muted-foreground/60',
      destructive: 'text-destructive',
      success: 'text-success',
      warning: 'text-warning',
      info: 'text-info',
    },
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
    border: {
      default: 'border-border',
      input: 'border-input',
      primary: 'border-primary',
      destructive: 'border-destructive',
      success: 'border-success',
      warning: 'border-warning',
      info: 'border-info',
    }
  },

  // Common state combinations
  states: {
    success: {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-success/20',
      hover: 'hover:bg-success/20',
    },
    error: {
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      border: 'border-destructive/20',
      hover: 'hover:bg-destructive/20',
    },
    warning: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      border: 'border-warning/20',
      hover: 'hover:bg-warning/20',
    },
    info: {
      bg: 'bg-info/10',
      text: 'text-info',
      border: 'border-info/20',
      hover: 'hover:bg-info/20',
    },
  },

  // Helper to combine multiple color classes
  combine: (...classes: string[]) => classes.filter(Boolean).join(' '),
};

// Legacy color replacement helpers (for migration)
export const legacyColorMap = {
  // Replace old hardcoded colors with semantic ones
  'text-white': 'text-background',
  'text-black': 'text-foreground',
  'bg-white': 'bg-background',
  'bg-black': 'bg-foreground',
  'border-white': 'border-background',
  'border-black': 'border-foreground',
  'text-green-500': 'text-success',
  'text-red-500': 'text-destructive',
  'text-blue-500': 'text-primary',
  'bg-green-500': 'bg-success',
  'bg-red-500': 'bg-destructive',
  'bg-blue-500': 'bg-primary',
  'border-green-500': 'border-success',
  'border-red-500': 'border-destructive',
  'border-blue-500': 'border-primary',
};

// Function to replace legacy colors in className strings
export function replaceLegacyColors(className: string): string {
  let result = className;
  Object.entries(legacyColorMap).forEach(([oldColor, newColor]) => {
    result = result.replace(new RegExp(`\\b${oldColor}\\b`, 'g'), newColor);
  });
  return result;
} 