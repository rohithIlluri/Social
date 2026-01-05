// App constants

// Distance constants
export const METERS_PER_MILE = 1609.34
export const DEFAULT_RADIUS_METERS = 400 // ~0.25 miles
export const MIN_RADIUS_METERS = 50
export const MAX_RADIUS_METERS = METERS_PER_MILE // 1 mile

// XP rewards
export const XP_NEW_ENCOUNTER = 10
export const XP_SEND_REACTION = 5
export const XP_ICEBREAKER_COMPLETE = 15
export const XP_GAME_PLAYED = 20
export const XP_GAME_WON = 10
export const XP_DAILY_STREAK = 25

// Reveal levels
export const REVEAL_LEVEL_COLOR = 1
export const REVEAL_LEVEL_INTERESTS = 3
export const REVEAL_LEVEL_NAME = 5
export const REVEAL_LEVEL_FULL = 10

// Timing
export const LOCATION_UPDATE_INTERVAL = 10000 // 10 seconds
export const ENCOUNTER_TIMEOUT = 300000 // 5 minutes of inactivity

// Map defaults
export const DEFAULT_MAP_ZOOM = 15
export const DEFAULT_MAP_CENTER = {
  lat: 37.7749,
  lng: -122.4194,
}
