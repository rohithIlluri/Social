import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapIcon, PeopleIcon, PersonIcon, RankIcon } from '@/components/icons/NavIcons'
import { useRankStore } from '@/store/rankStore'

function RankNavItem({ to }: { to: string }) {
  const location = useLocation()
  const { newGemCount } = useRankStore()
  const isActive = location.pathname === to

  return (
    <NavLink
      to={to}
      className="relative flex flex-col items-center justify-center w-20 h-full touch-target no-select"
    >
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute inset-x-3 inset-y-2 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(123,97,255,0.15), rgba(255,107,157,0.1))' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <motion.div
        animate={{ scale: isActive ? 1 : 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative z-10"
      >
        <RankIcon
          filled={isActive}
          className="w-6 h-6 transition-colors duration-quick"
          style={isActive ? {
            color: '#7B61FF',
          } : { color: '#71717a' }}
        />
        {newGemCount > 0 && !isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7B61FF, #FF6B9D)' }}
          >
            <span className="text-white font-bold" style={{ fontSize: '8px' }}>
              {newGemCount > 9 ? '9+' : newGemCount}
            </span>
          </motion.div>
        )}
      </motion.div>
      <motion.span
        initial={false}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 4, scale: isActive ? 1 : 0.8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="text-caption mt-1 relative z-10 font-semibold"
        style={isActive ? {
          background: 'linear-gradient(90deg, #7B61FF, #FF6B9D)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        } : { color: '#71717a' }}
      >
        Rank
      </motion.span>
    </NavLink>
  )
}

const navItems = [
  { to: '/', icon: MapIcon, label: 'Explore' },
  { to: '/friends', icon: PeopleIcon, label: 'Friends' },
  { to: '/rank', icon: null, label: 'Rank' },
  { to: '/profile', icon: PersonIcon, label: 'Profile' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      {/* Glass background */}
      <div className="glass border-t border-white/5">
        <div className="flex justify-around items-center h-[72px] safe-bottom max-w-md mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            // Rank tab has its own special component with gradient badge
            if (to === '/rank') {
              return <RankNavItem key={to} to={to} />
            }

            const isActive = location.pathname === to

            return (
              <NavLink
                key={to}
                to={to}
                className="relative flex flex-col items-center justify-center w-20 h-full touch-target no-select"
              >
                {/* Active indicator background */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-x-3 inset-y-2 rounded-2xl bg-sunrise-400/10"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  animate={{
                    scale: isActive ? 1 : 0.9,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  }}
                  className="relative z-10"
                >
                  {Icon && (
                    <Icon
                      filled={isActive}
                      className={`w-6 h-6 transition-colors duration-quick ${
                        isActive ? 'text-sunrise-400' : 'text-obsidian-500'
                      }`}
                    />
                  )}
                </motion.div>

                {/* Label - only show for active */}
                <motion.span
                  initial={false}
                  animate={{
                    opacity: isActive ? 1 : 0,
                    y: isActive ? 0 : 4,
                    scale: isActive ? 1 : 0.8,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  }}
                  className={`text-caption mt-1 relative z-10 ${
                    isActive ? 'text-sunrise-400' : 'text-obsidian-500'
                  }`}
                >
                  {label}
                </motion.span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
