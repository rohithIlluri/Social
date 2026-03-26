import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Gem, GemRarity } from '@/types/rank'
import { GEM_RARITY_COLORS, GEM_RARITY_LABELS, CATEGORY_LABELS } from '@/services/instagramMock'
import { useRankStore } from '@/store/rankStore'

interface GemFeedProps {
  gems: Gem[]
  onShare: () => void
}

// ─── Time formatting ───────────────────────────────────────────────────────────
function timeAgo(date: Date | string): string {
  const d = new Date(date)
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'yesterday' : `${days}d ago`
}

// ─── Rarity config ─────────────────────────────────────────────────────────────
const RARITY_ORDER: GemRarity[] = ['legendary', 'epic', 'rare', 'common']

const RARITY_ICONS: Record<GemRarity, string> = {
  legendary: '💎',
  epic: '💜',
  rare: '💙',
  common: '💚',
}

const RARITY_DESC: Record<GemRarity, string> = {
  legendary: 'Top 5% vote — you really stand out!',
  epic: 'You were the clear favourite',
  rare: 'Strong vote from your network',
  common: 'Your friends think of you',
}

// ─── Summary strip ─────────────────────────────────────────────────────────────
function SummaryStrip({ gems }: { gems: Gem[] }) {
  const counts = useMemo(() => {
    return RARITY_ORDER.reduce<Record<GemRarity, number>>((acc, r) => {
      acc[r] = gems.filter(g => g.rarity === r).length
      return acc
    }, { legendary: 0, epic: 0, rare: 0, common: 0 })
  }, [gems])

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {RARITY_ORDER.map(rarity => {
        const [from, to] = GEM_RARITY_COLORS[rarity]
        const count = counts[rarity]
        return (
          <motion.div
            key={rarity}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
            className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl min-w-[80px]"
            style={{
              background: `linear-gradient(145deg, ${from}12, ${to}08)`,
              border: `1.5px solid ${from}22`,
            }}
          >
            <span className="text-2xl">{RARITY_ICONS[rarity]}</span>
            <span className="text-title3 font-bold text-obsidian-900">{count}</span>
            <span
              className="text-caption font-bold"
              style={{
                background: `linear-gradient(90deg, ${from}, ${to})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {GEM_RARITY_LABELS[rarity]}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Individual gem card ───────────────────────────────────────────────────────
function GemCard({ gem, index }: { gem: Gem; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [from, to] = GEM_RARITY_COLORS[gem.rarity]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.32, ease: [0, 0, 0.2, 1] }}
      layout
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        background: `linear-gradient(145deg, ${from}10, ${to}06)`,
        border: `1.5px solid ${from}22`,
      }}
      onClick={() => setExpanded(v => !v)}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Gem icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-2xl"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {RARITY_ICONS[gem.rarity]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Rarity badge */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-caption font-bold text-white"
              style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
            >
              {GEM_RARITY_LABELS[gem.rarity]}
            </span>
            <span className="text-caption text-obsidian-400">{timeAgo(gem.receivedAt)}</span>
          </div>

          <p className="text-callout font-semibold text-obsidian-800 leading-snug">
            {gem.questionEmoji} "{gem.questionText}"
          </p>

          <p className="text-caption text-obsidian-400 mt-0.5">
            Category: {CATEGORY_LABELS[gem.category]}
          </p>
        </div>

        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 flex-shrink-0 text-obsidian-300"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              className="mx-4 mb-4 p-3 rounded-xl flex items-start gap-3"
              style={{ background: `${from}10`, border: `1px solid ${from}18` }}
            >
              <span className="text-xl flex-shrink-0">🔒</span>
              <div>
                <p className="text-caption font-semibold text-obsidian-600">{RARITY_DESC[gem.rarity]}</p>
                <p className="text-caption text-obsidian-400 mt-0.5">
                  The voter's identity is always anonymous.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Sort/filter bar ───────────────────────────────────────────────────────────
type SortMode = 'newest' | 'rarity'

function SortBar({ sort, onChange }: { sort: SortMode; onChange: (s: SortMode) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-caption text-obsidian-400 font-medium">Sort:</span>
      {(['newest', 'rarity'] as SortMode[]).map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className="px-3 py-1.5 rounded-full text-caption font-semibold transition-all"
          style={{
            background: sort === s ? 'linear-gradient(135deg, #7B61FF, #FF6B9D)' : 'rgba(0,0,0,0.04)',
            color: sort === s ? 'white' : '#71717A',
          }}
        >
          {s === 'newest' ? 'Newest' : 'Rarity'}
        </button>
      ))}
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyGems({ onShare }: { onShare: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center py-16 gap-5"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-6xl"
      >
        💎
      </motion.div>
      <div className="text-center max-w-xs">
        <p className="text-title3 font-bold text-obsidian-800">No gems yet</p>
        <p className="text-callout text-obsidian-400 mt-1.5 leading-relaxed">
          Gems appear here anonymously whenever someone votes for you on a question.
        </p>
      </div>
      <button
        onClick={onShare}
        className="px-6 py-3 rounded-2xl text-callout font-bold text-white shadow-md active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)', boxShadow: '0 6px 20px rgba(123,97,255,0.35)' }}
      >
        Share your link → get votes 🚀
      </button>
    </motion.div>
  )
}

// ─── Main feed ────────────────────────────────────────────────────────────────
const RARITY_WEIGHT: Record<GemRarity, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }

export function GemFeed({ gems, onShare }: GemFeedProps) {
  const { markGemsRead } = useRankStore()
  const [sort, setSort] = useState<SortMode>('newest')

  useEffect(() => {
    markGemsRead()
  }, [markGemsRead])

  const sorted = useMemo(() => {
    const arr = [...gems]
    if (sort === 'newest') {
      return arr.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
    }
    return arr.sort((a, b) => RARITY_WEIGHT[a.rarity] - RARITY_WEIGHT[b.rarity])
  }, [gems, sort])

  if (gems.length === 0) return <EmptyGems onShare={onShare} />

  const totalGems = gems.length
  const legendaryCount = gems.filter(g => g.rarity === 'legendary').length

  return (
    <div className="flex flex-col gap-4">
      {/* Top stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-title3 font-bold text-obsidian-900">Your Gems</h3>
          <p className="text-caption text-obsidian-400 mt-0.5">
            {totalGems} gem{totalGems !== 1 ? 's' : ''} received
            {legendaryCount > 0 && ` · ${legendaryCount} legendary 🌟`}
          </p>
        </div>
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-caption font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
          </svg>
          Share
        </button>
      </div>

      {/* Rarity summary */}
      <SummaryStrip gems={gems} />

      {/* Sort bar */}
      <SortBar sort={sort} onChange={setSort} />

      {/* Gem list */}
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {sorted.map((gem, i) => (
            <GemCard key={gem.id} gem={gem} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <p className="text-center text-caption text-obsidian-300 pt-2 pb-4">
        🔒 All votes are permanently anonymous
      </p>
    </div>
  )
}
