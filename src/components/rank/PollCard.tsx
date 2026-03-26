import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import type { Poll, InstagramProfile } from '@/types/rank'
import { useRankStore } from '@/store/rankStore'
import { haptics } from '@/utils/haptics'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PollCardProps {
  poll: Poll
  totalPolls: number
  votedCount: number
  onVoted: (profile: InstagramProfile) => void
  onSkip: () => void
}

// ─── Confetti burst (portal-safe, absolute within card) ────────────────────────
const CONFETTI_COLORS = ['#FF6B9D', '#7B61FF', '#FFD23F', '#3BCEAC', '#FF8C42', '#A78BFA', '#FB7185']

interface ConfettiPiece {
  id: number
  vx: number
  vy: number
  color: string
  shape: 'circle' | 'rect'
  size: number
  rotationSpeed: number
}

function ConfettiBurst({ active }: { active: boolean }) {
  const pieces: ConfettiPiece[] = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2
    const speed = 60 + Math.random() * 80
    return {
      id: i,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
      size: 6 + Math.random() * 8,
      rotationSpeed: (Math.random() - 0.5) * 720,
    }
  })

  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[28px]" style={{ zIndex: 20 }}>
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: '50%', y: '40%', opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            x: `calc(50% + ${p.vx}px)`,
            y: `calc(40% + ${p.vy}px)`,
            opacity: 0,
            rotate: p.rotationSpeed,
            scale: 0,
          }}
          transition={{ duration: 0.8, ease: [0.4, 0, 1, 1] }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : 3,
          }}
        />
      ))}
    </div>
  )
}

// ─── Profile option cell ───────────────────────────────────────────────────────
interface OptionCellProps {
  profile: InstagramProfile
  isSelected: boolean
  isDimmed: boolean
  isVoted: boolean
  onClick: (e: MouseEvent) => void
}

function OptionCell({ profile, isSelected, isDimmed, isVoted, onClick }: OptionCellProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={isVoted}
      animate={{
        opacity: isDimmed ? 0.38 : 1,
        scale: isSelected ? 1.04 : 1,
      }}
      transition={{ opacity: { duration: 0.2 }, scale: { type: 'spring', stiffness: 380, damping: 22 } }}
      className="flex flex-col items-center gap-2.5 p-4 rounded-[20px] relative tbh-vote-option"
      style={{
        background: isSelected
          ? 'rgba(255,255,255,0.38)'
          : 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: isSelected
          ? '2.5px solid rgba(255,255,255,0.9)'
          : '2px solid rgba(255,255,255,0.25)',
        boxShadow: isSelected
          ? '0 0 0 4px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.12)'
          : 'none',
      }}
    >
      {/* Avatar ring */}
      <div
        className="relative"
        style={{
          padding: isSelected ? 3 : 2,
          borderRadius: '50%',
          background: isSelected ? 'white' : 'rgba(255,255,255,0.4)',
        }}
      >
        <img
          src={profile.avatarUrl}
          alt={profile.displayName}
          className="w-16 h-16 rounded-full object-cover bg-white"
          loading="lazy"
        />
        {/* Checkmark overlay */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Name + username */}
      <div className="text-center">
        <p className="text-subhead font-bold text-white leading-tight line-clamp-1">
          {profile.displayName}
        </p>
        <p className="text-caption text-white/65 mt-0.5">
          @{profile.username}
        </p>
      </div>

      {/* Verified badge */}
      {profile.isVerified && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.3)' }}
        >
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )}
    </motion.button>
  )
}

