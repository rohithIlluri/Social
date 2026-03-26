import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  InstagramProfile,
  Poll,
  Vote,
  RankEntry,
  Gem,
} from '@/types/rank'
import {
  generatePolls,
  generateLeaderboard,
  generateGems,
  getNetworkProfiles,
} from '@/services/instagramMock'

interface RankState {
  // Connection
  isConnected: boolean
  currentUser: InstagramProfile | null
  network: InstagramProfile[]

  // Polls
  polls: Poll[]
  currentPollIndex: number
  votes: Vote[]

  // Rankings
  leaderboard: RankEntry[]
  myRank: RankEntry | null

  // Gems
  gems: Gem[]
  newGemCount: number

  // Actions
  connect: (profile: InstagramProfile) => void
  disconnect: () => void
  advanceToNextPoll: () => void
  submitVote: (pollId: string, questionId: string, category: import('@/types/rank').PollCategory, votedForId: string) => void
  markGemsRead: () => void
  addGem: (gem: Gem) => void
  refreshLeaderboard: () => void
}

export const useRankStore = create<RankState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      currentUser: null,
      network: [],
      polls: [],
      currentPollIndex: 0,
      votes: [],
      leaderboard: [],
      myRank: null,
      gems: [],
      newGemCount: 0,

      connect: (profile: InstagramProfile) => {
        const network = getNetworkProfiles()
        const polls = generatePolls(network)
        const leaderboard = generateLeaderboard(network, profile)
        const gems = generateGems()
        const myRank = leaderboard.find(e => e.profile.id === profile.id) ?? null

        set({
          isConnected: true,
          currentUser: profile,
          network,
          polls,
          currentPollIndex: 0,
          leaderboard,
          myRank,
          gems,
          newGemCount: gems.length,
        })
      },

      disconnect: () => {
        set({
          isConnected: false,
          currentUser: null,
          network: [],
          polls: [],
          currentPollIndex: 0,
          votes: [],
          leaderboard: [],
          myRank: null,
          gems: [],
          newGemCount: 0,
        })
      },

      advanceToNextPoll: () => {
        const { currentPollIndex, polls } = get()
        if (currentPollIndex < polls.length - 1) {
          set({ currentPollIndex: currentPollIndex + 1 })
        } else {
          // Cycle back
          set({ currentPollIndex: 0 })
        }
      },

      submitVote: (pollId, questionId, category, votedForId) => {
        const vote: Vote = {
          pollId,
          questionId,
          category,
          votedForId,
          votedAt: new Date(),
        }
        const { votes, leaderboard } = get()

        // Update leaderboard gem count for voted person
        const updated = leaderboard.map(entry => {
          if (entry.profile.id === votedForId) {
            return {
              ...entry,
              gemCount: entry.gemCount + 1,
              categoryBreakdown: {
                ...entry.categoryBreakdown,
                [category]: (entry.categoryBreakdown[category] ?? 0) + 1,
              },
            }
          }
          return entry
        }).sort((a, b) => b.gemCount - a.gemCount)
           .map((entry, i) => ({ ...entry, rank: i + 1 }))

        set({ votes: [...votes, vote], leaderboard: updated })
      },

      markGemsRead: () => {
        set({ newGemCount: 0 })
      },

      addGem: (gem: Gem) => {
        const { gems, newGemCount } = get()
        set({ gems: [gem, ...gems], newGemCount: newGemCount + 1 })
      },

      refreshLeaderboard: () => {
        const { network, currentUser } = get()
        if (!currentUser) return
        const leaderboard = generateLeaderboard(network, currentUser)
        const myRank = leaderboard.find(e => e.profile.id === currentUser.id) ?? null
        set({ leaderboard, myRank })
      },
    }),
    {
      name: 'rank-store',
      partialize: (state) => ({
        isConnected: state.isConnected,
        currentUser: state.currentUser,
        votes: state.votes,
        gems: state.gems,
      }),
    }
  )
)
