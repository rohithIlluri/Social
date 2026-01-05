// Geohash implementation for efficient proximity queries
// Based on standard geohashing algorithm

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

export function encode(lat: number, lng: number, precision: number = 7): string {
  let idx = 0
  let bit = 0
  let evenBit = true
  let geohash = ''
  let latMin = -90, latMax = 90
  let lngMin = -180, lngMax = 180

  while (geohash.length < precision) {
    if (evenBit) {
      const lngMid = (lngMin + lngMax) / 2
      if (lng >= lngMid) {
        idx = idx * 2 + 1
        lngMin = lngMid
      } else {
        idx = idx * 2
        lngMax = lngMid
      }
    } else {
      const latMid = (latMin + latMax) / 2
      if (lat >= latMid) {
        idx = idx * 2 + 1
        latMin = latMid
      } else {
        idx = idx * 2
        latMax = latMid
      }
    }
    evenBit = !evenBit

    if (++bit === 5) {
      geohash += BASE32[idx]
      bit = 0
      idx = 0
    }
  }

  return geohash
}

export function decode(geohash: string): { lat: number; lng: number } {
  let evenBit = true
  let latMin = -90, latMax = 90
  let lngMin = -180, lngMax = 180

  for (const char of geohash) {
    const idx = BASE32.indexOf(char)
    for (let n = 4; n >= 0; n--) {
      const bitN = (idx >> n) & 1
      if (evenBit) {
        const lngMid = (lngMin + lngMax) / 2
        if (bitN === 1) {
          lngMin = lngMid
        } else {
          lngMax = lngMid
        }
      } else {
        const latMid = (latMin + latMax) / 2
        if (bitN === 1) {
          latMin = latMid
        } else {
          latMax = latMid
        }
      }
      evenBit = !evenBit
    }
  }

  return {
    lat: (latMin + latMax) / 2,
    lng: (lngMin + lngMax) / 2,
  }
}

// Get neighboring geohashes for proximity queries
export function neighbors(geohash: string): string[] {
  const { lat, lng } = decode(geohash)
  const precision = geohash.length

  // Calculate approximate cell size
  const latErr = 180 / Math.pow(2, Math.ceil(precision * 5 / 2))
  const lngErr = 360 / Math.pow(2, Math.floor(precision * 5 / 2))

  const result: string[] = [geohash]

  // 8 surrounding cells
  const offsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1], [1, 0], [1, 1],
  ]

  for (const [dLat, dLng] of offsets) {
    const newLat = lat + dLat * latErr * 2
    const newLng = lng + dLng * lngErr * 2
    if (newLat >= -90 && newLat <= 90 && newLng >= -180 && newLng <= 180) {
      result.push(encode(newLat, newLng, precision))
    }
  }

  return [...new Set(result)]
}

// Calculate distance between two points in meters (Haversine formula)
export function distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Get precision level for a given radius (in meters)
export function precisionForRadius(radius: number): number {
  // Approximate geohash precision for different radii
  if (radius <= 50) return 8      // ~19m
  if (radius <= 150) return 7     // ~76m
  if (radius <= 600) return 6     // ~610m
  if (radius <= 2500) return 5    // ~2.4km
  return 4                         // ~20km
}
