import React from 'react'
import BaseCard from '../common/BaseCard'
import { cn } from '../../utils/cn'

const ContentCard = ({ 
  title, 
  subtitle,
  children, 
  className,
  headerClassName,
  action,
  variant = 'default',
  ...props 
}) => {
  return (
    <BaseCard variant={variant} className={className} {...props}>
      {(title || subtitle || action) && (
        <div className={cn(
          "flex items-start justify-between pb-4 mb-4 border-b border-gray-200",
          headerClassName
        )}>
          <div>
            {title && (
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0 ml-4">
              {action}
            </div>
          )}
        </div>
      )}
      {children}
    </BaseCard>
  )
}

export default ContentCard