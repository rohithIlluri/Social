# STATE.md

Zustand store architecture and patterns for FriendCatcher.

## Store Overview

FriendCatcher uses **Zustand** for state management with three stores:

| Store | Persistence | Purpose |
|-------|-------------|---------|
| userStore | ✅ localStorage | User profile, auth, gamification |
| encounterStore | ❌ Ephemeral | Real-time nearby users and interactions |
| gameStore | ✅ localStorage | Game statistics and streaks |

**Locations**:
- [src/store/userStore.ts](src/store/userStore.ts)
- [src/store/encounterStore.ts](src/store/encounterStore.ts)
- [src/store/gameStore.ts](src/store/gameStore.ts)

---

## userStore

**Location**: [src/store/userStore.ts](src/store/userStore.ts)

**Purpose**: Current user profile, authentication state, and gamification stats.

### State

```typescript
interface UserState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
```

**User Type**:
```typescript
interface User {
  id: string
  email: string
  nickname: string          // e.g., "CosmicPanda_42"
  avatarColor: string       // e.g., "#3b82f6"
  realName?: string
  interests: string[]
  level: number            // 1-11
  xp: number
  badges: string[]         // Badge IDs
  discoveryRadius: number  // 50-1609 meters
  createdAt: Date
  lastActive: Date
}
```

### Actions

#### setUser(user)
Set or clear user data.

```typescript
setUser(user: User | null) => void
```

**Usage**:
```typescript
import { useUserStore } from '@/store/userStore'

const setUser = useUserStore(state => state.setUser)

// Set user
setUser(userData)

// Clear user (logout)
setUser(null)
```

**Side Effects**:
- Sets `isAuthenticated` to `!!user`
- Sets `isLoading` to `false`

#### setLoading(loading)
Set loading state.

```typescript
setLoading(isLoading: boolean) => void
```

**Usage**:
```typescript
const setLoading = useUserStore(state => state.setLoading)
setLoading(true)
```

#### updateUser(updates)
Partially update user object.

```typescript
updateUser(updates: Partial<User>) => void
```

**Usage**:
```typescript
const updateUser = useUserStore(state => state.updateUser)

// Update interests
updateUser({ interests: ['music', 'hiking', 'coffee'] })

// Update discovery radius
updateUser({ discoveryRadius: 800 })

// Update real name
updateUser({ realName: 'John Doe' })
```

**Note**: Does nothing if `user` is `null`.

#### addXP(amount)
Add XP and auto-calculate new level.

```typescript
addXP(amount: number) => void
```

**Usage**:
```typescript
const addXP = useUserStore(state => state.addXP)

// Send reaction
addXP(5)  // XP_SEND_REACTION

// Complete ice breaker
addXP(15) // XP_ICEBREAKER_COMPLETE

// Win mini-game
addXP(30) // XP_GAME_PLAYED + XP_GAME_WON
```

**Level Calculation**:
```typescript
const THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]

// Find highest threshold user has reached
for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
  if (newXP >= THRESHOLDS[i]) {
    newLevel = i + 1
    break
  }
}
```

**Example**:
- User has 250 XP → Level 3 (threshold: 300)
- Add 60 XP → 310 XP total → Level 4 (threshold: 600)

#### addBadge(badgeId)
Add badge to user's collection (prevents duplicates).

```typescript
addBadge(badgeId: string) => void
```

**Usage**:
```typescript
const addBadge = useUserStore(state => state.addBadge)

// Unlock first catch badge
addBadge('first_catch')

// Unlock streak lord badge
addBadge('streak_lord')
```

**Badge IDs**:
- `first_catch`
- `social_butterfly`
- `connector`
- `explorer`
- `game_master`
- `streak_lord`

**Note**: Does nothing if badge already exists or user is null.

#### logout()
Clear user state.

```typescript
logout() => void
```

**Usage**:
```typescript
const logout = useUserStore(state => state.logout)

// Sign out
await firebaseSignOut(auth)
logout()
```

**Effect**:
```typescript
{
  user: null,
  isAuthenticated: false,
  isLoading: false
}
```

