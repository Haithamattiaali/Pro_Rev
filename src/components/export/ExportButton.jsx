import React, { useState, useRef } from 'react';
import ExportDialog from './ExportDialog';
import EnhancedExportButton from '../buttons/ExportButton';

const ExportButton = ({ 
  variant = 'glass', 
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

  return (
    <>
      <EnhancedExportButton
        onClick={() => setShowExportDialog(true)}
        variant={variant}
        size={size}
        label="Export Dashboard"
        className={className}
      />

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        dashboardRef={effectiveDashboardRef}
      />
    </>
  );
};

export default ExportButton;