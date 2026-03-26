import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRankStore } from '@/store/rankStore'
import { InstagramConnect } from '@/components/rank/InstagramConnect'
import { PollCard } from '@/components/rank/PollCard'
import { LeaderBoard } from '@/components/rank/LeaderBoard'
import { GemFeed } from '@/components/rank/GemFeed'
import type { InstagramProfile } from '@/types/rank'
import { haptics } from '@/utils/haptics'

type Tab = 'vote' | 'rank' | 'gems'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'vote', label: 'Vote', emoji: '🗳️' },
  { id: 'rank', label: 'Rankings', emoji: '🏆' },
  { id: 'gems', label: 'Gems', emoji: '💎' },
]

// Floating gem that appears after voting
function FloatingGem({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 1, scale: 0.5, y: 0 }}
      animate={{ opacity: 0, scale: 1.4, y: -90 }}
      transition={{ duration: 1.1, ease: [0, 0, 0.2, 1] }}
      className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-4xl"
    >
      💎
    </motion.div>
  )
}

function VoteTab() {
  const { polls, currentPollIndex, advanceToNextPoll, votes } = useRankStore()
  const [showFloatingGem, setShowFloatingGem] = useState(false)
  const [voteCount, setVoteCount] = useState(0)

  const currentPoll = polls[currentPollIndex]
  const totalPolls = polls.length

  const handleVoted = useCallback((_profile: InstagramProfile) => {
    setVoteCount(c => c + 1)
    setShowFloatingGem(true)
    setTimeout(() => {
      advanceToNextPoll()
    }, 50)
  }, [advanceToNextPoll])

  if (!currentPoll) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 gap-6"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-6xl"
        >
          🎉
        </motion.div>
        <div className="text-center">
          <p className="text-title2 font-bold text-obsidian-800">All done!</p>
          <p className="text-callout text-obsidian-400 mt-1">You've voted on every question.</p>
          <p className="text-callout text-obsidian-400">Come back tomorrow for more!</p>
        </div>
        <div className="text-callout text-obsidian-400 mt-2">
          Total votes sent: {votes.length} 💎
        </div>
      </motion.div>
    )
  }

  const votedCount = votes.length
  const progressPct = totalPolls > 0 ? Math.min((votedCount / totalPolls) * 100, 100) : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-obsidian-100 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7B61FF, #FF6B9D)' }}
          />
        </div>
        <span className="text-caption text-obsidian-400 flex-shrink-0">
          {votedCount}/{totalPolls}
        </span>
      </div>

      {/* Poll card */}
      <AnimatePresence mode="wait">
        <PollCard
          key={currentPoll.id}
          poll={currentPoll}
          onVoted={handleVoted}
        />
      </AnimatePresence>

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={() => {
          haptics.subtle()
          advanceToNextPoll()
        }}
        className="mx-auto text-callout text-obsidian-400 py-2 px-6"
      >
        Skip this question →
      </motion.button>

      {/* Floating gem on vote */}
      <AnimatePresence>
        {showFloatingGem && (
          <FloatingGem key={voteCount} onDone={() => setShowFloatingGem(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function TabBar({ active, onChange, newGemCount }: {
  active: Tab
  onChange: (t: Tab) => void
  newGemCount: number
}) {
  return (
    <div
      className="flex rounded-2xl p-1 gap-1 sticky top-0 z-20 bg-white/90"
      style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      {TABS.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => {
              haptics.subtle()
              onChange(tab.id)
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-callout font-semibold transition-all duration-200 relative ${
              isActive ? 'text-white' : 'text-obsidian-500'
            }`}
            style={isActive ? { background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' } : {}}
          >
            <span className="text-base">{tab.emoji}</span>
            <span>{tab.label}</span>
            {/* Gem badge */}
            {tab.id === 'gems' && newGemCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-tbh-candy text-white text-caption font-bold flex items-center justify-center"
              >
                {newGemCount > 9 ? '9+' : newGemCount}
              </motion.div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function ProfileHeader({ profile }: { profile: InstagramProfile }) {
  const { disconnect } = useRankStore()

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full p-0.5"
          style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' }}
        >
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="w-full h-full rounded-full object-cover bg-white"
          />
        </div>
        <div>
          <p className="text-callout font-bold text-obsidian-800 leading-tight">
            {profile.displayName}
          </p>
          <p className="text-caption text-obsidian-400">@{profile.username}</p>
        </div>
      </div>

      <button
        onClick={() => {
          haptics.subtle()
          disconnect()
        }}
        className="text-caption text-obsidian-400 px-3 py-1.5 rounded-full bg-obsidian-100"
      >
        Disconnect
      </button>
    </div>
  )
}

export function InstagramRank() {
  const {
    isConnected,
    currentUser,
    leaderboard,
    gems,
    newGemCount,
    polls,
    currentPollIndex,
    connect,
  } = useRankStore()

  const [activeTab, setActiveTab] = useState<Tab>('vote')

  // Re-initialize when reconnecting (e.g. persisted state without polls)
  useEffect(() => {
    if (isConnected && currentUser && polls.length === 0) {
      connect(currentUser)
    }
  }, [isConnected, currentUser, polls.length, connect])

  if (!isConnected) {
    return <InstagramConnect />
  }

  const currentPoll = polls[currentPollIndex]

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-4 pt-safe-top pt-4">
        {/* App title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' }}
            >
              <span className="text-sm">🏆</span>
            </div>
            <h1
              className="text-title3 font-bold"
              style={{
                background: 'linear-gradient(90deg, #7B61FF, #FF6B9D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              LinkRank
            </h1>
          </div>

          {currentUser && <ProfileHeader profile={currentUser} />}
        </div>

        {/* Tab bar */}
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          newGemCount={newGemCount}
        />
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'vote' && (
            <motion.div
              key="vote"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            >
              <VoteTab />
            </motion.div>
          )}

          {activeTab === 'rank' && (
            <motion.div
              key="rank"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            >
              <LeaderBoard
                entries={leaderboard}
                currentUserId={currentUser?.id}
              />
            </motion.div>
          )}

          {activeTab === 'gems' && (
            <motion.div
              key="gems"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            >
              <GemFeed gems={gems} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
