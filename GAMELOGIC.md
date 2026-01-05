# GAMELOGIC.md

Detailed gamification mechanics and formulas for FriendCatcher.

## Overview

FriendCatcher gamification includes:
- **Experience Points (XP)** - Earned through actions
- **Levels** - 11 levels with exponential XP thresholds
- **Badges** - 6 unlockable achievements
- **Streaks** - Daily active user rewards

---

## Experience Points (XP)

### XP Sources

All XP values defined in [src/utils/constants.ts](src/utils/constants.ts):

```typescript
XP_NEW_ENCOUNTER = 10       // First encounter with new user
XP_SEND_REACTION = 5        // Each reaction sent
XP_ICEBREAKER_COMPLETE = 15 // Ice breaker answered
XP_GAME_PLAYED = 20         // Participate in mini-game
XP_GAME_WON = 10            // Win mini-game (bonus)
XP_DAILY_STREAK = 25        // Daily streak maintained
```

### XP Calculation Examples

#### Basic Actions
```typescript
// User sends a wave reaction
addXP(5)  // XP_SEND_REACTION

// User completes ice breaker
addXP(15) // XP_ICEBREAKER_COMPLETE

// User has first encounter with someone
addXP(10) // XP_NEW_ENCOUNTER
```

#### Mini-Game Results
```typescript
// User plays Rock-Paper-Scissors and loses
addXP(20) // XP_GAME_PLAYED

// User plays RPS and wins
addXP(20 + 10) // XP_GAME_PLAYED + XP_GAME_WON = 30 total

// User plays RPS and draws
addXP(20) // XP_GAME_PLAYED (no bonus)
```

#### Compound XP (Multiple Actions)
```typescript
// New encounter + send reaction
addXP(10) // XP_NEW_ENCOUNTER
addXP(5)  // XP_SEND_REACTION
// Total: 15 XP

// Complete ice breaker + maintain streak
addXP(15) // XP_ICEBREAKER_COMPLETE
addXP(25) // XP_DAILY_STREAK
// Total: 40 XP
```

### XP Award Implementation

**In userStore** ([src/store/userStore.ts](src/store/userStore.ts:41-56)):

```typescript
addXP: (amount) => {
  const { user } = get()
  if (user) {
    const newXP = user.xp + amount

    // Calculate new level
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
}
```

**Usage Pattern**:
```typescript
import { useUserStore } from '@/store/userStore'

const addXP = useUserStore(state => state.addXP)

// Award XP after action
const sendReaction = async () => {
  // Send reaction logic...
  addXP(XP_SEND_REACTION)
}
```

---

## Level Progression

### Level System

**Total Levels**: 11 (Level 1 through Level 11)

**Thresholds** ([src/types/index.ts](src/types/index.ts:120)):
```typescript
LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]
```

### Complete Level Table

| Level | XP Required | XP to Next Level | XP Needed (Incremental) |
|-------|-------------|------------------|-------------------------|
| 1 | 0 | 100 | 100 |
| 2 | 100 | 200 | 200 |
| 3 | 300 | 300 | 300 |
| 4 | 600 | 400 | 400 |
| 5 | 1000 | 500 | 500 |
| 6 | 1500 | 600 | 600 |
| 7 | 2100 | 700 | 700 |
| 8 | 2800 | 800 | 800 |
| 9 | 3600 | 900 | 900 |
| 10 | 4500 | 1000 | 1000 |
| 11 | 5500 | (max) | - |

### Level Calculation Formula

```typescript
function calculateLevel(xp: number): number {
  const THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]

  // Start from highest level and work down
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= THRESHOLDS[i]) {
      return i + 1  // Level is index + 1
    }
  }

  return 1  // Minimum level
}
```

### Level Progression Examples

#### Example 1: New User to Level 3
```
Starting: 0 XP, Level 1

Action: 10 encounters with reactions
XP: 10 encounters × (10 + 5) = 150 XP
New Level: 2 (threshold 100)

Action: 10 more reactions
XP: 150 + (10 × 5) = 200 XP
New Level: 2 (need 300 for Level 3)

Action: Complete 7 ice breakers
XP: 200 + (7 × 15) = 305 XP
New Level: 3 (threshold 300 reached)
```

#### Example 2: Fast Level-Up
```
Starting: 0 XP, Level 1

Win 20 mini-games in a row:
XP: 20 × (20 + 10) = 600 XP
New Level: 4 (exactly at threshold)

Add 7-day streak:
XP: 600 + (7 × 25) = 775 XP
New Level: 5 (threshold 1000 not reached yet)
```

