/**
 * Interaction Service
 *
 * Handles sending/receiving interactions between users
 * and managing encounter state.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
  increment,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Interaction, InteractionType, NearbyUser } from '@/types'

// Get or create encounter between two users
export async function getOrCreateEncounter(
  userId1: string,
  userId2: string,
  location: { lat: number; lng: number }
): Promise<string> {
  // Sort IDs to ensure consistent encounter lookup
  const [user1, user2] = [userId1, userId2].sort()
  const encounterId = `${user1}_${user2}`

  const encounterRef = doc(db, 'encounters', encounterId)
  const encounterSnap = await getDoc(encounterRef)

  if (encounterSnap.exists()) {
    // Update last activity
    await updateDoc(encounterRef, {
      lastActiveAt: serverTimestamp(),
      status: 'active',
    })
    return encounterId
  }

  // Create new encounter
  await setDoc(encounterRef, {
    id: encounterId,
    users: [user1, user2],
    location,
    startedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
    interactionCount: 0,
    status: 'active',
  })

  return encounterId
}

// Send an interaction
export async function sendInteraction(
  encounterId: string,
  fromUserId: string,
  toUserId: string,
  type: InteractionType,
  data: Interaction['data']
): Promise<string> {
  // Add interaction document
  const interactionRef = await addDoc(collection(db, 'interactions'), {
    encounterId,
    fromUser: fromUserId,
    toUser: toUserId,
    type,
    data,
    timestamp: serverTimestamp(),
  })

  // Increment encounter interaction count
  const encounterRef = doc(db, 'encounters', encounterId)
  await updateDoc(encounterRef, {
    interactionCount: increment(1),
    lastActiveAt: serverTimestamp(),
  })

  // Update reveal level for the recipient
  await updateRevealLevel(fromUserId, toUserId)

  return interactionRef.id
}

// Update reveal level between two users
async function updateRevealLevel(fromUserId: string, toUserId: string): Promise<void> {
  // Sort IDs for consistent document ID
  const [user1, user2] = [fromUserId, toUserId].sort()
  const relationshipId = `${user1}_${user2}`

  const relationshipRef = doc(db, 'relationships', relationshipId)
  const relationshipSnap = await getDoc(relationshipRef)

  if (relationshipSnap.exists()) {
    await updateDoc(relationshipRef, {
      interactionCount: increment(1),
      lastInteraction: serverTimestamp(),
    })
  } else {
    await setDoc(relationshipRef, {
      users: [user1, user2],
      interactionCount: 1,
      firstInteraction: serverTimestamp(),
      lastInteraction: serverTimestamp(),
    })
  }
}

// Get reveal level for a user relationship
export async function getRevealLevel(userId1: string, userId2: string): Promise<number> {
  const [user1, user2] = [userId1, userId2].sort()
  const relationshipId = `${user1}_${user2}`

  const relationshipRef = doc(db, 'relationships', relationshipId)
  const relationshipSnap = await getDoc(relationshipRef)

  if (!relationshipSnap.exists()) {
    return 0
  }

  return relationshipSnap.data().interactionCount || 0
}

// Subscribe to interactions for an encounter
export function subscribeToInteractions(
  encounterId: string,
  callback: (interactions: Interaction[]) => void
): () => void {
  const q = query(
    collection(db, 'interactions'),
    where('encounterId', '==', encounterId),
    orderBy('timestamp', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const interactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as Interaction[]

    callback(interactions)
  })
}

// Send a quick reaction (wave, high-five, etc.)
export async function sendReaction(
  currentUserId: string,
  targetUser: NearbyUser,
  emoji: string,
  label: string,
  location: { lat: number; lng: number }
): Promise<{ encounterId: string; interactionId: string }> {
  const encounterId = await getOrCreateEncounter(currentUserId, targetUser.id, location)

  const interactionId = await sendInteraction(encounterId, currentUserId, targetUser.id, 'reaction', {
    emoji,
    label,
  })

  return { encounterId, interactionId }
}

// Get recent interactions for the current user
export async function getRecentInteractions(userId: string, limit = 20): Promise<Interaction[]> {
  const q = query(
    collection(db, 'interactions'),
    where('toUser', '==', userId),
    orderBy('timestamp', 'desc')
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.slice(0, limit).map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  })) as Interaction[]
}
