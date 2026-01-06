import { useState, useEffect, useCallback, useRef } from 'react'
import { ref, set, remove, onDisconnect, serverTimestamp } from 'firebase/database'
import { realtimeDb } from '@/services/firebase'
import { useUserStore } from '@/store/userStore'
import { encode } from '@/utils/geohash'
import { LOCATION_UPDATE_INTERVAL } from '@/utils/constants'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  isTracking: boolean
}

interface UseGeolocationOptions {
  autoStart?: boolean
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { autoStart = false } = options
  const { user } = useUserStore()

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isTracking: false,
  })

  // Store watchId in ref for proper cleanup
  const watchIdRef = useRef<number | null>(null)
  const lastGeohashRef = useRef<string | null>(null)

  // Cleanup Firebase location
  const cleanupFirebaseLocation = useCallback(async () => {
    if (!user || !lastGeohashRef.current) return

    const locationRef = ref(realtimeDb, `locations/${lastGeohashRef.current}/${user.id}`)
    try {
      await remove(locationRef)
    } catch (error) {
      console.error('Failed to clear location:', error)
    }
    lastGeohashRef.current = null
  }, [user])

  // Update Firebase location
  const updateFirebaseLocation = useCallback(
    async (lat: number, lng: number) => {
      if (!user) return

      const geohash = encode(lat, lng, 6) // ~610m precision

      // If geohash changed, remove from old location first
      if (lastGeohashRef.current && lastGeohashRef.current !== geohash) {
        const oldLocationRef = ref(realtimeDb, `locations/${lastGeohashRef.current}/${user.id}`)
        try {
          await remove(oldLocationRef)
        } catch {
          // Ignore cleanup errors
        }
      }

      const locationRef = ref(realtimeDb, `locations/${geohash}/${user.id}`)
      lastGeohashRef.current = geohash

      try {
        await set(locationRef, {
          lat,
          lng,
          timestamp: serverTimestamp(),
          active: true,
          nickname: user.nickname,
          avatarColor: user.avatarColor,
          radius: user.discoveryRadius,
        })

        // Set up disconnect handler to mark as inactive
        onDisconnect(locationRef).update({ active: false })
      } catch (error) {
        console.error('Failed to update location:', error)
      }
    },
    [user]
  )

  // Start tracking - returns cleanup function
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
      }))
      return () => {}
    }

    // Don't start if already tracking
    if (watchIdRef.current !== null) {
      return () => {}
    }

    setState((prev) => ({ ...prev, isTracking: true, error: null }))

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setState({
          latitude,
          longitude,
          accuracy,
          error: null,
          isTracking: true,
        })
        updateFirebaseLocation(latitude, longitude)
      },
      (error) => {
        let errorMessage = 'Unknown error'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isTracking: false,
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: LOCATION_UPDATE_INTERVAL,
      }
    )

    watchIdRef.current = watchId

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      setState((prev) => ({ ...prev, isTracking: false }))
    }
  }, [updateFirebaseLocation])

  // Stop tracking
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    await cleanupFirebaseLocation()
    setState((prev) => ({ ...prev, isTracking: false }))
  }, [cleanupFirebaseLocation])

  // Auto-start effect with proper cleanup
  useEffect(() => {
    if (!autoStart || !user) return

    const cleanup = startTracking()

    return () => {
      cleanup()
      // Also clean up Firebase on unmount
      if (lastGeohashRef.current && user) {
        const locationRef = ref(realtimeDb, `locations/${lastGeohashRef.current}/${user.id}`)
        remove(locationRef).catch(() => {
          // Ignore cleanup errors on unmount
        })
      }
    }
  }, [autoStart, user, startTracking])

  // Handle page visibility - pause tracking when hidden
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && watchIdRef.current !== null) {
        await stopTracking()
      } else if (!document.hidden && autoStart && user && watchIdRef.current === null) {
        // Resume tracking when page becomes visible again
        startTracking()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [autoStart, user, startTracking, stopTracking])

  return {
    ...state,
    startTracking,
    stopTracking,
  }
}
