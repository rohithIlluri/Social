# FriendCatcher Setup Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account

## 1. Install Dependencies

```bash
npm install
```

## 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project called "FriendCatcher"
3. Enable **Authentication** → Sign-in method → Google
4. Create **Firestore Database** (start in test mode for development)
5. Create **Realtime Database** (start in test mode)
6. Go to Project Settings → General → Your apps → Add Web App
7. Copy the config values

## 3. Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

> [!NOTE]
> No map token required! FriendCatcher uses MapLibre GL with free CARTO basemap tiles.

## 4. Firebase Security Rules

### Firestore Rules (firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    match /encounters/{encounterId} {
      allow read, write: if request.auth != null;
    }

    match /interactions/{interactionId} {
      allow read, write: if request.auth != null;
    }

    match /chats/{chatId} {
      allow read, write: if request.auth != null
        && request.auth.uid in resource.data.participants;
    }

    match /chats/{chatId}/messages/{messageId} {
      allow read, write: if request.auth != null;
    }

    match /friendships/{friendshipId} {
      allow read: if request.auth != null
        && request.auth.uid in resource.data.users;
      allow write: if request.auth != null;
    }
  }
}
```

### Realtime Database Rules (database.rules.json)

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

## 5. Run Development Server

```bash
npm run dev
```

The app will open at http://localhost:3000

## 6. Testing on Mobile

For the best experience, test on a real mobile device:

1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update `vite.config.ts` to allow network access:
   ```ts
   server: {
     port: 3000,
     host: true, // Add this
   }
   ```
3. Access `http://YOUR_LOCAL_IP:3000` from your phone
4. Enable location permissions when prompted

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── services/       # Firebase and API services
├── store/          # Zustand state stores
├── types/          # TypeScript types
└── utils/          # Utility functions
```

## Next Steps

After basic setup, you can implement:

1. **Mini-games** (Rock-Paper-Scissors, Emoji Guess, Trivia)
2. **Push notifications** for new encounters
3. **Progressive identity reveal** logic
4. **Chat functionality** between friends
5. **Block/report** safety features
6. **PWA offline support**

## Troubleshooting

**Location not working?**
- Ensure HTTPS is enabled (required for geolocation)
- Check browser permissions
- Try a different browser

**Firebase errors?**
- Verify all environment variables are set
- Check Firebase console for quota limits
- Review security rules

**Map not loading?**
- Check browser console for tile loading errors
- Ensure network can reach `basemaps.cartocdn.com`
