/**
 * Ephemeral Chat Service
 *
 * Messages exist only while both users are nearby.
 * Chat is tied to encounter - disappears when encounter ends.
 */

import {
  ref,
  push,
  set,
  onValue,
  off,
  serverTimestamp,
} from 'firebase/database'
import { realtimeDb } from './firebase'
import type { Message } from '@/types'

/**
 * Send a message in an encounter chat
 * Returns the message ID
 */
export async function sendMessage(
  encounterId: string,
  senderId: string,
  text: string
): Promise<string> {
  const messagesRef = ref(realtimeDb, `chats/${encounterId}/messages`)
  const newMessageRef = push(messagesRef)

  await set(newMessageRef, {
    sender: senderId,
    text: text.trim(),
    timestamp: serverTimestamp(),
  })

  return newMessageRef.key!
}

/**
 * Subscribe to chat messages for an encounter
 * Returns unsubscribe function
 */
export function subscribeToMessages(
  encounterId: string,
  callback: (messages: Message[]) => void,
  limit: number = 100
): () => void {
  const messagesRef = ref(realtimeDb, `chats/${encounterId}/messages`)

  onValue(messagesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([])
      return
    }

    const messagesData = snapshot.val() as Record<
      string,
      {
        sender: string
        text: string
        timestamp: number
      }
    >

    const messages: Message[] = Object.entries(messagesData)
      .map(([id, data]) => ({
        id,
        sender: data.sender,
        text: data.text,
        timestamp: new Date(data.timestamp),
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-limit)

    callback(messages)
  })

  return () => off(messagesRef)
}

/**
 * Mark chat as active (for presence tracking)
 */
export async function markChatActive(
  encounterId: string,
  active: boolean
): Promise<void> {
  const chatRef = ref(realtimeDb, `chats/${encounterId}/active`)
  await set(chatRef, active)
}
