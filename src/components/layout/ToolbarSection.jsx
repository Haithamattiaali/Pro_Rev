import React from 'react';
import { motion } from 'framer-motion';

const ToolbarSection = ({ 
  title, 
  subtitle, 
  children, 
  className = '',
  variant = 'default' // default, compact
}) => {
  const variantStyles = {
    default: 'px-6 py-4',
    compact: 'px-6 py-3'
  };

  return (
    <motion.div 
      className={`
        flex items-center justify-between 
        border-b border-neutral-light bg-white/50 backdrop-blur-sm
        ${variantStyles[variant]}
        ${className}
      `}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Title Section */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-primary-dark tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-neutral-mid mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions Section */}
      {children && (
        <div className="flex items-center gap-3 ml-6">
          {children}
        </div>
      )}
    </motion.div>
  );
};

export default ToolbarSection;