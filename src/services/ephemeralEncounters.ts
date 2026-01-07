/**
 * Ephemeral Encounter Service
 *
 * Handles creating/managing encounters in RTDB with automatic cleanup.
 * All data is ephemeral - disappears when users disconnect.
 */

import {
  ref,
  set,
  get,
  onValue,
  off,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database'
import { realtimeDb } from './firebase'

/**
 * Generate consistent encounter ID from two user IDs
 * Always sorted alphabetically to ensure same ID regardless of order
 */
export function getEncounterId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_')
}

/**
 * Create or join an encounter between two users
 * Sets up onDisconnect handler to mark participant as disconnected
 */
export async function joinEncounter(
  currentUserId: string,
  otherUserId: string,
  location: { lat: number; lng: number }
): Promise<string> {
  const encounterId = getEncounterId(currentUserId, otherUserId)
  const encounterRef = ref(realtimeDb, `encounters/${encounterId}`)

  // Check if encounter already exists
  const snapshot = await get(encounterRef)

  if (!snapshot.exists()) {
    // Create new encounter
    await set(encounterRef, {
      users: [currentUserId, otherUserId].sort(),
      location,
      startedAt: serverTimestamp(),
      active: true,
      interactionCount: 0,
    })
  }

  // Join as participant with disconnect handler
  const participantRef = ref(
    realtimeDb,
    `encounters/${encounterId}/participants/${currentUserId}`
  )
  await set(participantRef, { connected: true })

  // Auto-disconnect when user leaves
  onDisconnect(participantRef).set({ connected: false })

  return encounterId
}

/**
 * Leave an encounter (marks participant as disconnected)
 */
export async function leaveEncounter(
  encounterId: string,
  userId: string
): Promise<void> {
  const participantRef = ref(
    realtimeDb,
    `encounters/${encounterId}/participants/${userId}`
  )
  await set(participantRef, { connected: false })
}

/**
 * Record an interaction in the encounter
 * Increments the interaction count (used for reveal level calculation)
 */
export async function recordInteraction(encounterId: string): Promise<void> {
  const countRef = ref(realtimeDb, `encounters/${encounterId}/interactionCount`)
  const snapshot = await get(countRef)
  const currentCount = snapshot.exists() ? snapshot.val() : 0
  await set(countRef, currentCount + 1)
}

/**
 * Get reveal level between two users
 * Based on interaction count in their current encounter
 * Returns 0 if no encounter exists
 */
export async function getRevealLevel(
  userId1: string,
  userId2: string
): Promise<number> {
  const encounterId = getEncounterId(userId1, userId2)
  const countRef = ref(realtimeDb, `encounters/${encounterId}/interactionCount`)
  const snapshot = await get(countRef)
  return snapshot.exists() ? snapshot.val() : 0
}

/**
 * Subscribe to encounter updates
 * Returns unsubscribe function
 */
export function subscribeToEncounter(
  encounterId: string,
  callback: (
    encounter: {
      users: string[]
      location: { lat: number; lng: number }
      startedAt: number
      active: boolean
      interactionCount: number
    } | null
  ) => void
): () => void {
  const encounterRef = ref(realtimeDb, `encounters/${encounterId}`)

  onValue(encounterRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null)
  })

  return () => off(encounterRef)
}

/**
 * Check if encounter exists between two users
 */
export async function encounterExists(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const encounterId = getEncounterId(userId1, userId2)
  const encounterRef = ref(realtimeDb, `encounters/${encounterId}`)
  const snapshot = await get(encounterRef)
  return snapshot.exists()
}
