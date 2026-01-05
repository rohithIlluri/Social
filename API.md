# API.md

Complete API reference for hooks, services, and utilities in FriendCatcher.

## Custom Hooks

### useAuth

**Location**: [src/hooks/useAuth.ts](src/hooks/useAuth.ts)

**Purpose**: Authentication state management and user session handling.

**Returns**:
```typescript
{
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}
```

**Usage**:
```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, signInWithGoogle, signOut } = useAuth()

  if (!isAuthenticated) {
    return <button onClick={signInWithGoogle}>Sign In</button>
  }

  return <div>Welcome, {user.nickname}!</div>
}
```

**Key Features**:
- Listens to Firebase `onAuthStateChanged`
- Auto-creates new user in Firestore with:
  - Generated nickname (e.g., "CosmicPanda_42")
  - Random avatar color from 17 options
  - Default discovery radius (400m)
  - Level 1, 0 XP, no badges
- Syncs user data to userStore
- Handles sign out and cleanup

**Dependencies**:
- Firebase Auth (Google OAuth)
- userStore (Zustand)
- generateNickname(), generateAvatarColor() utils

---

### useGeolocation

**Location**: [src/hooks/useGeolocation.ts](src/hooks/useGeolocation.ts)

**Purpose**: Browser Geolocation API wrapper with Firebase Realtime DB sync.

**Returns**:
```typescript
{
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  isTracking: boolean
  startTracking: () => void
  stopTracking: () => Promise<void>
}
```

**Usage**:
```typescript
import { useGeolocation } from '@/hooks/useGeolocation'

function MapPage() {
  const { latitude, longitude, error, startTracking, stopTracking } = useGeolocation()

  useEffect(() => {
    startTracking()
    return () => stopTracking()
  }, [])

  if (error) return <div>Error: {error}</div>
  if (!latitude) return <div>Loading location...</div>

  return <Map center={[latitude, longitude]} />
}
```

**Key Features**:
- Uses `navigator.geolocation.watchPosition` for continuous tracking
- Updates Firebase Realtime DB every 10 seconds at `locations/{geohash}/{userId}`
- Sets `onDisconnect` handler to mark user inactive on disconnect
- Handles page visibility (stops tracking when tab hidden)
- High accuracy mode enabled

**Geolocation Options**:
```typescript
{
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 10000  // LOCATION_UPDATE_INTERVAL
}
```

**Error Handling**:
- PERMISSION_DENIED → "Location permission denied"
- POSITION_UNAVAILABLE → "Location information unavailable"
- TIMEOUT → "Location request timed out"

**Firebase Structure**:
```typescript
// locations/{geohash}/{userId}
{
  lat: number
  lng: number
  timestamp: serverTimestamp()
  active: boolean
  nickname: string
  avatarColor: string
  radius: number
}
```

---

### useEncounters

**Location**: [src/hooks/useEncounters.ts](src/hooks/useEncounters.ts)

**Purpose**: Real-time proximity detection of nearby users.

**Parameters**:
```typescript
useEncounters(latitude: number | null, longitude: number | null)
```

**Returns**:
```typescript
{
  nearbyUsers: NearbyUser[]
}
```

**Usage**:
```typescript
import { useEncounters } from '@/hooks/useEncounters'
import { useGeolocation } from '@/hooks/useGeolocation'

function EncountersList() {
  const { latitude, longitude } = useGeolocation()
  const { nearbyUsers } = useEncounters(latitude, longitude)

  return (
    <div>
      {nearbyUsers.map(user => (
        <EncounterCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

**Key Features**:
- Queries 9 geohash cells (center + 8 neighbors) for efficient proximity detection
- Calculates precise distance using Haversine formula
- Filters by **mutual discovery radius** (both users must be in range)
- Excludes self and inactive users
- Real-time updates via Firebase Realtime DB listeners
- Auto-cleanup on unmount

**Algorithm**:
1. Encode user location to 6-char geohash
2. Get 9 neighbor cells with `neighbors(geohash)`
3. Listen to all 9 cells: `onValue(ref(realtimeDb, 'locations/{hash}'))`
4. For each user in cells:
   - Calculate distance
   - Check if within mutual radius
   - Add to nearbyUsers map
5. Update encounterStore with array of nearby users

**NearbyUser Type**:
```typescript
interface NearbyUser {
  id: string
  nickname: string
  avatarColor: string
  distance: number        // Rounded to nearest meter
  revealLevel: number     // 0-10 based on interaction history
  interests?: string[]    // Only if revealLevel >= 3
  realName?: string       // Only if revealLevel >= 5
}
```

---

### useChat

**Location**: [src/hooks/useChat.ts](src/hooks/useChat.ts)

**Status**: To be implemented

**Purpose**: Real-time chat messaging between users.

**Expected Returns**:
```typescript
{
  messages: Message[]
  sendMessage: (text: string) => Promise<void>
  isLoading: boolean
}
```

**Planned Features**:
- Listen to Firestore subcollection `chats/{chatId}/messages/`
- Send message to Firestore
- Update chat lastMessage and lastMessageAt
- Mark messages as read
- Support for typing indicators

---

## Services

### firebase

**Location**: [src/services/firebase.ts](src/services/firebase.ts)

**Purpose**: Firebase initialization and exports.

**Exports**:
```typescript
import {
  auth,           // Firebase Auth instance
  googleProvider, // Google OAuth provider
  db,            // Firestore instance
  realtimeDb,    // Realtime Database instance
  app            // Firebase app instance
} from '@/services/firebase'
```

**Configuration**:
All values from environment variables (`.env.local`):
```typescript
{
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID,
  databaseURL: VITE_FIREBASE_DATABASE_URL
}
```

**Usage Examples**:
```typescript
// Auth
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/services/firebase'
await signInWithPopup(auth, googleProvider)