### Persistence

**Storage Key**: `friendcatcher-user`

**Persisted State**: Only `user` object (partial persistence)

**Implementation**:
```typescript
persist(
  (set, get) => ({ /* state and actions */ }),
  {
    name: 'friendcatcher-user',
    partialize: (state) => ({ user: state.user })
  }
)
```

**Not Persisted**:
- `isAuthenticated` (derived from user)
- `isLoading` (ephemeral)

### Usage Patterns

#### Basic Usage
```typescript
import { useUserStore } from '@/store/userStore'

function MyComponent() {
  const user = useUserStore(state => state.user)
  const addXP = useUserStore(state => state.addXP)

  if (!user) return <div>Not authenticated</div>

  return (
    <div>
      <p>{user.nickname} - Level {user.level}</p>
      <button onClick={() => addXP(10)}>Add XP</button>
    </div>
  )
}
```

#### Selector Pattern (Optimized)
```typescript
// ✅ Good: Only re-renders when nickname changes
const nickname = useUserStore(state => state.user?.nickname)

// ❌ Bad: Re-renders on any user change
const user = useUserStore(state => state.user)
```

#### Multiple Selectors
```typescript
const { user, addXP, updateUser } = useUserStore(state => ({
  user: state.user,
  addXP: state.addXP,
  updateUser: state.updateUser
}))
```

---

## encounterStore

**Location**: [src/store/encounterStore.ts](src/store/encounterStore.ts)

**Purpose**: Real-time encounter state (nearby users, active encounter, interactions).

### State

```typescript
interface EncounterState {
  nearbyUsers: NearbyUser[]
  activeEncounter: Encounter | null
  interactions: Interaction[]
}
```

**Types**:
```typescript
interface NearbyUser {
  id: string
  nickname: string
  avatarColor: string
  distance: number
  revealLevel: number
  interests?: string[]
  realName?: string
}

interface Encounter {
  id: string
  users: [string, string]
  location: { lat: number; lng: number }
  startedAt: Date
  interactionCount: number
  status: 'active' | 'ended'
}

interface Interaction {
  id: string
  encounterId: string
  fromUser: string
  toUser: string
  type: 'reaction' | 'icebreaker' | 'game'
  data: ReactionData | IceBreakerData | GameData
  timestamp: Date
}
```

### Actions

#### setNearbyUsers(users)
Replace entire nearbyUsers array.

```typescript
setNearbyUsers(nearbyUsers: NearbyUser[]) => void
```

**Usage**:
```typescript
import { useEncounterStore } from '@/store/encounterStore'

const setNearbyUsers = useEncounterStore(state => state.setNearbyUsers)

// Called by useEncounters hook
setNearbyUsers([
  { id: 'user1', nickname: 'CosmicPanda_42', distance: 245, ... },
  { id: 'user2', nickname: 'SilentDragon_87', distance: 380, ... }
])
```

#### addNearbyUser(user)
Add single user (checks for duplicates).

```typescript
addNearbyUser(user: NearbyUser) => void
```

**Usage**:
```typescript
const addNearbyUser = useEncounterStore(state => state.addNearbyUser)

// Add new nearby user
addNearbyUser({
  id: 'user3',
  nickname: 'NeonFox_55',
  avatarColor: '#ec4899',
  distance: 150,
  revealLevel: 0
})
```

**Note**: Does nothing if user with same ID already exists.

#### removeNearbyUser(userId)
Remove user from nearbyUsers array.

```typescript
removeNearbyUser(userId: string) => void
```

**Usage**:
```typescript
const removeNearbyUser = useEncounterStore(state => state.removeNearbyUser)

// User moved out of range
removeNearbyUser('user123')
```

#### setActiveEncounter(encounter)
Set or clear active encounter.

```typescript
setActiveEncounter(encounter: Encounter | null) => void
```

