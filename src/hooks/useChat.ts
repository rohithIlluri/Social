import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useUserStore } from '@/store/userStore'
import type { Message, Chat } from '@/types'

export function useChat(chatId: string | null) {
  const { user } = useUserStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Listen to messages
  useEffect(() => {
    if (!chatId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const messagesRef = collection(db, 'chats', chatId, 'messages')
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        newMessages.push({
          id: doc.id,
          sender: data.sender,
          text: data.text,
          timestamp: data.timestamp?.toDate() || new Date(),
        })
      })
      setMessages(newMessages)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [chatId])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!chatId || !user || !text.trim()) return

      const messagesRef = collection(db, 'chats', chatId, 'messages')

      await addDoc(messagesRef, {
        sender: user.id,
        text: text.trim(),
        timestamp: serverTimestamp(),
      })

      // Update chat's last message
      const chatRef = doc(db, 'chats', chatId)
      await updateDoc(chatRef, {
        lastMessage: text.trim(),
        lastMessageAt: serverTimestamp(),
      })
    },
    [chatId, user]
  )

  return {
    messages,
    isLoading,
    sendMessage,
  }
}

// Hook to get all chats for current user
export function useChats() {
  const { user } = useUserStore()
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setChats([])
      setIsLoading(false)
      return
    }

    const chatsRef = collection(db, 'chats')
    const q = query(chatsRef, orderBy('lastMessageAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userChats: Chat[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        // Only include chats where user is a participant
        if (data.participants?.includes(user.id)) {
          userChats.push({
            id: doc.id,
            participants: data.participants,
            lastMessage: data.lastMessage || '',
            lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
          })
        }
      })
      setChats(userChats)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { chats, isLoading }
}
