/**
 * Interaction Service - Ephemeral via RTDB
 *
 * Simplified service that uses ephemeral encounters.
 * No persistent storage - all data disappears when users disconnect.
 */

import {
  joinEncounter,
  recordInteraction,
  getRevealLevel as getEphemeralRevealLevel,
  subscribeToEncounter,
  getEncounterId,
} from './ephemeralEncounters'
import type { NearbyUser } from '@/types'

/**
 * Send a quick reaction (wave, high-five, etc.)
 * Creates or joins an encounter and records the interaction.
 */
export async function sendReaction(
  currentUserId: string,
  targetUser: NearbyUser,
  _emoji: string,
  _label: string,
  location: { lat: number; lng: number }
): Promise<{ encounterId: string }> {
  const encounterId = await joinEncounter(currentUserId, targetUser.id, location)
  await recordInteraction(encounterId)
  return { encounterId }
}

/**
 * Get reveal level between two users
 * Based on interaction count in their current ephemeral encounter.
 * Returns 0 if no encounter exists.
 */
export async function getRevealLevel(
  userId1: string,
  userId2: string
): Promise<number> {
  return getEphemeralRevealLevel(userId1, userId2)
}

/**
 * Get or create encounter between two users
 * Wrapper for ephemeral encounter creation.
 */
export async function getOrCreateEncounter(
  userId1: string,
  userId2: string,
  location: { lat: number; lng: number }
): Promise<string> {
  return joinEncounter(userId1, userId2, location)
}

/**
 * Subscribe to encounter updates
 * Returns unsubscribe function.
 */
export function subscribeToInteractions(
  encounterId: string,
  callback: (encounter: {
    users: string[]
    location: { lat: number; lng: number }
    startedAt: number
    active: boolean
    interactionCount: number
  } | null) => void
): () => void {
  return subscribeToEncounter(encounterId, callback)
}

// Re-export utility
export { getEncounterId }
