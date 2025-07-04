import React from 'react'
import clsx from 'clsx'

interface ProgressBarProps {
  progress: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

export const ProgressBar: React.FC<ProgressBarProps> = React.memo(({ 
  progress, 
  className = '', 
  showLabel = true,
  size = 'md',
  color = 'primary'
}) => {
  const normalizedProgress = Math.max(0, Math.min(100, progress))
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  }

  const getProgressColor = () => {
    if (color !== 'primary') return colorClasses[color]
    
    if (normalizedProgress >= 80) return 'bg-green-500'
    if (normalizedProgress >= 50) return 'bg-primary'
    if (normalizedProgress >= 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
          <span>Progress</span>
          <span className="font-medium">{Math.round(normalizedProgress)}%</span>
        </div>
      )}
      <div className={clsx(
        'w-full bg-neutral-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div 
          className={clsx(
            'h-full transition-all duration-300 ease-out rounded-full',
            getProgressColor()
          )}
          style={{ width: `${normalizedProgress}%` }}
          role="progressbar"
          aria-valuenow={normalizedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
})

ProgressBar.displayName = 'ProgressBar'