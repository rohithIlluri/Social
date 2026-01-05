# ARCHITECTURE.md

Technical architecture reference for FriendCatcher - a location-based social discovery PWA.

## System Overview

FriendCatcher uses a **dual Firebase database strategy** with real-time geohash-based proximity detection:
- **Firestore**: Structured data (users, encounters, interactions, chats, friendships)
- **Realtime Database**: Live location tracking with low latency

## Data Flow

```
Browser Geolocation API
    ↓
useGeolocation hook
    ↓
Firebase Realtime DB (locations/{geohash}/{userId})
    ↓
useEncounters hook (geohash neighbors query)
    ↓
encounterStore (Zustand)
    ↓
UI Components
```

## Geohashing System

### Overview
Geohashing converts 2D coordinates (lat/lng) into a single string for efficient proximity queries.

**Implementation**: [src/utils/geohash.ts](src/utils/geohash.ts)

### Key Details
- **Precision**: 6 characters = ~610m cell size
- **Encoding**: BASE32 (`0123456789bcdefghjkmnpqrstuvwxyz`)
- **Algorithm**: Binary interleaving of lat/lng bits

### Functions
```typescript
encode(lat: number, lng: number, precision: number = 7): string
// Example: encode(37.7749, -122.4194, 6) → "9q8yyk"

decode(geohash: string): { lat: number; lng: number }
// Example: decode("9q8yyk") → { lat: 37.7749, lng: -122.4194 }

neighbors(geohash: string): string[]
// Returns center + 8 surrounding cells (9 total) for proximity queries

distance(lat1: number, lng1: number, lat2: number, lng2: number): number
// Haversine formula, returns distance in meters

precisionForRadius(radius: number): number
// Returns appropriate precision for given radius
// 50m→8, 150m→7, 600m→6, 2500m→5, else→4
```

### Proximity Detection Pattern
```typescript
// User's location encoded to geohash
const myGeohash = encode(37.7749, -122.4194, 6) // "9q8yyk"

// Query 9 cells (center + 8 neighbors)
const cells = neighbors(myGeohash)
// ["9q8yyk", "9q8yy7", "9q8yye", "9q8yys", ...]

// Listen to all 9 cells in Realtime DB
cells.forEach(hash => {
  ref(realtimeDb, `locations/${hash}`)
})
```

## Firebase Architecture

### Firestore Collections

