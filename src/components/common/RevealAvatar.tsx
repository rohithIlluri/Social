import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getInitials } from '@/utils/nameGenerator'
import { adjustColorBrightness } from '@/utils/colors'

export type RevealStage = 'silhouette' | 'color' | 'partial' | 'full'

interface RevealAvatarProps {
  nickname: string
  color: string
  stage: RevealStage
  size?: 'md' | 'lg' | 'xl' | '2xl'
}

const sizeClasses = {
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
  '2xl': 'w-40 h-40',
}

const initialsSize = {
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-3xl',
  '2xl': 'text-4xl',
}

/**
 * RevealAvatar - Progressive identity reveal with premium animations
 *
 * Stages:
 * - silhouette: Gray person icon, pulsing ring
 * - color: Colored gradient, no initials
 * - partial: Color + initials + shimmer
 * - full: Full reveal with glow effect
 */
export const RevealAvatar = memo(function RevealAvatar({
  nickname,
  color,
  stage,
  size = 'xl',
}: RevealAvatarProps) {
  const initials = getInitials(nickname)
  const isSilhouette = stage === 'silhouette'
  const showColor = stage !== 'silhouette'
  const showInitials = stage === 'partial' || stage === 'full'
  const showGlow = stage === 'full'

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      {/* Outer glow ring (full reveal only) */}
      <AnimatePresence>
        {showGlow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
            className="absolute -inset-3 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color}50 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Scanning ring (silhouette only) */}
      <AnimatePresence>
        {isSilhouette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-1 rounded-full border border-obsidian-600"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, rgba(113, 113, 122, 0.3) 0deg, transparent 90deg)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main avatar circle */}
      <motion.div
        className="relative w-full h-full rounded-full overflow-hidden"
        animate={{
          background: isSilhouette
            ? 'linear-gradient(135deg, #3f3f46 0%, #27272a 100%)'
            : `linear-gradient(135deg, ${color} 0%, ${adjustColorBrightness(color, -20)} 100%)`,
        }}
        transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
      >
        {/* Silhouette person icon */}
        <AnimatePresence mode="wait">
          {isSilhouette && (
            <motion.div
              key="silhouette"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <svg
                className="w-1/2 h-1/2 text-obsidian-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Color reveal shimmer effect */}
        <AnimatePresence>
          {showColor && !isSilhouette && (
            <motion.div
              key="shimmer"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          )}
        </AnimatePresence>

        {/* Initials */}
        <AnimatePresence mode="wait">
          {showInitials && (
            <motion.div
              key="initials"
              initial={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span
                className={`font-semibold text-white ${initialsSize[size]}`}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
              >
                {initials}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inner highlight for depth */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-50" />
      </motion.div>
    </div>
  )
})

/**
 * Map reveal level (0, 1, 3, 5, 10) to stage
 */
export function getRevealStage(revealLevel: number): RevealStage {
  if (revealLevel === 0) return 'silhouette'
  if (revealLevel < 3) return 'color'
  if (revealLevel < 5) return 'partial'
  return 'full'
}
