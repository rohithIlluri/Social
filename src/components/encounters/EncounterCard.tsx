import { Avatar } from '@/components/common/Avatar'
import type { NearbyUser } from '@/types'
import { REVEAL_LEVEL_COLOR } from '@/utils/constants'

interface EncounterCardProps {
  user: NearbyUser
  onInteract: () => void
}

export function EncounterCard({ user, onInteract }: EncounterCardProps) {
  const showColor = user.revealLevel >= REVEAL_LEVEL_COLOR

  return (
    <div className="card encounter-glow flex items-center gap-4">
      <Avatar
        nickname={user.nickname}
        color={user.avatarColor}
        size="lg"
        isSilhouette={!showColor}
      />

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{user.nickname}</h3>
        <p className="text-sm text-gray-400">{user.distance}m away</p>
        {user.interests && user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {user.interests.slice(0, 3).map((interest) => (
              <span
                key={interest}
                className="px-2 py-0.5 bg-gray-700 rounded-full text-xs"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onInteract}
        className="btn-primary py-2 px-4 text-sm"
      >
        Interact
      </button>
    </div>
  )
}
