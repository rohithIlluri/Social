import { motion } from 'framer-motion'
import type { NearbyUser } from '@/types'
import { haptics } from '@/utils/haptics'

interface RadarBlipProps {
  user: NearbyUser
  isNew?: boolean
  onClick: (user: NearbyUser) => void
}

/**
 * RadarBlip - A pulsing radar marker for nearby users
 *
 * Features:
 * - Pulsing ping animation
 * - Green glow effect
 * - Distance label
 * - Haptic feedback on tap
 * - Entrance animation for new blips
 */
export function RadarBlip({ user, isNew = false, onClick }: RadarBlipProps) {
  const handleClick = () => {
    haptics.subtle()
    onClick(user)
  }

  // Format distance display
  const formatDistance = (meters: number): string => {
    if (meters < 100) {
      return `${Math.round(meters)}m`
    } else if (meters < 1000) {
      return `${Math.round(meters / 10) * 10}m`
    } else {
      return `${(meters / 1000).toFixed(1)}km`
    }
  }

  return (
    <motion.button
      initial={isNew ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        duration: 0.4,
        ease: [0, 0, 0.2, 1],
      }}
      onClick={handleClick}
      className="relative flex flex-col items-center touch-target"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Ping ripple effect */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.6 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="absolute top-0 w-4 h-4 rounded-full bg-radar-blip"
      />

      {/* Secondary ping (offset timing) */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.4 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut',
          delay: 0.5,
        }}
        className="absolute top-0 w-4 h-4 rounded-full bg-radar-blip"
      />

      {/* Main blip */}
      <motion.div
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.1 }}
        className="relative w-4 h-4 rounded-full bg-radar-blip shadow-glow-radar"
      >
        {/* Inner gradient highlight */}
        <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
      </motion.div>

      {/* Distance label */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute -bottom-5 whitespace-nowrap text-[10px] font-medium text-radar-blip/80"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
      >
        {formatDistance(user.distance)}
      </motion.span>
    </motion.button>
  )
}

/**
 * RadarBlipCluster - For when multiple users are very close together
 * Shows a count badge instead of individual blips
 */
interface RadarBlipClusterProps {
  users: NearbyUser[]
  onClick: (users: NearbyUser[]) => void
}

export function RadarBlipCluster({ users, onClick }: RadarBlipClusterProps) {
  const handleClick = () => {
    haptics.medium()
    onClick(users)
  }

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        duration: 0.4,
        ease: [0, 0, 0.2, 1],
      }}
      onClick={handleClick}
      className="relative flex flex-col items-center touch-target"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Larger ping effect for clusters */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="absolute w-6 h-6 rounded-full bg-radar-blip"
      />

      {/* Cluster indicator */}
      <motion.div
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.1 }}
        className="relative w-7 h-7 rounded-full bg-radar-blip shadow-glow-radar-strong flex items-center justify-center"
      >
        <span className="text-[11px] font-bold text-obsidian-950">
          {users.length}
        </span>
      </motion.div>

      {/* Label */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute -bottom-5 whitespace-nowrap text-[10px] font-medium text-radar-blip/80"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
      >
        {users.length} nearby
      </motion.span>
    </motion.button>
  )
}
