# WORKFLOWS.md

Common development workflows and tasks for FriendCatcher.

## Adding a New Feature

### 1. Plan the Feature
- Define feature requirements and user flows
- Identify affected components, hooks, and stores
- Design data structures and Firebase schema changes
- Consider XP rewards and gamification integration

### 2. Update Type Definitions
Edit [src/types/index.ts](src/types/index.ts) to add new types:

```typescript
// Example: Add new interaction type
export type InteractionType = 'reaction' | 'icebreaker' | 'game' | 'challenge'

export interface ChallengeData {
  challengeType: string
  status: 'pending' | 'accepted' | 'completed'
}
```

### 3. Update Firebase Schema
If needed, add new Firestore collections or Realtime DB paths:

```typescript
// Firestore: challenges/{challengeId}
{
  id: string
  fromUser: string
  toUser: string
  challengeType: string
  status: string
  createdAt: Date
}
```

Update security rules in [SETUP.md](SETUP.md).

### 4. Create Services/Utilities
Add helper functions for the feature:

```typescript
// src/services/challenges.ts
export async function createChallenge(fromUser: string, toUser: string) {
  // Implementation
}
```

### 5. Update State (if needed)
Add state to appropriate Zustand store:

```typescript
// src/store/encounterStore.ts
interface EncounterState {
  // ... existing state
  activeChallenges: Challenge[]
  addChallenge: (challenge: Challenge) => void
}
```

### 6. Create Components
Build UI components:

```typescript
// src/components/challenges/ChallengeCard.tsx
export function ChallengeCard({ challenge }: ChallengeCardProps) {
  // Implementation
}
```

### 7. Integrate into Pages
Add feature to relevant pages:

```typescript
// src/pages/Home.tsx
import { ChallengeCard } from '@/components/challenges/ChallengeCard'

// ... in render
{activeChallenges.map(c => <ChallengeCard key={c.id} challenge={c} />)}
```

### 8. Add XP Rewards
Update [src/utils/constants.ts](src/utils/constants.ts):

```typescript
export const XP_CHALLENGE_SENT = 10
export const XP_CHALLENGE_COMPLETED = 30
```

Call `addXP()` at appropriate times.

### 9. Test
- Test in dev mode: `npm run dev`
- Test location features with geolocation override
- Test with multiple users/browsers
- Run TypeScript check: `npm run build`

---

## Adding a New Interaction Type

### Step 1: Update InteractionType Union
[src/types/index.ts](src/types/index.ts):

```typescript
export type InteractionType = 'reaction' | 'icebreaker' | 'game' | 'newtype'
```

### Step 2: Define Data Interface
```typescript
export interface NewTypeData {
  field1: string
  field2: number
}
```

### Step 3: Add to Interaction Data Union
```typescript
interface Interaction {
  // ...
  data: ReactionData | IceBreakerData | GameData | NewTypeData
}
```

### Step 4: Create UI Component
[src/components/encounters/NewTypePanel.tsx](src/components/encounters/NewTypePanel.tsx):

```typescript
export function NewTypePanel({ userId, encounterId }: Props) {
  const sendInteraction = async () => {
    const interaction: Interaction = {
      id: generateId(),
      encounterId,
      fromUser: currentUserId,
      toUser: userId,
      type: 'newtype',
      data: { field1: 'value', field2: 123 },
      timestamp: new Date()
    }

    // Save to Firestore
    await setDoc(doc(db, 'interactions', interaction.id), interaction)

    // Update local state
    addInteraction(interaction)

    // Award XP
    addXP(XP_NEW_TYPE)
  }

  return <button onClick={sendInteraction}>Send New Type</button>
}
```

### Step 5: Add to InteractionPanel
[src/components/encounters/InteractionPanel.tsx](src/components/encounters/InteractionPanel.tsx):

```typescript
<Tabs>
  <Tab>Reactions</Tab>
  <Tab>Ice Breakers</Tab>
  <Tab>Games</Tab>
  <Tab>New Type</Tab> {/* Add new tab */}
</Tabs>

{activeTab === 'newtype' && <NewTypePanel {...props} />}
```

### Step 6: Add XP Constant
[src/utils/constants.ts](src/utils/constants.ts):

```typescript
export const XP_NEW_TYPE = 15
```

### Step 7: Test
- Send interaction
- Verify Firestore write
- Check XP awarded
- Test interaction count increment

---

