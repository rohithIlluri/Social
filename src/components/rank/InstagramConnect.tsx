import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRankStore } from '@/store/rankStore'
import { simulateInstagramOAuth } from '@/services/instagramMock'
import { haptics } from '@/utils/haptics'

// ─── How it works steps ────────────────────────────────────────────────────────
const STEPS = [
  {
    emoji: '🔗',
    title: 'Connect Instagram',
    desc: 'Link your account to import your network',
  },
  {
    emoji: '🗳️',
    title: 'Vote on friends',
    desc: 'Answer fun questions about your circle',
  },
  {
    emoji: '💎',
    title: 'Earn gems',
    desc: 'Get ranked when others vote for you',
  },
]

const LOADING_STEPS = [
  'Opening Instagram…',
  'Verifying account…',
  'Loading your network…',
  'Setting up rankings…',
]

// ─── Animated background orbs ──────────────────────────────────────────────────
const ORBS = [
  { color: '#7B61FF', size: 220, x: '-10%', y: '-5%', delay: 0 },
  { color: '#FF6B9D', size: 180, x: '60%', y: '10%', delay: 0.6 },
  { color: '#FF8C42', size: 140, x: '75%', y: '55%', delay: 1.2 },
  { color: '#3BCEAC', size: 120, x: '-5%', y: '60%', delay: 0.9 },
  { color: '#FFD23F', size: 90,  x: '40%', y: '75%', delay: 1.5 },
]

function BackgroundOrb({ color, size, x, y, delay }: typeof ORBS[0]) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: [0.12, 0.22, 0.12],
        scale: [0.95, 1.05, 0.95],
        y: [0, -16, 0],
      }}
      transition={{
        opacity: { duration: 5, delay, repeat: Infinity, ease: 'easeInOut' },
        scale:   { duration: 6, delay, repeat: Infinity, ease: 'easeInOut' },
        y:       { duration: 7, delay, repeat: Infinity, ease: 'easeInOut' },
      }}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: `radial-gradient(circle, ${color}50, ${color}00)`,
        filter: 'blur(32px)',
      }}
    />
  )
}

// ─── Loading progress ──────────────────────────────────────────────────────────
function LoadingScreen({ step }: { step: number }) {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center gap-6 tbh-surface z-10"
    >
      {/* Animated logo */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-2xl"
        style={{ background: 'conic-gradient(from 0deg, #7B61FF, #FF6B9D, #FF8C42, #7B61FF)' }}
      />

      {/* Progress steps */}
      <div className="flex flex-col items-center gap-3 w-64">
        {LOADING_STEPS.map((label, i) => {
          const done = i < step
          const active = i === step - 1
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: done || active ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-center gap-3 w-full"
            >
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{
                  background: done
                    ? 'linear-gradient(135deg, #7B61FF, #FF6B9D)'
                    : active
                      ? 'rgba(123,97,255,0.15)'
                      : 'rgba(0,0,0,0.06)',
                  border: active ? '2px solid #7B61FF' : 'none',
                }}
              >
                {done && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {active && (
                  <motion.div
                    animate={{ scale: [0.6, 1, 0.6] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#7B61FF' }}
                  />
                )}
              </div>
              <p className={`text-callout ${done ? 'text-obsidian-400 line-through' : active ? 'text-obsidian-800 font-semibold' : 'text-obsidian-300'}`}>
                {label}
              </p>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Main connect screen ───────────────────────────────────────────────────────
export function InstagramConnect() {
  const { connect } = useRankStore()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)

  const handleConnect = async () => {
    if (isLoading) return
    haptics.subtle()
    setIsLoading(true)

    const advance = (step: number, delay: number) =>
      new Promise<void>(r => setTimeout(() => { setLoadingStep(step); r() }, delay))

    await advance(1, 400)
    await advance(2, 600)
    await advance(3, 500)
    await advance(4, 700)

    try {
      const profile = await simulateInstagramOAuth()
      haptics.connection()
      connect(profile)
    } catch {
      setIsLoading(false)
      setLoadingStep(0)
    }
  }

  return (
    <div className="min-h-screen tbh-surface relative overflow-hidden flex flex-col">
      {/* Background orbs */}
      {ORBS.map((orb, i) => <BackgroundOrb key={i} {...orb} />)}

      <AnimatePresence>
        {isLoading && <LoadingScreen step={loadingStep} />}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 px-6 pt-safe-top">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className="mt-6 self-start"
        >
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-bold text-white"
            style={{ background: 'linear-gradient(90deg, #7B61FF, #FF6B9D)' }}
          >
            <span>✨</span> New — Anonymous Rankings
          </span>
        </motion.div>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center py-8">
          {/* App icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
            className="self-start mb-6"
          >
            <div
              className="w-20 h-20 rounded-[22px] flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' }}
            >
              <span className="text-4xl">🏆</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.45, ease: [0, 0, 0.2, 1] }}
            className="text-display font-bold text-obsidian-950 leading-none mb-3"
          >
            Who ranks
            <br />
            <span className="tbh-gradient-text">#1 in your</span>
            <br />
            network?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.4, ease: [0, 0, 0.2, 1] }}
            className="text-body text-obsidian-500 max-w-xs mb-10"
          >
            Anonymous votes. Real rankings. No cringe.
          </motion.p>

          {/* How it works */}
          <div className="flex flex-col gap-3 mb-10">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.38 + i * 0.09, duration: 0.38, ease: [0, 0, 0.2, 1] }}
                className="flex items-center gap-4"
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl shadow-sm"
                  style={{ background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.12)' }}
                >
                  {step.emoji}
                </div>
                <div>
                  <p className="text-callout font-bold text-obsidian-800">{step.title}</p>
                  <p className="text-footnote text-obsidian-400">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.45, ease: [0, 0, 0.2, 1] }}
          className="pb-10 safe-bottom"
        >
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl text-body-bold text-white shadow-lg relative overflow-hidden active:scale-[0.97] transition-transform"
            style={{
              background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)',
              boxShadow: '0 8px 32px rgba(123,97,255,0.35)',
            }}
          >
            <span className="flex items-center justify-center gap-3">
              {/* Instagram icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Continue with Instagram
            </span>
          </button>

          <p className="text-center text-caption text-obsidian-400 mt-3">
            🔒 Read-only access · Never posts on your behalf
          </p>
        </motion.div>
      </div>
    </div>
  )
}
