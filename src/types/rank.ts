// Instagram Ranking App — tbh-style types

export interface InstagramProfile {
  id: string
  username: string
  displayName: string
  avatarUrl: string
  followerCount: number
  followingCount: number
  postCount: number
  bio: string
  isVerified: boolean
}

export type PollCategory =
  | 'viral'
  | 'creative'
  | 'funny'
  | 'aesthetic'
  | 'inspiring'
  | 'adventurous'
  | 'social'
  | 'trendsetter'

export interface PollQuestion {
  id: string
  text: string
  emoji: string
  category: PollCategory
  gradient: [string, string]  // [from, to] hex colors
}

export interface PollOption {
  profile: InstagramProfile
  position: 0 | 1 | 2 | 3   // 2x2 grid position
}

export interface Poll {
  id: string
  question: PollQuestion
  options: [PollOption, PollOption, PollOption, PollOption]
}

export interface Vote {
  pollId: string
  questionId: string
  category: PollCategory
  votedForId: string
  votedAt: Date
}

export type GemRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Gem {
  id: string
  questionText: string
  questionEmoji: string
  category: PollCategory
  rarity: GemRarity
  receivedAt: Date
  gradient: [string, string]
}

export interface RankEntry {
  profile: InstagramProfile
  rank: number
  gemCount: number
  topCategory: PollCategory
  categoryBreakdown: Partial<Record<PollCategory, number>>
  weeklyChange: number   // +/- positions vs last week
  gradient: [string, string]  // profile card gradient
}

export interface RankStore {
  // Connection state
  isConnected: boolean
  currentUser: InstagramProfile | null
  network: InstagramProfile[]

  // Poll state
  polls: Poll[]
  currentPollIndex: number
  votedPolls: Set<string>
  votes: Vote[]

  // Rankings
  leaderboard: RankEntry[]
  myRank: RankEntry | null

  // Gems (received anonymous votes)
  gems: Gem[]
  newGemCount: number

  // Actions
  connect: (profile: InstagramProfile) => void
  disconnect: () => void
  loadPolls: () => void
  submitVote: (pollId: string, votedForId: string) => void
  markGemsRead: () => void
}