// ─── Main PollCard ─────────────────────────────────────────────────────────────
export function PollCard({ poll, totalPolls, votedCount, onVoted, onSkip }: PollCardProps) {
  const { submitVote } = useRankStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const exitDir = useRef<'left' | 'right' | 'up'>('up')

  // Drag for skip gesture
  const x = useMotionValue(0)
  const cardRotate = useTransform(x, [-140, 0, 140], [-12, 0, 12])
  const skipLeftOpacity = useTransform(x, [-120, -40], [0.9, 0])
  const skipRightOpacity = useTransform(x, [40, 120], [0, 0.9])

  const { question, options } = poll

  const handleVote = useCallback((profile: InstagramProfile, e: MouseEvent) => {
    e.stopPropagation()
    if (selectedId || isExiting) return

    setSelectedId(profile.id)
    haptics.connection()
    setShowConfetti(true)

    submitVote(poll.id, question.id, question.category, profile.id)

    setTimeout(() => {
      exitDir.current = 'up'
      setIsExiting(true)
      setTimeout(() => onVoted(profile), 320)
    }, 700)
  }, [selectedId, isExiting, poll.id, question.id, question.category, submitVote, onVoted])

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    const threshold = 80
    if (Math.abs(info.offset.x) > threshold && !selectedId) {
      exitDir.current = info.offset.x > 0 ? 'right' : 'left'
      setIsExiting(true)
      setTimeout(onSkip, 300)
    }
  }, [selectedId, onSkip])

  const exitVariants = {
    up:    { y: -60, opacity: 0, scale: 0.94 },
    left:  { x: -160, rotate: -15, opacity: 0 },
    right: { x: 160, rotate: 15, opacity: 0 },
  }

  const progressPct = totalPolls > 0 ? Math.min(votedCount / totalPolls, 1) * 100 : 0

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Progress header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(123,97,255,0.12)' }}>
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7B61FF, #FF6B9D)' }}
          />
        </div>
        <span className="text-caption font-semibold text-obsidian-400 tabular-nums flex-shrink-0">
          {votedCount} / {totalPolls}
        </span>
      </div>

      {/* Card */}
      <motion.div
        drag={!selectedId ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        style={{
          x: selectedId ? 0 : x,
          rotate: selectedId ? 0 : cardRotate,
          background: `linear-gradient(145deg, ${question.gradient[0]}, ${question.gradient[1]})`,
          minHeight: 460,
          touchAction: 'pan-y',
        }}
        animate={isExiting
          ? (exitVariants as Record<string, object>)[exitDir.current]
          : { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }
        }
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        transition={isExiting
          ? { duration: 0.3, ease: [0.4, 0, 1, 1] }
          : { duration: 0.42, ease: [0, 0, 0.2, 1] }
        }
        className="w-full rounded-[28px] overflow-hidden shadow-xl relative cursor-grab active:cursor-grabbing select-none"
      >
        {/* Skip hint overlays (drag feedback) */}
        <motion.div
          style={{ opacity: skipLeftOpacity }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
        >
          <div className="px-4 py-2 rounded-xl border-2 border-white/80 rotate-[-12deg]">
            <p className="text-body-bold text-white/90 tracking-wide">SKIP</p>
          </div>
        </motion.div>
        <motion.div
          style={{ opacity: skipRightOpacity }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
        >
          <div className="px-4 py-2 rounded-xl border-2 border-white/80 rotate-[12deg]">
            <p className="text-body-bold text-white/90 tracking-wide">SKIP</p>
          </div>
        </motion.div>

        {/* Question header */}
        <div className="px-6 pt-7 pb-5 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 350, damping: 20 }}
            className="text-5xl mb-3"
          >
            {question.emoji}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.35, ease: [0, 0, 0.2, 1] }}
            className="text-title3 font-bold text-white leading-snug drop-shadow-sm"
          >
            {question.text}
          </motion.h2>
        </div>

        {/* 2×2 option grid */}
        <div className="px-4 pb-5 grid grid-cols-2 gap-2.5">
          {options.map((option, i) => (
            <motion.div
              key={option.profile.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18 + i * 0.07, duration: 0.32, ease: [0, 0, 0.2, 1] }}
            >
              <OptionCell
                profile={option.profile}
                isSelected={selectedId === option.profile.id}
                isDimmed={selectedId !== null && selectedId !== option.profile.id}
                isVoted={selectedId !== null}
                onClick={(e) => handleVote(option.profile, e)}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom hint */}
        <AnimatePresence>
          {!selectedId && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.5, duration: 0.4 }}
              className="pb-4 text-center text-caption text-white/45"
            >
              Tap to vote · Drag to skip
            </motion.p>
          )}
        </AnimatePresence>

        {/* Voted feedback */}
        <AnimatePresence>
          {selectedId && !isExiting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-callout font-bold text-white shadow-lg"
              style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              💎 Gem sent!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confetti */}
        <ConfettiBurst active={showConfetti} />
      </motion.div>

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={onSkip}
        className="mx-auto py-2 px-6 text-callout text-obsidian-400 font-medium rounded-full active:bg-obsidian-100 transition-colors"
      >
        Skip this question →
      </motion.button>
    </div>
  )
}
