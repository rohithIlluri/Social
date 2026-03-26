import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRankStore } from '@/store/rankStore'
import { InstagramConnect } from '@/components/rank/InstagramConnect'
import { PollCard } from '@/components/rank/PollCard'
import { LeaderBoard } from '@/components/rank/LeaderBoard'
import { GemFeed } from '@/components/rank/GemFeed'
import { ShareModal } from '@/components/rank/ShareModal'
import type { InstagramProfile } from '@/types/rank'
import { haptics } from '@/utils/haptics'

// ─── Tab definition ────────────────────────────────────────────────────────────
type Tab = 'vote' | 'rank' | 'gems'

interface TabConfig {
  id: Tab
  label: string
  emoji: string
}

const TABS: TabConfig[] = [
  { id: 'vote',  label: 'Vote',     emoji: '🗳️' },
  { id: 'rank',  label: 'Rankings', emoji: '🏆' },
  { id: 'gems',  label: 'Gems',     emoji: '💎' },
]

// ─── Tab bar ───────────────────────────────────────────────────────────────────
interface TabBarProps {
  active: Tab
  onChange: (t: Tab) => void
  newGemCount: number
}

function TabBar({ active, onChange, newGemCount }: TabBarProps) {
  return (
    <div
      className="flex gap-1 p-1 rounded-2xl"
      style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)' }}
    >
      {TABS.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => { haptics.subtle(); onChange(tab.id) }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-callout font-semibold transition-all duration-200 relative"
            style={{
              background: isActive ? 'linear-gradient(135deg, #7B61FF, #FF6B9D)' : 'transparent',
              color: isActive ? 'white' : '#71717A',
              boxShadow: isActive ? '0 2px 12px rgba(123,97,255,0.3)' : 'none',
            }}
          >
            <span className="text-base leading-none">{tab.emoji}</span>
            <span>{tab.label}</span>

            {/* Gem badge */}
            {tab.id === 'gems' && newGemCount > 0 && !isActive && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold"
                style={{ fontSize: 9, background: 'linear-gradient(135deg, #FF6B9D, #FF8C42)' }}
              >
                {newGemCount > 9 ? '9+' : newGemCount}
              </motion.span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Floating gem animation after voting ──────────────────────────────────────
function FloatingGem({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1100)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 1, scale: 0.6, y: 0 }}
      animate={{ opacity: 0, scale: 1.6, y: -100 }}
      transition={{ duration: 1.0, ease: [0, 0, 0.2, 1] }}
      className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-5xl"
      aria-hidden
    >
      💎
    </motion.div>
  )
}

// ─── Done state after all polls voted ─────────────────────────────────────────
function AllVotedState({ voteCount, totalPolls, onReset }: {
  voteCount: number; totalPolls: number; onReset: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
      className="flex flex-col items-center justify-center py-16 gap-6 text-center"
    >
      <motion.div
        animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-7xl"
      >
        🎉
      </motion.div>
      <div>
        <h2 className="text-title2 font-bold text-obsidian-900">You're all caught up!</h2>
        <p className="text-callout text-obsidian-400 mt-1.5 leading-relaxed max-w-xs">
          You voted on all {totalPolls} questions and sent <strong>{voteCount} gems</strong> to your network.
        </p>
      </div>
      <div
        className="flex flex-col items-center gap-2 px-6 py-5 rounded-2xl w-full max-w-xs"
        style={{ background: 'rgba(123,97,255,0.06)', border: '1.5px solid rgba(123,97,255,0.12)' }}
      >
        <p className="text-caption text-obsidian-500 font-medium">New questions every day</p>
        <p className="text-title3 font-bold text-obsidian-800">Come back tomorrow 🌅</p>
      </div>
      <button
        onClick={onReset}
        className="text-callout text-obsidian-400 underline underline-offset-2"
      >
        Start from the beginning
      </button>
    </motion.div>
  )
}

