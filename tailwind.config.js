/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Warm sunrise orange - reserved for action moments
        sunrise: {
          50: '#fffaf5',
          100: '#fff0e0',
          200: '#ffdcb8',
          300: '#ffc285',
          400: '#ff9f4a',  // Main brand - warm, inviting
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },

        // Secondary: Reserved for rare moments of delight
        connect: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },

        // Encounter glow - special moments only
        encounter: {
          DEFAULT: '#ec4899',
          glow: 'rgba(236, 72, 153, 0.3)',
          pulse: 'rgba(236, 72, 153, 0.5)',
        },

        // Obsidian neutrals - deeper, richer blacks
        obsidian: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',  // Cards - slightly elevated
          900: '#18181b',  // Surface
          950: '#0f0e0d',  // Deep background - true obsidian
        },

        // Keep slate for compatibility
        slate: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#0f0e0d',
        },

        // Semantic - minimal, purposeful
        success: '#22c55e',
        error: '#ef4444',
        warning: '#eab308',

        // Radar - military tech aesthetic
        radar: {
          screen: '#0a1a0a',
          grid: 'rgba(34, 197, 94, 0.08)',
          sweep: 'rgba(34, 197, 94, 0.15)',
          blip: '#22c55e',
          glow: 'rgba(34, 197, 94, 0.4)',
          pulse: 'rgba(34, 197, 94, 0.2)',
          ring: 'rgba(34, 197, 94, 0.12)',
        },
      },

      // SF Pro-inspired typography - BOLDER hierarchy
      fontSize: {
        // Massive - for hero moments, single words
        massive: ['72px', { lineHeight: '1.0', letterSpacing: '-0.03em', fontWeight: '700' }],

        // Display - page titles
        display: ['64px', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],

        // Titles - clear hierarchy
        title1: ['40px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        title2: ['32px', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
        title3: ['24px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],

        // Body - comfortable reading
        body: ['17px', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'body-medium': ['17px', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '500' }],
        'body-bold': ['17px', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '600' }],

        // Large body - for emphasis
        'body-large': ['19px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],

        // UI elements
        callout: ['15px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '500' }],
        subhead: ['13px', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
        footnote: ['12px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '400' }],
        caption: ['11px', { lineHeight: '1.3', letterSpacing: '0.03em', fontWeight: '500' }],
      },

      // Extended spacing - more breathing room
      spacing: {
        0: '0',
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        2.5: '10px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        11: '44px',
        12: '48px',
        14: '56px',
        16: '64px',
        18: '72px',
        20: '80px',
        24: '96px',
        28: '112px',
        32: '128px',
        36: '144px',
        40: '160px',
      },

      // Refined animation curves
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'decelerate': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'accelerate': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'gentle': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },

      transitionDuration: {
        instant: '100ms',
        quick: '200ms',
        base: '300ms',
        smooth: '400ms',
        slow: '500ms',
        slower: '700ms',
      },

      animation: {
        // Subtle, refined animations
        'fade-in': 'fade-in 0.3s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        'fade-up': 'fade-up 0.4s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        'fade-down': 'fade-down 0.3s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.4, 0.0, 1, 1) forwards',

        // Float effects - for XP gains, toasts
        'float-up': 'float-up 0.6s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',

        // Gentle pulse - for loading, attention
        'gentle-pulse': 'gentle-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breath': 'breath 3s ease-in-out infinite',

        // Counter animation - for numbers
        'counter-pulse': 'counter-pulse 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',

        // Glow effects - reserved for special moments
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'encounter-pulse': 'encounter-pulse 2.5s ease-in-out infinite',

        // Success
        'checkmark': 'checkmark 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'confetti-fall': 'confetti-fall 1s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',

        // Shimmer - subtle loading
        'shimmer': 'shimmer 2.5s ease-in-out infinite',

        // Radar - military tech animations
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'radar-ping': 'radar-ping 2s ease-out infinite',
        'blip-appear': 'blip-appear 0.6s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        'blip-pulse': 'blip-pulse 2s ease-in-out infinite',

        // Reveal - premium unlock moments
        'reveal-expand': 'reveal-expand 0.5s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        'reveal-shimmer': 'reveal-shimmer 0.8s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
      },

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'float-up': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-40px)' },
        },
        'gentle-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'breath': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.02)', opacity: '1' },
        },
        'counter-pulse': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(255, 159, 74, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(255, 159, 74, 0.5)',
          },
        },
        'encounter-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 24px rgba(236, 72, 153, 0.3)',
            transform: 'scale(1)'
          },
          '50%': {
            boxShadow: '0 0 48px rgba(236, 72, 153, 0.5)',
            transform: 'scale(1.02)'
          },
        },
        'checkmark': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },

        // Radar keyframes
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'radar-ping': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '70%': { transform: 'scale(1)', opacity: '0.4' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'blip-appear': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'blip-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(34, 197, 94, 0)' },
        },

        // Reveal keyframes
        'reveal-expand': {
          '0%': { transform: 'scale(0.95)', opacity: '0', filter: 'blur(4px)' },
          '100%': { transform: 'scale(1)', opacity: '1', filter: 'blur(0)' },
        },
        'reveal-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },

      // Shadows - softer, more natural
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'large': '0 8px 40px rgba(0, 0, 0, 0.12)',
        'xl': '0 16px 64px rgba(0, 0, 0, 0.16)',
        'glow-sunrise': '0 0 32px rgba(255, 159, 74, 0.4)',
        'glow-connect': '0 0 32px rgba(20, 184, 166, 0.4)',
        'glow-encounter': '0 0 32px rgba(236, 72, 153, 0.4)',
        'glow-radar': '0 0 12px rgba(34, 197, 94, 0.5)',
        'glow-radar-strong': '0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3)',
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        'up': '0 -4px 24px rgba(0, 0, 0, 0.08)',
      },

      // Border radius - rounder, friendlier
      borderRadius: {
        'sm': '8px',
        'button': '14px',
        'card': '20px',
        'modal': '28px',
        'full': '9999px',
      },

      // Backdrop blur
      backdropBlur: {
        'glass': '24px',
        'subtle': '12px',
      },

      // Min heights for touch targets
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
    },
  },
  plugins: [],
}