**users/** - User profiles
```typescript
{
  id: string
  email: string
  nickname: string          // Generated: "CosmicPanda_42"
  avatarColor: string       // Hex color: "#3b82f6"
  realName?: string         // Revealed at interaction level 5
  interests: string[]       // Revealed at interaction level 3
  level: number            // 1-11
  xp: number
  badges: string[]         // Badge IDs
  discoveryRadius: number  // 50-1609 meters
  createdAt: Date
  lastActive: Date
}
```

**encounters/** - Encounter sessions
```typescript
{
  id: string
  users: [string, string]  // [userId1, userId2]
  location: { lat: number, lng: number }
  startedAt: Date
  interactionCount: number // Drives progressive reveal
  status: 'active' | 'ended'
}
```

**interactions/** - All interactions
```typescript
{
  id: string
  encounterId: string
  fromUser: string
  toUser: string
  type: 'reaction' | 'icebreaker' | 'game'
  data: ReactionData | IceBreakerData | GameData
  timestamp: Date
}
```

**chats/{chatId}/messages/** - Nested subcollection
```typescript
// Chat document
{
  id: string
  participants: [string, string]
  lastMessage: string
  lastMessageAt: Date
}

// Message subdocument
{
  id: string
  sender: string
  text: string
  timestamp: Date
}
```

**friendships/** - Relationship tracking
```typescript
{
  id: string
  users: [string, string]
  level: number              // Based on interactionCount
  totalInteractions: number
  firstEncounter: Date
  isFavorite: boolean
}
```

### Realtime Database Structure

**locations/{geohash}/{userId}** - Live positions
```typescript
{
  lat: number
  lng: number
  timestamp: number          // Server timestamp
  active: boolean           // onDisconnect sets to false
  nickname: string          // Denormalized for quick display
  avatarColor: string       // Denormalized for quick display
  radius: number            // User's discoveryRadius
}
```

**Pattern**: Geohash-keyed for efficient proximity queries
```
locations/
  9q8yyk/               ← geohash cell
    user123: { ... }
    user456: { ... }
  9q8yy7/               ← neighboring cell
    user789: { ... }
```

## Progressive Identity Reveal

Identity unlocks based on **interactionCount** between two users.

### Reveal Levels (from [src/utils/constants.ts](src/utils/constants.ts))

| Interactions | Reveal Level | What's Visible |
|--------------|--------------|----------------|
| 0 | 0 | Silhouette avatar, nickname hidden |
| 1 | 1 | Avatar color revealed |
| 3 | 3 | Interests array revealed |
| 5 | 5 | Real name revealed |
| 10+ | 10 | Full profile + chat unlocked |

**Constants**:
```typescript
REVEAL_LEVEL_COLOR = 1
REVEAL_LEVEL_INTERESTS = 3
REVEAL_LEVEL_NAME = 5
REVEAL_LEVEL_FULL = 10
```

### Implementation
The `revealLevel` is calculated in real-time based on the encounter's `interactionCount`:
```typescript
// In NearbyUser type
interface NearbyUser {
  revealLevel: number  // Computed from interactionCount
}
```

## State Management (Zustand)

### Architecture Pattern
- **userStore**: Persisted (localStorage: 'friendcatcher-user')
- **encounterStore**: Ephemeral (no persistence)
- **gameStore**: Persisted (localStorage: 'friendcatcher-game')

### Store Locations
- [src/store/userStore.ts](src/store/userStore.ts)
- [src/store/encounterStore.ts](src/store/encounterStore.ts)
- [src/store/gameStore.ts](src/store/gameStore.ts)

### userStore
**Purpose**: Current user profile, auth state, gamification stats

**State**:
```typescript
{
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
```

**Key Actions**:
- `addXP(amount)` - Auto-calculates level from LEVEL_THRESHOLDS
- `addBadge(badgeId)` - Prevents duplicates
- `logout()` - Clears user state

**Persistence**: Partial - only `user` object persisted

### encounterStore
**Purpose**: Real-time encounter state

**State**:
```typescript
{
  nearbyUsers: NearbyUser[]
  activeEncounter: Encounter | null
  interactions: Interaction[]
}
```

**Key Actions**:
- `setNearbyUsers(users)` - Replace entire array
- `addNearbyUser(user)` - Checks for duplicates
- `removeNearbyUser(userId)` - Filter out by ID

**Persistence**: None (real-time only)

### gameStore
**Purpose**: Gamification statistics

**State**:
```typescript
{
  totalEncounters: number
  totalInteractions: number
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
}
```

**Key Actions**:
- `checkStreak()` - Compares lastActiveDate with today/yesterday
- `recordGame(won)` - Updates both played and won counts

**Persistence**: Full state

## Authentication Flow

1. User clicks "Sign in with Google"
2. `signInWithPopup(auth, googleProvider)` from [src/hooks/useAuth.ts](src/hooks/useAuth.ts)
3. `onAuthStateChanged` listener fires
4. Call `getOrCreateUser(firebaseUser)`
   - Check Firestore `users/{uid}`
   - If exists: load data
   - If new: generate nickname/color, create document
5. `setUser(userData)` in userStore
6. `isAuthenticated` set to `true`

### User Creation
```typescript
// New users get:
nickname: generateNickname()      // "CosmicPanda_42"
avatarColor: generateAvatarColor() // Random from 17 colors
level: 1
xp: 0
badges: []
discoveryRadius: 400              // DEFAULT_RADIUS_METERS
```

## Location Tracking Pipeline

1. **Start Tracking** ([src/hooks/useGeolocation.ts](src/hooks/useGeolocation.ts))
   ```typescript
   startTracking() // Calls navigator.geolocation.watchPosition
   ```

2. **Position Updates** (every 10 seconds)
   ```typescript
   // Browser provides coordinates
   { latitude, longitude, accuracy }
   ```

3. **Geohash Encoding**
   ```typescript
   const geohash = encode(lat, lng, 6) // ~610m precision
   ```

4. **Firebase Update**
   ```typescript
   ref(realtimeDb, `locations/${geohash}/${userId}`)
   set({ lat, lng, timestamp, active: true, ... })
   ```

5. **Disconnect Handler**
   ```typescript
   onDisconnect(locationRef).update({ active: false })
   ```

## Encounter Detection Pipeline

1. **User Location** ([src/hooks/useEncounters.ts](src/hooks/useEncounters.ts))
   ```typescript
   const geohash = encode(userLat, userLng, 6)
   ```

2. **Neighbor Cells**
   ```typescript
   const cells = neighbors(geohash) // 9 cells
   ```

3. **Listen to All Cells**
   ```typescript
   cells.forEach(hash => {
     onValue(ref(realtimeDb, `locations/${hash}`), snapshot => {
       // Process all users in this cell
     })
   })
   ```

4. **Filter by Radius**
   ```typescript
   const dist = distance(myLat, myLng, theirLat, theirLng)
   const withinMyRadius = dist <= user.discoveryRadius
   const withinTheirRadius = dist <= locationData.radius
   if (withinMyRadius && withinTheirRadius) {
     // Add to nearbyUsers
   }
   ```

5. **Update Store**
   ```typescript
   setNearbyUsers(Array.from(allNearbyUsers.values()))
   ```

## Component Architecture

### Page Structure
```
App
├── Onboarding (unauthenticated)
└── Authenticated Layout
    ├── Home (MapView + EncounterCards)
    ├── Friends (FriendsList)
    └── Profile (UserProfile + Settings)
```

### Common Patterns
- **Compound Components**: Modal with Modal.Header, Modal.Body, Modal.Footer
- **Render Props**: MapView accepts custom markers via children
- **Controlled Inputs**: RadiusSlider controlled by parent state

### Key Components
- **Avatar**: Shows initials or silhouette based on revealLevel
- **EncounterCard**: Displays NearbyUser with progressive reveal
- **InteractionPanel**: Tabs for reactions/icebreakers/games
- **MapView**: Mapbox GL wrapper with user location marker

## Performance Considerations

### Geohash Query Efficiency
- **9 cells** queried simultaneously (O(1) for each cell lookup)
- Prevents scanning entire database
- Trade-off: Edge cases near cell boundaries covered by neighbor queries

### Real-time Listeners
- **Location updates**: Throttled to 10s intervals
- **Encounter listeners**: Scoped to 9 geohash cells only
- **Cleanup**: All listeners removed on unmount

### State Persistence
- **userStore**: Persisted (auth state across sessions)
- **encounterStore**: Ephemeral (real-time data only)
- **gameStore**: Persisted (stats preserved)

## Security Model

### Firestore Rules
- Users can only read/write their own user document
- Encounters readable by both participants
- Interactions readable by both fromUser and toUser
- Chats readable by both participants

### Realtime Database Rules
- Users can only write their own location
- Locations readable by anyone (public discovery)
- Active flag prevents stale data

**See**: [SETUP.md](SETUP.md) for complete security rules

## Map Integration

### MapLibre GL JS
- **Library**: MapLibre GL (free, no token required)
- **Tiles**: CARTO dark-matter basemap
- **Default**: Zoom 15, centered on user location
- **Markers**: User position, nearby users (with reveal-appropriate avatars)

**Implementation**: [src/components/map/MapView.tsx](src/components/map/MapView.tsx)

## Related Documentation

- [FEATURES.md](FEATURES.md) - Feature specifications and business logic
- [STATE.md](STATE.md) - Detailed Zustand store reference
- [API.md](API.md) - Complete API reference for hooks and utilities
- [FIREBASE.md](FIREBASE.md) - Firebase schema and configuration
