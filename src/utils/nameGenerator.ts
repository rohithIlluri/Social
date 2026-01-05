const adjectives = [
  'Cosmic', 'Swift', 'Mystic', 'Neon', 'Shadow', 'Crystal', 'Thunder', 'Lunar',
  'Solar', 'Arctic', 'Blazing', 'Silent', 'Golden', 'Silver', 'Crimson', 'Azure',
  'Emerald', 'Phantom', 'Stellar', 'Nova', 'Zen', 'Pixel', 'Cyber', 'Glitch',
  'Turbo', 'Hyper', 'Ultra', 'Mega', 'Epic', 'Lucky', 'Wild', 'Chill'
]

const nouns = [
  'Panda', 'Fox', 'Wolf', 'Hawk', 'Tiger', 'Dragon', 'Phoenix', 'Raven',
  'Falcon', 'Owl', 'Bear', 'Lion', 'Shark', 'Eagle', 'Panther', 'Cobra',
  'Viper', 'Storm', 'Flame', 'Frost', 'Wave', 'Spark', 'Blaze', 'Thunder',
  'Shadow', 'Spirit', 'Knight', 'Ninja', 'Ranger', 'Scout', 'Pilot', 'Hero'
]

const colors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
]

export function generateNickname(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 100)
  return `${adjective}${noun}_${number}`
}

export function generateAvatarColor(): string {
  return colors[Math.floor(Math.random() * colors.length)]
}

export function getInitials(nickname: string): string {
  const parts = nickname.split(/(?=[A-Z])|_/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return nickname.slice(0, 2).toUpperCase()
}
