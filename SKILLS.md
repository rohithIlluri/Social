# SKILLS.md

Claude-specific skills and automation patterns for FriendCatcher development.

## Overview

This document defines reusable skills and patterns that Claude Code can use to efficiently work with the FriendCatcher codebase. These patterns streamline common development tasks specific to location-based features, gamification, and real-time data.

---

## Location & Geolocation Skills

### Location Debug Skill

**Purpose**: Quickly set up environment for testing location features

**Steps**:
1. Start dev server: `npm run dev`
2. Open browser DevTools
3. Navigate to Sensors tab (Chrome) or Geo console (Firefox)
4. Set test coordinates
5. Monitor Firebase Realtime DB for location updates

**Example Coordinates**:
```typescript
// San Francisco
37.7749, -122.4194

// New York
40.7128, -74.0060

// Close proximity test (SF Bay Area, ~150m apart)
37.7749, -122.4194  // User A
37.7760, -122.4200  // User B
```

**Verification Checklist**:
- [ ] Location appears in Firebase Realtime DB under `locations/{geohash}/{userId}`
- [ ] `active: true` flag set
- [ ] Geohash calculated correctly with 6-char precision
- [ ] Updates every 10 seconds

---

### User Simulation Skill

**Purpose**: Create multiple test users with specific locations to test encounter detection

**Pattern**:
```typescript
// Test scenario: 2 users within range
// User A: SF downtown
// User B: SF nearby (~200m away)

// Browser 1 (Incognito)
1. Sign in with test1@example.com
2. Set location: 37.7749, -122.4194
3. Set radius: 400m
4. Monitor nearbyUsers in encounterStore

// Browser 2 (Different incognito)
1. Sign in with test2@example.com
2. Set location: 37.7760, -122.4200
3. Set radius: 400m
4. Check if User A appears in nearby list
```

**Quick Test Matrix**:
| Scenario | User A Location | User B Location | Distance | A Radius | B Radius | Expected |
|----------|----------------|-----------------|----------|----------|----------|----------|
| In range | 37.7749, -122.4194 | 37.7760, -122.4200 | ~150m | 400m | 400m | ✅ Nearby |
| Out of range | 37.7749, -122.4194 | 37.7900, -122.4300 | ~2km | 400m | 400m | ❌ Not nearby |
| Edge case | 37.7749, -122.4194 | 37.7785, -122.4230 | ~450m | 400m | 400m | ❌ Not nearby |

---

## Gamification Skills

### Badge Unlock Test Skill

**Purpose**: Fast-forward game state to test badge unlock conditions

**Badge Test Scenarios**:

#### First Catch Badge
```typescript
// Browser console
const { addBadge } = useUserStore.getState()
addBadge('first_catch')

// Or trigger naturally:
// Complete 1 encounter with any interaction
```

#### Social Butterfly Badge
```typescript
// Fast-forward encounters
const { incrementEncounters } = useGameStore.getState()
for (let i = 0; i < 10; i++) {
  incrementEncounters()
}

// Trigger badge check
if (useGameStore.getState().totalEncounters >= 10) {
  useUserStore.getState().addBadge('social_butterfly')
}
```

#### Game Master Badge
```typescript
// Fast-forward game wins
const { recordGame } = useGameStore.getState()
for (let i = 0; i < 20; i++) {
  recordGame(true) // 20 wins
}

// Check badge
if (useGameStore.getState().gamesWon >= 20) {
  useUserStore.getState().addBadge('game_master')
}
```

#### Streak Lord Badge
```typescript
// Manually set streak
// Edit localStorage
const game = JSON.parse(localStorage.getItem('friendcatcher-game'))
game.state.currentStreak = 7
localStorage.setItem('friendcatcher-game', JSON.stringify(game))

// Reload and trigger badge check
location.reload()
```

---

### XP & Level Progression Skill

**Purpose**: Test level-up transitions and UI

**Level Jump Commands**:
```typescript
// Browser console
const { addXP } = useUserStore.getState()

// Jump to specific level
addXP(100)   // Level 2
addXP(300)   // Level 3
addXP(1000)  // Level 5
addXP(5500)  // Level 11 (max)

// Test level-up boundary
const user = useUserStore.getState().user
console.log(`Current: ${user.xp} XP, Level ${user.level}`)

// Add XP to cross threshold
addXP(50) // Should trigger level-up if near threshold
```

**Progressive Reveal Simulation**:
```typescript
// Simulate interaction progression
// In browser console or test component

// revealLevel 0 → 1: Send 1 reaction
encounterStore.getState().addInteraction({
  /* ... interaction with count = 1 ... */
})

// revealLevel 1 → 3: Send 2 more interactions
// (total interactions = 3)

// revealLevel 3 → 5: Send 2 more interactions
// (total interactions = 5)

// revealLevel 5 → 10: Send 5 more interactions
// (total interactions = 10, chat unlocked)
```

