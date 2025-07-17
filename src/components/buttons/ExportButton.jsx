import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Check } from 'lucide-react';

const ExportButton = ({ 
  onClick, 
  label = 'Export', 
  className = '', 
  disabled = false,
  variant = 'primary', // primary, glass, minimal
  size = 'medium', // small, medium, large
  showLabel = true,
  tooltip = 'Export to Excel'
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleExport = async () => {
    if (isExporting || disabled) return;
    
    setIsExporting(true);
    setError(null);
    
    try {
      await onClick();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Size variants
  const sizeClasses = {
    small: showLabel ? 'px-3 py-1.5 text-sm gap-1.5' : 'p-1.5',
    medium: showLabel ? 'px-4 py-2 text-base gap-2' : 'p-2',
    large: showLabel ? 'px-6 py-3 text-lg gap-2.5' : 'p-3'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  // Style variants with Apple-inspired design
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-primary to-primary-dark text-white
      shadow-md hover:shadow-lg
      border border-primary-dark/20
      backdrop-blur-sm
    `,
    glass: `
      bg-white/10 backdrop-blur-xl
      border border-white/20
      text-neutral-dark hover:bg-white/20
      shadow-sm hover:shadow-md
    `,
    minimal: `
      ${showLabel ? 'text-neutral-dark hover:bg-neutral-light' : 'text-neutral-mid hover:text-primary hover:bg-neutral-light'}
      border border-transparent
    `
  };

  const baseClasses = `
    relative inline-flex items-center justify-center
    font-medium rounded-xl
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <motion.button
      onClick={handleExport}
      disabled={disabled || isExporting}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background gradient overlay for primary variant */}
      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-light to-primary opacity-0"
          animate={{ opacity: isHovered ? 0.2 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Icon with animation */}
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Check className={iconSizes[size]} />
          </motion.div>
        ) : (
          <motion.div
            key="icon"
            animate={{ 
              rotate: isExporting ? 360 : 0,
              scale: isHovered && !isExporting ? 1.1 : 1
            }}
            transition={{ 
              rotate: { duration: 1, repeat: isExporting ? Infinity : 0, ease: "linear" },
              scale: { duration: 0.2 }
            }}
          >
            <FileSpreadsheet className={iconSizes[size]} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      {showLabel && (
        <motion.span
          className="ml-2"
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          transition={{ delay: 0.1 }}
        >
          {isExporting ? 'Exporting...' : showSuccess ? 'Exported!' : label}
        </motion.span>
      )}

      {/* Tooltip for minimal variant without label */}
      {!showLabel && isHovered && !isExporting && (
        <motion.div
          className="absolute -top-10 left-1/2 transform -translate-x-1/2 
                     bg-neutral-dark text-white text-xs px-2 py-1 rounded-md
                     whitespace-nowrap pointer-events-none z-50"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
        >
          {tooltip}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 
                          w-2 h-2 bg-neutral-dark rotate-45" />
        </motion.div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.span
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                       text-xs text-red-600 whitespace-nowrap"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default ExportButton;