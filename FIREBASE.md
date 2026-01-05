# FIREBASE.md

Complete Firebase configuration and schema reference for FriendCatcher.

## Firebase Services

FriendCatcher uses **four Firebase services**:

| Service | Purpose | Access Pattern |
|---------|---------|----------------|
| **Authentication** | Google OAuth user auth | auth, googleProvider |
| **Firestore** | Structured data (users, encounters, interactions, chats, friendships) | db |
| **Realtime Database** | Live location tracking | realtimeDb |
| **Cloud Functions** | Server-side logic (planned) | functions/ directory |

**Configuration**: [src/services/firebase.ts](src/services/firebase.ts)

---

## Environment Variables

Required in `.env.local`:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

**Setup Guide**: [SETUP.md](SETUP.md)

---

## Firestore Database

### Collection: users/

**Path**: `users/{userId}`

**Document Structure**:
```typescript
{
  id: string                 // Same as document ID (auth.uid)
  email: string
  nickname: string           // Generated: "CosmicPanda_42"
  avatarColor: string        // Hex color: "#3b82f6"
  realName?: string          // Optional, revealed at level 5
  interests: string[]        // Array of interest tags
  level: number             // 1-11
  xp: number                // Experience points
  badges: string[]          // Badge IDs: ['first_catch', ...]
  discoveryRadius: number   // Meters: 50-1609
  createdAt: Timestamp      // Firebase Timestamp
  lastActive: Timestamp     // Updated on each login
}
```

**Indexes**: None required (queries by document ID only)

**Security Rules**:
```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

**Operations**:
```typescript
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

// Read user
const userDoc = await getDoc(doc(db, 'users', userId))
const userData = userDoc.data()

// Create user
await setDoc(doc(db, 'users', userId), {
  email: 'user@example.com',
  nickname: generateNickname(),
  // ...
})

// Update user
await updateDoc(doc(db, 'users', userId), {
  discoveryRadius: 800,
  interests: ['music', 'hiking']
})
```

---

### Collection: encounters/

**Path**: `encounters/{encounterId}`

**Document Structure**:
```typescript
{
  id: string
  users: [string, string]    // [userId1, userId2] (ordered)
  location: {
    lat: number
    lng: number
  }
  startedAt: Timestamp
  interactionCount: number   // Drives progressive reveal
  status: 'active' | 'ended'
  lastInteractionAt?: Timestamp
}
```

**Indexes Required**:
- Composite: `users` (array-contains) + `status` (ascending)

**Security Rules**:
```javascript
match /encounters/{encounterId} {
  allow read: if request.auth != null &&
              request.auth.uid in resource.data.users;
  allow create: if request.auth != null &&
                request.auth.uid in request.resource.data.users;
  allow update: if request.auth != null &&
                request.auth.uid in resource.data.users;
}
```

**Operations**:
```typescript
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore'

// Create encounter
const encounterId = generateId()
await setDoc(doc(db, 'encounters', encounterId), {
  id: encounterId,
  users: [userId1, userId2].sort(), // Sort for consistency
  location: { lat: 37.7749, lng: -122.4194 },
  startedAt: serverTimestamp(),
  interactionCount: 0,
  status: 'active'
})

// Increment interaction count
await updateDoc(doc(db, 'encounters', encounterId), {
  interactionCount: increment(1),
  lastInteractionAt: serverTimestamp()
})

// Query user's encounters
const q = query(
  collection(db, 'encounters'),
  where('users', 'array-contains', userId),
  where('status', '==', 'active')
)
const snapshot = await getDocs(q)
```

---

### Collection: interactions/

**Path**: `interactions/{interactionId}`

**Document Structure**:
```typescript
{
  id: string
  encounterId: string
  fromUser: string
  toUser: string
  type: 'reaction' | 'icebreaker' | 'game'
  data: {
    // ReactionData
    emoji?: string
    label?: string

    // IceBreakerData
    prompt?: string
    answer?: string

    // GameData
    game?: 'rps' | 'emoji' | 'trivia'
    move?: string
    result?: 'win' | 'lose' | 'draw'
  }
  timestamp: Timestamp
}
```

**Indexes Required**:
- Composite: `encounterId` (ascending) + `timestamp` (descending)
- Single: `fromUser` (ascending)
- Single: `toUser` (ascending)

**Security Rules**:
```javascript
match /interactions/{interactionId} {
  allow read: if request.auth != null &&
              (request.auth.uid == resource.data.fromUser ||
               request.auth.uid == resource.data.toUser);
  allow create: if request.auth != null &&
                request.auth.uid == request.resource.data.fromUser;
}
```

**Operations**:
```typescript
// Create interaction
const interactionId = generateId()
await setDoc(doc(db, 'interactions', interactionId), {
  id: interactionId,
  encounterId: 'enc123',
  fromUser: userId,
  toUser: otherUserId,
  type: 'reaction',
  data: { emoji: '👋', label: 'Wave' },
  timestamp: serverTimestamp()
})