---

## Firebase Data Skills

### Firebase Data Seed Skill

**Purpose**: Populate Firebase with test data for development

**Seed Script Pattern**:
```typescript
// scripts/seed-data.ts
import { db, realtimeDb } from '@/services/firebase'
import { setDoc, doc } from 'firebase/firestore'
import { ref, set } from 'firebase/database'

async function seedTestData() {
  // Create test users
  const users = [
    { id: 'test1', nickname: 'CosmicPanda_42', avatarColor: '#3b82f6' },
    { id: 'test2', nickname: 'SilentDragon_87', avatarColor: '#ec4899' }
  ]

  for (const user of users) {
    await setDoc(doc(db, 'users', user.id), {
      ...user,
      level: 1,
      xp: 0,
      badges: [],
      discoveryRadius: 400,
      createdAt: new Date(),
      lastActive: new Date()
    })
  }

  // Seed locations
  const geohash = '9q8yyk'
  await set(ref(realtimeDb, `locations/${geohash}/test1`), {
    lat: 37.7749,
    lng: -122.4194,
    timestamp: Date.now(),
    active: true,
    nickname: 'CosmicPanda_42',
    avatarColor: '#3b82f6',
    radius: 400
  })

  console.log('Test data seeded!')
}

seedTestData()
```

**Run Seed**:
```bash
# Add script to package.json
"seed": "vite-node scripts/seed-data.ts"

# Run
npm run seed
```

---

### Firebase Data Cleanup Skill

**Purpose**: Clear test data from Firebase

**Cleanup Script**:
```typescript
// scripts/cleanup-data.ts
import { db, realtimeDb } from '@/services/firebase'
import { deleteDoc, doc, collection, getDocs } from 'firebase/firestore'
import { ref, remove } from 'firebase/database'

async function cleanupTestData() {
  // Delete test users
  const testUserIds = ['test1', 'test2', 'test3']
  for (const id of testUserIds) {
    await deleteDoc(doc(db, 'users', id))
  }

  // Clear all locations
  await remove(ref(realtimeDb, 'locations'))

  console.log('Test data cleaned!')
}

cleanupTestData()
```

---

## Testing & Debugging Skills

### Type Check Workflow

**Purpose**: Ensure TypeScript correctness before commits

**Steps**:
```bash
# Quick type check (no emit)
npm run build

# Or add dedicated script to package.json
"type-check": "tsc --noEmit"

# Then run
npm run type-check
```

**Common Type Errors to Watch For**:
- Missing optional chaining: `user?.nickname` vs `user.nickname`
- Incorrect union types: `InteractionType` must match exactly
- Date objects vs timestamps: Firebase dates need `.toDate()`

---

### Geohash Query Debug Skill

**Purpose**: Debug geohash proximity queries

**Debug Pattern**:
```typescript
// Add to useEncounters hook temporarily
const geohash = encode(latitude, longitude, 6)
const cells = neighbors(geohash)

console.group('Geohash Debug')
console.log('My location:', { latitude, longitude })
console.log('My geohash:', geohash)
console.log('Querying cells:', cells)
console.log('Cell count:', cells.length) // Should be 9
console.groupEnd()

// In Firebase listener
onValue(locationRef, (snapshot) => {
  const data = snapshot.val()
  console.log(`Cell ${hash}:`, Object.keys(data || {}).length, 'users')
})
```

**Verification**:
- 9 cells queried (center + 8 neighbors)
- Each cell exists in Firebase Realtime DB
- Users with `active: true` appear in query results

---

### Progressive Reveal Testing Skill

**Purpose**: Test all reveal levels systematically

**Test Script**:
```typescript
// Test component or console
const REVEAL_LEVELS = [
  { count: 0, expected: 'Silhouette, no name' },
  { count: 1, expected: 'Color + nickname visible' },
  { count: 3, expected: 'Interests array shown' },
  { count: 5, expected: 'Real name revealed' },
  { count: 10, expected: 'Full profile + chat unlock' }
]

REVEAL_LEVELS.forEach(({ count, expected }) => {
  console.log(`interactionCount: ${count}`)
  console.log(`Expected: ${expected}`)

  // Test with mock NearbyUser
  const testUser = {
    id: 'test',
    nickname: 'CosmicPanda_42',
    avatarColor: '#3b82f6',
    distance: 200,
    revealLevel: count,
    interests: count >= 3 ? ['music', 'hiking'] : undefined,
    realName: count >= 5 ? 'John Doe' : undefined
  }

  // Render EncounterCard with testUser
  // Verify correct information shown
})
```