## Adding a New Badge

### Step 1: Add Badge Definition
[src/types/index.ts](src/types/index.ts):

```typescript
export const BADGES: Badge[] = [
  // ... existing badges
  {
    id: 'new_badge',
    name: 'New Badge Name',
    description: 'Unlock condition description',
    icon: '🎖️'
  }
]
```

### Step 2: Implement Unlock Logic
Determine where to check for unlock condition:

**Option A: In a Hook** (for real-time checks)
```typescript
// src/hooks/useBadgeUnlock.ts
export function useBadgeUnlock() {
  const { totalEncounters } = useGameStore()
  const { addBadge } = useUserStore()

  useEffect(() => {
    if (totalEncounters >= 50) {
      addBadge('new_badge')
    }
  }, [totalEncounters])
}
```

**Option B: In Action** (for event-based checks)
```typescript
// src/store/gameStore.ts
incrementEncounters: () => {
  set(state => {
    const newTotal = state.totalEncounters + 1

    // Check badge unlock
    if (newTotal === 50) {
      useUserStore.getState().addBadge('new_badge')
    }

    return { totalEncounters: newTotal }
  })
}
```

**Option C: Cloud Function** (for server-side validation)
```typescript
// functions/src/index.ts
exports.checkBadges = functions.firestore
  .document('encounters/{encounterId}')
  .onCreate(async (snap, context) => {
    // Check conditions and award badge
  })
```

### Step 3: Display Badge
Badges automatically appear in Profile page if in `user.badges` array.

### Step 4: Test Unlock
```typescript
// Manually test in console
const { addBadge } = useUserStore.getState()
addBadge('new_badge')
```

Or trigger the unlock condition naturally.

---

## Testing Location-Based Features

### Setup: Browser DevTools Geolocation Override

#### Chrome/Edge
1. Open DevTools (F12)
2. Press `Ctrl+Shift+P` → "Show Sensors"
3. In Sensors tab → Geolocation → "Custom location"
4. Enter latitude and longitude

#### Firefox
1. Open DevTools (F12)
2. Press `Shift+F2` to open console
3. Run: `geo location <lat> <lng>`

### Testing Proximity Detection

#### Test with 2 Users
1. **Browser 1**: Sign in as User A
   - Set location: 37.7749, -122.4194 (San Francisco)
   - Discovery radius: 400m

2. **Browser 2**: Sign in as User B
   - Set location: 37.7760, -122.4200 (nearby SF, ~150m away)
   - Discovery radius: 400m

3. **Expected Result**: Both users appear in each other's nearby list

#### Test Radius Boundaries
1. Set User A: 37.7749, -122.4194
2. Set User B: 37.7800, -122.4250 (~700m away)
3. Set both radii to 400m
4. **Expected**: Users NOT nearby (700m > 400m + 400m mutual)
5. Increase both radii to 800m
6. **Expected**: Users NOW nearby (700m < 800m + 800m mutual)

### Testing Geohash Queries

#### Check Firebase Realtime DB
Open Firebase Console → Realtime Database:

```
locations/
  9q8yyk/           ← User A's geohash cell
    userA: { lat: 37.7749, lng: -122.4194, active: true }
  9q8yym/           ← User B's geohash cell (neighbor)
    userB: { lat: 37.7760, lng: -122.4200, active: true }
```

#### Verify Neighbor Query
Console log in [src/hooks/useEncounters.ts](src/hooks/useEncounters.ts:29):

```typescript
const neighborHashes = neighbors(geohash)
console.log('Querying cells:', neighborHashes)
// Should show 9 cells
```

---

## Modifying Firebase Security Rules

### 1. Edit Rules in SETUP.md
[SETUP.md](SETUP.md) contains Firestore and Realtime DB rules.

### 2. Test Locally with Emulator
```bash
# Install Firebase emulator
npm install -g firebase-tools

# Initialize emulators
firebase init emulators

# Start emulators
firebase emulators:start
```

Update app to use emulator:
```typescript
// src/services/firebase.ts
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectDatabaseEmulator(realtimeDb, 'localhost', 9000)
}
```

### 3. Test Rules
Try operations that should succeed and fail:

```typescript
// Should succeed: Write own user doc
await setDoc(doc(db, 'users', auth.currentUser.uid), userData)

// Should fail: Write other user's doc
await setDoc(doc(db, 'users', 'otherUserId'), userData) // Permission denied
```

