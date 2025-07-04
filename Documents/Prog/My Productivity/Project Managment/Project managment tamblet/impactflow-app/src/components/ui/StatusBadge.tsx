import React from 'react'
import { TaskStatus } from '@/types/project'
import clsx from 'clsx'
import { 
  CheckCircle, Clock, AlertTriangle, XCircle, 
  PauseCircle, PlayCircle, Search, TestTube, Timer
} from 'lucide-react'

interface StatusBadgeProps {
  status: TaskStatus
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ 
  status, 
  className = '', 
  showIcon = true,
  size = 'md' 
}) => {
  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return {
          icon: <div className="w-3 h-3 rounded-full border-2 border-current" />,
          bgColor: 'bg-neutral-100',
          textColor: 'text-neutral-600',
          borderColor: 'border-neutral-300'
        }
      case TaskStatus.PLANNING:
        return {
          icon: <Search className="w-3 h-3" />,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-300'
        }
      case TaskStatus.IN_PROGRESS:
        return {
          icon: <PlayCircle className="w-3 h-3" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-300'
        }
      case TaskStatus.TESTING:
        return {
          icon: <TestTube className="w-3 h-3" />,
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-700',
          borderColor: 'border-indigo-300'
        }
      case TaskStatus.REVIEW:
        return {
          icon: <Clock className="w-3 h-3" />,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-300'
        }
      case TaskStatus.COMPLETE:
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-300'
        }
      case TaskStatus.ON_HOLD:
        return {
          icon: <PauseCircle className="w-3 h-3" />,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-300'
        }
      case TaskStatus.CANCELLED:
        return {
          icon: <XCircle className="w-3 h-3" />,
          bgColor: 'bg-neutral-100',
          textColor: 'text-neutral-500',
          borderColor: 'border-neutral-300'
        }
      case TaskStatus.DELAYED:
        return {
          icon: <Timer className="w-3 h-3" />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-300'
        }
      case TaskStatus.BLOCKED:
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-300'
        }
      default:
        return {
          icon: <div className="w-3 h-3 rounded-full border-2 border-current" />,
          bgColor: 'bg-neutral-100',
          textColor: 'text-neutral-600',
          borderColor: 'border-neutral-300'
        }
    }
  }

  const config = getStatusConfig(status)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && config.icon}
      <span>{status.replace(/_/g, ' ')}</span>
    </span>
  )
})

StatusBadge.displayName = 'StatusBadge'