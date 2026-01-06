import { motion } from 'framer-motion'

interface RadarOverlayProps {
  isScanning: boolean
  showGrid?: boolean
}

/**
 * RadarOverlay - ShareIt-style expanding pulse scanner
 *
 * Renders:
 * - Concentric static range rings (subtle green)
 * - Expanding pulse rings (when scanning) - ShareIt style
 * - Optional grid overlay
 * - Center point indicator (user location)
 */
export function RadarOverlay({ isScanning, showGrid = false }: RadarOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Vignette overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.5) 100%)',
        }}
      />

      {/* Optional grid overlay */}
      {showGrid && (
        <div className="absolute inset-0 radar-grid opacity-50" />
      )}

      {/* Static concentric range rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[25, 45, 65, 85].map((percent, i) => (
          <motion.div
            key={percent}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 - (i * 0.02) }}
            transition={{
              delay: 0.1 * i,
              duration: 0.6,
              ease: [0, 0, 0.2, 1],
            }}
            className="absolute rounded-full border border-radar-ring"
            style={{
              width: `${percent}%`,
              height: `${percent}%`,
            }}
          />
        ))}
      </div>

      {/* ShareIt-style expanding pulse scanner */}
      {isScanning && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Multiple staggered expanding rings for continuous effect */}
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="absolute rounded-full border-2 border-radar-blip"
              initial={{ scale: 0, opacity: 0.7 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: index * 1, // Stagger each ring by 1 second
                ease: 'easeOut',
              }}
              style={{
                width: '60px',
                height: '60px',
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
              }}
            />
          ))}
        </div>
      )}

      {/* Center point (user location) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Steady glow around center */}
        <div
          className="absolute -inset-3 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
          }}
        />

        {/* Main center dot */}
        <div className="relative w-4 h-4 rounded-full bg-radar-blip shadow-glow-radar">
          {/* Inner highlight */}
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
        </div>

        {/* Small breathing pulse */}
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="absolute inset-0 rounded-full bg-radar-blip"
        />
      </div>

      {/* Corner markers for tactical feel */}
      <div className="absolute top-4 left-4 w-8 h-8">
        <div className="absolute top-0 left-0 w-4 h-[1px] bg-radar-blip/30" />
        <div className="absolute top-0 left-0 w-[1px] h-4 bg-radar-blip/30" />
      </div>
      <div className="absolute top-4 right-4 w-8 h-8">
        <div className="absolute top-0 right-0 w-4 h-[1px] bg-radar-blip/30" />
        <div className="absolute top-0 right-0 w-[1px] h-4 bg-radar-blip/30" />
      </div>
      <div className="absolute bottom-4 left-4 w-8 h-8">
        <div className="absolute bottom-0 left-0 w-4 h-[1px] bg-radar-blip/30" />
        <div className="absolute bottom-0 left-0 w-[1px] h-4 bg-radar-blip/30" />
      </div>
      <div className="absolute bottom-4 right-4 w-8 h-8">
        <div className="absolute bottom-0 right-0 w-4 h-[1px] bg-radar-blip/30" />
        <div className="absolute bottom-0 right-0 w-[1px] h-4 bg-radar-blip/30" />
      </div>
    </div>
  )
}
