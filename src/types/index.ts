/**
 * FriendCatcher Types
 *
 * Privacy-First Architecture:
 * - User profiles stored in localStorage only (never sent to server)
 * - All server data is ephemeral (auto-deleted when users disconnect)
 * - No persistent relationships or chat history
 */

// User types (stored in localStorage only - never persisted to server)
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

// Encounter types (ephemeral - stored in RTDB, auto-deleted)
export interface Encounter {
  id: string
  users: [string, string]
  location: {
    lat: number
    lng: number
  }
  startedAt: Date
  interactionCount: number
  active: boolean
}

export interface NearbyUser {
  id: string
  distance: number // in meters
  revealLevel: number
  // Profile fields - optional (fetched via Socket.io peer-to-peer)
  // Undefined until profile is exchanged
  nickname?: string
  avatarColor?: string
  interests?: string[]
  realName?: string
}

// Interaction types (used in-memory only, not persisted)
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

// Message types (ephemeral - stored in RTDB, auto-deleted with encounter)
export interface Message {
  id: string
  sender: string
  text: string
  timestamp: Date
}

// Gamification types (stored in localStorage only)
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
