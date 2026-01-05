# COMPONENTS.md

Component catalog and usage guide for FriendCatcher.

## Component Directory Structure

```
src/components/
├── common/
│   ├── Avatar.tsx
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── RadiusSlider.tsx
│   └── BottomNav.tsx
├── encounters/
│   ├── EncounterCard.tsx
│   └── InteractionPanel.tsx
└── map/
    └── MapView.tsx
```

## Common Components

### Avatar

**Location**: [src/components/common/Avatar.tsx](src/components/common/Avatar.tsx)

**Purpose**: Display user avatar with progressive reveal based on revealLevel.

**Props**:
```typescript
interface AvatarProps {
  nickname: string
  avatarColor: string
  revealLevel: number     // 0-10
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
```

**Usage**:
```typescript
import { Avatar } from '@/components/common/Avatar'

<Avatar
  nickname="CosmicPanda_42"
  avatarColor="#3b82f6"
  revealLevel={1}
  size="md"
/>
```

**Behavior**:
- **revealLevel 0**: Generic silhouette (no color, no initials)
- **revealLevel 1+**: Colored circle with initials (e.g., "CP")
- **revealLevel 10+**: Optional: Display profile picture if available

**Sizes**:
- `sm`: 32px × 32px
- `md`: 48px × 48px (default)
- `lg`: 64px × 64px

**Implementation Note**: Uses `getInitials()` utility to extract 2-letter initials from nickname.

---

### Button

**Location**: [src/components/common/Button.tsx](src/components/common/Button.tsx)

**Purpose**: Reusable button component with variants.

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}
```

**Usage**:
```typescript
import { Button } from '@/components/common/Button'

<Button variant="primary" size="md" onClick={handleClick}>
  Send Reaction
</Button>

<Button variant="ghost" isLoading={true}>
  Loading...
</Button>
```

**Variants**:
- `primary`: Solid background, high emphasis
- `secondary`: Outlined, medium emphasis
- `ghost`: Transparent, low emphasis

**Loading State**: Shows spinner and disables button when `isLoading={true}`

---

### Modal

**Location**: [src/components/common/Modal.tsx](src/components/common/Modal.tsx)

**Purpose**: Overlay modal dialog with compound components pattern.

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}
```

**Usage**:
```typescript
import { Modal } from '@/components/common/Modal'

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <Modal.Header>
    <h2>Interaction Options</h2>
  </Modal.Header>
  <Modal.Body>
    <InteractionPanel userId={selectedUser} />
  </Modal.Body>
  <Modal.Footer>
    <Button onClick={() => setIsOpen(false)}>Close</Button>
  </Modal.Footer>
</Modal>
```

**Compound Components**:
- `Modal.Header`: Top section with optional close button
- `Modal.Body`: Main content area
- `Modal.Footer`: Bottom section for actions

**Features**:
- Click outside to close
- ESC key to close
- Scroll lock on body when open
- Fade-in animation

---

### RadiusSlider

**Location**: [src/components/common/RadiusSlider.tsx](src/components/common/RadiusSlider.tsx)

**Purpose**: Slider to adjust user's discovery radius.

**Props**:
```typescript
interface RadiusSliderProps {
  value: number          // Current radius in meters
  onChange: (value: number) => void
  min?: number          // Default: MIN_RADIUS_METERS (50)
  max?: number          // Default: MAX_RADIUS_METERS (1609)
}
```

**Usage**:
```typescript
import { RadiusSlider } from '@/components/common/RadiusSlider'

const [radius, setRadius] = useState(400)

<RadiusSlider
  value={radius}
  onChange={setRadius}
  min={50}
  max={1609}
/>
```

**Display**:
- Shows current value in meters and miles
- Visual indicator on slider
- Step size: 50 meters

**Conversion**: Displays both units
```
400m ≈ 0.25 miles
800m ≈ 0.5 miles
1609m = 1 mile
```

---

### BottomNav

**Location**: [src/components/common/BottomNav.tsx](src/components/common/BottomNav.tsx)

**Purpose**: Fixed bottom navigation bar (mobile PWA pattern).

**Props**: None (uses React Router for navigation state)