// Query encounter interactions
const q = query(
  collection(db, 'interactions'),
  where('encounterId', '==', encounterId),
  orderBy('timestamp', 'desc'),
  limit(50)
)
const snapshot = await getDocs(q)
```

---

### Collection: chats/

**Path**: `chats/{chatId}`

**Document Structure**:
```typescript
{
  id: string
  participants: [string, string]  // [userId1, userId2] (sorted)
  lastMessage: string
  lastMessageAt: Timestamp
  createdAt: Timestamp
}
```

**Security Rules**:
```javascript
match /chats/{chatId} {
  allow read: if request.auth != null &&
              request.auth.uid in resource.data.participants;
  allow create: if request.auth != null &&
                request.auth.uid in request.resource.data.participants;
  allow update: if request.auth != null &&
                request.auth.uid in resource.data.participants;
}
```

**Subcollection**: `chats/{chatId}/messages/{messageId}`

**Message Structure**:
```typescript
{
  id: string
  sender: string
  text: string
  timestamp: Timestamp
  read?: boolean
}
```

**Message Security Rules**:
```javascript
match /chats/{chatId}/messages/{messageId} {
  allow read: if request.auth != null &&
              request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
  allow create: if request.auth != null &&
                request.auth.uid == request.resource.data.sender &&
                request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
}
```

**Operations**:
```typescript
// Create chat
const chatId = [userId1, userId2].sort().join('_')
await setDoc(doc(db, 'chats', chatId), {
  id: chatId,
  participants: [userId1, userId2].sort(),
  lastMessage: '',
  lastMessageAt: serverTimestamp(),
  createdAt: serverTimestamp()
})

// Send message
const messageId = generateId()
await setDoc(doc(db, `chats/${chatId}/messages`, messageId), {
  id: messageId,
  sender: userId,
  text: 'Hello!',
  timestamp: serverTimestamp()
})

// Update chat lastMessage
await updateDoc(doc(db, 'chats', chatId), {
  lastMessage: 'Hello!',
  lastMessageAt: serverTimestamp()
})

// Listen to messages (real-time)
const q = query(
  collection(db, `chats/${chatId}/messages`),
  orderBy('timestamp', 'asc')
)
onSnapshot(q, (snapshot) => {
  const messages = snapshot.docs.map(doc => doc.data())
  setMessages(messages)
})
```

---

### Collection: friendships/

**Path**: `friendships/{friendshipId}`

**Document Structure**:
```typescript
{
  id: string
  users: [string, string]      // [userId1, userId2] (sorted)
  level: number               // 1-4 based on totalInteractions
  totalInteractions: number
  firstEncounter: Timestamp
  lastInteraction: Timestamp
  isFavorite: boolean        // Either user can favorite
}
```

**Friendship ID Convention**: `{userId1}_{userId2}` (sorted alphabetically)

**Indexes Required**:
- Composite: `users` (array-contains) + `lastInteraction` (descending)

**Security Rules**:
```javascript
match /friendships/{friendshipId} {
  allow read: if request.auth != null &&
              request.auth.uid in resource.data.users;
  allow write: if request.auth != null &&
               request.auth.uid in resource.data.users;
}
```

**Operations**:
```typescript
// Create or update friendship
const friendshipId = [userId1, userId2].sort().join('_')
await setDoc(doc(db, 'friendships', friendshipId), {
  id: friendshipId,
  users: [userId1, userId2].sort(),
  level: 1,
  totalInteractions: 1,
  firstEncounter: serverTimestamp(),
  lastInteraction: serverTimestamp(),
  isFavorite: false
}, { merge: true })

