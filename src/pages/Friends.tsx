import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { Avatar } from '@/components/common/Avatar'
import { Skeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useUserStore } from '@/store/userStore'
import type { Friendship } from '@/types'

interface FriendData extends Friendship {
  friendNickname: string
  friendColor: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function Friends() {
  const { user } = useUserStore()
  const [friends, setFriends] = useState<FriendData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const friendshipsRef = collection(db, 'friendships')
    const q = query(
      friendshipsRef,
      where('users', 'array-contains', user.id),
      orderBy('totalInteractions', 'desc')
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const friendsData: FriendData[] = []

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data()
        const friendId = data.users.find((id: string) => id !== user.id)

        friendsData.push({
          id: docSnap.id,
          users: data.users,
          level: data.level || 0,
          totalInteractions: data.totalInteractions || 0,
          firstEncounter: data.firstEncounter?.toDate() || new Date(),
          isFavorite: data.isFavorite || false,
          friendNickname: `Friend_${friendId?.slice(0, 6)}`,
          friendColor: '#6366f1',
        })
      }

      setFriends(friendsData)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen safe-top">
        <div className="px-6 pt-12 pb-6">
          <Skeleton className="h-10 w-40 rounded-full mb-8" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-card" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen safe-top">
      <div className="px-6 pt-12 pb-6">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-title1 text-white mb-8"
        >
          Friends
        </motion.h1>

        {friends.length === 0 ? (
          <EmptyState
            icon={
              <div className="w-24 h-24 rounded-full bg-obsidian-800 flex items-center justify-center">
                <svg className="w-12 h-12 text-obsidian-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="7" r="3" />
                  <circle cx="17" cy="7" r="2.5" />
                  <path d="M3 19v-1.5C3 15.01 6.58 13 9 13s6 2.01 6 4.5V19" />
                  <path d="M15 13.5c1.5 0 5 1 5 3.5v2" />
                </svg>
              </div>
            }
            title="No friends yet"
            description="Go explore and connect with people nearby"
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-4"
          >
            {friends.map((friend) => (
              <motion.button
                key={friend.id}
                variants={itemVariants}
                className="card-interactive p-6 flex flex-col items-center text-center"
              >
                {/* Avatar */}
                <div className="relative mb-4">
                  <Avatar
                    nickname={friend.friendNickname}
                    color={friend.friendColor}
                    size="xl"
                    isSilhouette={friend.level < 1}
                  />
                  {friend.isFavorite && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-sunrise-400 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-body-bold text-white truncate w-full mb-1">
                  {friend.friendNickname}
                </h3>

                {/* Stats */}
                <p className="text-footnote text-obsidian-400">
                  {friend.totalInteractions} {friend.totalInteractions === 1 ? 'interaction' : 'interactions'}
                </p>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
