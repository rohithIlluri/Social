/**
 * Profile Exchange Service via Socket.io
 *
 * Handles peer-to-peer profile sharing without server storage.
 * Profiles are ephemeral - exchanged directly between clients.
 *
 * Flow:
 * 1. User connects to Socket.io with Firebase auth token
 * 2. User joins geohash-based room for their region
 * 3. When nearby user detected (from RTDB), request their profile
 * 4. Other user receives request and sends profile back
 * 5. Profile displayed locally (never stored on server)
 */

import { io, Socket } from 'socket.io-client'
import { auth } from './firebase'
import type { User } from '@/types'

// Profile data structure for exchange
export interface ProfileData {
  nickname: string
  avatarColor: string
  interests?: string[]
  realName?: string
}

// Callback type for profile updates
type ProfileCallback = (userId: string, profile: ProfileData) => void

class ProfileExchangeService {
  private socket: Socket | null = null
  private currentGeohash: string | null = null
  private profileCallbacks: Set<ProfileCallback> = new Set()
  private pendingRequests: Map<string, number> = new Map() // userId -> timestamp
  private myProfile: ProfileData | null = null
  private connectionPromise: Promise<void> | null = null

  /**
   * Connect to Socket.io server with Firebase auth token
   */
  async connect(): Promise<void> {
    // Return existing connection promise if connecting
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    // Already connected
    if (this.socket?.connected) {
      return Promise.resolve()
    }

    this.connectionPromise = this._connect()
    try {
      await this.connectionPromise
    } finally {
      this.connectionPromise = null
    }
  }

  private async _connect(): Promise<void> {
    const user = auth.currentUser
    if (!user) {
      throw new Error('User not authenticated with Firebase')
    }

    // Get Firebase ID token for authentication
    const token = await user.getIdToken()

    const serverUrl = import.meta.env.VITE_SOCKET_SERVER_URL
    if (!serverUrl) {
      console.warn('VITE_SOCKET_SERVER_URL not set, profile exchange disabled')
      return
    }

    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })

    this.setupEventHandlers()

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Socket.io connection timeout'))
      }, 15000)

      this.socket!.on('connect', () => {
        clearTimeout(timeout)
        console.log('[ProfileExchange] Connected to server')
        resolve()
      })

      this.socket!.on('connect_error', (err) => {
        clearTimeout(timeout)
        console.error('[ProfileExchange] Connection error:', err.message)
        reject(err)
      })
    })
  }

  /**
   * Set up Socket.io event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return

    // Handle incoming profile requests - auto-respond with our profile
    this.socket.on('profile_request', (data: { fromUserId: string }) => {
      if (this.myProfile) {
        console.log(`[ProfileExchange] Sending profile to ${data.fromUserId.substring(0, 8)}...`)
        this.socket!.emit('profile_response', {
          targetUserId: data.fromUserId,
          profile: this.myProfile,
        })
      }
    })

    // Handle incoming profile responses
    this.socket.on('profile', (data: { fromUserId: string; profile: ProfileData }) => {
      console.log(`[ProfileExchange] Received profile from ${data.fromUserId.substring(0, 8)}...`)
      this.pendingRequests.delete(data.fromUserId)
      this.profileCallbacks.forEach((cb) => cb(data.fromUserId, data.profile))
    })

    // Handle reconnection
    this.socket.on('reconnect', () => {
      console.log('[ProfileExchange] Reconnected')
      // Rejoin current region after reconnect
      if (this.currentGeohash) {
        this.socket!.emit('join_region', { geohash: this.currentGeohash })
      }
    })

    // Handle disconnection
    this.socket.on('disconnect', (reason) => {
      console.log(`[ProfileExchange] Disconnected: ${reason}`)
    })
  }

  /**
   * Update current location region (join geohash room)
   * Called when user's location changes significantly
   */
  joinRegion(geohash: string): void {
    if (!this.socket?.connected) {
      // Queue for after connection
      this.currentGeohash = geohash
      return
    }

    if (this.currentGeohash === geohash) return

    this.socket.emit('join_region', { geohash })
    this.currentGeohash = geohash
  }

  /**
   * Set the current user's profile for sharing
   * Call this when user profile changes
   */
  setMyProfile(user: User): void {
    this.myProfile = {
      nickname: user.nickname,
      avatarColor: user.avatarColor,
      interests: user.interests,
      realName: user.realName,
    }
  }

  /**
   * Request another user's profile
   * Will trigger profile callback when response received
   */
  requestProfile(targetUserId: string): void {
    if (!this.socket?.connected) {
      console.warn('[ProfileExchange] Not connected, cannot request profile')
      return
    }

    // Debounce: don't request same profile within 5 seconds
    const lastRequest = this.pendingRequests.get(targetUserId)
    if (lastRequest && Date.now() - lastRequest < 5000) {
      return
    }

    this.pendingRequests.set(targetUserId, Date.now())
    this.socket.emit('profile_request', { targetUserId })
  }

  /**
   * Subscribe to profile updates
   * Returns unsubscribe function
   */
  onProfile(callback: ProfileCallback): () => void {
    this.profileCallbacks.add(callback)
    return () => {
      this.profileCallbacks.delete(callback)
    }
  }

  /**
   * Check if connected to server
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.currentGeohash = null
    this.pendingRequests.clear()
    this.profileCallbacks.clear()
  }
}

// Singleton instance
export const profileExchange = new ProfileExchangeService()