#### Example 3: Max Level
```
Target: Level 11 (5500 XP)

Strategy (theoretical minimum actions):
- 220 mini-game wins: 220 × 30 = 6600 XP ✓
- OR: 367 ice breakers: 367 × 15 = 5505 XP ✓
- OR: 220 streak days: 220 × 25 = 5500 XP ✓

Realistic (mixed actions):
- 100 encounters: 100 × 10 = 1000 XP
- 200 reactions: 200 × 5 = 1000 XP
- 100 ice breakers: 100 × 15 = 1500 XP
- 50 game wins: 50 × 30 = 1500 XP
- 20 streaks: 20 × 25 = 500 XP
Total: 5500 XP → Level 11
```

---

## Badges

### Badge System

**Total Badges**: 6 achievements

**Definitions** ([src/types/index.ts](src/types/index.ts:110-117)):
```typescript
const BADGES: Badge[] = [
  { id: 'first_catch', name: 'First Catch',
    description: 'Complete your first encounter', icon: '🎯' },

  { id: 'social_butterfly', name: 'Social Butterfly',
    description: '10 different encounters', icon: '🦋' },

  { id: 'connector', name: 'Connector',
    description: '5 mutual friends', icon: '🤝' },

  { id: 'explorer', name: 'Explorer',
    description: 'Encounters in 5 different areas', icon: '🗺️' },

  { id: 'game_master', name: 'Game Master',
    description: 'Win 20 mini-games', icon: '🎮' },

  { id: 'streak_lord', name: 'Streak Lord',
    description: '7-day streak', icon: '🔥' }
]
```

### Badge Unlock Conditions

#### 1. First Catch 🎯
**Condition**: Complete your first encounter (1+ interaction with any user)

**Implementation**:
```typescript
// When encounter reaches interactionCount = 1
if (encounter.interactionCount === 1) {
  addBadge('first_catch')
}
```

**Typical Trigger**: Send first reaction or ice breaker to anyone

---

#### 2. Social Butterfly 🦋
**Condition**: Have encounters with 10 different users

**Implementation**:
```typescript
// Check gameStore.totalEncounters
const { totalEncounters } = useGameStore()
if (totalEncounters >= 10) {
  addBadge('social_butterfly')
}
```

**Progress Tracking**:
```typescript
// Increment on each new encounter
incrementEncounters() // gameStore action
```

---

#### 3. Connector 🤝
**Condition**: Have 5+ friendships with level ≥ 3

**Implementation**:
```typescript
// Query friendships collection
const friendships = await getDocs(
  query(
    collection(db, 'friendships'),
    where('users', 'array-contains', userId),
    where('level', '>=', 3)
  )
)

if (friendships.size >= 5) {
  addBadge('connector')
}
```

**Friendship Levels**:
- Level 1: 1-2 interactions (acquaintance)
- Level 2: 3-5 interactions (friend)
- Level 3: 6-10 interactions (close friend) ← Badge requirement
- Level 4+: 10+ interactions (best friend)

---

#### 4. Explorer 🗺️
**Condition**: Have encounters in 5+ different geographic areas (geohash prefixes)

**Implementation**:
```typescript
// Track unique geohash prefixes (first 4 chars) in encounters
const uniqueAreas = new Set<string>()

encounters.forEach(encounter => {
  const geohash = encode(encounter.location.lat, encounter.location.lng, 4)
  uniqueAreas.add(geohash)
})

if (uniqueAreas.size >= 5) {
  addBadge('explorer')
}
```

**Geohash Area Examples**:
- San Francisco downtown: "9q8y"
- San Francisco Marina: "9q8z"
- Oakland: "9q9p"
- Berkeley: "9q9q"
- Palo Alto: "9q9j"

**Area Size**: 4-char geohash ≈ 20km × 20km cell

---

#### 5. Game Master 🎮
**Condition**: Win 20 mini-games

**Implementation**:
```typescript
const { gamesWon } = useGameStore()
if (gamesWon >= 20) {
  addBadge('game_master')
}
```

**Progress Tracking**:
```typescript
// When game completes
if (result === 'win') {
  recordGame(true)  // Increments gamesWon
}
```

**Game Types** (all count toward badge):
- Rock-Paper-Scissors
- Emoji matching
- Trivia questions

---

#### 6. Streak Lord 🔥
**Condition**: Maintain 7-day consecutive active streak