// Increment interactions
await updateDoc(doc(db, 'friendships', friendshipId), {
  totalInteractions: increment(1),
  lastInteraction: serverTimestamp()
})

// Query user's friends
const q = query(
  collection(db, 'friendships'),
  where('users', 'array-contains', userId),
  orderBy('lastInteraction', 'desc')
)
const snapshot = await getDocs(q)
```

---

## Realtime Database

### Structure: locations/

**Path**: `locations/{geohash}/{userId}`

**Data Structure**:
```typescript
{
  lat: number              // Latitude
  lng: number              // Longitude
  timestamp: number        // Server timestamp
  active: boolean          // User is online
  nickname: string         // Denormalized for quick display
  avatarColor: string      // Denormalized for quick display
  radius: number           // User's discoveryRadius
}
```

**Tree Example**:
```json
{
  "locations": {
    "9q8yyk": {
      "user123": {
        "lat": 37.7749,
        "lng": -122.4194,
        "timestamp": 1704067200000,
        "active": true,
        "nickname": "CosmicPanda_42",
        "avatarColor": "#3b82f6",
        "radius": 400
      },
      "user456": { /* ... */ }
    },
    "9q8yy7": {
      "user789": { /* ... */ }
    }
  }
}
```

**Security Rules**:
```json
{
  "rules": {
    "locations": {
      "$geohash": {
        "$userId": {
          ".read": true,
          ".write": "$userId === auth.uid"
        }
      }
    }
  }
}
```

**Operations**:
```typescript
import { ref, set, onValue, onDisconnect, serverTimestamp } from 'firebase/database'
import { realtimeDb } from '@/services/firebase'

// Write location
const geohash = encode(lat, lng, 6)
const locationRef = ref(realtimeDb, `locations/${geohash}/${userId}`)

await set(locationRef, {
  lat,
  lng,
  timestamp: serverTimestamp(),
  active: true,
  nickname: user.nickname,
  avatarColor: user.avatarColor,
  radius: user.discoveryRadius
})

// Set disconnect handler
onDisconnect(locationRef).update({ active: false })

// Listen to cell
onValue(ref(realtimeDb, `locations/${geohash}`), (snapshot) => {
  const users = snapshot.val()
  // Process users in this cell
})

// Remove location
await set(locationRef, null)
```

**Geohash Precision**: 6 characters = ~610m cell size

**Why Realtime DB?**
- Lower latency than Firestore for frequent writes
- Better for ephemeral location data
- Efficient geohash-based queries

---

## Cloud Functions

**Location**: `/functions` directory

**Status**: Planned

### Planned Functions

#### onNewEncounter
Trigger when new encounter created.

```typescript
// functions/src/index.ts
export const onNewEncounter = functions.firestore
  .document('encounters/{encounterId}')
  .onCreate(async (snap, context) => {
    const encounter = snap.data()

    // Award XP to both users
    const [user1, user2] = encounter.users
    await awardXP(user1, XP_NEW_ENCOUNTER)
    await awardXP(user2, XP_NEW_ENCOUNTER)

    // Check badge unlocks
    await checkBadges(user1)
    await checkBadges(user2)
  })
```

#### checkBadges
Evaluate badge unlock conditions.

```typescript
export const checkBadges = functions.firestore
  .document('encounters/{encounterId}')
  .onUpdate(async (change, context) => {
    const encounter = change.after.data()

    // Check "first_catch" badge
    if (encounter.interactionCount === 1) {
      const [user1, user2] = encounter.users
      await unlockBadge(user1, 'first_catch')
      await unlockBadge(user2, 'first_catch')
    }
  })
```

#### cleanupInactiveLocations
Remove stale location data.

```typescript
export const cleanupInactiveLocations = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const cutoff = Date.now() - 5 * 60 * 1000 // 5 minutes ago
    const snapshot = await realtimeDb.ref('locations').once('value')

    snapshot.forEach(cell => {
      cell.forEach(user => {
        if (user.val().timestamp < cutoff) {
          user.ref.remove()
        }
      })
    })
  })
