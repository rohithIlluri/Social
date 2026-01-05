import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GameStats {
  totalEncounters: number
  totalInteractions: number
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
}

interface GameState extends GameStats {
  // Actions
  incrementEncounters: () => void
  incrementInteractions: () => void
  recordGame: (won: boolean) => void
  checkStreak: () => void
  resetStats: () => void
}

const initialStats: GameStats = {
  totalEncounters: 0,
  totalInteractions: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialStats,

      incrementEncounters: () => {
        set((state) => ({ totalEncounters: state.totalEncounters + 1 }))
      },

      incrementInteractions: () => {
        set((state) => ({ totalInteractions: state.totalInteractions + 1 }))
      },

      recordGame: (won) => {
        set((state) => ({
          gamesPlayed: state.gamesPlayed + 1,
          gamesWon: won ? state.gamesWon + 1 : state.gamesWon,
        }))
      },

      checkStreak: () => {
        const { lastActiveDate, currentStreak, longestStreak } = get()
        const today = new Date().toDateString()

        if (lastActiveDate === today) {
          return // Already checked in today
        }

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toDateString()

        if (lastActiveDate === yesterdayStr) {
          // Continue streak
          const newStreak = currentStreak + 1
          set({
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, longestStreak),
            lastActiveDate: today,
          })
        } else if (lastActiveDate !== today) {
          // Reset streak
          set({
            currentStreak: 1,
            lastActiveDate: today,
          })
        }
      },

      resetStats: () => set(initialStats),
    }),
    {
      name: 'friendcatcher-game',
    }
  )
)
