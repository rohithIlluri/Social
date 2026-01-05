import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/utils/haptics';
import { buttonVariants, transitions } from '@/utils/animations';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading,
  loadingText,
  icon,
  iconPosition = 'left',
  fullWidth,
  className = '',
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Haptic feedback on tap
    haptics.light();

    // Call original onClick if provided
    if (onClick && !disabled && !isLoading) {
      onClick(e);
    }
  };

  // Base styles - 44px minimum touch target
  const baseStyles = 'btn-base font-medium no-select flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

  // Variant styles with gradients and shadows
  const variants = {
    primary: 'gradient-sunrise text-white shadow-glow-sunrise hover:shadow-glow-sunrise/60',
    secondary: 'glass-light text-white border border-white/10 hover:border-white/20',
    ghost: 'bg-transparent text-slate-300 hover:bg-slate-800/50',
    danger: 'bg-gradient-to-r from-error to-red-600 text-white shadow-lg hover:shadow-xl',
  };

  // Size styles
  const sizes = {
    sm: 'text-callout px-4 h-10',
    md: 'text-body px-6 h-12',
    lg: 'text-body-bold px-8 h-14',
  };

  // Icon size based on button size
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <motion.button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      onClick={handleClick}
      variants={buttonVariants}
      initial="idle"
      whileTap={disabled || isLoading ? undefined : "press"}
      transition={transitions.press}
      {...props}
    >
      {/* Loading state */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={transitions.fade}
            className="flex items-center justify-center gap-2"
          >
            <svg
              className={`animate-spin ${iconSizes[size]}`}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText && <span>{loadingText}</span>}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={transitions.fade}
            className="flex items-center justify-center gap-2"
          >
            {/* Icon on left */}
            {icon && iconPosition === 'left' && (
              <span className={iconSizes[size]}>{icon}</span>
            )}

            {/* Button text */}
            <span>{children}</span>

            {/* Icon on right */}
            {icon && iconPosition === 'right' && (
              <span className={iconSizes[size]}>{icon}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shine effect on hover for primary button */}
      {variant === 'primary' && !disabled && !isLoading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </motion.button>
  );
}