**Usage**:
```typescript
const setActiveEncounter = useEncounterStore(state => state.setActiveEncounter)

// Start encounter
setActiveEncounter({
  id: 'enc123',
  users: ['myUserId', 'theirUserId'],
  location: { lat: 37.7749, lng: -122.4194 },
  startedAt: new Date(),
  interactionCount: 0,
  status: 'active'
})

// End encounter
setActiveEncounter(null)
```

#### addInteraction(interaction)
Add interaction to local array.

```typescript
addInteraction(interaction: Interaction) => void
```

**Usage**:
```typescript
const addInteraction = useEncounterStore(state => state.addInteraction)

// Record reaction sent
addInteraction({
  id: 'int123',
  encounterId: 'enc123',
  fromUser: 'myUserId',
  toUser: 'theirUserId',
  type: 'reaction',
  data: { emoji: '👋', label: 'Wave' },
  timestamp: new Date()
})
```

#### clearInteractions()
Clear interactions array.

```typescript
clearInteractions() => void
```

**Usage**:
```typescript
const clearInteractions = useEncounterStore(state => state.clearInteractions)

// End encounter session
clearInteractions()
```

### Persistence

**None** - All state is ephemeral and driven by real-time Firebase listeners.

### Usage Patterns

#### Display Nearby Users
```typescript
import { useEncounterStore } from '@/store/encounterStore'

function EncounterList() {
  const nearbyUsers = useEncounterStore(state => state.nearbyUsers)

  return (
    <div>
      {nearbyUsers.map(user => (
        <EncounterCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

#### Check Active Encounter
```typescript
const activeEncounter = useEncounterStore(state => state.activeEncounter)

if (activeEncounter) {
  // Show interaction panel
}
```

---

## gameStore

**Location**: [src/store/gameStore.ts](src/store/gameStore.ts)

**Purpose**: Game statistics and streak tracking.

### State

```typescript
interface GameState {
  totalEncounters: number
  totalInteractions: number
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
}
```

**Initial State**:
```typescript
{
  totalEncounters: 0,
  totalInteractions: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null
}
```

### Actions

#### incrementEncounters()
Increment total encounters by 1.

```typescript
incrementEncounters() => void
```

**Usage**:
```typescript
import { useGameStore } from '@/store/gameStore'

const incrementEncounters = useGameStore(state => state.incrementEncounters)

// New encounter started
incrementEncounters()
```

#### incrementInteractions()
Increment total interactions by 1.

```typescript
incrementInteractions() => void
```

**Usage**:
```typescript
const incrementInteractions = useGameStore(state => state.incrementInteractions)

// Sent reaction
incrementInteractions()
```

#### recordGame(won)
Record game played and optionally increment wins.

```typescript
recordGame(won: boolean) => void
```

**Usage**:
```typescript
const recordGame = useGameStore(state => state.recordGame)

// Lost game
recordGame(false) // gamesPlayed++

// Won game
recordGame(true)  // gamesPlayed++, gamesWon++
```

#### checkStreak()
Update streak based on last active date.

```typescript
checkStreak() => void
```

**Usage**:
```typescript
const checkStreak = useGameStore(state => state.checkStreak)

// Call on app startup
useEffect(() => {
  checkStreak()
}, [])
```

**Logic** ([src/store/gameStore.ts](src/store/gameStore.ts:53-80)):
```typescript
const today = new Date().toDateString()
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
const yesterdayStr = yesterday.toDateString()

if (lastActiveDate === today) {
  return // Already checked in today
}

if (lastActiveDate === yesterdayStr) {
  // Continue streak
  currentStreak++
  longestStreak = Math.max(currentStreak, longestStreak)
  lastActiveDate = today
} else {
  // Reset streak
  currentStreak = 1
  lastActiveDate = today
}
```

**Streak Rules**:
- **Same day**: No change
- **Yesterday**: Continue streak (increment)
- **Gap > 1 day**: Reset to 1

#### resetStats()
Reset all stats to initial values.

```typescript
resetStats() => void
```

**Usage**:
```typescript
const resetStats = useGameStore(state => state.resetStats)

