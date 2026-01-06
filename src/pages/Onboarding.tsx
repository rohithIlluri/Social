import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/common/Button'
import { Avatar } from '@/components/common/Avatar'
import { useUserStore } from '@/store/userStore'
import { generateNickname, generateAvatarColor } from '@/utils/nameGenerator'
import { haptics } from '@/utils/haptics'

type Step = 'welcome' | 'location'

const stepVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export function Onboarding() {
  const navigate = useNavigate()
  const { createGuestUser, updateUser, completeOnboarding } = useUserStore()
  const [step, setStep] = useState<Step>('welcome')
  const [nickname, setNickname] = useState('')
  const [avatarColor, setAvatarColor] = useState('')
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [shuffleKey, setShuffleKey] = useState(0)

  // Auto-generate identity on mount
  useEffect(() => {
    const generatedNickname = generateNickname()
    const generatedColor = generateAvatarColor()
    setNickname(generatedNickname)
    setAvatarColor(generatedColor)
  }, [])

  const regenerateIdentity = () => {
    haptics.light()
    setNickname(generateNickname())
    setAvatarColor(generateAvatarColor())
    setShuffleKey(prev => prev + 1)
  }

  const handleStart = () => {
    haptics.medium()
    // Create the user with auto-generated identity
    createGuestUser()
    // Update with the displayed identity (in case they shuffled)
    updateUser({ nickname, avatarColor })
    setStep('location')
  }

  const requestLocationPermission = async () => {
    setIsLoading(true)
    setPermissionError(null)
    haptics.subtle()

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      if (result.state === 'denied') {
        setPermissionError('Location access was denied. Please enable it in your browser settings.')
        setIsLoading(false)
        haptics.error()
        return
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          haptics.success()
          completeOnboarding()
          navigate('/')
        },
        (error) => {
          setIsLoading(false)
          haptics.error()
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionError('Location access was denied.')
          } else {
            setPermissionError('Could not get your location.')
          }
        }
      )
    } catch {
      navigator.geolocation.getCurrentPosition(
        () => {
          haptics.success()
          completeOnboarding()
          navigate('/')
        },
        () => {
          setIsLoading(false)
          haptics.error()
          setPermissionError('Location access is required.')
        }
      )
    }
  }

  // Progress dots - only 2 steps now
  const steps: Step[] = ['welcome', 'location']
  const currentIndex = steps.indexOf(step)

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-950">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
              className="text-center max-w-sm"
            >
              {/* Radar-style brand mark */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] }}
                className="mb-10"
              >
                <div className="w-28 h-28 mx-auto rounded-full bg-radar-screen flex items-center justify-center relative">
                  {/* Radar rings */}
                  <div className="absolute inset-2 rounded-full border border-radar-ring opacity-60" />
                  <div className="absolute inset-5 rounded-full border border-radar-ring opacity-40" />
                  <div className="absolute inset-8 rounded-full border border-radar-ring opacity-20" />

                  {/* Center blip */}
                  <div className="w-4 h-4 rounded-full bg-radar-blip shadow-glow-radar animate-blip-pulse" />

                  {/* Sweep line */}
                  <div
                    className="absolute inset-0 origin-center animate-radar-sweep"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0deg, rgba(34, 197, 94, 0.2) 0deg, transparent 60deg)',
                    }}
                  />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: [0, 0, 0.2, 1] }}
                className="text-title1 text-white mb-2"
              >
                FriendCatcher
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: [0, 0, 0.2, 1] }}
                className="text-body text-obsidian-400 mb-12"
              >
                Discover friends in the real world
              </motion.p>

              {/* Auto-generated identity preview */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4, ease: [0, 0, 0.2, 1] }}
                className="mb-8"
              >
                <p className="text-footnote text-obsidian-500 uppercase tracking-wider mb-4">
                  Your identity
                </p>

                <motion.div
                  key={shuffleKey}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
                >
                  <Avatar nickname={nickname} color={avatarColor} size="xl" />
                </motion.div>

                <motion.p
                  key={`name-${shuffleKey}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="text-title3 text-white mt-4"
                >
                  {nickname}
                </motion.p>

                <button
                  onClick={regenerateIdentity}
                  className="mt-4 px-4 py-2 text-callout text-obsidian-400 flex items-center justify-center gap-2 mx-auto transition-colors hover:text-obsidian-300"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                  </svg>
                  Shuffle
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4, ease: [0, 0, 0.2, 1] }}
              >
                <Button onClick={handleStart} className="w-full">
                  Start Discovering
                </Button>
              </motion.div>
            </motion.div>
          )}

          {step === 'location' && (
            <motion.div
              key="location"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
              className="w-full max-w-sm text-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0, 0, 0.2, 1] }}
                className="w-24 h-24 mx-auto mb-8 rounded-full bg-obsidian-800/50 flex items-center justify-center border border-obsidian-700/50"
              >
                <svg className="w-12 h-12 text-radar-blip" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: [0, 0, 0.2, 1] }}
                className="text-title2 text-white mb-3"
              >
                Enable location
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: [0, 0, 0.2, 1] }}
                className="text-body text-obsidian-400 mb-10"
              >
                We'll use this to find nearby friends.
                <br />
                <span className="text-obsidian-500">Your exact location is never shared.</span>
              </motion.p>

              {permissionError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-footnote text-error mb-6"
                >
                  {permissionError}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4, ease: [0, 0, 0.2, 1] }}
              >
                <Button onClick={requestLocationPermission} className="w-full" isLoading={isLoading}>
                  Allow Location Access
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress indicator - 2 steps */}
      <div className="flex justify-center gap-2 pb-12 safe-bottom">
        {steps.map((s, i) => (
          <motion.div
            key={s}
            initial={false}
            animate={{
              width: i === currentIndex ? 24 : 6,
              opacity: i <= currentIndex ? 1 : 0.3,
            }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
            className={`h-1.5 rounded-full ${
              i <= currentIndex ? 'bg-radar-blip' : 'bg-obsidian-700'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
