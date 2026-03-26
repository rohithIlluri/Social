import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Poll, InstagramProfile } from '@/types/rank'
import { useRankStore } from '@/store/rankStore'
import { haptics } from '@/utils/haptics'

interface PollCardProps {
  poll: Poll
  onVoted: (votedFor: InstagramProfile) => void
}

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  size: number
}

function Confetti({ active, fromX, fromY }: { active: boolean; fromX: number; fromY: number }) {
  const pieces: ConfettiPiece[] = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 160,
    color: ['#FF6B9D', '#7B61FF', '#FFD23F', '#3BCEAC', '#FF8C42', '#A78BFA'][i % 6],
    delay: Math.random() * 0.15,
    size: Math.random() * 8 + 5,
  }))

  if (!active) return null

  return (
    <div className="absolute pointer-events-none" style={{ left: fromX, top: fromY, zIndex: 50 }}>
      {pieces.map(piece => (
        <motion.div
          key={piece.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
          animate={{
            x: piece.x,
            y: -80 - Math.random() * 60,
            scale: 0,
            opacity: 0,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 0.7, delay: piece.delay, ease: [0.4, 0, 1, 1] }}
          style={{
            position: 'absolute',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}

export function PollCard({ poll, onVoted }: PollCardProps) {
  const { submitVote } = useRankStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confettiPos, setConfettiPos] = useState({ x: 0, y: 0 })
  const [showConfetti, setShowConfetti] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const { question, options } = poll

  const handleVote = useCallback((profile: InstagramProfile, event: React.MouseEvent) => {
    if (selectedId) return

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    setConfettiPos({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })

    setSelectedId(profile.id)
    haptics.connection()

    // Brief confetti burst
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 800)

    submitVote(poll.id, question.id, question.category, profile.id)

    // Animate card exit after short delay
    setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onVoted(profile), 350)
    }, 650)
  }, [selectedId, poll.id, question.id, question.category, submitVote, onVoted])

  return (
    <motion.div
      initial={{ scale: 0.88, opacity: 0, y: 20 }}
      animate={isExiting
        ? { scale: 0.94, opacity: 0, y: -30 }
        : { scale: 1, opacity: 1, y: 0 }
      }
      transition={{
        duration: isExiting ? 0.3 : 0.4,
        ease: isExiting ? [0.4, 0, 1, 1] : [0, 0, 0.2, 1],
      }}
      className="w-full rounded-[28px] overflow-hidden shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${question.gradient[0]}, ${question.gradient[1]})`,
        minHeight: '480px',
      }}
    >
      {/* Question header */}
      <div className="px-6 pt-8 pb-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
          className="text-5xl mb-4"
        >
          {question.emoji}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0, 0, 0.2, 1] }}
          className="text-title3 font-bold text-white leading-tight drop-shadow-sm"
        >
          {question.text}
        </motion.h2>
      </div>

      {/* 2x2 profile grid */}
      <div className="px-5 pb-8 grid grid-cols-2 gap-3">
        {options.map((option, i) => {
          const isSelected = selectedId === option.profile.id
          const isOther = selectedId !== null && !isSelected

          return (
            <motion.button
              key={option.profile.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isOther ? 0.45 : 1,
                scale: isSelected ? 1.03 : 1,
              }}
              transition={{
                opacity: { duration: 0.25 },
                scale: isSelected
                  ? { type: 'spring', stiffness: 400, damping: 20 }
                  : { duration: 0.2 },
                delay: i * 0.07,
              }}
              whileTap={!selectedId ? { scale: 0.95 } : {}}
              onClick={(e) => handleVote(option.profile, e)}
              disabled={!!selectedId}
              className="relative flex flex-col items-center gap-2 p-4 rounded-[20px] text-center cursor-pointer touch-target"
              style={{
                background: isSelected
                  ? 'rgba(255,255,255,0.35)'
                  : 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: isSelected
                  ? '2px solid rgba(255,255,255,0.8)'
                  : '2px solid rgba(255,255,255,0.3)',
              }}
            >
              {/* Avatar */}
              <div className="relative">
                <img
                  src={option.profile.avatarUrl}
                  alt={option.profile.displayName}
                  className="w-16 h-16 rounded-full object-cover"
                  style={{
                    border: isSelected
                      ? '3px solid white'
                      : '3px solid rgba(255,255,255,0.5)',
                    boxShadow: isSelected
                      ? '0 0 0 4px rgba(255,255,255,0.3)'
                      : 'none',
                  }}
                />
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="#7B61FF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>
                )}
              </div>

              {/* Name */}
              <div>
                <p className="text-subhead font-bold text-white leading-tight">
                  {option.profile.displayName}
                </p>
                <p className="text-caption text-white/70 mt-0.5">
                  @{option.profile.username}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* "Skip" hint at bottom */}
      <AnimatePresence>
        {!selectedId && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="text-center text-caption text-white/50 pb-4"
          >
            Tap to vote — it's anonymous
          </motion.p>
        )}
      </AnimatePresence>

      {/* Confetti burst */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            <Confetti active={showConfetti} fromX={confettiPos.x} fromY={confettiPos.y} />
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
