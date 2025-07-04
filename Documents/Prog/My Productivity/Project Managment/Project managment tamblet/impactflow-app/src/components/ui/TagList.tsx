import React from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'

interface TagListProps {
  tags: string[] | undefined | null
  className?: string
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outlined' | 'solid'
  onRemove?: (tag: string, index: number) => void
  emptyText?: string
}

export const TagList: React.FC<TagListProps> = React.memo(({ 
  tags, 
  className = '', 
  maxVisible = 3,
  size = 'sm',
  variant = 'default',
  onRemove,
  emptyText = 'None'
}) => {
  if (!tags || tags.length === 0) {
    return (
      <span className={clsx('text-neutral-400 text-sm', className)}>
        {emptyText}
      </span>
    )
  }

  const visibleTags = maxVisible > 0 ? tags.slice(0, maxVisible) : tags
  const remainingCount = tags.length - visibleTags.length

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const variantClasses = {
    default: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    outlined: 'bg-transparent text-neutral-700 border-neutral-300',
    solid: 'bg-primary text-white border-primary'
  }

  return (
    <div className={clsx('inline-flex items-center gap-1 flex-wrap', className)}>
      {visibleTags.map((tag, index) => (
        <span
          key={index}
          className={clsx(
            'inline-flex items-center gap-1 rounded-full border',
            sizeClasses[size],
            variantClasses[variant]
          )}
        >
          <span className="truncate max-w-[120px]">{tag}</span>
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(tag, index)
              }}
              className={clsx(
                'ml-0.5 -mr-1 rounded-full p-0.5 hover:bg-black/10 transition-colors',
                variant === 'solid' && 'hover:bg-white/20'
              )}
              aria-label={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className={clsx(
            'inline-flex items-center rounded-full',
            sizeClasses[size],
            'bg-neutral-200 text-neutral-600'
          )}
          title={tags.slice(maxVisible).join(', ')}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  )
})

TagList.displayName = 'TagList'