**Usage**:
```typescript
import { BottomNav } from '@/components/common/BottomNav'

<BottomNav />
```

**Navigation Items**:
```typescript
[
  { path: '/', icon: '🗺️', label: 'Map' },
  { path: '/friends', icon: '👥', label: 'Friends' },
  { path: '/profile', icon: '👤', label: 'Profile' }
]
```

**Features**:
- Active state highlighting
- Badge indicators (e.g., new messages count)
- Fixed to bottom on mobile
- Responsive: Hidden on desktop (sidebar shown instead)

---

## Encounter Components

### EncounterCard

**Location**: [src/components/encounters/EncounterCard.tsx](src/components/encounters/EncounterCard.tsx)

**Purpose**: Display a nearby user with progressive reveal.

**Props**:
```typescript
interface EncounterCardProps {
  user: NearbyUser
  onInteract: (userId: string) => void
}
```

**Usage**:
```typescript
import { EncounterCard } from '@/components/encounters/EncounterCard'

<EncounterCard
  user={{
    id: 'user123',
    nickname: 'CosmicPanda_42',
    avatarColor: '#3b82f6',
    distance: 245,
    revealLevel: 1
  }}
  onInteract={handleInteract}
/>
```

**Display Logic**:
```typescript
// revealLevel 0: "Someone nearby"
// revealLevel 1+: "CosmicPanda_42"
// revealLevel 3+: Show interests tags
// revealLevel 5+: Show real name
// revealLevel 10+: Show "Chat unlocked" badge
```

**Information Shown**:
- Avatar (with reveal logic)
- Nickname (if revealLevel >= 1)
- Distance (e.g., "245m away")
- Interests tags (if revealLevel >= 3)
- Real name (if revealLevel >= 5)
- "Interact" button

**Styling**: Card with shadow, rounded corners, hover effect

---

### InteractionPanel

**Location**: [src/components/encounters/InteractionPanel.tsx](src/components/encounters/InteractionPanel.tsx)

**Purpose**: Tabbed interface for sending reactions, ice breakers, and playing games.

**Props**:
```typescript
interface InteractionPanelProps {
  userId: string
  encounterId: string
  onInteractionSent: () => void
}
```

**Usage**:
```typescript
import { InteractionPanel } from '@/components/encounters/InteractionPanel'

<InteractionPanel
  userId="user123"
  encounterId="enc456"
  onInteractionSent={() => {
    console.log('Interaction sent!')
    setModalOpen(false)
  }}
/>
```

**Tabs**:
1. **Reactions** (6 options)
   - Grid of emoji buttons
   - Click to send
   - Shows label on hover

2. **Ice Breakers** (8 prompts)
   - List of question prompts
   - Click prompt to send
   - Other user can answer

3. **Mini-Games** (3 games)
   - RPS: Rock-Paper-Scissors
   - Emoji: Emoji matching game
   - Trivia: Quick questions
   - Shows game instructions

**Behavior**:
- Sends interaction to Firestore
- Awards XP to sender
- Increments encounter interactionCount
- Calls `onInteractionSent` callback
- Shows success toast

---

## Map Components

### MapView

**Location**: [src/components/map/MapView.tsx](src/components/map/MapView.tsx)

**Purpose**: MapLibre GL wrapper showing user location and nearby users.

**Props**:
```typescript
interface MapViewProps {
  latitude: number
  longitude: number
  radius: number
  nearbyUsers: NearbyUser[]
  onUserClick?: (user: NearbyUser) => void
}
```

**Usage**:
```typescript
import { MapView } from '@/components/map/MapView'

const { latitude, longitude } = useGeolocation()
const { nearbyUsers } = useEncounters(latitude, longitude)

<MapView
  latitude={latitude}
  longitude={longitude}
  radius={user?.discoveryRadius || 400}
  nearbyUsers={nearbyUsers}
  onUserClick={handleUserClick}
/>
```

**Features**:
- User location marker (blue dot)
- Nearby user markers (silhouette icons with glow animation)
- Discovery radius circle overlay (cyan fill)
- Click markers to open InteractionPanel
- Dark mode map style (CARTO dark-matter)

