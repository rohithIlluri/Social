import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapView } from '@/components/map/MapView'
import { RevealModal } from '@/components/encounters/RevealModal'
import { EmptyState } from '@/components/common/EmptyState'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useEncounters } from '@/hooks/useEncounters'
import { useUserStore } from '@/store/userStore'
import { useGameStore } from '@/store/gameStore'
import { useToast } from '@/context/ToastContext'
import { haptics } from '@/utils/haptics'
import { sendReaction, getRevealLevel } from '@/services/interactions'
import type { NearbyUser } from '@/types'

export function Home() {
  const { user } = useUserStore()
  const { checkStreak } = useGameStore()
  // Use autoStart for automatic tracking with proper cleanup
  const { latitude, longitude, error, isTracking, startTracking } = useGeolocation({ autoStart: true })
  const { nearbyUsers } = useEncounters(latitude, longitude)
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null)
  const [showRevealModal, setShowRevealModal] = useState(false)
  const prevUserCountRef = useRef(0)
  const toast = useToast()

  // Check streak on mount (tracking handled by hook)
  useEffect(() => {
    checkStreak()
  }, [checkStreak])

  // Haptic feedback when new users appear
  useEffect(() => {
    if (nearbyUsers.length > prevUserCountRef.current && prevUserCountRef.current > 0) {
      haptics.radarPing()
    }
    prevUserCountRef.current = nearbyUsers.length
  }, [nearbyUsers.length])

  const handleBlipClick = (nearbyUser: NearbyUser) => {
    haptics.subtle()
    setSelectedUser(nearbyUser)
    setShowRevealModal(true)
  }

  const handleInteract = async (nearbyUser: NearbyUser) => {
    if (!user || !latitude || !longitude) return

    haptics.connection()

    try {
      await sendReaction(
        user.id,
        nearbyUser,
        '👋',
        'Wave',
        { lat: latitude, lng: longitude }
      )

      // Fetch updated reveal level
      const newRevealLevel = await getRevealLevel(user.id, nearbyUser.id)

      // Show appropriate message based on progress
      if (newRevealLevel === 1) {
        toast.success(`Said hello to someone new!`)
      } else if (newRevealLevel === 3) {
        toast.success(`${nearbyUser.nickname}'s interests revealed!`)
      } else if (newRevealLevel === 5) {
        toast.success(`${nearbyUser.nickname}'s profile unlocked!`)
      } else {
        toast.success(`Waved at ${nearbyUser.nickname}`)
      }
    } catch (error) {
      console.error('Failed to send interaction:', error)
      toast.error('Failed to send interaction')
    }

    setShowRevealModal(false)
  }

  const handleCloseReveal = () => {
    setShowRevealModal(false)
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian-950">
        <EmptyState
          icon={
            <div className="w-24 h-24 rounded-full bg-obsidian-800/50 border border-obsidian-700/50 flex items-center justify-center">
              <svg className="w-12 h-12 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <line x1="4" y1="4" x2="20" y2="20" />
              </svg>
            </div>
          }
          title="Location needed"
          description={error}
          action={{ label: 'Enable Location', onClick: startTracking }}
        />
      </div>
    )
  }

  // Loading state - minimal radar aesthetic
  if (!latitude || !longitude) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-obsidian-950 radar-screen">
        {/* Animated radar rings */}
        <div className="relative w-48 h-48">
          {[40, 60, 80, 100].map((percent, i) => (
            <motion.div
              key={percent}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.3 - i * 0.05 }}
              transition={{
                delay: i * 0.15,
                duration: 0.6,
                ease: [0, 0, 0.2, 1],
              }}
              className="absolute inset-0 m-auto rounded-full border border-radar-ring"
              style={{
                width: `${percent}%`,
                height: `${percent}%`,
              }}
            />
          ))}

          {/* Rotating sweep */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(34, 197, 94, 0.15) 0deg, transparent 60deg)',
            }}
          />

          {/* Center pulse */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-radar-blip"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-radar-blip shadow-glow-radar" />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-callout text-obsidian-400"
        >
          Locating you...
        </motion.p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0">
      {/* Full-screen radar map */}
      <MapView
        latitude={latitude}
        longitude={longitude}
        radius={user?.discoveryRadius || 400}
        nearbyUsers={nearbyUsers}
        onUserClick={handleBlipClick}
        isScanning={isTracking}
      />

      {/* Floating status pill */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0, 0, 0.2, 1] }}
        className="absolute top-6 left-1/2 -translate-x-1/2 safe-top z-20"
      >
        <div className="glass-radar rounded-full px-4 py-2 flex items-center gap-3">
          {/* Status indicator */}
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-radar-blip' : 'bg-error'}`} />
            {isTracking && (
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-radar-blip"
              />
            )}
          </div>

          {/* Status text */}
          <span className="text-callout text-white/80">
            {nearbyUsers.length > 0 ? (
              <span>
                <span className="text-radar-blip font-medium">{nearbyUsers.length}</span>
                {' '}nearby
              </span>
            ) : (
              'Scanning...'
            )}
          </span>
        </div>
      </motion.div>

      {/* Empty state hint - shows when no users nearby after initial scan */}
      <AnimatePresence>
        {nearbyUsers.length === 0 && isTracking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 2, duration: 0.4, ease: [0, 0, 0.2, 1] }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="glass-subtle rounded-card px-6 py-4 text-center max-w-xs">
              <p className="text-body text-obsidian-300">
                No one nearby yet
              </p>
              <p className="text-footnote text-obsidian-500 mt-1">
                Keep moving to discover people
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal modal - opened when tapping a blip */}
      <RevealModal
        user={selectedUser}
        isOpen={showRevealModal}
        onClose={handleCloseReveal}
        onInteract={handleInteract}
      />
    </div>
  )
}
