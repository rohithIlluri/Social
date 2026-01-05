# FEATURES.md

Complete feature specifications and business logic for FriendCatcher.

## Core Features Overview

FriendCatcher is a location-based social discovery PWA with four main feature areas:
1. **Encounters** - Real-time proximity detection
2. **Interactions** - Reactions, ice breakers, and mini-games
3. **Gamification** - XP, levels, badges, and streaks
4. **Chat** - Unlocked after mutual interaction

## 1. Encounters

### Overview
Encounters happen when two users come within range of each other's discovery radius.

### Discovery Radius
- **Default**: 400 meters (~0.25 miles)
- **Range**: 50m (MIN_RADIUS_METERS) to 1 mile (MAX_RADIUS_METERS)
- **User-configurable**: via RadiusSlider in Profile settings
- **Mutual requirement**: Both users must be within each other's radius

**Constants** ([src/utils/constants.ts](src/utils/constants.ts)):
```typescript
DEFAULT_RADIUS_METERS = 400
MIN_RADIUS_METERS = 50
MAX_RADIUS_METERS = 1609 // 1 mile
```

### Proximity Detection
**Mechanism**: Geohash-based queries of 9 cells (center + 8 neighbors)

**Process**:
1. User location encoded to 6-char geohash (~610m cells)
2. Query all 9 neighboring cells in Realtime Database
3. Calculate precise distance using Haversine formula
4. Filter by mutual discovery radius
5. Update nearbyUsers in encounterStore

**Implementation**: [src/hooks/useEncounters.ts](src/hooks/useEncounters.ts)

### Encounter Session
An encounter session starts when users are nearby and persists in Firestore:
```typescript
{
  id: string
  users: [userId1, userId2]
  location: { lat, lng }
  startedAt: Date
  interactionCount: number  // Increments with each interaction
  status: 'active' | 'ended'
}
```

**Timeout**: 5 minutes of inactivity (ENCOUNTER_TIMEOUT = 300000ms)

### NearbyUser Display
Users see nearby people as cards with progressive reveal:
```typescript
{
  id: string
  nickname: string          // e.g., "CosmicPanda_42"
  avatarColor: string       // e.g., "#3b82f6"
  distance: number          // in meters (rounded)
  revealLevel: number       // 0-10 based on interactionCount
  interests?: string[]      // Only if revealLevel >= 3
  realName?: string         // Only if revealLevel >= 5
}
```

## 2. Interactions

### Interaction Types
Three types defined in [src/types/index.ts](src/types/index.ts):
```typescript
type InteractionType = 'reaction' | 'icebreaker' | 'game'
```

### 2.1 Reactions
Quick emoji-based interactions.

**Available Reactions** (6 total):
```typescript
{ emoji: '👋', label: 'Wave' }
{ emoji: '🙌', label: 'High-five' }
{ emoji: '✨', label: 'Spark' }
{ emoji: '😎', label: 'Cool vibes' }
{ emoji: '🔥', label: 'Fire' }
{ emoji: '💫', label: 'Star' }
```

**XP Reward**: 5 XP (XP_SEND_REACTION)

**Data Structure**:
```typescript
interface ReactionData {
  emoji: string
  label: string
}
```

### 2.2 Ice Breakers
Question-and-answer prompts to start conversations.

**Available Prompts** (8 total):
```typescript
'Coffee or tea?'
'What song are you vibing to?'
'Morning person or night owl?'
'Best local food spot?'
'Cats or dogs?'
'Beach or mountains?'
'What\'s your superpower?'
'Last thing that made you laugh?'
```

**XP Reward**: 15 XP (XP_ICEBREAKER_COMPLETE)

**Data Structure**:
```typescript
interface IceBreakerData {
  prompt: string
  answer: string
}
```

**Flow**:
1. User A sends ice breaker prompt to User B
2. User B sees prompt and can answer
3. Completing the interaction awards XP to both users

### 2.3 Mini-Games
Three quick games to play with nearby users.

**Game Types**:
```typescript
type GameType = 'rps' | 'emoji' | 'trivia'
```

- **rps**: Rock-Paper-Scissors
- **emoji**: Emoji matching game
- **trivia**: Quick trivia questions

**XP Rewards**:
- Participation: 20 XP (XP_GAME_PLAYED)
- Winning: +10 XP bonus (XP_GAME_WON)
- Total for winner: 30 XP

**Data Structure**:
```typescript
interface GameData {
  game: 'rps' | 'emoji' | 'trivia'
  move?: string
  result?: 'win' | 'lose' | 'draw'
}
```