### 4. Deploy Rules
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Realtime DB rules
firebase deploy --only database
```

---

## Deploying Cloud Functions

### Setup
```bash
cd functions
npm install
```

### Development
```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions'

export const onNewEncounter = functions.firestore
  .document('encounters/{encounterId}')
  .onCreate(async (snap, context) => {
    // Handle new encounter
    console.log('New encounter:', snap.id)
  })
```

### Test Locally
```bash
cd functions
npm run serve
```

### Deploy
```bash
# Build TypeScript
npm run build

# Deploy all functions
npm run deploy

# Deploy specific function
firebase deploy --only functions:onNewEncounter
```

### Monitor Logs
```bash
firebase functions:log
```

---

## PWA Updates

### 1. Update Manifest
[public/manifest.json](public/manifest.json):

```json
{
  "name": "FriendCatcher",
  "short_name": "FriendCatcher",
  "version": "1.1.0",  // Increment version
  "icons": [ ... ],
  "start_url": "/",
  "display": "standalone"
}
```

### 2. Update Service Worker
If using Vite PWA plugin:

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: { /* ... */ }
    })
  ]
})
```

### 3. Build Production Bundle
```bash
npm run build
```

### 4. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### 5. Force Update
Users will get new version on next app load. To force immediate update:

```typescript
// src/App.tsx
import { useRegisterSW } from 'virtual:pwa-register/react'

const { needRefresh, updateServiceWorker } = useRegisterSW()

if (needRefresh) {
  updateServiceWorker(true)
}
```

---

## Common Development Tasks

### Run Dev Server
```bash
npm run dev
# Opens on http://localhost:3000
```

### Type Check
```bash
npm run build
# Runs tsc --noEmit before build
```

### Lint Code
```bash
npm run lint
```

### Clear LocalStorage (Reset State)
```javascript
// Browser console
localStorage.removeItem('friendcatcher-user')
localStorage.removeItem('friendcatcher-game')
location.reload()
```

### Simulate Different Locations Quickly
```typescript
// Add to dev tools or component
const TEST_LOCATIONS = {
  SF: [37.7749, -122.4194],
  NYC: [40.7128, -74.0060],
  TOKYO: [35.6762, 139.6503]
}

// In useGeolocation or test component
updateFirebaseLocation(...TEST_LOCATIONS.SF)
```

### Mock Nearby Users (Development)
```typescript
// Add to encounterStore for testing
const MOCK_USERS = [
  { id: '1', nickname: 'TestUser_1', distance: 100, revealLevel: 0 },
  { id: '2', nickname: 'TestUser_2', distance: 250, revealLevel: 1 }
]

setNearbyUsers(MOCK_USERS)
```

### Fast-Forward XP/Level
```typescript
// Browser console
const { addXP } = useUserStore.getState()
addXP(5500) // Jump to level 11
```

### Trigger Badge Unlock
```typescript
// Browser console
const { addBadge } = useUserStore.getState()
addBadge('streak_lord')
```

---

## Git Workflow

### Feature Branch
```bash
git checkout -b feature/new-feature-name
```

### Commit Changes
```bash
git add .
git commit -m "feat: add new feature"
```

### Push and Create PR
```bash
git push origin feature/new-feature-name
# Create PR on GitHub
```

### Commit Message Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Build/config

---

## Troubleshooting Workflows

### Location Not Updating
1. Check browser console for geolocation errors
2. Verify HTTPS (required for geolocation)
3. Check Firebase Realtime DB for active flag
4. Confirm geohash encoding: `encode(lat, lng, 6)`

### No Nearby Users
1. Check both users' discovery radius
2. Verify active: true in Realtime DB
3. Calculate distance manually: `distance(lat1, lng1, lat2, lng2)`
4. Check geohash neighbors: should query 9 cells

### XP Not Updating
1. Check addXP call with console.log
2. Verify LEVEL_THRESHOLDS array
3. Check userStore persistence in localStorage
4. Ensure addXP is called with correct amount

### Firebase Permission Denied
1. Check security rules in Firebase Console
2. Verify auth.currentUser.uid matches document path
3. Test with Firebase emulator locally
4. Check Firestore/Realtime DB rules syntax

---

## Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [API.md](API.md) - Hooks and utilities reference
- [FEATURES.md](FEATURES.md) - Feature specifications
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [FIREBASE.md](FIREBASE.md) - Firebase schema and configuration
