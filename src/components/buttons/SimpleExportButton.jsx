import React, { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import exportService from '../../services/exportService';
import { useFilter } from '../../contexts/FilterContext';

/**
 * SimpleExportButton - Direct Excel export button using the new sustainable backend system
 * Provides one-click Excel export with proper error handling and loading states
 */
const SimpleExportButton = ({ 
  exportType = 'overview', // overview, businessUnits, customers, trends
  customData = null,
  label = 'Export to Excel',
  variant = 'secondary',
  size = 'medium',
  className = '',
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const { periodFilter } = useFilter();

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      // Notify parent component export is starting
      if (onExportStart) onExportStart();

      // Get current filter parameters
      const { year, period, month, quarter } = periodFilter;

      // Call appropriate export method based on type
      switch (exportType) {
        case 'overview':
          await exportService.exportOverview(year, period, month, quarter);
          break;
          
        case 'businessUnits':
          await exportService.exportBusinessUnits(year, period, month, quarter);
          break;
          
        case 'customers':
          await exportService.exportCustomers(year, period, month, quarter);
          break;
          
        case 'trends':
          await exportService.exportTrends(year);
          break;
          
        case 'custom':
          if (customData) {
            await exportService.exportCustomOverview({
              sections: customData.sections || ['summary', 'serviceBreakdown'],
              period: `${period} ${year}`,
              data: customData.data,
              year
            });
          }
          break;
          
        default:
          throw new Error(`Unknown export type: ${exportType}`);
      }

      // Notify parent component export completed
      if (onExportComplete) onExportComplete();
      
    } catch (err) {
      console.error('Export failed:', err);
      const errorMessage = err.message || 'Export failed. Please try again.';
      setError(errorMessage);
      
      // Notify parent component of error
      if (onExportError) onExportError(err);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // Size variants
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm gap-1.5',
    medium: 'px-4 py-2 text-base gap-2',
    large: 'px-6 py-3 text-lg gap-3'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  // Style variants
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
    ghost: `
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
        disabled={isExporting}
        className={`
          inline-flex items-center justify-center
          font-medium rounded-lg
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
          disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
      >
        {isExporting ? (
          <>
            <Loader2 className={`${iconSizes[size]} animate-spin`} />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <FileSpreadsheet className={iconSizes[size]} />
            <span>{label}</span>
          </>
        )}
      </button>
      
      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap animate-fadeIn">
          <div className="absolute -top-1 right-4 w-2 h-2 bg-red-600 transform rotate-45"></div>
          {error}
        </div>
      )}
      
      {/* Success indicator (brief flash) */}
      {!isExporting && !error && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-green-500 opacity-0 rounded-lg animate-[success-flash_0.5s_ease-out]" />
        </div>
      )}
    </div>
  );
};

export default SimpleExportButton;