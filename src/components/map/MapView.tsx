import { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { DEFAULT_MAP_ZOOM } from '@/utils/constants'
import type { NearbyUser } from '@/types'

// No token needed for MapLibre with free tiles!

interface MapViewProps {
  latitude: number
  longitude: number
  radius: number
  nearbyUsers: NearbyUser[]
  onUserClick?: (user: NearbyUser) => void
}

export function MapView({
  latitude,
  longitude,
  radius,
  nearbyUsers,
  onUserClick,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [longitude, latitude],
        zoom: DEFAULT_MAP_ZOOM,
      })

      // Wait for map to fully load before adding layers
      map.current.on('load', () => {
        setIsMapLoaded(true)
      })

      // Disable scroll zoom for mobile
      map.current.scrollZoom.disable()
    } catch (error) {
      console.error('Map initialization error:', error)
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update center when location changes
  useEffect(() => {
    if (!map.current) return
    map.current.setCenter([longitude, latitude])
  }, [latitude, longitude])

  // Add/update user marker and radius circle
  useEffect(() => {
    if (!map.current || !isMapLoaded) return

    const mapInstance = map.current

    try {
      // Remove old layers/sources if they exist
      if (mapInstance.getLayer('radius-circle')) {
        mapInstance.removeLayer('radius-circle')
      }
      if (mapInstance.getSource('radius')) {
        mapInstance.removeSource('radius')
      }

      // Add radius circle
      mapInstance.addSource('radius', {
        type: 'geojson',
        data: createCircleGeoJSON(longitude, latitude, radius),
      })

      mapInstance.addLayer({
        id: 'radius-circle',
        type: 'fill',
        source: 'radius',
        paint: {
          'fill-color': '#0ea5e9',
          'fill-opacity': 0.15,
        },
      })

      // Add user location marker
      const userEl = document.createElement('div')
      userEl.className = 'w-4 h-4 bg-primary-500 rounded-full border-2 border-white shadow-lg'
      new maplibregl.Marker({ element: userEl }).setLngLat([longitude, latitude]).addTo(mapInstance)
    } catch (error) {
      console.error('Map layer error:', error)
    }

  }, [latitude, longitude, radius, isMapLoaded])

  // Update nearby user markers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add new markers for nearby users
    nearbyUsers.forEach((user) => {
      // We don't have exact coordinates for other users (privacy)
      // So we show them at a random offset within their distance
      const angle = Math.random() * 2 * Math.PI
      const offsetLat = (user.distance / 111000) * Math.cos(angle) * 0.8
      const offsetLng = (user.distance / (111000 * Math.cos(latitude * Math.PI / 180))) * Math.sin(angle) * 0.8

      const el = document.createElement('div')
      el.className = 'w-10 h-10 rounded-full bg-gray-600 border-2 border-catch-glow flex items-center justify-center cursor-pointer animate-pulse-glow'
      el.innerHTML = `<svg class="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`

      el.addEventListener('click', () => onUserClick?.(user))

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([longitude + offsetLng, latitude + offsetLat])
        .addTo(map.current!)

      markersRef.current.push(marker)
    })
  }, [nearbyUsers, latitude, longitude, onUserClick, isMapLoaded])

  return (
    <div ref={mapContainer} className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden" />
  )
}

// Helper to create a circle GeoJSON
function createCircleGeoJSON(lng: number, lat: number, radiusMeters: number) {
  const points = 64
  const coords: [number, number][] = []

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const dx = radiusMeters * Math.cos(angle)
    const dy = radiusMeters * Math.sin(angle)

    const dLat = dy / 111000
    const dLng = dx / (111000 * Math.cos(lat * Math.PI / 180))

    coords.push([lng + dLng, lat + dLat])
  }
  coords.push(coords[0]) // Close the circle

  return {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [coords],
    },
    properties: {},
  }
}
