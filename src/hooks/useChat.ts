/**
 * useChat Hook - Ephemeral Chat via RTDB
 *
 * Messages exist only while both users are in the encounter.
 * Chat disappears when encounter ends.
 */

import { useState, useEffect, useCallback } from 'react'
import { useUserStore } from '@/store/userStore'
import {
  subscribeToMessages,
  sendMessage as sendChatMessage,
} from '@/services/ephemeralChat'
import type { Message } from '@/types'

/**
 * Hook for managing ephemeral chat in an encounter
 */
export function useChat(encounterId: string | null) {
  const { user } = useUserStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Subscribe to messages
  useEffect(() => {
    if (!encounterId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const unsubscribe = subscribeToMessages(encounterId, (newMessages) => {
      setMessages(newMessages)
      setIsLoading(false)
    })

    return unsubscribe
  }, [encounterId])

  // Send a message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!encounterId || !user || !text.trim()) return
      await sendChatMessage(encounterId, user.id, text)
    },
    [encounterId, user]
  )

  return {
    messages,
    isLoading,
    sendMessage,
  }
}

// Note: useChats removed - no persistent chat list in ephemeral architecture
// Chats only exist within active encounters
