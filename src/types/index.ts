// User types
export interface User {
  id: string
  email?: string
  nickname: string
  avatarColor: string
  realName?: string
  interests: string[]
  level: number
  xp: number
  badges: string[]
  discoveryRadius: number // in meters
  createdAt: Date
  lastActive: Date
}

export interface UserLocation {
  lat: number
  lng: number
  timestamp: number
  active: boolean
}

// Encounter types
export interface Encounter {
  id: string
  users: [string, string]
  location: {
    lat: number
    lng: number
  }
  startedAt: Date
  interactionCount: number
  status: 'active' | 'ended'
}

export interface NearbyUser {
  id: string
  nickname: string
  avatarColor: string
  distance: number // in meters
  revealLevel: number
  interests?: string[]
  realName?: string
}

// Interaction types
export type InteractionType = 'reaction' | 'icebreaker' | 'game'

export interface Interaction {
  id: string
  encounterId: string
  fromUser: string
  toUser: string
  type: InteractionType
  data: ReactionData | IceBreakerData | GameData
  timestamp: Date
}

export interface ReactionData {
  emoji: string
  label: string
}

export interface IceBreakerData {
  prompt: string
  answer: string
}

export interface GameData {
  game: 'rps' | 'emoji' | 'trivia'
  move?: string
  result?: 'win' | 'lose' | 'draw'
}

// Chat types
export interface Chat {
  id: string
  participants: [string, string]
  lastMessage: string
  lastMessageAt: Date
}

export interface Message {
  id: string
  sender: string
  text: string
  timestamp: Date
}

// Friendship types
export interface Friendship {
  id: string
  users: [string, string]
  level: number
  totalInteractions: number
  firstEncounter: Date
  isFavorite: boolean
}

// Gamification types
export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: Date
}

export const BADGES: Badge[] = [
  { id: 'first_catch', name: 'First Catch', description: 'Complete your first encounter', icon: '🎯' },
  { id: 'social_butterfly', name: 'Social Butterfly', description: '10 different encounters', icon: '🦋' },
  { id: 'connector', name: 'Connector', description: '5 mutual friends', icon: '🤝' },
  { id: 'explorer', name: 'Explorer', description: 'Encounters in 5 different areas', icon: '🗺️' },
  { id: 'game_master', name: 'Game Master', description: 'Win 20 mini-games', icon: '🎮' },
  { id: 'streak_lord', name: 'Streak Lord', description: '7-day streak', icon: '🔥' },
]

// XP thresholds for levels
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]

// Reactions available
export const REACTIONS = [
  { emoji: '👋', label: 'Wave' },
  { emoji: '🙌', label: 'High-five' },
  { emoji: '✨', label: 'Spark' },
  { emoji: '😎', label: 'Cool vibes' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💫', label: 'Star' },
]

// Ice breaker prompts
export const ICE_BREAKERS = [
  'Coffee or tea?',
  'What song are you vibing to?',
  'Morning person or night owl?',
  'Best local food spot?',
  'Cats or dogs?',
  'Beach or mountains?',
  'What\'s your superpower?',
  'Last thing that made you laugh?',
]
