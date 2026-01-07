import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { signInAnonymously, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '@/services/firebase'
import type { User } from '@/types'
import { generateNickname, generateAvatarColor } from '@/utils/nameGenerator'
import { DEFAULT_RADIUS_METERS } from '@/utils/constants'

interface UserState {
  user: User | null
  isAuthenticated: boolean
  isOnboarded: boolean // New: tracks if onboarding is complete
  isLoading: boolean

  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  updateUser: (updates: Partial<User>) => void
  createGuestUser: () => Promise<User>
  completeOnboarding: () => void
  addXP: (amount: number) => void
  addBadge: (badgeId: string) => void
  logout: () => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      }),

      setLoading: (isLoading) => set({ isLoading }),

      updateUser: (updates) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...updates } })
        }
      },

      createGuestUser: async () => {
        set({ isLoading: true })

        // Sign in anonymously with Firebase to get a verified user ID
        // This enables secure Socket.io authentication for profile exchange
        const credential = await signInAnonymously(auth)
        const firebaseUid = credential.user.uid

        const newUser: User = {
          id: firebaseUid, // Use Firebase UID for secure authentication
          nickname: generateNickname(), // Always auto-generate
          avatarColor: generateAvatarColor(),
          interests: [],
          level: 1,
          xp: 0,
          badges: [],
          discoveryRadius: DEFAULT_RADIUS_METERS,
          createdAt: new Date(),
          lastActive: new Date(),
        }
        // Don't set isOnboarded yet - wait for full onboarding completion
        set({ user: newUser, isAuthenticated: true, isLoading: false })
        return newUser
      },

      completeOnboarding: () => set({ isOnboarded: true }),

      addXP: (amount) => {
        const { user } = get()
        if (user) {
          const newXP = user.xp + amount
          const THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]
          let newLevel = 1
          for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
            if (newXP >= THRESHOLDS[i]) {
              newLevel = i + 1
              break
            }
          }
          set({ user: { ...user, xp: newXP, level: newLevel } })
        }
      },

      addBadge: (badgeId) => {
        const { user } = get()
        if (user && !user.badges.includes(badgeId)) {
          set({ user: { ...user, badges: [...user.badges, badgeId] } })
        }
      },

      logout: async () => {
        // Sign out from Firebase
        await firebaseSignOut(auth)
        set({
          user: null,
          isAuthenticated: false,
          isOnboarded: false,
          isLoading: false,
        })
      },
    }),
    {
      name: 'friendcatcher-user',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded
      }),
    }
  )
)