// ─── Vote tab ──────────────────────────────────────────────────────────────────
function VoteTab() {
  const { polls, currentPollIndex, advanceToNextPoll, votes, resetPollIndex } = useRankStore()
  const [gemKey, setGemKey] = useState(0)
  const [showGem, setShowGem] = useState(false)

  const currentPoll = polls[currentPollIndex]
  const totalPolls = polls.length
  const votedCount = votes.length

  const handleVoted = useCallback((_profile: InstagramProfile) => {
    setGemKey(k => k + 1)
    setShowGem(true)
    advanceToNextPoll()
  }, [advanceToNextPoll])

  const handleSkip = useCallback(() => {
    haptics.subtle()
    advanceToNextPoll()
  }, [advanceToNextPoll])

  const handleReset = useCallback(() => {
    resetPollIndex()
  }, [resetPollIndex])

  if (!currentPoll) {
    return (
      <AllVotedState
        voteCount={votedCount}
        totalPolls={totalPolls}
        onReset={handleReset}
      />
    )
  }

  return (
    <div className="relative">
      <PollCard
        poll={currentPoll}
        totalPolls={totalPolls}
        votedCount={votedCount}
        onVoted={handleVoted}
        onSkip={handleSkip}
      />
      <AnimatePresence mode="wait">
        {showGem && (
          <motion.div key={gemKey}>
            <FloatingGem onDone={() => setShowGem(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
interface HeaderProps {
  profile: InstagramProfile | null
  onDisconnect: () => void
}

function Header({ profile, onDisconnect }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="flex items-center justify-between py-2">
      {/* App logo + name */}
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-[11px] flex items-center justify-center shadow-sm"
          style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' }}
        >
          <span className="text-lg leading-none">🏆</span>
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

      {/* Profile + menu */}
      {profile && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            style={{ background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.12)' }}
          >
            <div
              className="w-6 h-6 rounded-full p-0.5 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' }}
            >
              <img src={profile.avatarUrl} alt={profile.displayName}
                className="w-full h-full rounded-full object-cover bg-white" />
            </div>
            <span className="text-caption font-bold text-obsidian-700 max-w-[80px] truncate">
              @{profile.username}
            </span>
            <svg className="w-3 h-3 text-obsidian-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
                  className="absolute right-0 top-full mt-2 z-40 w-52 rounded-2xl overflow-hidden shadow-xl"
                  style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)' }}
                >
                  {/* Profile info */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    <p className="text-callout font-bold text-obsidian-800">{profile.displayName}</p>
                    <p className="text-caption text-obsidian-400">@{profile.username}</p>
                  </div>
                  <button
                    onClick={() => { setShowMenu(false); haptics.subtle(); onDisconnect() }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-callout text-rose-500 font-semibold active:bg-rose-50 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Disconnect Instagram
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function InstagramRank() {
  const {
    isConnected,
    currentUser,
    leaderboard,
    gems,
    newGemCount,
    polls,
    connect,
    disconnect,
  } = useRankStore()

  const [activeTab, setActiveTab] = useState<Tab>('vote')
  const [shareOpen, setShareOpen] = useState(false)
  const prevTabRef = useRef<Tab>('vote')

  // Re-initialize when state is rehydrated from localStorage without polls
  useEffect(() => {
    if (isConnected && currentUser && polls.length === 0) {
      connect(currentUser)
    }
  }, [isConnected, currentUser, polls.length, connect])

  const tabDirection = TABS.findIndex(t => t.id === activeTab) >
    TABS.findIndex(t => t.id === prevTabRef.current) ? 1 : -1

  const handleTabChange = (tab: Tab) => {
    prevTabRef.current = activeTab
    setActiveTab(tab)
  }

  if (!isConnected) return <InstagramConnect />

  return (
    <div
      className="min-h-screen tbh-surface pb-28 flex flex-col"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 px-4 safe-top pt-3 pb-3"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Header profile={currentUser} onDisconnect={disconnect} />
        <div className="mt-3">
          <TabBar active={activeTab} onChange={handleTabChange} newGemCount={newGemCount} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4">
          <AnimatePresence mode="wait" custom={tabDirection}>
            {activeTab === 'vote' && (
              <motion.div
                key="vote"
                custom={tabDirection}
                initial={{ opacity: 0, x: tabDirection * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tabDirection * -24 }}
                transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
              >
                <VoteTab />
              </motion.div>
            )}

            {activeTab === 'rank' && (
              <motion.div
                key="rank"
                custom={tabDirection}
                initial={{ opacity: 0, x: tabDirection * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tabDirection * -24 }}
                transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
              >
                <LeaderBoard
                  entries={leaderboard}
                  currentUserId={currentUser?.id}
                  onShare={() => setShareOpen(true)}
                />
              </motion.div>
            )}

            {activeTab === 'gems' && (
              <motion.div
                key="gems"
                custom={tabDirection}
                initial={{ opacity: 0, x: tabDirection * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tabDirection * -24 }}
                transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
              >
                <GemFeed gems={gems} onShare={() => setShareOpen(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Share modal */}
      <ShareModal
        isOpen={shareOpen}
        profile={currentUser}
        onClose={() => setShareOpen(false)}
      />
    </div>
  )
}
