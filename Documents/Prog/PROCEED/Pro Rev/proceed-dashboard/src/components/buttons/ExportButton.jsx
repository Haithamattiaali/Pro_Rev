import React, { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';

const ExportButton = ({ 
  onClick, 
  label = 'Export', 
  className = '', 
  disabled = false,
  variant = 'primary', // primary, secondary, inline
  size = 'medium' // small, medium, large
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      await onClick();
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
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  // Style variants following Apple design principles
  const variantClasses = {
    primary: `
      bg-primary text-white shadow-sm
      hover:bg-primary-dark hover:shadow-md
      active:scale-[0.98]
      disabled:bg-neutral-light disabled:text-neutral-mid disabled:shadow-none
    `,
    secondary: `
      bg-white text-primary border border-primary/20 shadow-sm
      hover:bg-primary/5 hover:border-primary/30 hover:shadow-md
      active:scale-[0.98]
      disabled:bg-neutral-light disabled:text-neutral-mid disabled:border-neutral-mid/20
    `,
    inline: `
      bg-transparent text-primary
      hover:bg-primary/10 hover:text-primary-dark
      active:scale-[0.98]
      disabled:text-neutral-mid disabled:hover:bg-transparent
    `
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleExport}
        disabled={disabled || isExporting}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium rounded-lg
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
          disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
      >
        <FileSpreadsheet className={`${iconSizes[size]} ${isExporting ? 'animate-pulse' : ''}`} />
        {label && <span>{isExporting ? 'Exporting...' : label}</span>}
      </button>
      
      {error && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-neutral-dark text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap animate-fadeIn">
          <div className="absolute -top-1 right-4 w-2 h-2 bg-neutral-dark transform rotate-45"></div>
          {error}
        </div>
      )}
    </div>
  );
};

export default ExportButton;