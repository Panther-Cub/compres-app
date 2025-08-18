# Native macOS Theme System

## Overview

This project implements a completely native macOS theme system that automatically follows the system's light/dark mode preference. The theme system is designed to provide a seamless, native experience with proper vibrancy effects and color consistency.

## Core Principles

### 1. Native macOS Integration
- **Automatic System Theme Detection**: Uses `window.matchMedia('(prefers-color-scheme: dark)')` to detect system theme
- **Native Vibrancy**: Leverages Electron's `vibrancy: 'under-window'` for authentic macOS appearance
- **No Manual Theme Toggle**: Always follows macOS system preference for consistency

### 2. Color System Rules
- **Pure Black/White Base**: All non-blue elements use pure black in light mode and pure white in dark mode
- **Varying Opacities**: Different visual weights achieved through opacity variations (3%, 5%, 8%, 15%, 60%)
- **macOS Blue Preserved**: Primary blue color (HSL: 217 91% 60%) remains consistent across themes
- **Semantic Colors**: Red (destructive), green (success), orange (warning) for specific states

## CSS Variables Structure

### Light Mode (`:root`)
```css
/* Text Colors - Pure Black with varying opacities */
--foreground: 0 0% 0%; /* Pure black text */
--foreground-muted: 0 0% 0% / 0.6; /* Black with 60% opacity */

/* Background Colors - Pure White/Black */
--card: 0 0% 100%; /* Pure white card background */
--card-foreground: 0 0% 0%; /* Pure black text on cards */

/* Border Colors - Pure Black with varying opacities */
--border: 0 0% 0% / 0.15; /* Black with 15% opacity for borders */
--input: 0 0% 0% / 0.15; /* Black with 15% opacity for input borders */

/* Primary Colors - macOS Blue (unchanged) */
--primary: 217 91% 60%; /* macOS Blue */
--primary-foreground: 0 0% 100%; /* White text on blue */
```

### Dark Mode (`.dark`)
```css
/* Text Colors - Pure White with varying opacities */
--foreground: 0 0% 100%; /* Pure white text */
--foreground-muted: 0 0% 100% / 0.6; /* White with 60% opacity */

/* Background Colors - Pure Black/White */
--card: 0 0% 0%; /* Pure black card background */
--card-foreground: 0 0% 100%; /* Pure white text on cards */

/* Border Colors - Pure White with varying opacities */
--border: 0 0% 100% / 0.15; /* White with 15% opacity for borders */
--input: 0 0% 100% / 0.15; /* White with 15% opacity for input borders */

/* Primary Colors - macOS Blue (same in both modes) */
--primary: 217 91% 60%; /* macOS Blue */
--primary-foreground: 0 0% 100%; /* White text on blue */
```

## Implementation Details

### Theme Manager (`src/lib/theme.ts`)
- **Singleton Pattern**: Ensures single theme instance across the app
- **System Theme Detection**: Automatically detects and applies system theme
- **Event Listeners**: Responds to system theme changes in real-time
- **Native Vibrancy Support**: Optimized for macOS vibrancy effects

### CSS Architecture
- **CSS Variables Only**: No hardcoded colors in components
- **HSL Format**: All colors use HSL format with alpha channels for opacity
- **Tailwind Integration**: Seamless integration with Tailwind's color system
- **No Custom Classes**: All colors use semantic variable names

### Component Integration
- **Consistent Usage**: All UI components use theme variables
- **No Hardcoded Colors**: Zero hardcoded color values in components
- **Semantic Naming**: Components use semantic class names (e.g., `text-foreground`, `bg-card`)

## File Structure

```
src/
├── lib/
│   └── theme.ts              # Theme manager singleton
├── hooks/
│   └── useTheme.ts           # React hook for theme access
├── components/ui/            # All UI components use theme variables
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
└── index.css                 # CSS variables and theme definitions
```

## Usage Examples

### In Components
```tsx
// ✅ Correct - Using theme variables
<div className="bg-card text-card-foreground border border-border">
  <h1 className="text-foreground">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>

// ❌ Incorrect - Hardcoded colors
<div className="bg-white text-black border border-gray-300">
  <h1 className="text-black">Title</h1>
  <p className="text-gray-600">Description</p>
</div>
```

### In CSS
```css
/* ✅ Correct - Using CSS variables */
.my-component {
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
}

/* ❌ Incorrect - Hardcoded colors */
.my-component {
  background-color: #ffffff;
  color: #000000;
  border: 1px solid #e5e5e5;
}
```

## Benefits

1. **Native macOS Experience**: Seamless integration with system appearance
2. **Automatic Theme Switching**: No user intervention required
3. **Consistent Visual Hierarchy**: Proper contrast ratios maintained
4. **Accessibility**: Follows system accessibility preferences
5. **Performance**: Efficient CSS variable system
6. **Maintainability**: Centralized color management

## Testing

The theme system automatically:
- Detects system theme on app launch
- Responds to system theme changes
- Applies correct colors to all UI elements
- Maintains proper contrast ratios
- Preserves macOS blue for primary actions

## Migration Notes

- All hardcoded colors have been removed
- Components now use semantic theme variables
- No manual theme toggle functionality
- System theme preference is always respected
- Native vibrancy effects are preserved
