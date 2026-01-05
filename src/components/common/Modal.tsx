import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/utils/haptics';
import { backdropVariants, slideUpVariants } from '@/utils/animations';

// PanInfo type for drag events
interface PanInfo {
  offset: { x: number; y: number };
  velocity: { x: number; y: number };
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showHandle?: boolean; // Show drag handle indicator
  allowDismiss?: boolean; // Allow dismissing by backdrop/gesture
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  showHandle = true,
  allowDismiss = true,
}: ModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle drag end to determine if should close
  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);

    if (!allowDismiss) return;

    // Close if dragged down more than 100px or with sufficient velocity
    if (info.offset.y > 100 || info.velocity.y > 500) {
      haptics.light();
      onClose();
    }
  };

  const handleBackdropClick = () => {
    if (allowDismiss) {
      haptics.light();
      onClose();
    }
  };

  const handleCloseButton = () => {
    haptics.light();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop with gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90 backdrop-blur-md"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
          />

          {/* Modal content */}
          <motion.div
            ref={contentRef}
            className="relative w-full max-w-md sm:max-w-lg mx-4 mb-0 sm:mb-4 max-h-[90vh] flex flex-col"
            variants={slideUpVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag={allowDismiss ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={{ touchAction: 'none' }}
          >
            {/* Container with rounded corners and glass effect */}
            <div className="bg-slate-800 rounded-t-modal sm:rounded-modal shadow-large overflow-hidden flex flex-col">
              {/* Drag handle */}
              {showHandle && (
                <div className="pt-3 pb-2 flex justify-center no-select">
                  <div className="w-10 h-1 bg-slate-600 rounded-full" />
                </div>
              )}

              {/* Header with title and close button */}
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                  <h2 className="text-title3 font-semibold">{title}</h2>
                  {allowDismiss && (
                    <motion.button
                      onClick={handleCloseButton}
                      className="p-2 rounded-lg hover:bg-slate-700 transition-colors touch-target no-select"
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.1 }}
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  )}
                </div>
              )}

              {/* Content with custom scrollbar */}
              <div
                className={`
                  overflow-y-auto custom-scrollbar flex-1
                  ${title ? 'p-6' : 'p-6 pt-3'}
                `}
                style={{
                  // Prevent scroll during drag
                  overflowY: isDragging ? 'hidden' : 'auto',
                }}
              >
                {children}
              </div>

              {/* iOS safe area bottom padding */}
              <div className="safe-bottom" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Sheet Modal - A bottom sheet variant for mobile-first experiences
 */
interface SheetModalProps extends Omit<ModalProps, 'showHandle'> {
  snapPoints?: number[]; // Percentage heights the sheet can snap to
}

export function SheetModal({
  isOpen,
  onClose,
  children,
  title,
  allowDismiss = true,
  snapPoints = [40, 85], // Default: half screen and almost full
}: SheetModalProps) {
  const [currentSnap, setCurrentSnap] = useState(1); // Start at second snap point
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);

    if (!allowDismiss) return;

    const threshold = window.innerHeight * 0.3;

    // If dragged down significantly, close
    if (info.offset.y > threshold || info.velocity.y > 500) {
      haptics.light();
      onClose();
    } else if (snapPoints.length > 1) {
      // Otherwise snap to nearest point
      const velocityFactor = info.velocity.y > 0 ? -1 : 1;
      const targetSnap = Math.max(
        0,
        Math.min(snapPoints.length - 1, currentSnap + velocityFactor)
      );
      setCurrentSnap(targetSnap);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={allowDismiss ? onClose : undefined}
          />

          {/* Sheet content */}
          <motion.div
            className="relative w-full bg-slate-800 rounded-t-modal shadow-large"
            style={{
              height: `${snapPoints[currentSnap]}vh`,
              maxHeight: '90vh',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle */}
            <div className="pt-3 pb-2 flex justify-center no-select">
              <div className="w-10 h-1 bg-slate-600 rounded-full" />
            </div>

            {/* Title if provided */}
            {title && (
              <div className="px-6 pb-4">
                <h2 className="text-title2 font-semibold text-center">{title}</h2>
              </div>
            )}

            {/* Content */}
            <div
              className="px-6 pb-6 overflow-y-auto custom-scrollbar"
              style={{
                height: title ? 'calc(100% - 80px)' : 'calc(100% - 40px)',
                overflowY: isDragging ? 'hidden' : 'auto',
              }}
            >
              {children}
            </div>

            {/* Safe area */}
            <div className="safe-bottom" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
