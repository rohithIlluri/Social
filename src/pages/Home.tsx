import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapView } from '@/components/map/MapView'
import { InteractionPanel } from '@/components/encounters/InteractionPanel'
import { Modal } from '@/components/common/Modal'
import { Avatar } from '@/components/common/Avatar'
import { Skeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useEncounters } from '@/hooks/useEncounters'
import { useUserStore } from '@/store/userStore'
import { useGameStore } from '@/store/gameStore'
import { useToast } from '@/context/ToastContext'
import { REVEAL_LEVEL_COLOR } from '@/utils/constants'
import type { NearbyUser } from '@/types'

export function Home() {
  const { user } = useUserStore()
  const { checkStreak } = useGameStore()
  const { latitude, longitude, error, isTracking, startTracking } = useGeolocation()
  const { nearbyUsers } = useEncounters(latitude, longitude)
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showInteractionPanel, setShowInteractionPanel] = useState(false)
  const toast = useToast()

  useEffect(() => {
    startTracking()
    checkStreak()
  }, [startTracking, checkStreak])

  // Reset selected index when users change
  useEffect(() => {
    if (selectedIndex >= nearbyUsers.length) {
      setSelectedIndex(Math.max(0, nearbyUsers.length - 1))
    }
  }, [nearbyUsers.length, selectedIndex])

  const currentUser = nearbyUsers[selectedIndex]

  const handleUserClick = (nearbyUser: NearbyUser) => {
    setSelectedUser(nearbyUser)
    setShowInteractionPanel(true)
  }

  const handleSendReaction = (emoji: string, _label: string) => {
    toast.success(`${emoji} sent`)
    setShowInteractionPanel(false)
  }

  const handleSendIceBreaker = (_prompt: string, _answer: string) => {
    toast.success('Ice breaker sent')
    setShowInteractionPanel(false)
  }

  const handleStartGame = (_game: 'rps' | 'emoji' | 'trivia') => {
    toast.show('Game invite sent')
    setShowInteractionPanel(false)
  }

  const nextUser = () => {
    if (selectedIndex < nearbyUsers.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  const prevUser = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        icon={
          <div className="w-20 h-20 rounded-full bg-obsidian-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-obsidian-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <line x1="4" y1="4" x2="20" y2="20" />
            </svg>
          </div>
        }
        title="Location needed"
        description={error}
        action={{ label: 'Enable Location', onClick: startTracking }}
      />
    )
  }

  // Loading state
  if (!latitude || !longitude) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 relative">
          <Skeleton className="absolute inset-0 rounded-none" />
        </div>
        <div className="p-6">
          <Skeleton.EncounterCard />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Map - takes most of the screen */}
      <div className="flex-1 relative" style={{ minHeight: '60vh' }}>
        <MapView
          latitude={latitude}
          longitude={longitude}
          radius={user?.discoveryRadius || 400}
          nearbyUsers={nearbyUsers}
          onUserClick={handleUserClick}
        />

        {/* Minimal status pill */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 safe-top">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-full px-4 py-2 flex items-center gap-3"
          >
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-success animate-breath' : 'bg-error'}`} />
            <span className="text-callout text-white/80">
              {nearbyUsers.length > 0 ? `${nearbyUsers.length} nearby` : 'Scanning'}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Bottom card area */}
      <div className="relative z-10 -mt-8">
        <AnimatePresence mode="wait">
          {nearbyUsers.length > 0 && currentUser ? (
            <motion.div
              key={currentUser.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="mx-4"
            >
              {/* Hero encounter card */}
              <div className="card-elevated p-8 text-center">
                {/* Navigation dots */}
                {nearbyUsers.length > 1 && (
                  <div className="flex justify-center gap-1.5 mb-6">
                    {nearbyUsers.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-base ${
                          i === selectedIndex ? 'bg-sunrise-400 w-4' : 'bg-obsidian-600'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Large avatar */}
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="flex justify-center mb-6"
                >
                  <Avatar
                    nickname={currentUser.nickname}
                    color={currentUser.avatarColor}
                    size="2xl"
                    isSilhouette={currentUser.revealLevel < REVEAL_LEVEL_COLOR}
                  />
                </motion.div>

                {/* Name */}
                <h2 className="text-title2 text-white mb-1">{currentUser.nickname}</h2>

                {/* Distance */}
                <p className="text-callout text-obsidian-400 mb-6">{currentUser.distance}m away</p>

                {/* Interests */}
                {currentUser.interests && currentUser.interests.length > 0 && (
                  <div className="flex justify-center flex-wrap gap-2 mb-8">
                    {currentUser.interests.slice(0, 3).map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 bg-obsidian-700 rounded-full text-footnote text-obsidian-300"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}

                {/* Connect button */}
                <button
                  onClick={() => handleUserClick(currentUser)}
                  className="btn-primary w-full text-body-bold"
                >
                  Connect
                </button>

                {/* Swipe hint for multiple users */}
                {nearbyUsers.length > 1 && (
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={prevUser}
                      disabled={selectedIndex === 0}
                      className={`touch-target flex items-center justify-center ${
                        selectedIndex === 0 ? 'opacity-30' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={nextUser}
                      disabled={selectedIndex === nearbyUsers.length - 1}
                      className={`touch-target flex items-center justify-center ${
                        selectedIndex === nearbyUsers.length - 1 ? 'opacity-30' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4"
            >
              <div className="card-elevated p-8 text-center">
                <p className="text-body text-obsidian-400">
                  No one nearby yet
                </p>
                <p className="text-footnote text-obsidian-500 mt-2">
                  Keep exploring to find friends
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-6" />

      {/* Interaction panel modal */}
      <Modal
        isOpen={showInteractionPanel && !!selectedUser}
        onClose={() => setShowInteractionPanel(false)}
      >
        {selectedUser && (
          <InteractionPanel
            targetUser={selectedUser}
            onSendReaction={handleSendReaction}
            onSendIceBreaker={handleSendIceBreaker}
            onStartGame={handleStartGame}
            onClose={() => setShowInteractionPanel(false)}
          />
        )}
      </Modal>
    </div>
  )
}