// Debug or admin action
resetStats()
```

### Persistence

**Storage Key**: `friendcatcher-game`

**Persisted State**: All state (full persistence)

**Implementation**:
```typescript
persist(
  (set, get) => ({ /* state and actions */ }),
  {
    name: 'friendcatcher-game'
  }
)
```

### Usage Patterns

#### Display Stats
```typescript
import { useGameStore } from '@/store/gameStore'

function StatsPanel() {
  const {
    totalEncounters,
    totalInteractions,
    currentStreak,
    longestStreak
  } = useGameStore()

  return (
    <div>
      <p>Encounters: {totalEncounters}</p>
      <p>Interactions: {totalInteractions}</p>
      <p>Streak: {currentStreak} days (best: {longestStreak})</p>
    </div>
  )
}
```

#### Track Game Result
```typescript
const recordGame = useGameStore(state => state.recordGame)

function playRockPaperScissors() {
  const result = determineWinner(myMove, theirMove)

  if (result === 'win') {
    recordGame(true)  // Won
    addXP(30)         // 20 + 10 bonus
  } else {
    recordGame(false) // Lost or draw
    addXP(20)         // Participation only
  }
}
```

---

## Best Practices

### 1. Use Selectors
Select only what you need to avoid unnecessary re-renders.

```typescript
// ✅ Good
const nickname = useUserStore(state => state.user?.nickname)

// ❌ Bad
const { user } = useUserStore()
const nickname = user?.nickname
```

### 2. Separate Actions from State
Import actions separately for better code splitting.

```typescript
// ✅ Good
const addXP = useUserStore(state => state.addXP)

// Later...
addXP(10)
```

### 3. Don't Mutate State
Always use provided actions.

```typescript
// ❌ Bad
user.xp += 10

// ✅ Good
addXP(10)
```

### 4. Persist Only What's Needed
- **userStore**: Partial persistence (user object only)
- **encounterStore**: No persistence (real-time)
- **gameStore**: Full persistence (stats history)

### 5. Check for Null
Always check if user exists before accessing properties.

```typescript
const level = useUserStore(state => state.user?.level ?? 1)
```

---

## Store Composition

### Accessing Multiple Stores
```typescript
import { useUserStore } from '@/store/userStore'
import { useEncounterStore } from '@/store/encounterStore'
import { useGameStore } from '@/store/gameStore'

function Dashboard() {
  const user = useUserStore(state => state.user)
  const nearbyUsers = useEncounterStore(state => state.nearbyUsers)
  const stats = useGameStore()

  return (
    <div>
      <h1>{user?.nickname}</h1>
      <p>Nearby: {nearbyUsers.length}</p>
      <p>Encounters: {stats.totalEncounters}</p>
    </div>
  )
}
```

### Cross-Store Actions
Actions can read from other stores using `useUserStore.getState()`:

```typescript
import { useUserStore } from '@/store/userStore'
import { useGameStore } from '@/store/gameStore'

function handleEncounter() {
  const user = useUserStore.getState().user
  const incrementEncounters = useGameStore.getState().incrementEncounters

  if (user) {
    incrementEncounters()
    useUserStore.getState().addXP(10) // XP_NEW_ENCOUNTER
  }
}
```

---

## Debugging

### Zustand DevTools
Enable Redux DevTools integration:

```typescript
import { devtools } from 'zustand/middleware'

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({ /* ... */ }),
      { name: 'friendcatcher-user' }
    ),
    { name: 'UserStore' }
  )
)
```

### Log State Changes
```typescript
useEffect(() => {
  const unsubscribe = useUserStore.subscribe(
    state => console.log('User store changed:', state)
  )
  return unsubscribe
}, [])
```

### Inspect LocalStorage
```javascript
// In browser console
localStorage.getItem('friendcatcher-user')
localStorage.getItem('friendcatcher-game')
```

---

## Related Documentation

- [API.md](API.md) - Hooks that use these stores
- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall state management architecture
- [FEATURES.md](FEATURES.md) - Features that depend on state
- [GAMELOGIC.md](GAMELOGIC.md) - XP and badge logic
