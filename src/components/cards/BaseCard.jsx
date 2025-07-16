import React from 'react'
import { cn } from '../../utils/cn'

const BaseCard = ({ 
  children, 
  className, 
  variant = 'default',
  padding = 'normal',
  hover = true,
  border = true,
  shadow = 'sm',
  ...props 
}) => {
  const variants = {
    default: 'bg-white',
    elevated: 'bg-white ring-1 ring-secondary-pale/20',
    outlined: 'bg-white',
    filled: 'bg-gradient-to-br from-secondary-pale/30 to-secondary-pale/10',
    glass: 'bg-white/80 backdrop-blur-sm',
  }

  const paddings = {
    none: '',
    small: 'p-4',
    normal: 'p-6',
    large: 'p-8',
  }

  const shadows = {
    none: '',
    sm: 'shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)]',
    md: 'shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]',
    lg: 'shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]',
    xl: 'shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]',
  }

  const borderStyles = {
    default: border ? 'border border-secondary-pale/20' : '',
    elevated: '',
    outlined: 'border-2 border-secondary-pale/30',
    filled: '',
    glass: border ? 'border border-white/20' : '',
  }

  const hoverEffects = {
    default: hover ? 'hover:shadow-md hover:scale-[1.01] hover:border-secondary-pale/30' : '',
    elevated: hover ? 'hover:shadow-lg hover:ring-secondary-pale/30' : '',
    outlined: hover ? 'hover:border-secondary-pale/50 hover:shadow-md' : '',
    filled: hover ? 'hover:shadow-lg hover:from-secondary-pale/40 hover:to-secondary-pale/20' : '',
    glass: hover ? 'hover:bg-white/90 hover:shadow-lg' : '',
  }

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-300 ease-out transform-gpu',
        variants[variant],
        paddings[padding],
        shadows[shadow],
        borderStyles[variant],
        hoverEffects[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default BaseCard