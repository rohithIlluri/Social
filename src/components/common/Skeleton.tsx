import { type HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
}

function SkeletonBase({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`skeleton animate-gentle-pulse ${className}`}
      {...props}
    />
  )
}

function SkeletonText({ className = '', lines = 1 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 rounded-full animate-gentle-pulse"
          style={{
            width: i === lines - 1 && lines > 1 ? '60%' : '100%',
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  )
}

function SkeletonAvatar({
  size = 'md',
  className = ''
}: SkeletonProps & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
  }

  return (
    <div
      className={`skeleton rounded-full animate-gentle-pulse ${sizeClasses[size]} ${className}`}
    />
  )
}

function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton p-6 rounded-card ${className}`}>
      <div className="flex items-center gap-4">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded-full animate-gentle-pulse" />
          <div className="skeleton h-3 w-1/2 rounded-full animate-gentle-pulse stagger-1" />
        </div>
      </div>
    </div>
  )
}

function SkeletonEncounterCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton p-8 rounded-card ${className}`}>
      <div className="flex flex-col items-center text-center">
        <SkeletonAvatar size="xl" className="mb-6" />
        <div className="skeleton h-6 w-32 rounded-full animate-gentle-pulse mb-3" />
        <div className="skeleton h-4 w-20 rounded-full animate-gentle-pulse stagger-1 mb-6" />
        <div className="flex gap-2">
          <div className="skeleton h-6 w-16 rounded-full animate-gentle-pulse stagger-2" />
          <div className="skeleton h-6 w-16 rounded-full animate-gentle-pulse stagger-3" />
        </div>
      </div>
    </div>
  )
}

function SkeletonButton({ className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton h-12 rounded-button animate-gentle-pulse ${className}`} />
  )
}

export const Skeleton = Object.assign(SkeletonBase, {
  Text: SkeletonText,
  Avatar: SkeletonAvatar,
  Card: SkeletonCard,
  EncounterCard: SkeletonEncounterCard,
  Button: SkeletonButton,
})
