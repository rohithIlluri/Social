/**
 * Friends Page - Privacy-First Architecture
 *
 * In the ephemeral architecture, there are no persistent friendships.
 * This page shows active encounters instead.
 */

import { motion } from 'framer-motion'
import { EmptyState } from '@/components/common/EmptyState'

export function Friends() {
  return (
    <div className="min-h-screen safe-top">
      <div className="px-6 pt-12 pb-6">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-title1 text-white mb-8"
        >
          Connections
        </motion.h1>

        <EmptyState
          icon={
            <div className="w-24 h-24 rounded-full bg-obsidian-800 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-radar-blip"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
          }
          title="Privacy First"
          description="Connections are ephemeral. When you leave, your encounters disappear. Go explore and meet people nearby in real-time!"
        />

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-6 rounded-card bg-obsidian-900/50 border border-obsidian-700"
        >
          <h3 className="text-body-bold text-white mb-2">How it works</h3>
          <ul className="space-y-3 text-footnote text-obsidian-400">
            <li className="flex items-start gap-3">
              <span className="text-radar-blip">1.</span>
              <span>Open the radar to see people nearby</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-radar-blip">2.</span>
              <span>Wave or react to start an encounter</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-radar-blip">3.</span>
              <span>Chat while you're both nearby</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-radar-blip">4.</span>
              <span>When you leave, the encounter ends</span>
            </li>
          </ul>
          <p className="mt-4 text-caption1 text-obsidian-500">
            No data is stored. Your privacy is protected.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
