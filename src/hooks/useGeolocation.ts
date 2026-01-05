import { useState, useEffect, useCallback } from 'react'
import { ref, set, onDisconnect, serverTimestamp } from 'firebase/database'
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

export function useGeolocation() {
  const { user } = useUserStore()
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isTracking: false,
  })

  const updateFirebaseLocation = useCallback(
    async (lat: number, lng: number) => {
      if (!user) return

      const geohash = encode(lat, lng, 6) // ~610m precision
      const locationRef = ref(realtimeDb, `locations/${geohash}/${user.id}`)

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

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
      }))
      return
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

    return () => {
      navigator.geolocation.clearWatch(watchId)
      setState((prev) => ({ ...prev, isTracking: false }))
    }
  }, [updateFirebaseLocation])

  const stopTracking = useCallback(async () => {
    if (!user || !state.latitude || !state.longitude) return

    const geohash = encode(state.latitude, state.longitude, 6)
    const locationRef = ref(realtimeDb, `locations/${geohash}/${user.id}`)

    try {
      await set(locationRef, null)
    } catch (error) {
      console.error('Failed to clear location:', error)
    }

    setState((prev) => ({ ...prev, isTracking: false }))
  }, [user, state.latitude, state.longitude])

  // Handle page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state.isTracking) {
        stopTracking()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [state.isTracking, stopTracking])

  return {
    ...state,
    startTracking,
    stopTracking,
  }
}
