import { motion, AnimatePresence } from 'framer-motion';
import { getInitials } from '@/utils/nameGenerator';
import { bounceInVariants } from '@/utils/animations';

interface AvatarProps {
  nickname: string;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showInitials?: boolean;
  isSilhouette?: boolean;
  revealLevel?: 0 | 1 | 3 | 5 | 10; // Progressive reveal levels
  className?: string;
  animate?: boolean; // Whether to animate on mount
}

export function Avatar({
  nickname,
  color,
  size = 'md',
  showInitials = true,
  isSilhouette = false,
  revealLevel = 10,
  className = '',
  animate = false,
}: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
    '2xl': 'w-32 h-32 text-2xl',
  };

  // Silhouette state (Level 0)
  if (isSilhouette || revealLevel === 0) {
    return (
      <motion.div
        className={`${sizes[size]} silhouette ${className}`}
        variants={animate ? bounceInVariants : undefined}
        initial={animate ? 'hidden' : undefined}
        animate={animate ? 'visible' : undefined}
      >
        {/* Person icon */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-3/5 h-3/5 text-slate-500"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>

        {/* Pulsing glow ring */}
        <div className="pulse-ring inset-0 bg-slate-600/30" />
      </motion.div>
    );
  }

  // Determine gradient based on reveal level
  const getGradient = () => {
    if (revealLevel === 1) {
      // Level 1: Just color gradient, no initials
      return `linear-gradient(135deg, ${color} 0%, ${adjustColorBrightness(color, -20)} 100%)`;
    } else if (revealLevel >= 3) {
      // Level 3+: Full gradient with potential enhancements
      return `linear-gradient(135deg, ${color} 0%, ${adjustColorBrightness(color, -20)} 100%)`;
    }
    return color;
  };

  // Determine if we should show border glow (Level 5+)
  const showGlow = revealLevel >= 5;

  // Determine if we should show rainbow shimmer (Level 10)
  const showRainbow = revealLevel >= 10;

  return (
    <motion.div
      className={`${sizes[size]} relative ${className}`}
      variants={animate ? bounceInVariants : undefined}
      initial={animate ? 'hidden' : undefined}
      animate={animate ? 'visible' : undefined}
    >
      {/* Avatar circle */}
      <div
        className={`
          w-full h-full rounded-full flex items-center justify-center
          font-semibold text-white shadow-medium relative overflow-hidden
          ${showGlow ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''}
        `}
        style={{
          background: getGradient(),
          ...(showGlow && !showRainbow ? { '--tw-ring-color': color } as any : {}),
        }}
      >
        {/* Rainbow ring for Level 10 */}
        {showRainbow && (
          <div className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-slate-900 animate-gradient-rotate"
            style={{
              background: 'linear-gradient(90deg, #fb923c, #ec4899, #2dd4bf, #fb923c)',
              backgroundSize: '300% 300%',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              padding: '2px',
            }}
          />
        )}

        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent" />

        {/* Show initials based on reveal level */}
        <AnimatePresence mode="wait">
          {showInitials && revealLevel >= 3 && (
            <motion.span
              key="initials"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative z-10"
              style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
            >
              {getInitials(nickname)}
            </motion.span>
          )}

          {/* Level 1: Show just a colored dot instead of initials */}
          {revealLevel === 1 && (
            <motion.div
              key="dot"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-1/3 h-1/3 rounded-full bg-white/30"
            />
          )}
        </AnimatePresence>

        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%', opacity: 0 }}
          whileHover={{ x: '100%', opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </div>

      {/* Outer glow effect for higher levels */}
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full blur-md opacity-50 -z-10"
          style={{
            background: showRainbow
              ? 'linear-gradient(90deg, #fb923c, #ec4899, #2dd4bf, #fb923c)'
              : color,
            animation: showRainbow ? 'gradient-rotate 3s linear infinite' : undefined,
            backgroundSize: showRainbow ? '300% 300%' : undefined,
          }}
        />
      )}
    </motion.div>
  );
}

/**
 * Helper function to adjust color brightness
 */
function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Adjust brightness
  const adjust = (color: number) => {
    const adjusted = color + (color * percent) / 100;
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  const newR = adjust(r);
  const newG = adjust(g);
  const newB = adjust(b);

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}
