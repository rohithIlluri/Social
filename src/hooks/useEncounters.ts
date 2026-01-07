/**
 * useEncounters Hook - Anonymous Location Discovery
 *
 * Discovers nearby users via anonymous RTDB location data.
 * Profile info (nickname, avatar) fetched via Socket.io peer-to-peer.
 *
 * Flow:
 * 1. Subscribe to RTDB locations in nearby geohash cells
 * 2. RTDB only contains: userId, lat, lng, radius, timestamp, active
 * 3. Request profiles via Socket.io for each nearby user
 * 4. Merge profile data into nearbyUsers state
 */

import { useEffect, useCallback, useRef } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { realtimeDb } from '@/services/firebase'
import { useUserStore } from '@/store/userStore'
import { useEncounterStore } from '@/store/encounterStore'
import { encode, neighbors, distance } from '@/utils/geohash'
import { getRevealLevel } from '@/services/interactions'
import { profileExchange, ProfileData } from '@/services/profileExchange'
import type { NearbyUser } from '@/types'

// Anonymous location data from RTDB (no PII)
interface LocationData {
  lat: number
  lng: number
  timestamp: number
  active: boolean
  radius: number
}

export function useEncounters(latitude: number | null, longitude: number | null) {
  const { user } = useUserStore()
  const { setNearbyUsers, nearbyUsers } = useEncounterStore()

  // Cache profiles received via Socket.io
  const profileCacheRef = useRef<Map<string, ProfileData>>(new Map())

  // Track which users we've requested profiles for
  const requestedProfilesRef = useRef<Set<string>>(new Set())

  // Initialize Socket.io connection and set up profile sharing
  useEffect(() => {
    if (!user) return

    // Set our profile for sharing with other users
    profileExchange.setMyProfile(user)

    // Connect to Socket.io server
    profileExchange.connect().catch((err) => {
      console.warn('[useEncounters] Socket.io connection failed:', err.message)
    })

    // Subscribe to incoming profiles
    const unsubscribe = profileExchange.onProfile((userId, profile) => {
      // Cache the received profile
      profileCacheRef.current.set(userId, profile)

      // Update nearby users with new profile data
      setNearbyUsers(
        nearbyUsers.map((u) => {
          if (u.id === userId) {
            return {
              ...u,
              nickname: profile.nickname,
              avatarColor: profile.avatarColor,
              interests: profile.interests,
              realName: profile.realName,
            }
          }
          return u
        })
      )
    })

    return () => {
      unsubscribe()
      profileExchange.disconnect()
      profileCacheRef.current.clear()
      requestedProfilesRef.current.clear()
    }
  }, [user]) // Don't include nearbyUsers in deps - handled via ref pattern

  // Join Socket.io region when location changes
  useEffect(() => {
    if (!latitude || !longitude) return
    const geohash = encode(latitude, longitude, 6)
    profileExchange.joinRegion(geohash)
  }, [latitude, longitude])

  // Find nearby users from RTDB and request their profiles
  const findNearbyUsers = useCallback(() => {
    if (!latitude || !longitude || !user) {
      setNearbyUsers([])
      return () => {}
    }

    const geohash = encode(latitude, longitude, 6)
    const neighborHashes = neighbors(geohash)
    const listeners: (() => void)[] = []

    const allNearbyUsers = new Map<string, NearbyUser>()

    neighborHashes.forEach((hash) => {
      const locationRef = ref(realtimeDb, `locations/${hash}`)

      onValue(locationRef, async (snapshot) => {
        if (!snapshot.exists()) return

        const data = snapshot.val() as Record<string, LocationData>

        for (const [userId, locationData] of Object.entries(data)) {
          // Skip self and inactive users
          if (userId === user.id || !locationData.active) {
            allNearbyUsers.delete(userId)
            continue
          }

          // Calculate distance
          const dist = distance(latitude, longitude, locationData.lat, locationData.lng)

          // Check if within both users' discovery radius
          const withinMyRadius = dist <= user.discoveryRadius
          const withinTheirRadius = dist <= locationData.radius

          if (withinMyRadius && withinTheirRadius) {
            // Fetch reveal level from encounter history
            let revealLevel = 0
            try {
              revealLevel = await getRevealLevel(user.id, userId)
            } catch {
              // Keep default if fetch fails
            }

            // Get cached profile or use placeholder
            const cachedProfile = profileCacheRef.current.get(userId)

            allNearbyUsers.set(userId, {
              id: userId,
              nickname: cachedProfile?.nickname, // undefined if not yet received
              avatarColor: cachedProfile?.avatarColor, // undefined if not yet received
              interests: cachedProfile?.interests,
              realName: cachedProfile?.realName,
              distance: Math.round(dist),
              revealLevel,
            })

            // Request profile via Socket.io if not cached and not already requested
            if (!cachedProfile && !requestedProfilesRef.current.has(userId)) {
              requestedProfilesRef.current.add(userId)
              profileExchange.requestProfile(userId)
            }
          } else {
            allNearbyUsers.delete(userId)
          }
        }

        // Update store with all nearby users
        setNearbyUsers(Array.from(allNearbyUsers.values()))
      })

      listeners.push(() => off(locationRef))
    })

    return () => {
      listeners.forEach((cleanup) => cleanup())
    }
  }, [latitude, longitude, user, setNearbyUsers])

  useEffect(() => {
    const cleanup = findNearbyUsers()
    return cleanup
  }, [findNearbyUsers])

  return { nearbyUsers }
}
