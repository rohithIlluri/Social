import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { NearbyUser } from '@/types'
import { RevealAvatar, getRevealStage, type RevealStage } from '@/components/common/RevealAvatar'
import { Button } from '@/components/common/Button'
import { haptics } from '@/utils/haptics'

interface RevealModalProps {
  user: NearbyUser | null
  isOpen: boolean
  onClose: () => void
  onInteract: (user: NearbyUser) => void
}

// Format distance for display
function formatDistance(meters: number): string {
  if (meters < 100) {
    return `${Math.round(meters)}m away`
  } else if (meters < 1000) {
    return `${Math.round(meters / 10) * 10}m away`
  } else {
    return `${(meters / 1000).toFixed(1)}km away`
  }
}

// Get CTA text based on stage
function getCtaText(stage: RevealStage): string {
  switch (stage) {
    case 'silhouette':
      return 'Say Hello'
    case 'color':
      return 'Wave'
    case 'partial':
      return 'Connect'
    case 'full':
      return 'Send Message'
  }
}

/**
 * RevealModal - Premium tap-to-reveal interaction flow
 *
 * Shows progressive identity reveal with satisfying animations
 */
export function RevealModal({ user, isOpen, onClose, onInteract }: RevealModalProps) {
  const [stage, setStage] = useState<RevealStage>('silhouette')

  // Update stage based on reveal level
  useEffect(() => {
    if (user) {
      const newStage = getRevealStage(user.revealLevel || 0)
      setStage(newStage)

      // Trigger haptic on reveal
      if (newStage !== 'silhouette') {
        haptics.reveal()
      }
    }
  }, [user])

  const handleInteract = () => {
    if (!user) return
    haptics.success()
    onInteract(user)
  }

  const handleClose = () => {
    haptics.subtle()
    onClose()
  }

  if (!user) return null

  const stages: RevealStage[] = ['silhouette', 'color', 'partial', 'full']
  const currentStageIndex = stages.indexOf(stage)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-obsidian-950/90 backdrop-blur-xl"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal content */}
          <motion.div
            className="relative z-10 w-full max-w-[320px]"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          >
            {/* Gradient border glow */}
            <div className="absolute -inset-px rounded-[28px] bg-gradient-to-b from-white/10 to-transparent" />

            {/* Card content */}
            <div className="relative reveal-card rounded-[28px] p-8 text-center overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-obsidian-500 hover:text-obsidian-300 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {/* Avatar with reveal animation */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0, 0, 0.2, 1] }}
              >
                <RevealAvatar
                  nickname={user.nickname}
                  color={user.avatarColor}
                  stage={stage}
                  size="2xl"
                />
              </motion.div>

              {/* Name / Mystery text */}
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: [0, 0, 0.2, 1] }}
              >
                {stage === 'silhouette' ? (
                  <div className="h-7 w-32 mx-auto bg-obsidian-700/50 rounded-full animate-pulse" />
                ) : (
                  <h2 className="text-title2 text-white">{user.nickname}</h2>
                )}
              </motion.div>

              {/* Distance */}
              <motion.p
                className="text-callout text-obsidian-400 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                {formatDistance(user.distance)}
              </motion.p>

              {/* Interests (shown at partial+ stage) */}
              <AnimatePresence>
                {(stage === 'partial' || stage === 'full') && user.interests && user.interests.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: 0.3, duration: 0.4, ease: [0, 0, 0.2, 1] }}
                    className="flex flex-wrap justify-center gap-2 mt-6"
                  >
                    {user.interests.slice(0, 3).map((interest, i) => (
                      <motion.span
                        key={interest}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 + i * 0.05 }}
                        className="px-3 py-1 bg-obsidian-800 rounded-full text-footnote text-obsidian-300"
                      >
                        {interest}
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4, ease: [0, 0, 0.2, 1] }}
                className="mt-8"
              >
                <Button onClick={handleInteract} className="w-full">
                  {getCtaText(stage)}
                </Button>
              </motion.div>

              {/* Progress indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="flex justify-center gap-1.5 mt-6"
              >
                {stages.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={false}
                    animate={{
                      width: i <= currentStageIndex ? 24 : 6,
                      backgroundColor: i <= currentStageIndex ? '#22c55e' : '#3f3f46',
                    }}
                    transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
                    className="h-1 rounded-full"
                  />
                ))}
              </motion.div>

              {/* Hint text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="text-caption text-obsidian-500 mt-4"
              >
                {stage === 'silhouette'
                  ? 'Interact to reveal their identity'
                  : stage === 'full'
                  ? 'Full profile unlocked!'
                  : `${5 - (user.revealLevel || 0)} more interactions to unlock`}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
