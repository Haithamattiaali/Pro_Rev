import React, { useState, useRef } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import ExportDialog from './ExportDialog';

const ExportButton = ({ 
  variant = 'primary', 
  size = 'medium',
  dashboardRef,
  className = ''
}) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // If no dashboardRef provided, try to find the dashboard element
  const defaultDashboardRef = useRef(null);
  const effectiveDashboardRef = dashboardRef || defaultDashboardRef;

  React.useEffect(() => {
    if (!dashboardRef && defaultDashboardRef.current === null) {
      // Try to find the main dashboard container
      const dashboardElement = document.querySelector(
        '.dashboard-container, #dashboard, [data-dashboard="true"], main'
      );
      if (dashboardElement) {
        defaultDashboardRef.current = dashboardElement;
      }
    }
  }, [dashboardRef]);

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary'
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5', 
    large: 'h-6 w-6'
  };

  return (
    <>
      <button
        onClick={() => setShowExportDialog(true)}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
      >
        <DocumentArrowDownIcon className={`${iconSizes[size]} mr-2`} />
        Export
      </button>

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        dashboardRef={effectiveDashboardRef}
      />
    </>
  );
};

export default ExportButton;