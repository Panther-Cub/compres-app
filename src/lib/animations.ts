import { Variants } from 'framer-motion';

// macOS-style animation configurations
export const macAnimations = {
  // Subtle fade in with slight scale
  fadeIn: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Smooth slide up from bottom
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Gentle slide in from right (for drawers)
  slideInRight: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Hover animations for interactive elements
  hover: {
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Tap animation for buttons
  tap: {
    transition: { duration: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Stagger animation for lists
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.05
      }
    }
  },

  // List item animation
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Modal backdrop animation
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Modal content animation
  modal: {
    initial: { opacity: 0, scale: 0.95, y: 30 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 30 },
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Progress bar animation
  progress: {
    initial: { width: 0 },
    animate: { width: '100%' },
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Drop zone animation
  dropZone: {
    initial: { scale: 1 },
    animate: { scale: 1 },
    whileDrag: { scale: 0.98 },
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // File card animation
  fileCard: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// Variants for specific components
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const drawerVariants: Variants = {
  closed: {
    x: '100%',
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  open: {
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const overlayVariants: Variants = {
  hidden: { 
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Spring configurations for more natural motion
export const springConfig = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

// Easing functions for consistent motion
export const easing = {
  easeOut: [0.25, 0.46, 0.45, 0.94],
  easeIn: [0.55, 0.055, 0.675, 0.19],
  easeInOut: [0.645, 0.045, 0.355, 1]
};

