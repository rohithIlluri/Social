import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { RadiusSlider } from '@/components/common/RadiusSlider'
import { useAuth } from '@/hooks/useAuth'
import { useUserStore } from '@/store/userStore'
import { useGameStore } from '@/store/gameStore'
import { BADGES, LEVEL_THRESHOLDS } from '@/types'

export function Profile() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { user, updateUser } = useUserStore()
  const gameStats = useGameStore()
  const [radius, setRadius] = useState(user?.discoveryRadius || 400)
  const [showSettings, setShowSettings] = useState(false)

  if (!user) return null

  const currentLevelXP = LEVEL_THRESHOLDS[user.level - 1] || 0
  const nextLevelXP = LEVEL_THRESHOLDS[user.level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const progress = ((user.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100

  const handleSaveRadius = () => {
    updateUser({ discoveryRadius: radius })
    setShowSettings(false)
  }

  const handleSignOut = () => {
    signOut()
    navigate('/onboarding')
  }

  const earnedBadges = BADGES.filter((badge) => user.badges.includes(badge.id))

  return (
    <div className="min-h-screen safe-top">
      {/* Hero section */}
      <div className="px-6 pt-16 pb-8 text-center">
        {/* Large avatar */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex justify-center mb-6"
        >
          <Avatar nickname={user.nickname} color={user.avatarColor} size="2xl" />
        </motion.div>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-title1 text-white mb-2"
        >
          {user.nickname}
        </motion.h1>

        {/* Level indicator */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-callout text-obsidian-400"
        >
          Level {user.level}
        </motion.p>
      </div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-6 mb-8"
      >
        <div className="card p-6">
          <div className="flex justify-around">
            <div className="text-center">
              <p className="text-title2 text-white">{user.xp}</p>
              <p className="text-caption text-obsidian-400 mt-1">XP</p>
            </div>
            <div className="w-px bg-obsidian-700" />
            <div className="text-center">
              <p className="text-title2 text-white">{user.level}</p>
              <p className="text-caption text-obsidian-400 mt-1">Level</p>
            </div>
            <div className="w-px bg-obsidian-700" />
            <div className="text-center">
              <p className="text-title2 text-white">{gameStats.currentStreak}</p>
              <p className="text-caption text-obsidian-400 mt-1">Streak</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-footnote text-obsidian-400 mb-2">
              <span>Progress to Level {user.level + 1}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-obsidian-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0, 0, 0.2, 1] }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #ff9f4a 0%, #f97316 100%)',
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Badges section */}
      {earnedBadges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-6 mb-8"
        >
          <h2 className="text-title3 text-white mb-4">Badges</h2>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex-shrink-0 card p-4 w-20 text-center"
              >
                <span className="text-3xl">{badge.icon}</span>
                <p className="text-caption text-obsidian-400 mt-2 truncate">{badge.name}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Settings section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-6 space-y-3"
      >
        {/* Discovery radius */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="card w-full p-5 flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-body-medium text-white">Discovery Radius</h3>
            <p className="text-footnote text-obsidian-400">{user.discoveryRadius}m</p>
          </div>
          <svg
            className={`w-5 h-5 text-obsidian-400 transition-transform ${showSettings ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-5 space-y-4"
          >
            <RadiusSlider value={radius} onChange={setRadius} />
            {radius !== user.discoveryRadius && (
              <Button onClick={handleSaveRadius} size="sm" className="w-full">
                Save
              </Button>
            )}
          </motion.div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="card w-full p-5 flex items-center justify-between text-left"
        >
          <span className="text-body-medium text-error">Sign Out</span>
          <svg className="w-5 h-5 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </motion.div>

      {/* Spacer */}
      <div className="h-8" />
    </div>
  )
}
