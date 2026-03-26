import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InstagramProfile, Poll, Vote, RankEntry, Gem, PollCategory } from '@/types/rank'
import {
  generatePolls,
  generateLeaderboard,
  generateGems,
  getNetworkProfiles,
} from '@/services/instagramMock'

// ─── State shape ───────────────────────────────────────────────────────────────
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

  // Gems
  gems: Gem[]
  newGemCount: number

  // Actions
  connect: (profile: InstagramProfile) => void
  disconnect: () => void
  advanceToNextPoll: () => void
  resetPollIndex: () => void
  submitVote: (pollId: string, questionId: string, category: PollCategory, votedForId: string) => void
  markGemsRead: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────
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
      gems: [],
      newGemCount: 0,

      connect: (profile: InstagramProfile) => {
        const network = getNetworkProfiles()
        const polls = generatePolls(network)
        const leaderboard = generateLeaderboard(network, profile)
        const gems = generateGems()

        set({
          isConnected: true,
          currentUser: profile,
          network,
          polls,
          currentPollIndex: 0,
          votes: [],
          leaderboard,
          gems,
          newGemCount: gems.length,
        })
      },

      disconnect: () =>
        set({
          isConnected: false,
          currentUser: null,
          network: [],
          polls: [],
          currentPollIndex: 0,
          votes: [],
          leaderboard: [],
          gems: [],
          newGemCount: 0,
        }),

      advanceToNextPoll: () => {
        const { currentPollIndex, polls } = get()
        const next = currentPollIndex + 1
        // Cycle back silently after last poll (AllVotedState handles the UI)
        set({ currentPollIndex: next < polls.length ? next : polls.length })
      },

      submitVote: (pollId: string, questionId: string, category: PollCategory, votedForId: string) => {
        const { votes, leaderboard } = get()

        const vote: Vote = {
          pollId,
          questionId,
          category,
          votedForId,
          votedAt: new Date(),
        }

        // Optimistically update the voted person's gem count in the leaderboard
        const updated = leaderboard
          .map((entry) => {
            if (entry.profile.id !== votedForId) return entry
            return {
              ...entry,
              gemCount: entry.gemCount + 1,
              categoryBreakdown: {
                ...entry.categoryBreakdown,
                [category]: (entry.categoryBreakdown[category] ?? 0) + 1,
              },
            }
          })
          .sort((a, b) => b.gemCount - a.gemCount)
          .map((entry, i) => ({ ...entry, rank: i + 1 }))

        set({ votes: [...votes, vote], leaderboard: updated })
      },

      resetPollIndex: () => set({ currentPollIndex: 0 }),

      markGemsRead: () => set({ newGemCount: 0 }),
    }),
    {
      name: 'linkrank-store-v2',
      partialize: (state) => ({
        isConnected: state.isConnected,
        currentUser: state.currentUser,
        // Do NOT persist polls/leaderboard — always regenerate on connect
        votes: state.votes,
        gems: state.gems,
      }),
    }
  )
)
