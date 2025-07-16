import React, { useState } from 'react';
import { FileSpreadsheet, Presentation } from 'lucide-react';

const PowerPointExportButton = ({ 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  children,
  className = '',
  endpoint,
  params = {},
  filename
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // If custom onClick is provided, use it
      if (onClick) {
        await onClick();
      } else if (endpoint) {
        // Otherwise, use the endpoint
        const queryParams = new URLSearchParams(params).toString();
        const url = `${import.meta.env.VITE_API_URL}/export/powerpoint/${endpoint}${queryParams ? `?${queryParams}` : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Export failed');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename || `powerpoint-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('PowerPoint export error:', err);
      setError('Export failed');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#9e1f63] to-[#721548] hover:from-[#721548] hover:to-[#5a0f39] text-white shadow-md hover:shadow-lg focus:ring-[#9e1f63]',
    secondary: 'bg-white hover:bg-gray-50 text-[#9e1f63] border-2 border-[#9e1f63] hover:border-[#721548] focus:ring-[#9e1f63]',
    inline: 'text-[#9e1f63] hover:text-[#721548] hover:bg-[#9e1f63]/5 focus:ring-[#9e1f63]'
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
    medium: 'px-4 py-2 text-base rounded-lg gap-2',
    large: 'px-6 py-3 text-lg rounded-xl gap-2.5'
  };

  const iconSizes = {
    small: 16,
    medium: 18,
    large: 20
  };

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${isExporting ? 'opacity-75 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Presentation size={iconSizes[size]} className="flex-shrink-0" />
            <span>{children || 'Export for PowerPoint'}</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="absolute top-full mt-2 left-0 bg-red-500 text-white text-sm px-3 py-1 rounded-md shadow-lg whitespace-nowrap animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
};

export default PowerPointExportButton;