// Firestore
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
const userDoc = await getDoc(doc(db, 'users', userId))

// Realtime Database
import { ref, onValue } from 'firebase/database'
import { realtimeDb } from '@/services/firebase'
onValue(ref(realtimeDb, 'locations/abc123'), snapshot => { ... })
```

---

## Utility Functions

### Geohash Utils

**Location**: [src/utils/geohash.ts](src/utils/geohash.ts)

#### encode()
```typescript
encode(lat: number, lng: number, precision: number = 7): string
```

**Purpose**: Convert latitude/longitude to geohash string.

**Example**:
```typescript
import { encode } from '@/utils/geohash'

const hash = encode(37.7749, -122.4194, 6)
// Returns: "9q8yyk"
```

**Default Precision**: 7 characters
**Typical Usage**: 6 characters (~610m cells)

#### decode()
```typescript
decode(geohash: string): { lat: number; lng: number }
```

**Purpose**: Convert geohash string back to coordinates.

**Example**:
```typescript
import { decode } from '@/utils/geohash'

const coords = decode("9q8yyk")
// Returns: { lat: 37.7749, lng: -122.4194 }
```

#### neighbors()
```typescript
neighbors(geohash: string): string[]
```

**Purpose**: Get center + 8 surrounding geohash cells (9 total).

**Example**:
```typescript
import { neighbors } from '@/utils/geohash'

const cells = neighbors("9q8yyk")
// Returns: ["9q8yyk", "9q8yy7", "9q8yye", "9q8yys", ...]
```

**Use Case**: Proximity queries across cell boundaries.

#### distance()
```typescript
distance(lat1: number, lng1: number, lat2: number, lng2: number): number
```

**Purpose**: Calculate distance between two points in meters (Haversine formula).

**Example**:
```typescript
import { distance } from '@/utils/geohash'

const dist = distance(37.7749, -122.4194, 37.7849, -122.4094)
// Returns: 1234 (meters)
```

**Accuracy**: Earth's radius = 6,371,000 meters

#### precisionForRadius()
```typescript
precisionForRadius(radius: number): number
```

**Purpose**: Get appropriate geohash precision for given radius.

**Example**:
```typescript
import { precisionForRadius } from '@/utils/geohash'

precisionForRadius(50)    // Returns: 8 (~19m cells)
precisionForRadius(150)   // Returns: 7 (~76m cells)
precisionForRadius(600)   // Returns: 6 (~610m cells)
precisionForRadius(2500)  // Returns: 5 (~2.4km cells)
```

**Mapping**:
- ≤50m → precision 8
- ≤150m → precision 7
- ≤600m → precision 6
- ≤2500m → precision 5
- >2500m → precision 4

---

### Name Generator

**Location**: [src/utils/nameGenerator.ts](src/utils/nameGenerator.ts)

#### generateNickname()
```typescript
generateNickname(): string
```

**Purpose**: Generate random nickname for new users.

**Example**:
```typescript
import { generateNickname } from '@/utils/nameGenerator'

const nickname = generateNickname()
// Returns: "CosmicPanda_42" or "SilentDragon_87"
```

**Pattern**: `{Adjective}{Noun}_{Number}`
- 32 adjectives (Cosmic, Swift, Mystic, Neon, ...)
- 32 nouns (Panda, Fox, Wolf, Dragon, ...)
- Random number 0-99

#### generateAvatarColor()
```typescript
generateAvatarColor(): string
```

**Purpose**: Generate random hex color for avatar.

**Example**:
```typescript
import { generateAvatarColor } from '@/utils/nameGenerator'

