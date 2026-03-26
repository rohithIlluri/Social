// Mock Instagram data service — simulates OAuth + network graph
import type {
  InstagramProfile,
  Poll,
  PollQuestion,
  RankEntry,
  Gem,
  PollCategory,
  GemRarity,
} from '@/types/rank'

// ─── Gradient palettes for poll cards ─────────────────────────────────────────
export const POLL_GRADIENTS: [string, string][] = [
  ['#FF6B9D', '#FF8C42'],  // candy-tangerine
  ['#7B61FF', '#FF6B9D'],  // violet-candy
  ['#3BCEAC', '#00C2E0'],  // mint-sky
  ['#FFD23F', '#FF8C42'],  // lemon-tangerine
  ['#A78BFA', '#FB7185'],  // grape-rose
  ['#F472B6', '#818CF8'],  // pink-indigo
  ['#34D399', '#06B6D4'],  // emerald-cyan
  ['#FB923C', '#F43F5E'],  // orange-rose
]

export const PROFILE_GRADIENTS: [string, string][] = [
  ['#FF6B9D', '#FF8C42'],
  ['#7B61FF', '#A78BFA'],
  ['#3BCEAC', '#34D399'],
  ['#FFD23F', '#FB923C'],
  ['#00C2E0', '#818CF8'],
  ['#F472B6', '#FB7185'],
  ['#06B6D4', '#3BCEAC'],
  ['#FB923C', '#FFD23F'],
  ['#818CF8', '#7B61FF'],
  ['#34D399', '#00C2E0'],
]

// ─── Poll questions — tbh style ────────────────────────────────────────────────
export const POLL_QUESTIONS: PollQuestion[] = [
  {
    id: 'q1',
    text: 'Who would go viral on Instagram first?',
    emoji: '🚀',
    category: 'viral',
    gradient: ['#FF6B9D', '#FF8C42'],
  },
  {
    id: 'q2',
    text: 'Who has the most aesthetic feed?',
    emoji: '✨',
    category: 'aesthetic',
    gradient: ['#7B61FF', '#FF6B9D'],
  },
  {
    id: 'q3',
    text: 'Who would make everyone laugh at a party?',
    emoji: '😂',
    category: 'funny',
    gradient: ['#FFD23F', '#FF8C42'],
  },
  {
    id: 'q4',
    text: 'Who sets the trends everyone copies?',
    emoji: '💫',
    category: 'trendsetter',
    gradient: ['#A78BFA', '#FB7185'],
  },
  {
    id: 'q5',
    text: 'Who creates the most inspiring content?',
    emoji: '🌟',
    category: 'inspiring',
    gradient: ['#3BCEAC', '#00C2E0'],
  },
  {
    id: 'q6',
    text: 'Who would be up for any wild adventure?',
    emoji: '🏔️',
    category: 'adventurous',
    gradient: ['#34D399', '#06B6D4'],
  },
  {
    id: 'q7',
    text: 'Who has the most creative ideas?',
    emoji: '🎨',
    category: 'creative',
    gradient: ['#F472B6', '#818CF8'],
  },
  {
    id: 'q8',
    text: 'Who lights up every room they walk into?',
    emoji: '💡',
    category: 'social',
    gradient: ['#FB923C', '#F43F5E'],
  },
  {
    id: 'q9',
    text: 'Who would hit 10k followers fastest?',
    emoji: '📈',
    category: 'viral',
    gradient: ['#FF6B9D', '#7B61FF'],
  },
  {
    id: 'q10',
    text: 'Who posts the most fire photos?',
    emoji: '🔥',
    category: 'aesthetic',
    gradient: ['#FB923C', '#FFD23F'],
  },
  {
    id: 'q11',
    text: "Who's the best hype person?",
    emoji: '📣',
    category: 'social',
    gradient: ['#818CF8', '#7B61FF'],
  },
  {
    id: 'q12',
    text: 'Who would collab with a major brand?',
    emoji: '🤝',
    category: 'trendsetter',
    gradient: ['#3BCEAC', '#34D399'],
  },
]