### Interaction Storage
All interactions stored in Firestore `interactions/` collection:
```typescript
{
  id: string
  encounterId: string
  fromUser: string
  toUser: string
  type: InteractionType
  data: ReactionData | IceBreakerData | GameData
  timestamp: Date
}
```

## 3. Gamification

### 3.1 Experience Points (XP)

**XP Sources** ([src/utils/constants.ts](src/utils/constants.ts)):
```typescript
XP_NEW_ENCOUNTER = 10       // First encounter with new user
XP_SEND_REACTION = 5        // Each reaction sent
XP_ICEBREAKER_COMPLETE = 15 // Ice breaker answered
XP_GAME_PLAYED = 20         // Participate in mini-game
XP_GAME_WON = 10            // Win mini-game (bonus)
XP_DAILY_STREAK = 25        // Daily streak maintained
```

**Example XP Calculations**:
- Send wave reaction: **5 XP**
- Complete ice breaker: **15 XP**
- Play RPS and win: **20 + 10 = 30 XP**
- First encounter + reaction: **10 + 5 = 15 XP**

### 3.2 Level Progression

**Total Levels**: 11 (Level 1 through Level 11)

**XP Thresholds** ([src/types/index.ts](src/types/index.ts)):
```typescript
LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]
```

**Level Table**:
| Level | XP Required | XP to Next Level |
|-------|-------------|------------------|
| 1 | 0 | 100 |
| 2 | 100 | 200 |
| 3 | 300 | 300 |
| 4 | 600 | 400 |
| 5 | 1000 | 500 |
| 6 | 1500 | 600 |
| 7 | 2100 | 700 |
| 8 | 2800 | 800 |
| 9 | 3600 | 900 |
| 10 | 4500 | 1000 |
| 11 | 5500 | (max) |

**Calculation Logic** ([src/store/userStore.ts](src/store/userStore.ts:41-56)):
```typescript
addXP: (amount) => {
  const newXP = user.xp + amount
  let newLevel = 1
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (newXP >= THRESHOLDS[i]) {
      newLevel = i + 1
      break
    }
  }
}
```

### 3.3 Badges

**Total Badges**: 6 unlockable achievements

**Badge Definitions** ([src/types/index.ts](src/types/index.ts:110-117)):
```typescript
{ id: 'first_catch', name: 'First Catch',
  description: 'Complete your first encounter', icon: '🎯' }

{ id: 'social_butterfly', name: 'Social Butterfly',
  description: '10 different encounters', icon: '🦋' }

{ id: 'connector', name: 'Connector',
  description: '5 mutual friends', icon: '🤝' }

{ id: 'explorer', name: 'Explorer',
  description: 'Encounters in 5 different areas', icon: '🗺️' }

{ id: 'game_master', name: 'Game Master',
  description: 'Win 20 mini-games', icon: '🎮' }

{ id: 'streak_lord', name: 'Streak Lord',
  description: '7-day streak', icon: '🔥' }
```

**Badge Unlock Conditions**:
- **First Catch**: Complete any encounter (interactionCount >= 1)
- **Social Butterfly**: totalEncounters >= 10
- **Connector**: 5+ friendships with level >= 3
- **Explorer**: Encounters in 5+ different geohash prefixes
- **Game Master**: gamesWon >= 20
- **Streak Lord**: currentStreak >= 7

**Badge Storage**: Array of badge IDs in User.badges

### 3.4 Streaks

**Purpose**: Encourage daily active usage

**Mechanism** ([src/store/gameStore.ts](src/store/gameStore.ts:53-80)):
```typescript
checkStreak: () => {
  const today = new Date().toDateString()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (lastActiveDate === yesterday) {
    // Continue streak
    currentStreak++
  } else if (lastActiveDate !== today) {
    // Reset streak
    currentStreak = 1
  }
}
```

**Streak Logic**:
- **Continue**: lastActiveDate was yesterday → increment currentStreak
- **Reset**: gap > 1 day → reset to 1
- **Same day**: No change (already checked in today)

**XP Reward**: 25 XP per day (XP_DAILY_STREAK)

**Stats Tracked**:
- `currentStreak`: Consecutive days active
- `longestStreak`: Personal record

## 4. Progressive Identity Reveal

### Concept
User profiles reveal gradually based on **interaction count** between two users.

### Reveal Thresholds ([src/utils/constants.ts](src/utils/constants.ts)):
```typescript
REVEAL_LEVEL_COLOR = 1
REVEAL_LEVEL_INTERESTS = 3
REVEAL_LEVEL_NAME = 5
REVEAL_LEVEL_FULL = 10
```

