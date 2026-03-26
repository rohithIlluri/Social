import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RankEntry, PollCategory } from '@/types/rank'
import { CATEGORY_LABELS, CATEGORY_EMOJIS } from '@/services/instagramMock'

interface LeaderBoardProps {
  entries: RankEntry[]
  currentUserId: string | undefined
}

const CATEGORIES: (PollCategory | 'all')[] = [
  'all', 'viral', 'creative', 'funny', 'aesthetic',
  'inspiring', 'adventurous', 'social', 'trendsetter',
]

const MEDAL_GRADIENTS: [string, string][] = [
  ['#FFD23F', '#FF8C42'],   // Gold
  ['#C0C0C0', '#9CA3AF'],   // Silver
  ['#CD7F32', '#A05C1A'],   // Bronze
]

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const [from, to] = MEDAL_GRADIENTS[rank - 1]
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: rank * 0.05 }}
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-subhead shadow-md flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {rank}
      </motion.div>
    )
  }

  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-subhead text-obsidian-400 flex-shrink-0"
      style={{ background: 'rgba(0,0,0,0.04)' }}
    >
      {rank}
    </div>
  )
}

function WeeklyChange({ change }: { change: number }) {
  if (change === 0) return null
  const isUp = change > 0
  return (
    <div className={`flex items-center gap-0.5 text-caption font-medium ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        {isUp
          ? <path d="M7 14l5-5 5 5z" />
          : <path d="M7 10l5 5 5-5z" />
        }
      </svg>
      {Math.abs(change)}
    </div>
  )
}

function EntryCard({ entry, index, isMe }: { entry: RankEntry; index: number; isMe: boolean }) {
  const [from, to] = entry.gradient

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0, 0, 0.2, 1] }}
      className={`flex items-center gap-3 p-3 rounded-2xl ${isMe ? 'ring-2' : ''}`}
      style={{
        background: isMe ? 'rgba(123,97,255,0.06)' : 'rgba(0,0,0,0.02)',
        ringColor: isMe ? '#7B61FF' : undefined,
      }}
    >
      {/* Rank */}
      <RankBadge rank={entry.rank} />

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-11 h-11 rounded-full p-0.5"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          <img
            src={entry.profile.avatarUrl}
            alt={entry.profile.displayName}
            className="w-full h-full rounded-full object-cover bg-white"
          />
        </div>
        {isMe && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-tbh-violet flex items-center justify-center">
            <span className="text-white" style={{ fontSize: '8px', fontWeight: 700 }}>ME</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-callout font-bold text-obsidian-900 truncate">
            {entry.profile.displayName}
          </p>
          {entry.profile.isVerified && (
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#7B61FF">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-caption text-obsidian-400">
            {CATEGORY_EMOJIS[entry.topCategory]} {CATEGORY_LABELS[entry.topCategory]}
          </span>
        </div>
      </div>

      {/* Gem count + change */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-base">💎</span>
          <span className="text-callout font-bold text-obsidian-800">{entry.gemCount}</span>
        </div>
        <WeeklyChange change={entry.weeklyChange} />
      </div>
    </motion.div>
  )
}

export function LeaderBoard({ entries, currentUserId }: LeaderBoardProps) {
  const [activeCategory, setActiveCategory] = useState<PollCategory | 'all'>('all')

  const sorted = activeCategory === 'all'
    ? entries
    : [...entries]
        .sort((a, b) => (b.categoryBreakdown[activeCategory] ?? 0) - (a.categoryBreakdown[activeCategory] ?? 0))
        .map((e, i) => ({ ...e, rank: i + 1 }))

  const myEntry = entries.find(e => e.profile.id === currentUserId)
  const myRankInCategory = sorted.findIndex(e => e.profile.id === currentUserId) + 1

  return (
    <div className="flex flex-col gap-4">
      {/* My rank summary card */}
      {myEntry && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className="rounded-[24px] p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)',
          }}
        >
          <div className="relative z-10">
            <p className="text-caption font-semibold text-white/70 uppercase tracking-wider mb-1">
              Your Ranking
            </p>
            <div className="flex items-end gap-2">
              <span className="text-display font-bold text-white leading-none">
                #{activeCategory === 'all' ? myEntry.rank : myRankInCategory}
              </span>
              <span className="text-title3 text-white/70 mb-1">
                of {entries.length}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">💎</span>
                <span className="text-title3 font-bold text-white">{myEntry.gemCount}</span>
                <span className="text-callout text-white/70">gems</span>
              </div>
              <div className="w-px h-5 bg-white/30" />
              <div className="text-callout text-white/80">
                {CATEGORY_EMOJIS[myEntry.topCategory]} Best at {CATEGORY_LABELS[myEntry.topCategory]}
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20"
            style={{ background: 'white' }}
          />
          <div
            className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-15"
            style={{ background: 'white' }}
          />
        </motion.div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-semibold transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-obsidian-500 bg-obsidian-100'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' } : {}}
            >
              {cat !== 'all' && <span>{CATEGORY_EMOJIS[cat as PollCategory]}</span>}
              {cat === 'all' ? 'Overall' : CATEGORY_LABELS[cat as PollCategory]}
            </button>
          )
        })}
      </div>

      {/* Top 3 podium */}
      {activeCategory === 'all' && sorted.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className="flex items-end justify-center gap-3 pt-2 pb-4"
        >
          {/* 2nd */}
          <PodiumItem entry={sorted[1]} place={2} />
          {/* 1st */}
          <PodiumItem entry={sorted[0]} place={1} />
          {/* 3rd */}
          <PodiumItem entry={sorted[2]} place={3} />
        </motion.div>
      )}

      {/* Full list */}
      <div className="flex flex-col gap-1">
        <AnimatePresence mode="popLayout">
          {sorted.map((entry, i) => (
            <EntryCard
              key={`${entry.profile.id}-${activeCategory}`}
              entry={entry}
              index={i}
              isMe={entry.profile.id === currentUserId}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PodiumItem({ entry, place }: { entry: RankEntry; place: 1 | 2 | 3 }) {
  const heights = { 1: 'h-20', 2: 'h-14', 3: 'h-10' }
  const avatarSizes = { 1: 'w-16 h-16', 2: 'w-12 h-12', 3: 'w-12 h-12' }
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const [from, to] = entry.gradient

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div
        className={`${avatarSizes[place]} rounded-full p-0.5`}
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <img
          src={entry.profile.avatarUrl}
          alt={entry.profile.displayName}
          className="w-full h-full rounded-full object-cover bg-white"
        />
      </div>
      <p className="text-caption font-bold text-obsidian-700 text-center leading-tight max-w-[72px] truncate">
        {entry.profile.displayName.split(' ')[0]}
      </p>
      <div className="text-lg">{medals[place]}</div>
      <div
        className={`${heights[place]} w-full rounded-t-xl flex items-start justify-center pt-2`}
        style={{
          background: `linear-gradient(180deg, ${from}22, ${to}11)`,
          border: `1px solid ${from}33`,
        }}
      >
        <span className="text-caption font-bold text-obsidian-500">💎 {entry.gemCount}</span>
      </div>
    </div>
  )
}
