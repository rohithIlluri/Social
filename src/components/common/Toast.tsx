import { motion, AnimatePresence } from 'framer-motion'

interface ToastItem {
  id: string
  message: string
  type: 'default' | 'success' | 'error'
}

interface ToastProps {
  toasts: ToastItem[]
  onRemove: (id: string) => void
}

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none safe-top pt-4">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
            className="pointer-events-auto mb-2"
            onClick={() => onRemove(toast.id)}
          >
            <div
              className={`
                px-5 py-3 rounded-full
                text-callout font-medium
                backdrop-blur-glass
                cursor-pointer
                transition-transform duration-quick ease-smooth
                active:scale-95
                ${toast.type === 'error'
                  ? 'bg-error/90 text-white'
                  : toast.type === 'success'
                  ? 'bg-obsidian-800/90 text-success border border-success/20'
                  : 'bg-obsidian-800/90 text-white border border-white/10'
                }
              `}
              style={{
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
              }}
            >
              {toast.message}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
