import { useEffect, useCallback } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { realtimeDb } from '@/services/firebase'
import { useUserStore } from '@/store/userStore'
import { useEncounterStore } from '@/store/encounterStore'
import { encode, neighbors, distance } from '@/utils/geohash'
import { getRevealLevel } from '@/services/interactions'
import type { NearbyUser } from '@/types'

interface LocationData {
  lat: number
  lng: number
  timestamp: number
  active: boolean
  nickname: string
  avatarColor: string
  radius: number
}

export function useEncounters(latitude: number | null, longitude: number | null) {
  const { user } = useUserStore()
  const { setNearbyUsers, nearbyUsers } = useEncounterStore()

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
            // Fetch reveal level from relationship history
            let revealLevel = 0
            try {
              revealLevel = await getRevealLevel(user.id, userId)
            } catch {
              // Keep default if fetch fails
            }

            allNearbyUsers.set(userId, {
              id: userId,
              nickname: locationData.nickname,
              avatarColor: locationData.avatarColor,
              distance: Math.round(dist),
              revealLevel,
            })
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