**Implementation**:
```typescript
const { currentStreak } = useGameStore()
if (currentStreak >= 7) {
  addBadge('streak_lord')
}
```

**Streak Rules** (see [Streaks](#streaks) section below)

---

### Badge Award Implementation

**Adding Badge** ([src/store/userStore.ts](src/store/userStore.ts:58-63)):
```typescript
addBadge: (badgeId) => {
  const { user } = get()
  if (user && !user.badges.includes(badgeId)) {
    set({ user: { ...user, badges: [...user.badges, badgeId] } })
  }
}
```

**Checking Badge Unlock** (example):
```typescript
import { useUserStore } from '@/store/userStore'
import { useGameStore } from '@/store/gameStore'

useEffect(() => {
  const { gamesWon } = useGameStore()
  const { addBadge } = useUserStore()

  if (gamesWon >= 20) {
    addBadge('game_master')
  }
}, [gamesWon])
```

---

## Streaks

### Streak System

**Purpose**: Reward daily active usage

**Tracking** ([src/store/gameStore.ts](src/store/gameStore.ts)):
```typescript
interface GameState {
  currentStreak: number      // Consecutive days active
  longestStreak: number      // Personal record
  lastActiveDate: string | null  // Date string: "Fri Jan 05 2024"
}
```

### Streak Logic

**Implementation** ([src/store/gameStore.ts](src/store/gameStore.ts:53-80)):

```typescript
checkStreak: () => {
  const { lastActiveDate, currentStreak, longestStreak } = get()
  const today = new Date().toDateString()

  // Already checked in today
  if (lastActiveDate === today) {
    return
  }

  // Get yesterday's date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()

  if (lastActiveDate === yesterdayStr) {
    // Continue streak
    const newStreak = currentStreak + 1
    set({
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, longestStreak),
      lastActiveDate: today
    })
  } else {
    // Reset streak (gap > 1 day)
    set({
      currentStreak: 1,
      lastActiveDate: today
    })
  }
}
```

### Streak Rules

| Last Active | Action | currentStreak | XP Awarded |
|-------------|--------|---------------|------------|
| Same day (today) | No change | No change | 0 |
| Yesterday | Increment | currentStreak + 1 | 25 |
| 2+ days ago | Reset | 1 | 25 (new streak) |
| Never (null) | Start | 1 | 25 |

### Streak Examples

#### Example 1: Perfect Week
```
Day 1 (Mon): checkStreak() → currentStreak = 1, XP +25
Day 2 (Tue): checkStreak() → currentStreak = 2, XP +25
Day 3 (Wed): checkStreak() → currentStreak = 3, XP +25
Day 4 (Thu): checkStreak() → currentStreak = 4, XP +25
Day 5 (Fri): checkStreak() → currentStreak = 5, XP +25
Day 6 (Sat): checkStreak() → currentStreak = 6, XP +25
Day 7 (Sun): checkStreak() → currentStreak = 7, XP +25
Total: 175 XP + Streak Lord badge unlocked 🔥
```

#### Example 2: Broken Streak
```
Day 1 (Mon): checkStreak() → currentStreak = 1
Day 2 (Tue): checkStreak() → currentStreak = 2
Day 3 (Wed): checkStreak() → currentStreak = 3
Day 4 (Thu): MISSED
Day 5 (Fri): checkStreak() → currentStreak = 1 (reset)
Day 6 (Sat): checkStreak() → currentStreak = 2
Day 7 (Sun): checkStreak() → currentStreak = 3

Result: Streak reset to 1 on Day 5
```

#### Example 3: Multiple Checks Same Day
```
Day 1 @ 8am:  checkStreak() → currentStreak = 1, lastActiveDate = "Day 1"
Day 1 @ 2pm:  checkStreak() → NO CHANGE (already checked today)
Day 1 @ 10pm: checkStreak() → NO CHANGE (already checked today)

Result: Only first check counts per day
```

### Streak XP Award

**When to Call**:
```typescript
// On app startup
useEffect(() => {
  const { checkStreak } = useGameStore()
  checkStreak()

  // Award XP if streak continued or started
  const { currentStreak } = useGameStore.getState()
  if (currentStreak > 0) {
    addXP(XP_DAILY_STREAK) // 25 XP
  }
}, [])
```

**Streak Best Practices**:
- Call `checkStreak()` once on app load
- Don't call multiple times per session
- Award XP after streak check completes
- Update `longestStreak` when current exceeds it

---

## Progressive Reveal

### Identity Reveal System

**Mechanism**: User profile information unlocks based on **interaction count** between two users.

**Reveal Thresholds** ([src/utils/constants.ts](src/utils/constants.ts)):
```typescript
REVEAL_LEVEL_COLOR = 1
REVEAL_LEVEL_INTERESTS = 3
REVEAL_LEVEL_NAME = 5
REVEAL_LEVEL_FULL = 10
```

### Reveal Stages

| Interactions | Reveal Level | What's Visible |
|--------------|--------------|----------------|
| 0 | 0 | Generic silhouette, "Someone nearby" |
| 1-2 | 1 | Avatar color, nickname ("CosmicPanda_42") |
| 3-4 | 3 | + Interests array (["music", "hiking"]) |
| 5-9 | 5 | + Real name (if provided by user) |
| 10+ | 10 | + Full profile, chat unlocked |

### Reveal Level Calculation

```typescript
function getRevealLevel(interactionCount: number): number {
  if (interactionCount >= 10) return 10
  if (interactionCount >= 5) return 5
  if (interactionCount >= 3) return 3
  if (interactionCount >= 1) return 1
  return 0
}
```

### Progressive Reveal Example

**Two users meet**:

```
Interaction 0: "Someone nearby" (150m away)
- No nickname, generic silhouette

Send wave reaction → interactionCount = 1
Interaction 1: "CosmicPanda_42" (150m away)
- Blue avatar with "CP" initials

Send 2 more reactions → interactionCount = 3
Interaction 3: "CosmicPanda_42" (150m away)
- Interests: music, hiking, coffee

Complete 2 ice breakers → interactionCount = 5
Interaction 5: "John Doe (CosmicPanda_42)" (150m away)
- Real name revealed

Play 5 mini-games → interactionCount = 10
Interaction 10: Full profile + "Chat unlocked" badge
- Can now send messages
```

### Implementation in Components

**EncounterCard** ([src/components/encounters/EncounterCard.tsx](src/components/encounters/EncounterCard.tsx)):
```typescript
function EncounterCard({ user }: { user: NearbyUser }) {
  const { revealLevel } = user

  return (
    <div>
      <Avatar
        nickname={user.nickname}
        avatarColor={user.avatarColor}
        revealLevel={revealLevel}
      />

      {revealLevel >= 1 && <p>{user.nickname}</p>}
      {revealLevel >= 3 && <Tags items={user.interests} />}
      {revealLevel >= 5 && <p>Real name: {user.realName}</p>}
      {revealLevel >= 10 && <Badge>Chat unlocked</Badge>}
    </div>
  )
}
```

---

## Gamification Strategy

### Engagement Loops

1. **Core Loop**: Encounter → Interact → Earn XP → Level up
2. **Daily Loop**: Open app → Maintain streak → Earn bonus XP
3. **Social Loop**: More interactions → Higher reveal → Unlock chat
4. **Achievement Loop**: Complete milestones → Unlock badges → Display on profile

### XP Economy Balance

**Average Session (15 minutes)**:
- 2 encounters: 20 XP
- 5 reactions: 25 XP
- 2 ice breakers: 30 XP
- 1 mini-game: 30 XP
Total: ~105 XP → Enough to reach Level 2 in first session

**Daily Active User**:
- Daily streak: 25 XP/day
- 30 days: 750 XP → Reaches Level 5+

**Power User (1 month)**:
- 50 encounters: 500 XP
- 100 reactions: 500 XP
- 50 ice breakers: 750 XP
- 20 game wins: 600 XP
- 30 streaks: 750 XP
Total: 3100 XP → Level 8

### Badge Difficulty Tiers

| Tier | Badge | Difficulty | Expected Time |
|------|-------|------------|---------------|
| Easy | First Catch | Complete 1 encounter | First session |
| Medium | Social Butterfly | 10 encounters | 1 week |
| Medium | Streak Lord | 7-day streak | 1 week minimum |
| Hard | Game Master | 20 wins | 2-3 weeks |
| Hard | Explorer | 5 areas | 2-4 weeks |
| Very Hard | Connector | 5 level-3 friends | 1+ month |

---

## Related Documentation

- [FEATURES.md](FEATURES.md) - Complete feature specifications
- [STATE.md](STATE.md) - userStore and gameStore implementation
- [API.md](API.md) - addXP and badge functions
- [SKILLS.md](SKILLS.md) - Testing gamification features
