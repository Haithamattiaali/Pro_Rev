import React from 'react'
import { format, isToday, isTomorrow, isYesterday, isPast, isFuture, differenceInDays } from 'date-fns'
import clsx from 'clsx'
import { Calendar, Clock } from 'lucide-react'

interface DateFieldProps {
  date: Date | string | null | undefined
  className?: string
  format?: string
  showIcon?: boolean
  showRelative?: boolean
  highlightOverdue?: boolean
}

export const DateField: React.FC<DateFieldProps> = React.memo(({ 
  date, 
  className = '', 
  format: dateFormat = 'MMM d, yyyy',
  showIcon = true,
  showRelative = true,
  highlightOverdue = false
}) => {
  if (!date) {
    return (
      <span className={clsx('text-neutral-400 text-sm', className)}>
        No date
      </span>
    )
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return (
      <span className={clsx('text-neutral-400 text-sm', className)}>
        Invalid date
      </span>
    )
  }

  const getRelativeText = () => {
    if (!showRelative) return null
    
    if (isToday(dateObj)) return 'Today'
    if (isTomorrow(dateObj)) return 'Tomorrow'
    if (isYesterday(dateObj)) return 'Yesterday'
    
    const days = differenceInDays(dateObj, new Date())
    if (days > 0 && days <= 7) return `In ${days} days`
    if (days < 0 && days >= -7) return `${Math.abs(days)} days ago`
    
    return null
  }

  const isOverdue = highlightOverdue && isPast(dateObj) && !isToday(dateObj)
  const relativeText = getRelativeText()

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 text-sm',
        isOverdue ? 'text-red-600' : 'text-neutral-600',
        className
      )}
      title={format(dateObj, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
    >
      {showIcon && (
        <Calendar className="w-3.5 h-3.5" />
      )}
      <span>
        {relativeText ? (
          <>
            <span className="font-medium">{relativeText}</span>
            <span className="text-xs text-neutral-500 ml-1">
              ({format(dateObj, dateFormat)})
            </span>
          </>
        ) : (
          format(dateObj, dateFormat)
        )}
      </span>
    </span>
  )
})

DateField.displayName = 'DateField'