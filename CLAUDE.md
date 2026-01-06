# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FriendCatcher is a location-based social discovery PWA where users "catch" friends by crossing paths in the real world - like Pokémon Go but for meeting people. Features a **radar-style military tech aesthetic** with progressive identity reveal, tap-to-reveal interactions, and gamification (XP, levels, badges, streaks).

## Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # TypeScript check + production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

### Firebase Functions (in /functions)
```bash
cd functions
npm run build    # Compile TypeScript
npm run serve    # Local emulator
npm run deploy   # Deploy to Firebase
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Design System
- **Animations**: Framer Motion (decelerate easing, no bouncy springs)
- **State**: Zustand
- **3D Radar**: Three.js (pure WebGL - no map tiles)
- **Backend**: Firebase (Auth, Firestore, Realtime Database, Cloud Functions)
- **Hosting**: Firebase Hosting (PWA)

## Design System

### Visual Aesthetic
- **Style**: Minimal/Premium (Apple, Linear, Raycast quality)
- **Theme**: Radar/military tech with classic green (#22c55e)
- **Feedback**: Haptics only (no sounds)

### Color Palette (tailwind.config.js)
- **radar.blip**: `#22c55e` - Primary radar green
- **radar.screen**: `#0a1a0a` - Dark green-black background
- **radar.glow**: `rgba(34, 197, 94, 0.4)` - Glow effects
- **obsidian**: Deep black palette for surfaces
- **sunrise**: Warm orange accent for CTAs

### Animation Principles
- Use `cubic-bezier(0, 0, 0.2, 1)` (decelerate) for entrances
- Use `cubic-bezier(0.4, 0, 1, 1)` (accelerate) for exits
- NO bouncy springs - keep it premium and subtle
- Haptic feedback on key interactions

### Key CSS Classes (index.css)
- `.radar-screen` - Green-tinted radial gradient background
- `.radar-blip` - Pulsing radar marker with glow
- `.radar-grid` - Subtle green grid overlay
- `.glass-radar` - Green-tinted glass morphism
- `.reveal-card` - Premium reveal modal styling

## Architecture

### User Flow (Simplified)
1. **Onboarding**: 2 steps only (Welcome + Location permission)
2. **Name Generation**: Auto-generated on app open (no user input)
3. **Main Experience**: Full-screen radar map → Tap blips → Reveal modal

### Component Structure

```
src/components/
├── map/
│   ├── MapView.tsx         # Three.js radar scene (main entry)
│   ├── three/              # [Phase 2/3] Three.js modules
│   │   ├── RadarScene.ts   # [Phase 2] Scene manager: rings, sweep, grid
│   │   └── BlipParticleSystem.ts  # [Phase 3] GPU particle blips
│   ├── RadarOverlay.tsx    # [DEPRECATED] Legacy Framer Motion overlay
│   └── RadarBlip.tsx       # [DEPRECATED] Legacy DOM blips
├── encounters/
│   └── RevealModal.tsx     # Tap-to-reveal identity flow
├── common/
│   ├── RevealAvatar.tsx    # Progressive identity reveal avatar
│   ├── Button.tsx          # Primary/secondary/ghost variants
│   └── ...
└── ...
```

### Three.js Radar (Migration in Progress)

**Current State: Phase 1 Complete**
- Three.js scaffold with basic scene
- Proper cleanup on unmount
- Navigation bugs fixed

**Phase 2** (Pending): RadarScene class
- 4 concentric rings with subtle pulse
- Rotating sweep line (4s rotation, cone gradient)
- Grid overlay, vignette, fog
- Center point with glow

**Phase 3** (Pending): BlipParticleSystem
- GPU-accelerated particle points
- Trails behind moving blips
- Pulse/glow effects via shaders
- Raycasting for click detection

### Key Components

**MapView** (`components/map/MapView.tsx`)
- Three.js WebGLRenderer + PerspectiveCamera
- Scene background: #0a1a0a (radar.screen)
- Camera position: (0, 12, 3) for 3D depth
- Proper cleanup: dispose renderer, cancel animation frame

**RevealModal** (`components/encounters/RevealModal.tsx`)
- Full-screen backdrop with blur
- Progressive reveal stages: silhouette → color → partial → full
- Haptic feedback on reveal unlock
- Progress dots showing unlock progress

**RevealAvatar** (`components/common/RevealAvatar.tsx`)
- Stage-based rendering (silhouette, color, partial, full)
- Scanning ring animation for silhouette
- Shimmer effect on color reveal
- Glow effect for full reveal

### Data Flow
1. **Location tracking**: Browser Geolocation API → `useGeolocation` hook → Firebase Realtime DB (keyed by geohash)
2. **Encounter detection**: Geohash proximity query → `useEncounters` hook → encounterStore (Zustand)
3. **Interactions**: Tap blip → RevealModal → haptic feedback → toast notification
4. **Chat**: Unlocked after mutual interaction → `useChat` hook → Firestore subcollection

### Key Patterns

- **Geohashing**: Locations stored by geohash prefix for efficient proximity queries (`utils/geohash.ts`)
- **Progressive reveal**: Identity unlocks at interaction thresholds (0→silhouette, 1→color, 3→interests, 5→name, 10→full)
- **Auto-generated names**: Nickname pattern: `{Adjective}{Noun}_{Number}` (e.g., "CosmicPanda_42")
- **Haptic patterns**: radar ping, reveal unlock, connection made (`utils/haptics.ts`)

### State Management (Zustand)
- `userStore`: Current user profile, auth state, auto-generates user on create
- `encounterStore`: Active nearby encounters, interaction history
- `gameStore`: XP, level, badges, streaks

### Firebase Collections
- `users/` - Profile data, gamification stats
- `locations/` (Realtime DB) - Live positions keyed by `{geohash}/{userId}`
- `encounters/` - Encounter sessions between users
- `interactions/` - Reactions, ice breakers, game results
- `chats/{chatId}/messages/` - Conversation threads
- `friendships/` - Relationship levels, favorites

## Environment Variables

Create `.env.local`:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=
```

## Path Aliases

`@/*` maps to `src/*` (configured in tsconfig.json and vite.config.ts)