const color = generateAvatarColor()
// Returns: "#3b82f6" or "#ec4899"
```

**Color Palette**: 17 vibrant colors
```typescript
['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
 '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
 '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e']
```

#### getInitials()
```typescript
getInitials(nickname: string): string
```

**Purpose**: Extract 2-letter initials from nickname.

**Example**:
```typescript
import { getInitials } from '@/utils/nameGenerator'

getInitials("CosmicPanda_42")  // Returns: "CP"
getInitials("SilentDragon_87") // Returns: "SD"
```

**Logic**:
- Splits on camelCase or underscore
- Takes first letter of first two parts
- Uppercase

---

### Constants

**Location**: [src/utils/constants.ts](src/utils/constants.ts)

#### Distance Constants
```typescript
METERS_PER_MILE = 1609.34
DEFAULT_RADIUS_METERS = 400       // ~0.25 miles
MIN_RADIUS_METERS = 50
MAX_RADIUS_METERS = 1609          // 1 mile
```

#### XP Rewards
```typescript
XP_NEW_ENCOUNTER = 10
XP_SEND_REACTION = 5
XP_ICEBREAKER_COMPLETE = 15
XP_GAME_PLAYED = 20
XP_GAME_WON = 10                  // Bonus
XP_DAILY_STREAK = 25
```

#### Reveal Levels
```typescript
REVEAL_LEVEL_COLOR = 1
REVEAL_LEVEL_INTERESTS = 3
REVEAL_LEVEL_NAME = 5
REVEAL_LEVEL_FULL = 10
```

#### Timing
```typescript
LOCATION_UPDATE_INTERVAL = 10000  // 10 seconds
ENCOUNTER_TIMEOUT = 300000        // 5 minutes
```

#### Map Defaults
```typescript
DEFAULT_MAP_ZOOM = 15
DEFAULT_MAP_CENTER = {
  lat: 37.7749,
  lng: -122.4194
}
```

---

## Type Definitions

**Location**: [src/types/index.ts](src/types/index.ts)

### User Types

```typescript
interface User {
  id: string
  email: string
  nickname: string
  avatarColor: string
  realName?: string
  interests: string[]
  level: number
  xp: number
  badges: string[]
  discoveryRadius: number
  createdAt: Date
  lastActive: Date
}

interface UserLocation {
  lat: number
  lng: number
  timestamp: number
  active: boolean
}
```

### Encounter Types

```typescript
interface Encounter {
  id: string
  users: [string, string]
  location: { lat: number; lng: number }
  startedAt: Date
  interactionCount: number
  status: 'active' | 'ended'
}

interface NearbyUser {
  id: string
  nickname: string
  avatarColor: string
  distance: number
  revealLevel: number
  interests?: string[]
  realName?: string
}
```

### Interaction Types

```typescript
type InteractionType = 'reaction' | 'icebreaker' | 'game'

interface Interaction {
  id: string
  encounterId: string
  fromUser: string
  toUser: string
  type: InteractionType
  data: ReactionData | IceBreakerData | GameData
  timestamp: Date
}

interface ReactionData {
  emoji: string
  label: string
}

interface IceBreakerData {
  prompt: string
  answer: string
}

interface GameData {
  game: 'rps' | 'emoji' | 'trivia'
  move?: string
  result?: 'win' | 'lose' | 'draw'
}
```

### Chat Types

```typescript
interface Chat {
  id: string
  participants: [string, string]
  lastMessage: string
  lastMessageAt: Date
}

interface Message {
  id: string
  sender: string
  text: string
  timestamp: Date
}
```

### Friendship Types

```typescript
interface Friendship {
  id: string
  users: [string, string]
  level: number
  totalInteractions: number
  firstEncounter: Date
  isFavorite: boolean
}
```

### Gamification Types

```typescript
interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: Date
}

const BADGES: Badge[] = [
  { id: 'first_catch', name: 'First Catch',
    description: 'Complete your first encounter', icon: '🎯' },
  // ... 5 more
]

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]

const REACTIONS = [
  { emoji: '👋', label: 'Wave' },
  // ... 5 more
]

const ICE_BREAKERS = [
  'Coffee or tea?',
  // ... 7 more
]
```

---

## Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and data flow
- [STATE.md](STATE.md) - Zustand store API reference
- [COMPONENTS.md](COMPONENTS.md) - Component props and usage
- [FEATURES.md](FEATURES.md) - Feature specifications
