import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/common/Avatar'
import { REACTIONS, ICE_BREAKERS } from '@/types'
import { REVEAL_LEVEL_COLOR } from '@/utils/constants'
import type { NearbyUser } from '@/types'

interface InteractionPanelProps {
  targetUser: NearbyUser
  onSendReaction: (emoji: string, label: string) => void
  onSendIceBreaker: (prompt: string, answer: string) => void
  onStartGame: (game: 'rps' | 'emoji' | 'trivia') => void
  onClose: () => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export function InteractionPanel({
  targetUser,
  onSendReaction,
  onSendIceBreaker,
  onStartGame,
  onClose,
}: InteractionPanelProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [section, setSection] = useState<'main' | 'icebreaker'>('main')

  const handleSendIceBreaker = () => {
    if (selectedPrompt && answer.trim()) {
      onSendIceBreaker(selectedPrompt, answer.trim())
      setSelectedPrompt(null)
      setAnswer('')
    }
  }

  return (
    <div className="bg-obsidian-900 rounded-modal overflow-hidden">
      {/* Header with avatar */}
      <div className="p-6 pb-4 text-center border-b border-obsidian-800">
        <div className="flex justify-center mb-4">
          <Avatar
            nickname={targetUser.nickname}
            color={targetUser.avatarColor}
            size="lg"
            isSilhouette={targetUser.revealLevel < REVEAL_LEVEL_COLOR}
          />
        </div>
        <h3 className="text-title3 text-white">{targetUser.nickname}</h3>
        <p className="text-footnote text-obsidian-400 mt-1">{targetUser.distance}m away</p>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {section === 'main' ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Reactions - 2x3 grid */}
              <div className="mb-8">
                <h4 className="text-subhead text-obsidian-400 uppercase tracking-wider mb-4">
                  Send a reaction
                </h4>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-3 gap-3"
                >
                  {REACTIONS.slice(0, 6).map(({ emoji, label }) => (
                    <motion.button
                      key={label}
                      variants={itemVariants}
                      onClick={() => onSendReaction(emoji, label)}
                      className="card-interactive p-4 flex flex-col items-center gap-2"
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-3xl">{emoji}</span>
                      <span className="text-caption text-obsidian-400">{label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </div>

              {/* Quick actions */}
              <div className="space-y-3">
                <button
                  onClick={() => setSection('icebreaker')}
                  className="card w-full p-4 flex items-center gap-4 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-connect-500/20 flex items-center justify-center">
                    <span className="text-xl">💬</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-body-medium text-white">Ice Breaker</p>
                    <p className="text-footnote text-obsidian-400">Start a conversation</p>
                  </div>
                  <svg className="w-5 h-5 text-obsidian-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>

                <button
                  onClick={() => onStartGame('rps')}
                  className="card w-full p-4 flex items-center gap-4 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-sunrise-400/20 flex items-center justify-center">
                    <span className="text-xl">🎮</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-body-medium text-white">Play a Game</p>
                    <p className="text-footnote text-obsidian-400">Rock Paper Scissors</p>
                  </div>
                  <svg className="w-5 h-5 text-obsidian-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="icebreaker"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Back button */}
              <button
                onClick={() => {
                  setSection('main')
                  setSelectedPrompt(null)
                  setAnswer('')
                }}
                className="flex items-center gap-2 text-obsidian-400 mb-6 touch-target"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                <span className="text-callout">Back</span>
              </button>

              {selectedPrompt ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <p className="text-body-bold text-white">{selectedPrompt}</p>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Your answer..."
                    className="input-base"
                    autoFocus
                  />
                  <button
                    onClick={handleSendIceBreaker}
                    disabled={!answer.trim()}
                    className="btn-primary w-full disabled:opacity-40"
                  >
                    Send
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  <h4 className="text-subhead text-obsidian-400 uppercase tracking-wider mb-4">
                    Choose a prompt
                  </h4>
                  {ICE_BREAKERS.map((prompt) => (
                    <motion.button
                      key={prompt}
                      variants={itemVariants}
                      onClick={() => setSelectedPrompt(prompt)}
                      className="card w-full p-4 text-left text-body text-white"
                      whileTap={{ scale: 0.98 }}
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Close button */}
      <div className="p-6 pt-0">
        <button
          onClick={onClose}
          className="w-full p-4 text-center text-callout text-obsidian-400"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
