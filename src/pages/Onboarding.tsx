import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/common/Button'
import { Avatar } from '@/components/common/Avatar'
import { Input } from '@/components/common/Input'
import { useUserStore } from '@/store/userStore'
import { generateNickname, generateAvatarColor } from '@/utils/nameGenerator'

type Step = 'welcome' | 'name' | 'identity' | 'location'

const stepVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export function Onboarding() {
  const navigate = useNavigate()
  const { createGuestUser, updateUser, completeOnboarding } = useUserStore()
  const [step, setStep] = useState<Step>('welcome')
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState(generateNickname())
  const [avatarColor, setAvatarColor] = useState(generateAvatarColor())
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleStart = () => {
    setStep('name')
  }

  const handleNameSubmit = () => {
    if (!name.trim()) return
    createGuestUser(name.trim())
    setStep('identity')
  }

  const regenerateIdentity = () => {
    setNickname(generateNickname())
    setAvatarColor(generateAvatarColor())
  }

  const handleSaveIdentity = () => {
    updateUser({ nickname, avatarColor })
    setStep('location')
  }

  const requestLocationPermission = async () => {
    setIsLoading(true)
    setPermissionError(null)

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      if (result.state === 'denied') {
        setPermissionError('Location access was denied. Please enable it in your browser settings.')
        setIsLoading(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          completeOnboarding()
          navigate('/')
        },
        (error) => {
          setIsLoading(false)
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
          completeOnboarding()
          navigate('/')
        },
        () => {
          setIsLoading(false)
          setPermissionError('Location access is required.')
        }
      )
    }
  }

  // Progress dots
  const steps: Step[] = ['welcome', 'name', 'identity', 'location']
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
              transition={{ duration: 0.3 }}
              className="text-center max-w-sm"
            >
              {/* Logo / Brand mark */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
                className="mb-12"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-sunrise-400 to-sunrise-500 flex items-center justify-center shadow-glow-sunrise">
                  <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-display text-white mb-4"
              >
                FriendCatcher
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-body-large text-obsidian-400 mb-16"
              >
                Discover friends in the real world
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button onClick={handleStart} className="w-full">
                  Get Started
                </Button>
              </motion.div>
            </motion.div>
          )}

          {step === 'name' && (
            <motion.div
              key="name"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm"
            >
              <h2 className="text-title1 text-white mb-2 text-center">
                What should we call you?
              </h2>
              <p className="text-body text-obsidian-400 mb-12 text-center">
                This is just for us
              </p>

              <div className="space-y-8">
                <Input
                  label="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                  autoFocus
                />

                <Button
                  onClick={handleNameSubmit}
                  className="w-full"
                  disabled={!name.trim()}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'identity' && (
            <motion.div
              key="identity"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm text-center"
            >
              <h2 className="text-title1 text-white mb-2">
                Your secret identity
              </h2>
              <p className="text-body text-obsidian-400 mb-12">
                This is how others will see you at first
              </p>

              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="mb-6"
              >
                <Avatar nickname={nickname} color={avatarColor} size="2xl" />
              </motion.div>

              <p className="text-title2 text-white mb-8">{nickname}</p>

              <div className="space-y-4">
                <button
                  onClick={regenerateIdentity}
                  className="w-full p-4 text-callout text-obsidian-400 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                  </svg>
                  Shuffle
                </button>

                <Button onClick={handleSaveIdentity} className="w-full">
                  This is me
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'location' && (
            <motion.div
              key="location"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm text-center"
            >
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-obsidian-800 flex items-center justify-center">
                <svg className="w-10 h-10 text-obsidian-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>

              <h2 className="text-title1 text-white mb-2">
                Enable location
              </h2>
              <p className="text-body text-obsidian-400 mb-12">
                We'll use this to find nearby friends. Your exact location is never shared.
              </p>

              {permissionError && (
                <p className="text-footnote text-error mb-6">{permissionError}</p>
              )}

              <Button onClick={requestLocationPermission} className="w-full" isLoading={isLoading}>
                Allow Location Access
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 pb-12 safe-bottom">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-base ${
              i === currentIndex
                ? 'w-6 bg-sunrise-400'
                : i < currentIndex
                ? 'w-1.5 bg-sunrise-400/50'
                : 'w-1.5 bg-obsidian-700'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