---

### Streak Simulation Skill

**Purpose**: Test streak logic with different date scenarios

**Test Pattern**:
```typescript
// Mock dates in gameStore
const game = useGameStore.getState()

// Test scenarios
const scenarios = [
  { lastActive: 'today', expected: 'No change' },
  { lastActive: 'yesterday', expected: 'Increment streak' },
  { lastActive: '3 days ago', expected: 'Reset to 1' },
  { lastActive: null, expected: 'Start streak at 1' }
]

scenarios.forEach(({ lastActive, expected }) => {
  // Set lastActiveDate
  useGameStore.setState({
    lastActiveDate: calculateDate(lastActive)
  })

  // Call checkStreak
  game.checkStreak()

  // Verify result
  console.log(`Scenario: ${lastActive}`)
  console.log(`Expected: ${expected}`)
  console.log(`Result: ${game.currentStreak}`)
})
```

---

## Code Generation Patterns

### Component Template Skill

**Purpose**: Generate boilerplate for new components

**Template**:
```typescript
// src/components/{category}/{ComponentName}.tsx
import React from 'react'

interface {ComponentName}Props {
  // Props here
}

export function {ComponentName}({ }: {ComponentName}Props) {
  return (
    <div>
      {/* Component content */}
    </div>
  )
}
```

**Usage Pattern**:
```
1. Identify component category (common/encounters/map)
2. Create file with proper casing (PascalCase)
3. Define Props interface
4. Implement component with TypeScript
5. Export as named export
```

---

### Hook Template Skill

**Purpose**: Generate boilerplate for custom hooks

**Template**:
```typescript
// src/hooks/use{Feature}.ts
import { useState, useEffect } from 'react'

interface {Feature}Options {
  // Options here
}

export function use{Feature}(options?: {Feature}Options) {
  const [state, setState] = useState()

  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    }
  }, [])

  return {
    // Return values
  }
}
```

---

## Automation Shortcuts

### Quick Commands

**Start everything**:
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Firebase emulator (optional)
firebase emulators:start

# Terminal 3: Type check watch (optional)
npm run type-check -- --watch
```

**Reset development state**:
```javascript
// Browser console - ONE LINE
localStorage.clear(); location.reload()
```

**Fast user switch** (testing multiple users):
```javascript
// Incognito windows + saved bookmarks
// Bookmark 1: http://localhost:3000?lat=37.7749&lng=-122.4194
// Bookmark 2: http://localhost:3000?lat=37.7760&lng=-122.4200

// Parse query params in App.tsx for auto-location
const params = new URLSearchParams(location.search)
if (params.get('lat') && params.get('lng')) {
  // Override geolocation
}
```

---

## Common Task Patterns

### When Adding New Feature
1. Update [src/types/index.ts](src/types/index.ts) (types)
2. Create component(s) in [src/components/](src/components/)
3. Update Zustand store if needed
4. Add Firebase schema changes to [FIREBASE.md](FIREBASE.md)
5. Update [FEATURES.md](FEATURES.md) documentation
6. Add XP rewards to [src/utils/constants.ts](src/utils/constants.ts)
7. Test with seed data
8. Run type check: `npm run build`

### When Debugging Location Issues
1. Check browser console for geolocation errors
2. Verify Firebase Realtime DB: `locations/{geohash}/{userId}`
3. Log geohash calculation: `encode(lat, lng, 6)`
4. Log neighbor cells: `neighbors(geohash)`
5. Check mutual radius: both users must be in range
6. Verify `active: true` flag

### When Testing Gamification
1. Use console commands to fast-forward state
2. Test badge unlock conditions
3. Verify XP calculation with level thresholds
4. Test streak logic with different dates
5. Check localStorage persistence

---

## Performance Optimization Skills

### React Re-render Debugging

**Pattern**:
```typescript
// Add to component
import { useEffect } from 'react'

useEffect(() => {
  console.log('Component rendered')
})

// Or use React DevTools Profiler
// Identify unnecessary re-renders from store subscriptions
```

**Optimization**:
```typescript
// ✅ Good: Specific selector
const nickname = useUserStore(state => state.user?.nickname)

// ❌ Bad: Re-renders on any user change
const user = useUserStore(state => state.user)
```

---

## Related Documentation

- [WORKFLOWS.md](WORKFLOWS.md) - Development workflows
- [API.md](API.md) - Hooks and utilities reference
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [GAMELOGIC.md](GAMELOGIC.md) - Gamification mechanics
- [FIREBASE.md](FIREBASE.md) - Firebase schema and operations
