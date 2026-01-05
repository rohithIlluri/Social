# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FriendCatcher is a location-based social discovery PWA where users "catch" friends by crossing paths in the real world - like Pokémon Go but for meeting people. Anonymous encounters with progressive identity reveal, fun interactions (reactions, ice breakers, mini-games), and gamification (XP, levels, badges, streaks).

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
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Maps**: MapLibre GL JS (free, no token needed)
- **Backend**: Firebase (Auth, Firestore, Realtime Database, Cloud Functions)
- **Hosting**: Firebase Hosting (PWA)

## Architecture

### Data Flow
1. **Location tracking**: Browser Geolocation API → `useGeolocation` hook → Firebase Realtime DB (keyed by geohash)
2. **Encounter detection**: Geohash proximity query → `useEncounters` hook → encounterStore (Zustand)
3. **Interactions**: User action → `services/interactions.ts` → Firestore → real-time listener updates UI
4. **Chat**: Unlocked after mutual interaction → `useChat` hook → Firestore subcollection

### Key Patterns

- **Geohashing**: Locations stored by geohash prefix for efficient proximity queries (`utils/geohash.ts`)
- **Progressive reveal**: Identity unlocks at interaction thresholds (0→silhouette, 1→color, 3→interests, 5→name, 10→full)
- **Dual Firebase DBs**: Realtime DB for live locations (lower latency), Firestore for everything else (better queries)

### State Management (Zustand)
- `userStore`: Current user profile, auth state, settings
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
