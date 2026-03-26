import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Gem } from '@/types/rank'
import { GEM_RARITY_COLORS, GEM_RARITY_LABELS } from '@/services/instagramMock'
import { useRankStore } from '@/store/rankStore'

interface GemFeedProps {
  gems: Gem[]
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function GemIcon({ gradient }: { rarity: string; gradient: [string, string] }) {
  return (
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
      style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
    >
      <span className="text-2xl">💎</span>
    </div>
  )
}

function RarityBadge({ rarity }: { rarity: string }) {
  const [from, to] = GEM_RARITY_COLORS[rarity]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-caption font-bold text-white"
      style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
    >
      {GEM_RARITY_LABELS[rarity]}
    </span>
  )
}

function GemCard({ gem, index }: { gem: Gem; index: number }) {
  const [from, to] = GEM_RARITY_COLORS[gem.rarity]

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0, 0, 0.2, 1] }}
      className="flex items-start gap-3 p-4 rounded-2xl"
      style={{ background: `linear-gradient(135deg, ${from}10, ${to}08)`, border: `1px solid ${from}25` }}
    >
      <GemIcon rarity={gem.rarity} gradient={[from, to]} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <RarityBadge rarity={gem.rarity} />
          <span className="text-caption text-obsidian-400">{timeAgo(gem.receivedAt)}</span>
        </div>
        <p className="text-callout font-semibold text-obsidian-800 leading-snug">
          <span className="mr-1">{gem.questionEmoji}</span>
          Someone voted for you:
        </p>
        <p className="text-footnote text-obsidian-500 mt-0.5 italic">
          "{gem.questionText}"
        </p>
      </div>
    </motion.div>
  )
}

function EmptyGems() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      className="flex flex-col items-center justify-center py-16 gap-4"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-6xl"
      >
        💎
      </motion.div>
      <div className="text-center">
        <p className="text-title3 font-bold text-obsidian-700">No gems yet</p>
        <p className="text-callout text-obsidian-400 mt-1">
          When your network votes for you,
        </p>
        <p className="text-callout text-obsidian-400">
          your gems show up here.
        </p>
      </div>
      <div
        className="mt-2 px-5 py-2.5 rounded-full text-callout font-semibold text-white"
        style={{ background: 'linear-gradient(90deg, #7B61FF, #FF6B9D)' }}
      >
        Share your link to get votes
      </div>
    </motion.div>
  )
}

function GemSummaryBar({ gems }: { gems: Gem[] }) {
  const counts = gems.reduce<Record<string, number>>((acc, g) => {
    acc[g.rarity] = (acc[g.rarity] ?? 0) + 1
    return acc
  }, {})

  const rarities = ['legendary', 'epic', 'rare', 'common'] as const

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {rarities.map(rarity => {
        const count = counts[rarity] ?? 0
        const [from, to] = GEM_RARITY_COLORS[rarity]
        return (
          <div
            key={rarity}
            className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl min-w-[72px]"
            style={{ background: `linear-gradient(135deg, ${from}15, ${to}10)`, border: `1px solid ${from}30` }}
          >
            <span className="text-xl">💎</span>
            <span className="text-title3 font-bold text-obsidian-800">{count}</span>
            <span
              className="text-caption font-semibold"
              style={{ background: `linear-gradient(90deg, ${from}, ${to})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              {GEM_RARITY_LABELS[rarity]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function GemFeed({ gems }: GemFeedProps) {
  const { markGemsRead } = useRankStore()

  // Mark gems as read when this tab opens
  useEffect(() => {
    markGemsRead()
  }, [markGemsRead])

  if (gems.length === 0) return <EmptyGems />

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      <GemSummaryBar gems={gems} />

      {/* Total */}
      <div className="flex items-center justify-between">
        <h3 className="text-title3 font-bold text-obsidian-800">
          Your Gems
        </h3>
        <span className="text-callout text-obsidian-400">
          {gems.length} total
        </span>
      </div>

      {/* Gem list */}
      <div className="flex flex-col gap-2">
        {gems.map((gem, i) => (
          <GemCard key={gem.id} gem={gem} index={i} />
        ))}
      </div>

      {/* Bottom note */}
      <p className="text-center text-caption text-obsidian-400 pt-2 pb-4">
        All votes are anonymous 🔒
      </p>
    </div>
  )
}
