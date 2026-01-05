/**
 * Haptic Feedback Utility
 *
 * Provides tactile feedback for user interactions.
 * Falls back gracefully on devices that don't support vibration.
 */

export const haptics = {
  /**
   * Light tap - For simple interactions like tapping a button
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium tap - For confirmations and meaningful actions
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy tap - For important actions and warnings
   */
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 20]);
    }
  },

  /**
   * Success pattern - For successful completions
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error pattern - For errors and failed actions
   */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  },

  /**
   * Notification pattern - For incoming notifications
   */
  notification: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 20, 10, 20, 10]);
    }
  },

  /**
   * Selection tick - For scrolling through options (like radius slider)
   */
  tick: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  },
};

// Check if haptics are available
export const hapticsAvailable = 'vibrate' in navigator;
