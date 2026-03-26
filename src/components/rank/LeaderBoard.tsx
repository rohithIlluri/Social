import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RankEntry, PollCategory } from '@/types/rank'
import { CATEGORY_LABELS, CATEGORY_EMOJIS } from '@/services/instagramMock'
import { ProfileDrawer } from './ProfileDrawer'
import { haptics } from '@/utils/haptics'

interface LeaderBoardProps {
  entries: RankEntry[]
  currentUserId: string | undefined
  onShare: () => void
}

type CategoryFilter = PollCategory | 'all'

const CATEGORY_FILTERS: CategoryFilter[] = [
  'all', 'viral', 'creative', 'funny', 'aesthetic',
  'inspiring', 'adventurous', 'social', 'trendsetter',
]

const MEDAL: Record<1 | 2 | 3, { emoji: string; gradient: [string, string] }> = {
  1: { emoji: '🥇', gradient: ['#FFD23F', '#FF8C42'] },
  2: { emoji: '🥈', gradient: ['#C0C0C0', '#9CA3AF'] },
  3: { emoji: '🥉', gradient: ['#CD7F32', '#A05C1A'] },
}

// ─── Rank badge ────────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const m = MEDAL[rank as 1 | 2 | 3]
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-subhead shadow-sm flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${m.gradient[0]}, ${m.gradient[1]})` }}
      >
        {rank}
      </div>
    )
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-subhead text-obsidian-400 flex-shrink-0"
      style={{ background: 'rgba(0,0,0,0.04)' }}
    >
      {rank}
    </div>
  )
}

// ─── Weekly change indicator ───────────────────────────────────────────────────
function WeeklyChange({ change }: { change: number }) {
  if (change === 0) return <span className="text-caption text-obsidian-300">—</span>
  const up = change > 0
  return (
    <span className={`text-caption font-semibold flex items-center gap-0.5 ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
      {up ? '↑' : '↓'}{Math.abs(change)}
    </span>
  )
}

// ─── Podium item ───────────────────────────────────────────────────────────────
function PodiumItem({ entry, place, onClick }: { entry: RankEntry; place: 1 | 2 | 3; onClick: () => void }) {
  const m = MEDAL[place]
  const heightMap: Record<1 | 2 | 3, string> = { 1: 'h-20', 2: 'h-14', 3: 'h-10' }
  const avatarSize: Record<1 | 2 | 3, string> = { 1: 'w-16 h-16', 2: 'w-13 h-13 w-12 h-12', 3: 'w-12 h-12' }

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 flex-1 active:scale-95 transition-transform">
      <div
        className={`${avatarSize[place]} rounded-full p-0.5 shadow-md`}
        style={{ background: `linear-gradient(135deg, ${entry.gradient[0]}, ${entry.gradient[1]})` }}
      >
        <img src={entry.profile.avatarUrl} alt={entry.profile.displayName}
          className="w-full h-full rounded-full object-cover bg-white" />
      </div>
      <p className="text-caption font-bold text-obsidian-700 max-w-[72px] truncate text-center leading-tight">
        {entry.profile.displayName.split(' ')[0]}
      </p>
      <span className="text-lg">{m.emoji}</span>
      <div
        className={`${heightMap[place]} w-full rounded-t-2xl flex flex-col items-center justify-start pt-2 gap-0.5`}
        style={{
          background: `linear-gradient(180deg, ${entry.gradient[0]}20, ${entry.gradient[1]}08)`,
          border: `1px solid ${entry.gradient[0]}25`,
        }}
      >
        <p className="text-caption font-bold text-obsidian-600">💎 {entry.gemCount}</p>
      </div>
    </button>
  )
}