### Reveal Stages

| Interactions | Level | Visible Information |
|--------------|-------|---------------------|
| 0 | 0 | Generic silhouette avatar, no nickname |
| 1+ | 1 | Avatar color revealed, nickname shown |
| 3+ | 3 | Interests array revealed |
| 5+ | 5 | Real name revealed |
| 10+ | 10 | Full profile + chat unlocked |

### Implementation
The `revealLevel` is calculated based on the encounter's `interactionCount`:
```typescript
if (interactionCount >= 10) revealLevel = 10
else if (interactionCount >= 5) revealLevel = 5
else if (interactionCount >= 3) revealLevel = 3
else if (interactionCount >= 1) revealLevel = 1
else revealLevel = 0
```

### Privacy Implications
- **Anonymous encounters**: Initial interactions are low-risk
- **Mutual progression**: Both users must interact to reveal
- **Opt-in reveal**: Real name optional, controlled by user

## 5. Chat System

### Unlock Condition
Chat becomes available at **reveal level 10** (10+ mutual interactions).

### Architecture
**Pattern**: Firestore nested subcollections

**Chat Document** (`chats/{chatId}`):
```typescript
{
  id: string
  participants: [userId1, userId2]
  lastMessage: string
  lastMessageAt: Date
}
```

**Message Subcollection** (`chats/{chatId}/messages/{messageId}`):
```typescript
{
  id: string
  sender: string
  text: string
  timestamp: Date
}
```

### Features
- Real-time message sync via Firestore listeners
- Message history persists indefinitely
- Push notifications (to be implemented)

**Implementation**: [src/hooks/useChat.ts](src/hooks/useChat.ts) (to be implemented)

## 6. Friendship System

### Purpose
Track relationship strength and history between users.

### Friendship Data
```typescript
{
  id: string
  users: [userId1, userId2]
  level: number              // 1-10 based on interactions
  totalInteractions: number
  firstEncounter: Date
  isFavorite: boolean        // User-marked favorites
}
```

### Friendship Levels
Based on `totalInteractions`:
- Level 1: 1-2 interactions (acquaintance)
- Level 2: 3-5 interactions (friend)
- Level 3: 6-10 interactions (close friend)
- Level 4+: 10+ interactions (best friend)

### Friends List
Accessible via Friends page, shows:
- Friendship level
- Total interactions
- Days since first encounter
- Last interaction date

## 7. Location Updates

### Update Frequency
**Interval**: 10 seconds (LOCATION_UPDATE_INTERVAL = 10000ms)

**Implementation**: [src/hooks/useGeolocation.ts](src/hooks/useGeolocation.ts)

### Geolocation Options
```typescript
{
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: LOCATION_UPDATE_INTERVAL
}
```

### Active Status
- **Active**: User has app open and location tracking enabled
- **Inactive**: App closed or tracking stopped
- **Cleanup**: `onDisconnect` handler sets `active: false` automatically

### Privacy Controls
- Users control their discovery radius (50m-1 mile)
- Location data only shared when app is active
- Historical location not stored (Realtime DB only)

## 8. PWA Features

### Offline Support
- Service Worker caches static assets
- App shell loads instantly
- Network requests fallback gracefully

### Install Prompt
- "Add to Home Screen" banner on mobile
- Desktop install option via browser

### Push Notifications (Planned)
- New encounter detected
- Interaction received
- Friend comes online
- Badge unlocked

**Implementation**: To be added via Firebase Cloud Messaging

## Feature Status

### Implemented
- ✅ Geohash-based proximity detection
- ✅ Progressive identity reveal
- ✅ XP and leveling system
- ✅ Badge definitions
- ✅ Streak tracking
- ✅ Discovery radius configuration
- ✅ Reaction system
- ✅ Ice breaker prompts
- ✅ Mini-games definition

### In Progress
- 🚧 Encounter session management
- 🚧 Interaction handling
- 🚧 Badge unlock triggers
- 🚧 Friendship tracking

### Planned
- 📋 Chat system
- 📋 Push notifications
- 📋 Profile customization
- 📋 Leaderboards
- 📋 In-app reporting
- 📋 Block/unmatch functionality

## Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture
- [GAMELOGIC.md](GAMELOGIC.md) - Detailed gamification mechanics
- [API.md](API.md) - Hooks and utilities API reference
- [WORKFLOWS.md](WORKFLOWS.md) - Adding new features
