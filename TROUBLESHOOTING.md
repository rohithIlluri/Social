# TROUBLESHOOTING.md

Common issues and solutions for FriendCatcher development.

## Table of Contents

- [Location & Geolocation Issues](#location--geolocation-issues)
- [Firebase Connection Problems](#firebase-connection-problems)
- [Map Rendering Issues](#map-rendering-issues)
- [State Management Issues](#state-management-issues)
- [Build & Deployment Errors](#build--deployment-errors)
- [Authentication Issues](#authentication-issues)
- [Performance Problems](#performance-problems)

---

## Location & Geolocation Issues

### Location Permission Denied

**Symptoms**:
- Error: "Location permission denied"
- `useGeolocation` returns `error: "Location permission denied"`

**Causes**:
1. User denied browser permission
2. Not using HTTPS (required for geolocation)
3. Browser doesn't support geolocation

**Solutions**:

```typescript
// 1. Check browser support
if (!navigator.geolocation) {
  console.error('Geolocation not supported')
}

// 2. Verify HTTPS (geolocation requires secure context)
console.log('Is HTTPS?', window.isSecureContext)

// 3. Reset browser permissions
// Chrome: chrome://settings/content/location
// Firefox: about:preferences#privacy → Permissions → Location

// 4. Request permission explicitly
navigator.permissions.query({ name: 'geolocation' }).then(result => {
  console.log('Permission status:', result.state)
  // 'granted', 'denied', or 'prompt'
})
```

**Dev Workaround**:
Use browser DevTools to override location:
- Chrome: DevTools → Sensors → Location → Custom
- Firefox: DevTools → Console → `geo location 37.7749 -122.4194`

---

### Location Not Updating in Firebase

**Symptoms**:
- User location doesn't appear in Firebase Realtime DB
- `locations/{geohash}/{userId}` is empty or stale

**Debugging Steps**:

```typescript
// 1. Check if location tracking started
const { isTracking } = useGeolocation()
console.log('Is tracking?', isTracking)

// 2. Verify geolocation coordinates
const { latitude, longitude, error } = useGeolocation()
console.log({ latitude, longitude, error })

// 3. Check geohash calculation
import { encode } from '@/utils/geohash'
const geohash = encode(latitude, longitude, 6)
console.log('Geohash:', geohash)

// 4. Verify Firebase write
// Check browser Network tab for Firebase requests
// Should see POST to https://{project}.firebaseio.com/locations/{geohash}/{userId}.json

// 5. Check Firebase Realtime DB in console
// Firebase Console → Realtime Database → Data
// Navigate to locations/{geohash}/{userId}
```

**Common Fixes**:

1. **User not authenticated**:
```typescript
const { user } = useUserStore()
if (!user) {
  console.error('User must be authenticated to track location')
}
```

2. **onDisconnect not working**:
```typescript
// Ensure onDisconnect is set AFTER successful set()
await set(locationRef, locationData)
onDisconnect(locationRef).update({ active: false })
```

3. **Location updates throttled**:
- Updates occur every 10 seconds (LOCATION_UPDATE_INTERVAL)
- Check `timestamp` field to verify updates

---

### No Nearby Users Detected

**Symptoms**:
- `nearbyUsers` array is empty
- Users who should be nearby don't appear

**Debugging Checklist**:

```typescript
// 1. Verify both users are tracking location
// User A: Check Firebase locations/{geohashA}/{userA}
// User B: Check Firebase locations/{geohashB}/{userB}

// 2. Check active flag
// Both should have active: true

// 3. Calculate distance manually
import { distance } from '@/utils/geohash'
const dist = distance(lat1, lng1, lat2, lng2)
console.log('Distance between users:', dist, 'meters')

// 4. Check discovery radius (mutual requirement)
console.log('User A radius:', userA.discoveryRadius)
console.log('User B radius:', userB.discoveryRadius)
console.log('Are they in mutual range?',
  dist <= userA.discoveryRadius && dist <= userB.discoveryRadius)

// 5. Verify geohash neighbors query
const { latitude, longitude } = useGeolocation()
const geohash = encode(latitude, longitude, 6)
const cells = neighbors(geohash)
console.log('Querying cells:', cells) // Should be 9 cells

// 6. Check Firebase listeners
// useEncounters should attach listeners to all 9 cells
// Verify in Network tab: onValue calls to each cell
```

**Common Issues**:

1. **Users in different geohash cells (not neighbors)**:
```typescript
// User A: 37.7749, -122.4194 → geohash "9q8yyk"
// User B: 37.8000, -122.5000 → geohash "9q8yyy" (different cell, not neighbor)
// Solution: Increase distance or adjust coordinates
```

2. **Discovery radius too small**:
```typescript
// If distance = 500m but both radii = 400m → Not detected
// Solution: Increase discovery radius to 800m+
```

3. **Listener not cleaning up**:
```typescript
// Ensure useEncounters cleanup function runs
useEffect(() => {
  const cleanup = findNearbyUsers()
  return cleanup // Important!
}, [findNearbyUsers])
```

---

## Firebase Connection Problems

### Firebase API Key Invalid

**Symptoms**:
- Error: "Firebase: Error (auth/invalid-api-key)"
- Can't connect to Firebase

**Solution**:

```bash
# 1. Verify .env.local exists and has correct keys
cat .env.local

# 2. Check for typos in variable names
# Must be VITE_FIREBASE_API_KEY (not FIREBASE_API_KEY)

# 3. Restart dev server after changing .env.local
npm run dev

# 4. Get correct keys from Firebase Console
# Firebase Console → Project Settings → General → Your apps
```

---

### Firebase Permission Denied (Firestore)

**Symptoms**:
- Error: "Missing or insufficient permissions"
- Can't read/write Firestore documents

**Debugging**:

```typescript
// 1. Check if user is authenticated
const user = auth.currentUser
console.log('Current user:', user?.uid)

// 2. Verify security rules
// Firebase Console → Firestore → Rules

// 3. Test rules manually
// Firestore → Rules → Playground
// Simulate: read /users/{userId} with auth.uid = userId

// 4. Common rule patterns
```

**Firestore Security Rules** (see [SETUP.md](SETUP.md)):

```javascript
// Allow user to read/write their own document
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}

// Allow both participants to access encounter
match /encounters/{encounterId} {
  allow read: if request.auth.uid in resource.data.users;
}
```

---

### Firebase Realtime Database Permission Denied

**Symptoms**:
- Error: "Permission denied" in Realtime DB
- Can't write location data

**Solution**:

```json
// Firebase Console → Realtime Database → Rules
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

**Test**:
```typescript
// Should succeed: Write own location
await set(ref(realtimeDb, `locations/abc123/${auth.currentUser.uid}`), data)

// Should fail: Write other user's location
await set(ref(realtimeDb, `locations/abc123/otherUserId`), data)
```

---

## Map Rendering Issues

### Map Not Displaying

**Symptoms**:
- Blank screen where map should be
- Console error related to MapLibre GL

**Solutions**:

1. **Container has no height**:
```css
/* Map container must have explicit height */
.map-container {
  height: 100vh; /* or min-height: 400px */
}
```

2. **Import MapLibre CSS**:
```typescript
// Already imported in MapView.tsx
import 'maplibre-gl/dist/maplibre-gl.css'
```

3. **Check map initialization**:
```typescript
// Verify map created successfully
console.log('Map instance:', map.current)

// Check for errors in useEffect
useEffect(() => {
  try {
    map.current = new maplibregl.Map({ ... })
  } catch (error) {
    console.error('Map init failed:', error)
  }
}, [])
```

---

### Map Tiles Not Loading

**Symptoms**:
- Gray/blank map area
- Network errors in console

**Causes**:
- Network blocking CARTO tile server
- CORS issues
- Tile server temporarily down

**Solutions**:

```typescript
// 1. Verify tile server is reachable
fetch('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

// 2. Try alternative free tile sources
// OpenStreetMap: https://tile.openstreetmap.org/{z}/{x}/{y}.png
// Stadia Maps: https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json

// 3. Check DevTools Network tab for failed requests
// Look for 4xx/5xx errors on tile.openstreetmap.org or basemaps.cartocdn.com
```

---

## State Management Issues

### State Not Persisting

**Symptoms**:
- User logged in but data lost on refresh
- Game stats reset unexpectedly

**Debugging**:

```javascript
// 1. Check localStorage
localStorage.getItem('friendcatcher-user')
localStorage.getItem('friendcatcher-game')

// 2. Verify Zustand persist middleware
// src/store/userStore.ts
persist(
  (set, get) => ({ /* ... */ }),
  { name: 'friendcatcher-user' } // Must have name
)

// 3. Check localStorage quota
// Chrome: Settings → Site Settings → Storage
// Typical limit: 5-10 MB

// 4. Clear and test
localStorage.clear()
location.reload()
```

**Common Issues**:

1. **localStorage quota exceeded**:
```typescript
try {
  localStorage.setItem('test', 'data')
} catch (e) {
  console.error('localStorage full:', e)
  // Clear old data or reduce stored state
}
```

2. **Incognito mode** (localStorage disabled in some browsers)
3. **Browser extensions** blocking storage

---

### XP Not Calculating Correctly

**Symptoms**:
- XP added but level doesn't change
- Level calculation seems wrong

**Debugging**:

```typescript
// 1. Check current XP and level
const { user } = useUserStore()
console.log('XP:', user.xp, 'Level:', user.level)

// 2. Verify level thresholds
import { LEVEL_THRESHOLDS } from '@/types'
console.log('Thresholds:', LEVEL_THRESHOLDS)
// [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]

// 3. Test addXP logic manually
const testXP = 250
let level = 1
for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
  if (testXP >= LEVEL_THRESHOLDS[i]) {
    level = i + 1
    break
  }
}
console.log('250 XP should be level:', level) // Should be 3

// 4. Check addXP implementation
// src/store/userStore.ts:41-56
```

**Fix**: Ensure using `>=` not `>` in threshold comparison:
```typescript
// ✅ Correct
if (newXP >= THRESHOLDS[i])

// ❌ Wrong
if (newXP > THRESHOLDS[i])
```

---

## Build & Deployment Errors

### TypeScript Build Errors

**Symptoms**:
- `npm run build` fails
- Type errors in console

**Common Errors**:

1. **Missing optional chaining**:
```typescript
// ❌ Error: Object is possibly 'null'
const name = user.nickname

// ✅ Fix
const name = user?.nickname
```

2. **Incorrect type unions**:
```typescript
// ❌ Error: Type '"challenge"' not assignable to InteractionType
type: 'challenge'

// ✅ Fix: Add to union
export type InteractionType = 'reaction' | 'icebreaker' | 'game' | 'challenge'
```

3. **Date vs Timestamp**:
```typescript
// ❌ Error: Type 'Timestamp' not assignable to 'Date'
createdAt: firestoreTimestamp

// ✅ Fix
createdAt: firestoreTimestamp.toDate()
```

**Debug**:
```bash
# Run TypeScript check without build
npx tsc --noEmit

# Show detailed errors
npx tsc --noEmit --pretty
```

---

### Vite Build Fails

**Symptoms**:
- `npm run build` crashes
- Out of memory errors

**Solutions**:

1. **Increase Node memory**:
```bash
# In package.json
"build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
```

2. **Clear Vite cache**:
```bash
rm -rf node_modules/.vite
npm run build
```

3. **Check for circular dependencies**:
```bash
npx madge --circular src/
```

---

### Firebase Deploy Fails

**Symptoms**:
- `firebase deploy` errors
- Permission denied

**Solutions**:

```bash
# 1. Check logged in
firebase login

# 2. Verify project
firebase projects:list
firebase use YOUR_PROJECT_ID

# 3. Check Firebase CLI version
npm install -g firebase-tools@latest

# 4. Deploy specific targets
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules

# 5. Check quota
# Firebase Console → Usage and billing
```

---

## Authentication Issues

### Google Sign-In Popup Blocked

**Symptoms**:
- Sign-in popup doesn't open
- Error: "Popup blocked by browser"

**Solutions**:

1. **Use redirect instead of popup**:
```typescript
import { signInWithRedirect } from 'firebase/auth'

// Instead of signInWithPopup
await signInWithRedirect(auth, googleProvider)
```

2. **Handle getRedirectResult**:
```typescript
import { getRedirectResult } from 'firebase/auth'

useEffect(() => {
  getRedirectResult(auth).then(result => {
    if (result) {
      console.log('Signed in:', result.user)
    }
  })
}, [])
```

3. **Allow popups in browser**:
- Chrome: Site settings → Popups → Allow
- Firefox: Preferences → Privacy → Popups → Exceptions

---

### User Sign-Out Not Working

**Symptoms**:
- User clicks sign out but stays logged in
- `isAuthenticated` still true

**Debug**:

```typescript
// 1. Verify signOut function
import { signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '@/services/firebase'

const signOut = async () => {
  await firebaseSignOut(auth)
  useUserStore.getState().logout() // Must call both!
}

// 2. Check onAuthStateChanged listener
// Should trigger with null user on sign out

// 3. Clear localStorage manually
localStorage.removeItem('friendcatcher-user')
localStorage.removeItem('friendcatcher-game')
```

---

## Performance Problems

### App Loads Slowly

**Causes**:
- Large bundle size
- Excessive re-renders
- Unoptimized images

**Solutions**:

1. **Analyze bundle size**:
```bash
npm run build
npx vite-bundle-visualizer
```

2. **Code splitting**:
```typescript
// Lazy load pages
const Profile = lazy(() => import('@/pages/Profile'))

<Suspense fallback={<Loading />}>
  <Profile />
</Suspense>
```

3. **Optimize Zustand selectors**:
```typescript
// ✅ Good: Specific selector
const nickname = useUserStore(state => state.user?.nickname)

// ❌ Bad: Re-renders on any state change
const store = useUserStore()
```

4. **Memoize expensive calculations**:
```typescript
import { useMemo } from 'react'

const sortedUsers = useMemo(() => {
  return nearbyUsers.sort((a, b) => a.distance - b.distance)
}, [nearbyUsers])
```

---

### Map Performance Issues

**Symptoms**:
- Laggy map interactions
- High CPU usage

**Optimizations**:

1. **Limit markers**:
```typescript
// Only show closest 20 users
const visibleUsers = nearbyUsers.slice(0, 20)
```

2. **Debounce map events**:
```typescript
import { useDebouncedCallback } from 'use-debounce'

const handleMapMove = useDebouncedCallback(() => {
  // Handle map movement
}, 300)
```

3. **Reduce map updates**:
```typescript
// Update map only when location changes significantly
const [lastMapCenter, setLastMapCenter] = useState(null)

if (distance(lastMapCenter, currentLocation) > 100) {
  setLastMapCenter(currentLocation)
}
```

---

## Quick Fixes Reference

### Common Console Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot read property 'x' of null` | Missing null check | Use optional chaining `?.` |
| `auth/invalid-api-key` | Wrong Firebase key | Check `.env.local` |
| `Permission denied` | Firebase rules | Update security rules |
| `Geolocation not supported` | No HTTPS | Use HTTPS or localhost |
| `Popup blocked` | Browser settings | Use redirect flow |
| `Module not found` | Import path wrong | Check `@/` alias in tsconfig |

---

## Getting Help

### Debug Checklist

Before asking for help, check:
- [ ] Browser console for errors
- [ ] Network tab for failed requests
- [ ] Firebase Console for data/rules
- [ ] LocalStorage for state
- [ ] Environment variables in `.env.local`

### Useful Debug Commands

```javascript
// Browser console quick checks
console.log('User:', useUserStore.getState().user)
console.log('Nearby:', useEncounterStore.getState().nearbyUsers)
console.log('Game:', useGameStore.getState())
console.log('Auth:', auth.currentUser)
console.log('Location:', useGeolocation.getState())
```

---

## Related Documentation

- [WORKFLOWS.md](WORKFLOWS.md) - Development workflows
- [FIREBASE.md](FIREBASE.md) - Firebase configuration
- [API.md](API.md) - Hooks and utilities
- [SETUP.md](SETUP.md) - Initial setup guide