**Map Configuration**:
- Uses MapLibre GL (free, no token required)
- Tile source: `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`
- Scroll zoom disabled for mobile-friendly experience

**Performance**:
- Markers managed via refs to avoid re-renders
- Map layers added only after `load` event
- Cleanup on unmount

---

## Page Components

### Onboarding

**Location**: [src/pages/Onboarding.tsx](src/pages/Onboarding.tsx)

**Purpose**: First-time user onboarding flow (unauthenticated).

**Flow**:
1. Welcome screen with app explanation
2. Location permission request
3. Sign in with Google
4. Interest selection (optional)
5. Discovery radius setup

**Usage**: Shown when `!isAuthenticated`

---

### Home

**Location**: [src/pages/Home.tsx](src/pages/Home.tsx)

**Purpose**: Main app screen with map and encounter list.

**Layout**:
```
┌──────────────────┐
│   MapView        │ ← Top 60%
├──────────────────┤
│ EncounterCards   │ ← Bottom 40% (scrollable)
└──────────────────┘
```

**Features**:
- Full-screen map with user location
- Scrollable encounter list overlay
- Click encounter card to open InteractionPanel modal
- Real-time updates as users move

---

### Profile

**Location**: [src/pages/Profile.tsx](src/pages/Profile.tsx)

**Purpose**: User profile and settings.

**Sections**:
1. **Profile Info**
   - Avatar, nickname, real name
   - Level and XP progress bar
   - Badges earned (icons with hover tooltips)

2. **Stats**
   - Total encounters
   - Total interactions
   - Games played/won
   - Current/longest streak

3. **Settings**
   - Discovery radius slider
   - Interests editor (chip input)
   - Real name (optional, for reveal level 5+)
   - Sign out button

---

### Friends

**Location**: [src/pages/Friends.tsx](src/pages/Friends.tsx)

**Purpose**: List of friendships with interaction history.

**Display**:
- List of friendship cards
- Sorted by: Recent activity, friendship level, or alphabetical
- Each card shows:
  - Avatar and name
  - Friendship level (1-4 hearts)
  - Total interactions
  - Last interaction date
  - "Favorite" toggle

**Features**:
- Search/filter friends
- Click to view detailed history
- Send message (if chat unlocked)

---

## Component Patterns

### Compound Components
Use for complex components with multiple parts:
```typescript
<Modal>
  <Modal.Header />
  <Modal.Body />
  <Modal.Footer />
</Modal>
```

### Render Props
Pass rendering logic to children:
```typescript
<MapView>
  {({ markers }) => markers.map(m => <CustomMarker key={m.id} {...m} />)}
</MapView>
```

### Controlled Components
Parent controls state:
```typescript
<RadiusSlider value={radius} onChange={setRadius} />
```

### Composition
Combine small components:
```typescript
<EncounterCard>
  <Avatar />
  <EncounterInfo />
  <InteractButton />
</EncounterCard>
```

---

## Styling Approach

### Tailwind CSS
All components use Tailwind utility classes:
```typescript
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
```

### Responsive Design
Mobile-first with responsive breakpoints:
```typescript
<div className="w-full md:w-1/2 lg:w-1/3">
```

### Dark Mode (Planned)
Use Tailwind dark mode utilities:
```typescript
<div className="bg-white dark:bg-gray-800">
```

---

## Component Development Workflow

### 1. Create Component
```bash
# Create new component file
touch src/components/common/MyComponent.tsx
```

### 2. Define Props Interface
```typescript
interface MyComponentProps {
  value: string
  onChange: (value: string) => void
}
```

### 3. Implement Component
```typescript
export function MyComponent({ value, onChange }: MyComponentProps) {
  return <input value={value} onChange={e => onChange(e.target.value)} />
}
```

### 4. Export from Index
```typescript
// src/components/index.ts
export { MyComponent } from './common/MyComponent'
```

### 5. Use in Pages
```typescript
import { MyComponent } from '@/components'
```

---

## Related Documentation

- [API.md](API.md) - Hooks used by components
- [STATE.md](STATE.md) - State management
- [ARCHITECTURE.md](ARCHITECTURE.md) - Component architecture
- [WORKFLOWS.md](WORKFLOWS.md) - Adding new components
