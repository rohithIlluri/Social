import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapIcon, PeopleIcon, PersonIcon } from '@/components/icons/NavIcons'

const navItems = [
  { to: '/', icon: MapIcon, label: 'Explore' },
  { to: '/friends', icon: PeopleIcon, label: 'Friends' },
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
                  <Icon
                    filled={isActive}
                    className={`w-6 h-6 transition-colors duration-quick ${
                      isActive ? 'text-sunrise-400' : 'text-obsidian-500'
                    }`}
                  />
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
