/**
 * FriendCatcher Socket.io Profile Exchange Server
 *
 * Lightweight relay server for peer-to-peer profile exchange.
 * Profiles are NEVER stored - server acts purely as a relay.
 *
 * Security:
 * - Firebase Auth token verification on connection
 * - User ID extracted from verified token (prevents spoofing)
 * - Rate limiting on profile requests
 */

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS or default credentials)
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
})

const app = express()
const httpServer = createServer(app)

// Parse allowed origins from environment
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
]

// CORS configuration
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  })
)

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 20000,
})

// Health check endpoint (required for Cloud Run)
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() })
})

// Root endpoint
app.get('/', (_, res) => {
  res.json({
    service: 'FriendCatcher Profile Exchange',
    version: '1.0.0',
    status: 'running',
  })
})

// Rate limiting map: userId -> last request timestamp
const profileRequestRateLimit = new Map<string, Map<string, number>>()
const RATE_LIMIT_MS = 5000 // 5 seconds between requests for same target

/**
 * Check if profile request is rate limited
 */
function isRateLimited(fromUserId: string, targetUserId: string): boolean {
  const userLimits = profileRequestRateLimit.get(fromUserId)
  if (!userLimits) return false

  const lastRequest = userLimits.get(targetUserId)
  if (!lastRequest) return false

  return Date.now() - lastRequest < RATE_LIMIT_MS
}

/**
 * Record a profile request for rate limiting
 */
function recordRequest(fromUserId: string, targetUserId: string): void {
  let userLimits = profileRequestRateLimit.get(fromUserId)
  if (!userLimits) {
    userLimits = new Map()
    profileRequestRateLimit.set(fromUserId, userLimits)
  }
  userLimits.set(targetUserId, Date.now())
}

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_MS * 2
  profileRequestRateLimit.forEach((userLimits, userId) => {
    userLimits.forEach((timestamp, targetId) => {
      if (timestamp < cutoff) {
        userLimits.delete(targetId)
      }
    })
    if (userLimits.size === 0) {
      profileRequestRateLimit.delete(userId)
    }
  })
}, 5 * 60 * 1000)

/**
 * Firebase Auth middleware - verify token and extract userId
 */
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('Authentication required'))
    }

    // Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(token)

    // Attach verified userId to socket (prevents impersonation)
    socket.data.userId = decoded.uid
    socket.data.email = decoded.email

    next()
  } catch (err) {
    console.error('Auth failed:', err)
    next(new Error('Authentication failed'))
  }
})

/**
 * Connection handler
 */
io.on('connection', (socket: Socket) => {
  const userId = socket.data.userId as string
  console.log(`[Connect] User: ${userId.substring(0, 8)}...`)

  // Join user to their personal room for direct messages
  socket.join(userId)

  /**
   * Join a geohash region room
   */
  socket.on('join_region', ({ geohash }: { geohash: string }) => {
    if (!geohash || typeof geohash !== 'string' || geohash.length > 12) {
      return
    }

    // Leave all existing geohash rooms (user can only be in one region)
    socket.rooms.forEach((room) => {
      if (room !== socket.id && room !== userId && room.startsWith('geo:')) {
        socket.leave(room)
      }
    })

    const roomName = `geo:${geohash}`
    socket.join(roomName)
    console.log(`[Region] ${userId.substring(0, 8)}... joined ${geohash}`)
  })

  /**
   * Leave a geohash region room
   */
  socket.on('leave_region', ({ geohash }: { geohash: string }) => {
    if (!geohash) return
    socket.leave(`geo:${geohash}`)
  })

  /**
   * Handle profile request - relay to target user
   */
  socket.on('profile_request', ({ targetUserId }: { targetUserId: string }) => {
    if (!targetUserId || typeof targetUserId !== 'string') {
      return
    }

    // Rate limiting
    if (isRateLimited(userId, targetUserId)) {
      return
    }
    recordRequest(userId, targetUserId)

    // Relay request to target user with VERIFIED sender ID
    io.to(targetUserId).emit('profile_request', {
      fromUserId: userId, // Server-verified, not client-provided
    })
  })

  /**
   * Handle profile response - relay back to requester
   */
  socket.on(
    'profile_response',
    ({
      targetUserId,
      profile,
    }: {
      targetUserId: string
      profile: {
        nickname: string
        avatarColor: string
        interests?: string[]
        realName?: string
      }
    }) => {
      if (!targetUserId || !profile) {
        return
      }

      // Validate profile shape
      if (
        typeof profile.nickname !== 'string' ||
        typeof profile.avatarColor !== 'string'
      ) {
        return
      }

      // Truncate fields to prevent abuse
      const sanitizedProfile = {
        nickname: profile.nickname.substring(0, 50),
        avatarColor: profile.avatarColor.substring(0, 10),
        interests: Array.isArray(profile.interests)
          ? profile.interests.slice(0, 10).map((i) => String(i).substring(0, 50))
          : undefined,
        realName: profile.realName
          ? String(profile.realName).substring(0, 100)
          : undefined,
      }

      // Relay profile to requester with VERIFIED sender ID
      io.to(targetUserId).emit('profile', {
        fromUserId: userId, // Server-verified, not client-provided
        profile: sanitizedProfile,
      })
    }
  )

  /**
   * Handle disconnection
   */
  socket.on('disconnect', (reason) => {
    console.log(`[Disconnect] User: ${userId.substring(0, 8)}... (${reason})`)
    // Cleanup rate limit entries for this user
    profileRequestRateLimit.delete(userId)
  })
})

// Start server
const PORT = process.env.PORT || 8080
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`)
})