// ─── Mock network profiles ─────────────────────────────────────────────────────
const MOCK_PROFILES: InstagramProfile[] = [
  {
    id: 'u1',
    username: 'maya.creates',
    displayName: 'Maya Chen',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=maya&backgroundColor=b6e3f4',
    followerCount: 4200,
    followingCount: 312,
    postCount: 187,
    bio: 'creative director & coffee addict ☕',
    isVerified: false,
  },
  {
    id: 'u2',
    username: 'alex.vibes',
    displayName: 'Alex Kim',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=alex&backgroundColor=ffd5dc',
    followerCount: 8900,
    followingCount: 445,
    postCount: 342,
    bio: 'travel + lifestyle | NYC 🗽',
    isVerified: true,
  },
  {
    id: 'u3',
    username: 'jordannova',
    displayName: 'Jordan Nova',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=jordan&backgroundColor=d1f4cc',
    followerCount: 2100,
    followingCount: 891,
    postCount: 76,
    bio: 'photographer | chasing light 📸',
    isVerified: false,
  },
  {
    id: 'u4',
    username: 'sam.aesthetic',
    displayName: 'Sam Rivera',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=sam&backgroundColor=c0aede',
    followerCount: 11400,
    followingCount: 203,
    postCount: 521,
    bio: 'minimalist | design lover 🎨',
    isVerified: true,
  },
  {
    id: 'u5',
    username: 'priya.moments',
    displayName: 'Priya Sharma',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=priya&backgroundColor=ffdfbf',
    followerCount: 3400,
    followingCount: 567,
    postCount: 209,
    bio: 'food | travel | good vibes ✨',
    isVerified: false,
  },
  {
    id: 'u6',
    username: 'kai.lens',
    displayName: 'Kai Thompson',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=kai&backgroundColor=b6e3f4',
    followerCount: 5600,
    followingCount: 334,
    postCount: 163,
    bio: 'streetwear & sneakers 👟',
    isVerified: false,
  },
  {
    id: 'u7',
    username: 'zara.wildcard',
    displayName: 'Zara Osei',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=zara&backgroundColor=ffd5dc',
    followerCount: 18200,
    followingCount: 712,
    postCount: 834,
    bio: 'comedian | content creator 😂',
    isVerified: true,
  },
  {
    id: 'u8',
    username: 'noah.builds',
    displayName: 'Noah Park',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=noah&backgroundColor=d1f4cc',
    followerCount: 1800,
    followingCount: 290,
    postCount: 44,
    bio: 'entrepreneur | building things 🛠️',
    isVerified: false,
  },
  {
    id: 'u9',
    username: 'luna.art',
    displayName: 'Luna Flores',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=luna&backgroundColor=c0aede',
    followerCount: 7300,
    followingCount: 401,
    postCount: 278,
    bio: 'digital artist | illustrator 🎭',
    isVerified: false,
  },
  {
    id: 'u10',
    username: 'marcus.fit',
    displayName: 'Marcus Bell',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=marcus&backgroundColor=ffdfbf',
    followerCount: 22100,
    followingCount: 156,
    postCount: 612,
    bio: 'fitness coach | mindset 💪',
    isVerified: true,
  },
  {
    id: 'u11',
    username: 'ivy.explores',
    displayName: 'Ivy Chen',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=ivy&backgroundColor=b6e3f4',
    followerCount: 6800,
    followingCount: 523,
    postCount: 391,
    bio: 'explorer | 40 countries & counting 🌍',
    isVerified: false,
  },
  {
    id: 'u12',
    username: 'ravi.clicks',
    displayName: 'Ravi Patel',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=ravi&backgroundColor=ffd5dc',
    followerCount: 3900,
    followingCount: 678,
    postCount: 156,
    bio: 'architecture | urban photography 🏙️',
    isVerified: false,
  },
]

// ─── Current user mock ─────────────────────────────────────────────────────────
export const MOCK_CURRENT_USER: InstagramProfile = {
  id: 'me',
  username: 'you.here',
  displayName: 'You',
  avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=current&backgroundColor=b6e3f4',
  followerCount: 1247,
  followingCount: 489,
  postCount: 93,
  bio: 'just vibing ✌️',
  isVerified: false,
}