// ─── Entry row ─────────────────────────────────────────────────────────────────
function EntryRow({ entry, index, isMe, onClick }: {
  entry: RankEntry; index: number; isMe: boolean; onClick: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.035, duration: 0.3, ease: [0, 0, 0.2, 1] }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-2xl w-full text-left active:scale-[0.98] transition-transform"
      style={{
        background: isMe
          ? 'rgba(123,97,255,0.07)'
          : index % 2 === 0 ? 'rgba(0,0,0,0.015)' : 'transparent',
        boxShadow: isMe ? '0 0 0 2px rgba(123,97,255,0.25)' : 'none',
      }}
    >
      {/* Rank */}
      <RankBadge rank={entry.rank} />

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-11 h-11 rounded-full p-0.5"
          style={{ background: `linear-gradient(135deg, ${entry.gradient[0]}, ${entry.gradient[1]})` }}
        >
          <img src={entry.profile.avatarUrl} alt={entry.profile.displayName}
            className="w-full h-full rounded-full object-cover bg-white" loading="lazy" />
        </div>
        {isMe && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' }}
          >
            <span style={{ color: 'white', fontSize: 8, fontWeight: 700 }}>ME</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-callout font-bold text-obsidian-900 truncate">{entry.profile.displayName}</p>
          {entry.profile.isVerified && (
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#7B61FF">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <p className="text-caption text-obsidian-400 truncate mt-0.5">
          {CATEGORY_EMOJIS[entry.topCategory]} {CATEGORY_LABELS[entry.topCategory]}
        </p>
      </div>

      {/* Gems + change */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-base">💎</span>
          <span className="text-callout font-bold text-obsidian-800">{entry.gemCount}</span>
        </div>
        <WeeklyChange change={entry.weeklyChange} />
      </div>
    </motion.button>
  )
}

// ─── My rank hero card ─────────────────────────────────────────────────────────
function MyRankCard({ entry, onShare }: { entry: RankEntry; onShare: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0, 0, 0.2, 1] }}
      className="rounded-[24px] p-5 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -right-2 -bottom-6 w-20 h-20 rounded-full bg-white/08 pointer-events-none" />

      <div className="relative z-10">
        <p className="text-caption font-bold text-white/60 uppercase tracking-widest mb-1">Your Ranking</p>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-display font-bold text-white leading-none">#{entry.rank}</span>
          <span className="text-title3 text-white/60 mb-1">of {entry.categoryBreakdown ? Object.keys(entry.categoryBreakdown).length + 10 : 13}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl">💎</span>
            <span className="text-title3 font-bold text-white">{entry.gemCount}</span>
            <span className="text-callout text-white/60">gems</span>
          </div>
          <div className="w-px h-5 bg-white/25" />
          <p className="text-callout text-white/80">
            {CATEGORY_EMOJIS[entry.topCategory]} {CATEGORY_LABELS[entry.topCategory]}
          </p>
        </div>
        <button
          onClick={onShare}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-callout font-bold text-white active:scale-95 transition-transform"
          style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
          </svg>
          Share to get more votes
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main leaderboard ──────────────────────────────────────────────────────────
export function LeaderBoard({ entries, currentUserId, onShare }: LeaderBoardProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  const [search, setSearch] = useState('')
  const [drawerEntry, setDrawerEntry] = useState<RankEntry | null>(null)

  const myEntry = entries.find(e => e.profile.id === currentUserId)

  const sorted = useMemo(() => {
    let list = activeCategory === 'all'
      ? [...entries]
      : [...entries]
          .sort((a, b) => (b.categoryBreakdown[activeCategory as PollCategory] ?? 0) - (a.categoryBreakdown[activeCategory as PollCategory] ?? 0))
          .map((e, i) => ({ ...e, rank: i + 1 }))

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.profile.displayName.toLowerCase().includes(q) ||
        e.profile.username.toLowerCase().includes(q)
      )
    }
    return list
  }, [entries, activeCategory, search])

  const top3 = useMemo(() => sorted.slice(0, 3), [sorted])

  const handleRowClick = (entry: RankEntry) => {
    haptics.subtle()
    setDrawerEntry(entry)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* My rank card */}
        {myEntry && <MyRankCard entry={myEntry} onShare={() => { haptics.subtle(); onShare() }} />}

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people…"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-callout text-obsidian-800 placeholder:text-obsidian-300 focus:outline-none"
            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.1)' }}>
              <svg className="w-3 h-3 text-obsidian-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORY_FILTERS.map(cat => {
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => { haptics.subtle(); setActiveCategory(cat) }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-semibold transition-all duration-200"
                style={{
                  background: active ? 'linear-gradient(135deg, #7B61FF, #FF6B9D)' : 'rgba(0,0,0,0.04)',
                  color: active ? 'white' : '#71717A',
                  border: active ? 'none' : '1px solid rgba(0,0,0,0.06)',
                }}
              >
                {cat !== 'all' && <span>{CATEGORY_EMOJIS[cat as PollCategory]}</span>}
                <span>{cat === 'all' ? 'Overall' : CATEGORY_LABELS[cat as PollCategory]}</span>
              </button>
            )
          })}
        </div>

        {/* Podium — only on overall, no search filter */}
        <AnimatePresence mode="wait">
          {activeCategory === 'all' && !search && sorted.length >= 3 && (
            <motion.div
              key="podium"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
              className="flex items-end justify-center gap-3 pt-2 pb-2"
            >
              <PodiumItem entry={top3[1]} place={2} onClick={() => handleRowClick(top3[1])} />
              <PodiumItem entry={top3[0]} place={1} onClick={() => handleRowClick(top3[0])} />
              <PodiumItem entry={top3[2]} place={3} onClick={() => handleRowClick(top3[2])} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div className="flex flex-col gap-0.5">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <span className="text-4xl">🔍</span>
              <p className="text-callout text-obsidian-400">No results for "{search}"</p>
            </div>
          ) : (
            <AnimatePresence>
              {sorted.map((entry, i) => (
                <EntryRow
                  key={`${entry.profile.id}-${activeCategory}`}
                  entry={entry}
                  index={i}
                  isMe={entry.profile.id === currentUserId}
                  onClick={() => handleRowClick(entry)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-caption text-obsidian-300 py-2">
          Rankings update as votes come in · Tap any profile for details
        </p>
      </div>

      {/* Profile drawer */}
      <ProfileDrawer entry={drawerEntry} onClose={() => setDrawerEntry(null)} />
    </>
  )
}
