import React from 'react'
import clsx from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ScoreBadgeProps {
  score: number
  label?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showTrend?: boolean
  previousScore?: number
  max?: number
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = React.memo(({ 
  score, 
  label,
  className = '', 
  size = 'md',
  showTrend = false,
  previousScore,
  max = 100
}) => {
  const normalizedScore = Math.max(0, Math.min(max, score))
  const percentage = (normalizedScore / max) * 100
  
  const getScoreColor = () => {
    if (percentage >= 80) return 'text-red-600 bg-red-50 border-red-200'
    if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (percentage >= 20) return 'text-blue-600 bg-blue-50 border-blue-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  }

  const getTrendIcon = () => {
    if (!showTrend || previousScore === undefined) return null
    
    if (score > previousScore) {
      return <TrendingUp className="w-3 h-3 text-red-500" />
    } else if (score < previousScore) {
      return <TrendingDown className="w-3 h-3 text-green-500" />
    }
    return <Minus className="w-3 h-3 text-neutral-400" />
  }

  return (
    <div className={clsx('inline-flex flex-col items-center', className)}>
      {label && (
        <span className="text-xs text-neutral-600 mb-1">{label}</span>
      )}
      <span
        className={clsx(
          'inline-flex items-center gap-1 rounded-lg font-semibold border',
          getScoreColor(),
          sizeClasses[size]
        )}
      >
        <span>{Math.round(normalizedScore)}</span>
        {max !== 100 && (
          <span className="text-xs font-normal opacity-70">/{max}</span>
        )}
        {getTrendIcon()}
      </span>
    </div>
  )
})

ScoreBadge.displayName = 'ScoreBadge'