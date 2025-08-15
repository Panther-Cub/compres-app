// Design System Constants
// This file centralizes design tokens for consistency across the application

export const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
} as const;

export const textColors = {
  primary: 'text-foreground',
  secondary: 'text-muted-foreground',
  muted: 'text-muted-foreground/60',
  destructive: 'text-destructive',
  success: 'text-green-500'
} as const;

export const spacing = {
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-3',
  lg: 'space-y-4',
  xl: 'space-y-6'
} as const;

export const buttonSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
} as const;

// Common text combinations
export const textStyles = {
  label: `${textSizes.xs} ${textColors.secondary}`,
  body: `${textSizes.sm} ${textColors.primary}`,
  caption: `${textSizes.xs} ${textColors.muted}`,
  heading: `${textSizes.sm} font-medium ${textColors.primary}`,
  button: `${textSizes.sm} font-medium`
} as const;

// Component-specific text styles
export const componentText = {
  modal: {
    title: `${textSizes.lg} font-medium`,
    description: `${textSizes.sm} ${textColors.secondary}`,
    label: `${textSizes.sm} font-medium`,
    input: `${textSizes.sm}`,
    caption: `${textSizes.xs} ${textColors.muted}`
  },
  settings: {
    section: `${textSizes.sm} font-medium ${textColors.secondary} uppercase tracking-wider`,
    label: `${textSizes.xs} leading-none`,
    value: `${textSizes.xs} ${textColors.muted}`,
    description: `${textSizes.sm} ${textColors.secondary} leading-relaxed`
  },
  progress: {
    title: `${textSizes.base} font-light`,
    subtitle: `${textSizes.sm} ${textColors.muted}`,
    caption: `${textSizes.xs} ${textColors.muted}`,
    percentage: `${textSizes.sm} font-light`
  }
} as const;