```

### Deploy Functions

```bash
cd functions
npm install
npm run build
npm run deploy
```

**Environment Variables** (functions):
```bash
firebase functions:config:set app.env="production"
```

---

## Firestore Indexes

Required composite indexes (create in Firebase Console):

### encounters
- Collection: `encounters`
- Fields:
  1. `users` (Array-contains)
  2. `status` (Ascending)
  3. `lastInteractionAt` (Descending)

### interactions
- Collection: `interactions`
- Fields:
  1. `encounterId` (Ascending)
  2. `timestamp` (Descending)

### friendships
- Collection: `friendships`
- Fields:
  1. `users` (Array-contains)
  2. `lastInteraction` (Descending)

**Create via Firebase Console**: Firestore → Indexes → Composite → Create

Or via CLI:
```bash
firebase deploy --only firestore:indexes
```

With `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "encounters",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "users", "arrayConfig": "CONTAINS" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "lastInteractionAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Data Migration & Seeding

### Seed Development Data

```typescript
// scripts/seed-firebase.ts
import { db, realtimeDb } from '@/services/firebase'
import { setDoc, doc } from 'firebase/firestore'
import { ref, set } from 'firebase/database'

async function seedData() {
  // Create test users
  await setDoc(doc(db, 'users', 'test1'), {
    id: 'test1',
    email: 'test1@example.com',
    nickname: 'CosmicPanda_42',
    avatarColor: '#3b82f6',
    interests: ['music', 'hiking'],
    level: 1,
    xp: 0,
    badges: [],
    discoveryRadius: 400,
    createdAt: new Date(),
    lastActive: new Date()
  })

  // Seed location
  await set(ref(realtimeDb, 'locations/9q8yyk/test1'), {
    lat: 37.7749,
    lng: -122.4194,
    timestamp: Date.now(),
    active: true,
    nickname: 'CosmicPanda_42',
    avatarColor: '#3b82f6',
    radius: 400
  })

  console.log('Data seeded!')
}

seedData()
```

**Run**:
```bash
npm run seed
```

---

## Backup & Restore

### Firestore Backup
```bash
# Export Firestore
gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)

# Import Firestore
gcloud firestore import gs://your-bucket/backups/20240101
```

### Realtime Database Backup
Firebase Console → Realtime Database → Backups → Enable automated backups

Or manual export:
```bash
curl https://your-project.firebaseio.com/.json?auth=YOUR_SECRET > backup.json
```

---

## Performance Optimization

### Firestore
- Use `.limit()` on queries to reduce reads
- Implement pagination with `startAfter()`
- Cache frequently accessed documents
- Use `onSnapshot` only when real-time updates needed

### Realtime Database
- Limit listener scope to specific geohash cells (not entire DB)
- Use `once()` instead of `on()` for one-time reads
- Index rules properly for query performance
- Clean up inactive locations periodically

---

## Cost Optimization

### Firestore Costs
- **Reads**: $0.06 per 100K documents
- **Writes**: $0.18 per 100K documents
- Optimize: Cache user data, batch writes, limit query results

### Realtime Database Costs
- **Storage**: $5/GB/month
- **Bandwidth**: $1/GB downloaded
- Optimize: Remove inactive locations, minimize payload size

### Strategy
- Use Realtime DB for high-frequency writes (locations)
- Use Firestore for structured queries (users, encounters)
- Implement client-side caching
- Set up Firebase Budget Alerts

---

## Security Best Practices

1. **Never expose API keys in public repos** - Use `.env.local` (gitignored)
2. **Always validate on server** - Cloud Functions for critical operations
3. **Use security rules** - Deny by default, allow specific patterns
4. **Audit rules regularly** - Firebase Console → Rules → Test
5. **Rate limit writes** - Prevent abuse with Cloud Functions
6. **Sanitize user input** - Especially in chat messages

---

## Related Documentation

- [SETUP.md](SETUP.md) - Firebase setup and security rules
- [ARCHITECTURE.md](ARCHITECTURE.md) - Database architecture overview
- [API.md](API.md) - Firebase SDK usage in hooks
- [WORKFLOWS.md](WORKFLOWS.md) - Development and deployment workflows
