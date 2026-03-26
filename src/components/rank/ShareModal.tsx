import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { InstagramProfile } from '@/types/rank'
import { haptics } from '@/utils/haptics'

interface ShareModalProps {
  isOpen: boolean
  profile: InstagramProfile | null
  onClose: () => void
}

const SHARE_LINK_BASE = 'https://linkrank.app/vote/'

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) return navigator.clipboard.writeText(text)
  // Fallback for older browsers / non-HTTPS
  const el = document.createElement('textarea')
  el.value = text
  el.style.position = 'absolute'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
  return Promise.resolve()
}

interface ShareOption {
  id: string
  label: string
  icon: string
  gradient: [string, string]
  action: (link: string, text: string) => void
}

function buildShareOptions(link: string, text: string): ShareOption[] {
  return [
    {
      id: 'copy',
      label: 'Copy Link',
      icon: '🔗',
      gradient: ['#7B61FF', '#A78BFA'],
      action: (l: string) => copyToClipboard(l),
    },
    {
      id: 'instagram',
      label: 'Instagram Story',
      icon: '📸',
      gradient: ['#FF6B9D', '#FF8C42'],
      action: (l: string) => {
        // In a real app, deep link to Instagram story composer
        copyToClipboard(l)
      },
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: '💬',
      gradient: ['#3BCEAC', '#00C2E0'],
      action: (l, t) => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${t}\n${l}`)}`
        window.open(url, '_blank')
      },
    },
    {
      id: 'twitter',
      label: 'X (Twitter)',
      icon: '🐦',
      gradient: ['#18181B', '#52525B'],
      action: (l, t) => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(l)}`
        window.open(url, '_blank')
      },
    },
    {
      id: 'native',
      label: 'More…',
      icon: '⋯',
      gradient: ['#94A3B8', '#64748B'],
      action: (l, t) => {
        if (navigator.share) {
          navigator.share({ title: 'LinkRank', text: t, url: l }).catch(() => {})
        } else {
          copyToClipboard(l)
        }
      },
    },
  ]
}

export function ShareModal({ isOpen, profile, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!profile) return null

  const shareLink = `${SHARE_LINK_BASE}${profile.username}`
  const shareText = `Vote for me on LinkRank! Who am I most likely to...? 🏆💎`
  const options = buildShareOptions(shareLink, shareText)

  const handleOption = async (option: ShareOption) => {
    haptics.subtle()
    await option.action(shareLink, shareText)
    if (option.id === 'copy' || option.id === 'instagram') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 tbh-backdrop"
            onClick={() => { haptics.subtle(); onClose() }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] tbh-surface pb-10 safe-bottom"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
            </div>

            {/* Header */}
            <div className="px-6 mb-6 text-center">
              <h2 className="text-title3 font-bold text-obsidian-900">Get more votes</h2>
              <p className="text-callout text-obsidian-400 mt-1">
                Share your link so friends can rank you
              </p>
            </div>

            {/* Link preview card */}
            <div className="px-6 mb-6">
              <div
                className="rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(123,97,255,0.08), rgba(255,107,157,0.06))',
                  border: '1px solid rgba(123,97,255,0.15)',
                }}
              >
                {/* Gradient orb */}
                <div
                  className="absolute right-0 top-0 w-24 h-24 rounded-full opacity-20 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, #7B61FF, transparent)', transform: 'translate(30%, -30%)' }}
                />

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' }}
                >
                  🏆
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-callout font-bold text-obsidian-800 truncate">
                    linkrank.app/vote/{profile.username}
                  </p>
                  <p className="text-caption text-obsidian-400 mt-0.5">Your personal ranking link</p>
                </div>
              </div>
            </div>

            {/* Share options */}
            <div className="px-6">
              <div className="grid grid-cols-5 gap-3 mb-4">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleOption(opt)}
                    className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                  >
                    <div
                      className="w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${opt.gradient[0]}, ${opt.gradient[1]})` }}
                    >
                      <span className="text-xl">{opt.icon}</span>
                    </div>
                    <p className="text-caption text-obsidian-500 leading-tight text-center">{opt.label}</p>
                  </button>
                ))}
              </div>

              {/* Copy success */}
              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl mb-3"
                    style={{ background: 'rgba(59,206,172,0.1)', border: '1px solid rgba(59,206,172,0.2)' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#3BCEAC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-callout font-semibold" style={{ color: '#3BCEAC' }}>Link copied to clipboard!</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cancel */}
              <button
                onClick={() => { haptics.subtle(); onClose() }}
                className="w-full py-3.5 rounded-2xl text-callout font-semibold text-obsidian-500 active:bg-obsidian-50 transition-colors"
                style={{ background: 'rgba(0,0,0,0.04)' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
