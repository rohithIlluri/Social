import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRankStore } from '@/store/rankStore'
import { simulateInstagramOAuth } from '@/services/instagramMock'
import { haptics } from '@/utils/haptics'

const FEATURE_BULLETS = [
  { emoji: '🗳️', text: 'Vote anonymously on fun questions about your network' },
  { emoji: '💎', text: 'Earn gems when friends vote for you' },
  { emoji: '🏆', text: 'See where you rank in your circle' },
  { emoji: '🔒', text: 'All votes are completely anonymous' },
]

const GRADIENT_PAIRS: [string, string][] = [
  ['#FF6B9D', '#FF8C42'],
  ['#7B61FF', '#FF6B9D'],
  ['#3BCEAC', '#00C2E0'],
  ['#FFD23F', '#FF8C42'],
]

function FloatingBubble({ delay, x, y, gradient }: {
  delay: number; x: string; y: string; gradient: [string, string]
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0.8, 1, 0.8],
        opacity: [0.3, 0.5, 0.3],
        y: [0, -12, 0],
      }}
      transition={{
        duration: 4 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x,
        top: y,
        width: 60 + Math.random() * 50,
        height: 60 + Math.random() * 50,
        background: `linear-gradient(135deg, ${gradient[0]}60, ${gradient[1]}40)`,
        filter: 'blur(2px)',
      }}
    />
  )
}

export function InstagramConnect() {
  const { connect } = useRankStore()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)

  const handleConnect = async () => {
    if (isLoading) return
    haptics.subtle()
    setIsLoading(true)

    // Simulate OAuth steps
    setLoadingStep(1)
    await new Promise(r => setTimeout(r, 600))
    setLoadingStep(2)
    await new Promise(r => setTimeout(r, 500))
    setLoadingStep(3)

    try {
      const profile = await simulateInstagramOAuth()
      haptics.connection()
      connect(profile)
    } catch {
      setIsLoading(false)
      setLoadingStep(0)
    }
  }

  const loadingLabels = ['', 'Opening Instagram...', 'Authorizing...', 'Loading your network...']

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Background bubbles */}
      {GRADIENT_PAIRS.map((gradient, i) => (
        <FloatingBubble
          key={i}
          gradient={gradient}
          delay={i * 0.8}
          x={`${10 + i * 22}%`}
          y={`${5 + (i % 2) * 20}%`}
        />
      ))}
      <FloatingBubble gradient={['#A78BFA', '#FB7185']} delay={1.2} x="70%" y="60%" />
      <FloatingBubble gradient={['#FFD23F', '#3BCEAC']} delay={2.0} x="15%" y="55%" />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 pt-16 pb-8">
        {/* Logo / hero */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-24 h-24 rounded-[28px] flex items-center justify-center mb-8 shadow-xl"
          style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' }}
        >
          <span className="text-5xl">🏆</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className="text-title1 font-bold text-center text-obsidian-900 leading-tight"
        >
          Who ranks #1 in
          <br />
          <span
            style={{
              background: 'linear-gradient(90deg, #7B61FF, #FF6B9D)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            your network?
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className="text-body text-obsidian-500 text-center mt-3 max-w-xs"
        >
          Vote on fun questions about your Instagram circle. See where you rank.
        </motion.p>

        {/* Feature bullets */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-sm mt-8 flex flex-col gap-3"
        >
          {FEATURE_BULLETS.map((bullet, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + i * 0.08, duration: 0.35, ease: [0, 0, 0.2, 1] }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(0,0,0,0.03)' }}
            >
              <span className="text-2xl flex-shrink-0">{bullet.emoji}</span>
              <p className="text-callout text-obsidian-700">{bullet.text}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className="w-full max-w-sm mt-8"
        >
          <motion.button
            onClick={handleConnect}
            disabled={isLoading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-body-bold text-white shadow-lg relative overflow-hidden"
            style={{
              background: isLoading
                ? 'linear-gradient(135deg, #9B89FF, #FF8CB0)'
                : 'linear-gradient(135deg, #7B61FF, #FF6B9D)',
            }}
          >
            {/* Shimmer on loading */}
            {isLoading && (
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                }}
              />
            )}

            <div className="relative z-10 flex items-center justify-center gap-3">
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white"
                  />
                  <span>{loadingLabels[loadingStep]}</span>
                </>
              ) : (
                <>
                  {/* Instagram icon */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  Connect Instagram
                </>
              )}
            </div>
          </motion.button>

          <p className="text-center text-caption text-obsidian-400 mt-3">
            We never post or store your password
          </p>
        </motion.div>
      </div>
    </div>
  )
}