// ─── Helper: shuffle array ─────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Generate polls ────────────────────────────────────────────────────────────
export function generatePolls(network: InstagramProfile[]): Poll[] {
  const shuffledQuestions = shuffle(POLL_QUESTIONS)
  return shuffledQuestions.map((question, i) => {
    const shuffledProfiles = shuffle(network).slice(0, 4)
    return {
      id: `poll-${i}-${question.id}`,
      question,
      options: shuffledProfiles.map((profile, pos) => ({
        profile,
        position: pos as 0 | 1 | 2 | 3,
      })) as Poll['options'],
    }
  })
}

// ─── Generate leaderboard ──────────────────────────────────────────────────────
export function generateLeaderboard(
  network: InstagramProfile[],
  myProfile: InstagramProfile
): RankEntry[] {
  const categories: PollCategory[] = [
    'viral', 'creative', 'funny', 'aesthetic',
    'inspiring', 'adventurous', 'social', 'trendsetter',
  ]

  const all = [myProfile, ...network]
  return all
    .map((profile, i) => {
      const gemCount = Math.floor(Math.random() * 180) + 10
      const topCategory = categories[Math.floor(Math.random() * categories.length)]
      const breakdown: Partial<Record<PollCategory, number>> = {}
      categories.forEach(c => {
        breakdown[c] = Math.floor(Math.random() * 40)
      })
      return {
        profile,
        rank: i + 1,
        gemCount,
        topCategory,
        categoryBreakdown: breakdown,
        weeklyChange: Math.floor(Math.random() * 7) - 3,
        gradient: PROFILE_GRADIENTS[i % PROFILE_GRADIENTS.length],
      }
    })
    .sort((a, b) => b.gemCount - a.gemCount)
    .map((entry, i) => ({ ...entry, rank: i + 1 }))
}

// ─── Gem rarity helper ─────────────────────────────────────────────────────────
function randomRarity(): GemRarity {
  const r = Math.random()
  if (r < 0.55) return 'common'
  if (r < 0.80) return 'rare'
  if (r < 0.95) return 'epic'
  return 'legendary'
}

// ─── Generate gems (received votes) ───────────────────────────────────────────
export function generateGems(): Gem[] {
  const questions = shuffle(POLL_QUESTIONS).slice(0, 8)
  return questions.map((q, i) => ({
    id: `gem-${i}`,
    questionText: q.text,
    questionEmoji: q.emoji,
    category: q.category,
    rarity: randomRarity(),
    receivedAt: new Date(Date.now() - i * 1000 * 60 * 60 * (Math.random() * 12 + 1)),
    gradient: q.gradient,
  }))
}

// ─── Simulate OAuth connect ────────────────────────────────────────────────────
export async function simulateInstagramOAuth(): Promise<InstagramProfile> {
  // Simulates a 1.5s OAuth flow
  await new Promise(resolve => setTimeout(resolve, 1500))
  return MOCK_CURRENT_USER
}

export function getNetworkProfiles(): InstagramProfile[] {
  return MOCK_PROFILES
}

// ─── Category display helpers ──────────────────────────────────────────────────
export const CATEGORY_LABELS: Record<PollCategory, string> = {
  viral: 'Most Viral',
  creative: 'Most Creative',
  funny: 'Funniest',
  aesthetic: 'Best Aesthetic',
  inspiring: 'Most Inspiring',
  adventurous: 'Most Adventurous',
  social: 'Most Social',
  trendsetter: 'Trendsetter',
}

export const CATEGORY_EMOJIS: Record<PollCategory, string> = {
  viral: '🚀',
  creative: '🎨',
  funny: '😂',
  aesthetic: '✨',
  inspiring: '🌟',
  adventurous: '🏔️',
  social: '💡',
  trendsetter: '💫',
}

export const GEM_RARITY_COLORS: Record<string, [string, string]> = {
  common: ['#3BCEAC', '#00C2E0'],
  rare: ['#7B61FF', '#A78BFA'],
  epic: ['#FF6B9D', '#7B61FF'],
  legendary: ['#FFD23F', '#FF8C42'],
}

export const GEM_RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}
