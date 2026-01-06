/**
 * Animation Configurations for Framer Motion
 *
 * Centralized animation presets following Apple's Human Interface Guidelines.
 * Uses physics-based spring animations for natural, fluid motion.
 */

import { Variant, Transition } from 'framer-motion';

// Variants type for Framer Motion v12+
type Variants = {
  [key: string]: Variant;
};

// ============================================
// Timing Functions (Cubic Bezier Curves)
// ============================================

export const easings = {
  // General UI transitions
  standard: [0.4, 0.0, 0.2, 1] as [number, number, number, number],

  // Elements entering the screen
  decelerate: [0.0, 0.0, 0.2, 1] as [number, number, number, number],

  // Elements exiting the screen
  accelerate: [0.4, 0.0, 1, 1] as [number, number, number, number],

  // Quick transitions
  sharp: [0.4, 0.0, 0.6, 1] as [number, number, number, number],

  // Bouncy, playful moments
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
};

// ============================================
// Durations (in seconds)
// ============================================

export const durations = {
  instant: 0.1,
  quick: 0.2,
  base: 0.3,
  slow: 0.5,
  slower: 0.7,
};

// ============================================
// Spring Configurations
// ============================================

export const springs = {
  // Gentle, smooth spring
  gentle: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },

  // Standard spring for most UI
  standard: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  },

  // Snappy, responsive spring
  snappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 20,
  },

  // Bouncy, playful spring
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 15,
  },

  // Soft, elastic spring
  soft: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 20,
  },
};

// ============================================
// Transition Presets
// ============================================

export const transitions = {
  // Fade transitions
  fade: {
    duration: durations.quick,
    ease: easings.standard,
  },

  // Scale transitions
  scale: {
    duration: durations.quick,
    ease: easings.spring,
  },

  // Slide transitions
  slide: {
    duration: durations.base,
    ease: easings.decelerate,
  },

  // Spring transitions
  spring: springs.standard,

  // Button press
  press: {
    duration: durations.instant,
    ease: easings.sharp,
  },
};

// ============================================
// Variant Presets
// ============================================

/**
 * Fade in/out variants
 */
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: transitions.fade,
  },
  exit: {
    opacity: 0,
    transition: transitions.fade,
  },
};

/**
 * Scale variants (for popping in elements)
 */
export const scaleVariants: Variants = {
  hidden: {
    scale: 0.9,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springs.gentle,
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: transitions.fade,
  },
};

/**
 * Slide up variants (for modals, sheets)
 */
export const slideUpVariants: Variants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: springs.standard,
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: durations.quick,
      ease: easings.accelerate,
    },
  },
};

/**
 * Slide down variants (for notifications, toasts)
 */
export const slideDownVariants: Variants = {
  hidden: {
    y: '-100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: springs.gentle,
  },
  exit: {
    y: '-100%',
    opacity: 0,
    transition: {
      duration: durations.quick,
      ease: easings.accelerate,
    },
  },
};

/**
 * Slide from right variants (for cards)
 */
export const slideRightVariants: Variants = {
  hidden: {
    x: 100,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: springs.gentle,
  },
  exit: {
    x: 100,
    opacity: 0,
    transition: transitions.fade,
  },
};

/**
 * Bounce in variants (for markers, badges)
 */
export const bounceInVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springs.bouncy,
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: transitions.fade,
  },
};

/**
 * Button press variants
 */
export const buttonVariants: Variants = {
  idle: {
    scale: 1,
  },
  press: {
    scale: 0.97,
    transition: transitions.press,
  },
  hover: {
    scale: 1.02,
    transition: transitions.press,
  },
};

/**
 * Card tap variants
 */
export const cardTapVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
  },
  press: {
    scale: 0.97,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: transitions.press,
  },
};

/**
 * Modal backdrop variants
 */
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: durations.quick,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: durations.quick,
    },
  },
};

// ============================================
// Stagger Configurations
// ============================================

/**
 * Create a stagger parent variant
 */
export const createStaggerContainer = (staggerDelay = 0.05): Variants => ({
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.1,
    },
  },
});

/**
 * Stagger child variants (for use with stagger container)
 */
export const staggerChildVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.gentle,
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Create a delayed animation
 */
export const withDelay = (transition: Transition, delay: number): Transition => ({
  ...transition,
  delay,
});

/**
 * Pulse animation (for loading, attention)
 */
export const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [1, 0.8, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: easings.standard,
  },
};

/**
 * Rotate animation (for loading spinners)
 */
export const rotateAnimation = {
  rotate: 360,
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
};

/**
 * Shimmer animation (for loading skeleton)
 */
export const shimmerAnimation = {
  x: ['-100%', '100%'],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  },
};
