import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RankEntry } from '@/types/rank'
import { CATEGORY_LABELS, CATEGORY_EMOJIS, PROFILE_GRADIENTS } from '@/services/instagramMock'
import { haptics } from '@/utils/haptics'

interface ProfileDrawerProps {
  entry: RankEntry | null
  onClose: () => void
}

function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1">
      <p className="text-title3 font-bold text-obsidian-900">{value}</p>
      <p className="text-caption text-obsidian-400">{label}</p>
    </div>
  )
}

function CategoryBar({ category, count, max }: { category: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  const [from, to] = PROFILE_GRADIENTS[Object.keys(CATEGORY_LABELS).indexOf(category) % PROFILE_GRADIENTS.length]

  return (
    <div className="flex items-center gap-3">
      <span className="text-base w-6 flex-shrink-0">{CATEGORY_EMOJIS[category as keyof typeof CATEGORY_EMOJIS]}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <p className="text-caption font-semibold text-obsidian-600">
            {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
          </p>
          <p className="text-caption text-obsidian-400">{count}</p>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0, 0, 0.2, 1] }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
          />
        </div>
      </div>
    </div>
  )
}

export function ProfileDrawer({ entry, onClose }: ProfileDrawerProps) {
  // Lock scroll while open
  useEffect(() => {
    if (!entry) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [entry])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!entry) return null

  const { profile, rank, gemCount, topCategory, categoryBreakdown, weeklyChange, gradient } = entry
  const maxCatCount = Math.max(...Object.values(categoryBreakdown).filter(Boolean).map(Number))
  const sortedCategories = Object.entries(categoryBreakdown)
    .filter(([, v]) => (v ?? 0) > 0)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))

  const changeColor = weeklyChange > 0 ? '#10B981' : weeklyChange < 0 ? '#EF4444' : '#71717A'
  const changeLabel = weeklyChange === 0 ? '—' : weeklyChange > 0 ? `↑${weeklyChange}` : `↓${Math.abs(weeklyChange)}`

  return (
    <AnimatePresence>
      {entry && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 tbh-backdrop"
            onClick={() => { haptics.subtle(); onClose() }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] overflow-hidden tbh-surface"
            style={{ maxHeight: '88vh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(88vh - 20px)' }}>
              {/* Hero banner */}
              <div
                className="relative px-6 pt-6 pb-8 flex flex-col items-center text-center"
                style={{ background: `linear-gradient(145deg, ${gradient[0]}15, ${gradient[1]}08)` }}
              >
                {/* Rank badge */}
                <div
                  className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-subhead shadow-md"
                  style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
                >
                  #{rank}
                </div>

                {/* Avatar */}
                <div
                  className="w-24 h-24 rounded-full p-1 mb-3 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
                >
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                </div>

                {/* Name */}
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-title2 font-bold text-obsidian-900">{profile.displayName}</h2>
                  {profile.isVerified && (
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#7B61FF">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <p className="text-callout text-obsidian-400 mb-2">@{profile.username}</p>

                {profile.bio && (
                  <p className="text-footnote text-obsidian-500 max-w-xs leading-relaxed">{profile.bio}</p>
                )}

                {/* Top category badge */}
                <div
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-bold text-white"
                  style={{ background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})` }}
                >
                  {CATEGORY_EMOJIS[topCategory]} {CATEGORY_LABELS[topCategory]}
                </div>
              </div>

              {/* Stats row */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-around py-4 rounded-2xl"
                  style={{ background: 'rgba(123,97,255,0.04)', border: '1px solid rgba(123,97,255,0.08)' }}
                >
                  <StatPill value={`#${rank}`} label="Rank" />
                  <div className="w-px h-8" style={{ background: 'rgba(0,0,0,0.06)' }} />
                  <StatPill value={gemCount} label="Total Gems" />
                  <div className="w-px h-8" style={{ background: 'rgba(0,0,0,0.06)' }} />
                  <div className="flex flex-col items-center gap-0.5 flex-1">
                    <p className="text-title3 font-bold" style={{ color: changeColor }}>{changeLabel}</p>
                    <p className="text-caption text-obsidian-400">This week</p>
                  </div>
                </div>
              </div>

              {/* IG stats */}
              <div className="px-6 pb-4">
                <div className="flex items-center justify-around py-3 rounded-2xl"
                  style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}
                >
                  <StatPill value={profile.followerCount.toLocaleString()} label="Followers" />
                  <div className="w-px h-6" style={{ background: 'rgba(0,0,0,0.06)' }} />
                  <StatPill value={profile.followingCount.toLocaleString()} label="Following" />
                  <div className="w-px h-6" style={{ background: 'rgba(0,0,0,0.06)' }} />
                  <StatPill value={profile.postCount.toLocaleString()} label="Posts" />
                </div>
              </div>

              {/* Category breakdown */}
              {sortedCategories.length > 0 && (
                <div className="px-6 pb-8">
                  <h3 className="text-callout font-bold text-obsidian-500 uppercase tracking-wider mb-4">
                    Gem Breakdown
                  </h3>
                  <div className="flex flex-col gap-3">
                    {sortedCategories.map(([cat, count]) => (
                      <CategoryBar
                        key={cat}
                        category={cat}
                        count={count ?? 0}
                        max={maxCatCount}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Close button */}
              <div className="px-6 pb-10 safe-bottom">
                <button
                  onClick={() => { haptics.subtle(); onClose() }}
                  className="w-full py-3.5 rounded-2xl text-callout font-semibold text-obsidian-500 transition-colors active:bg-obsidian-50"
                  style={{ background: 'rgba(0,0,0,0.04)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
