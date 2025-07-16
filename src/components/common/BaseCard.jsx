import React from 'react';
import { cn } from '../../utils/cn';

const BaseCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'medium',
  hover = true,
  shadow = 'medium',
  border = true,
  rounded = 'lg',
  onClick,
  ...props 
}) => {
  const baseStyles = 'bg-white transition-all duration-300 ease-out';
  
  const variantStyles = {
    default: '',
    elevated: 'ring-1 ring-secondary-pale/50',
    accent: 'border-l-4 border-l-primary',
    highlight: 'ring-2 ring-primary/10',
    metric: 'relative overflow-hidden'
  };
  
  const paddingStyles = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };
  
  const shadowStyles = {
    none: '',
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg',
    xl: 'shadow-xl'
  };
  
  const hoverStyles = hover ? {
    default: 'hover:shadow-lg hover:scale-[1.01]',
    elevated: 'hover:shadow-xl hover:ring-secondary-pale/70',
    accent: 'hover:shadow-lg hover:border-l-primary-dark',
    highlight: 'hover:ring-primary/20 hover:shadow-lg',
    metric: 'hover:shadow-lg'
  }[variant] : '';
  
  const borderStyles = border ? 'border border-secondary-pale/30' : '';
  
  const roundedStyles = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl'
  }[rounded];
  
  const interactiveStyles = onClick ? 'cursor-pointer' : '';
  
  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        shadowStyles[shadow],
        hoverStyles,
        borderStyles,
        roundedStyles,
        interactiveStyles,
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default BaseCard;