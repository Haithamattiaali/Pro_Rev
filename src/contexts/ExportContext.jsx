import React, { createContext, useContext, useState, useCallback } from 'react';
import exportManager from '../services/exportCore/exportManager';
import { ExportFormats } from '../services/exportCore/uirSchema';
import { useFilter } from './FilterContext';

const ExportContext = createContext();

export const useExport = () => {
  const context = useContext(ExportContext);
  if (!context) {
    throw new Error('useExport must be used within an ExportProvider');
  }
  return context;
};

export const ExportProvider = ({ children }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);
  const { year, period, month, quarter } = useFilter();

  /**
   * Export current dashboard view
   */
  const exportDashboard = useCallback(async (format = ExportFormats.PDF, options = {}) => {
    console.log('🎨 ExportContext: Starting export', { format, options });
    
    setIsExporting(true);
    setExportError(null);
    setExportProgress({ stage: 'initializing', percentage: 0 });

    try {
      // Include current filter context in export
      const exportOptions = {
        format,
        captureOptions: {
          viewName: window.location.pathname.slice(1) || 'overview',
          includeData: true,
          includeStyles: true,
          captureFilters: true,
          captureCharts: true,
          captureTables: true,
          captureMetrics: true
        },
        exportOptions: {
          ...options,
          filters: {
            year,
            period,
            month,
            quarter
          }
        }
      };

      console.log('📤 Export options:', exportOptions);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => ({
          ...prev,
          percentage: Math.min((prev.percentage || 0) + 10, 90)
        }));
      }, 200);

      // Execute export
      const result = await exportManager.exportDashboard(exportOptions);

      clearInterval(progressInterval);
      setExportProgress({ stage: 'completed', percentage: 100 });

      console.log('✅ Export completed:', result);

      // Update history
      setExportHistory(prev => [...prev, {
        id: result.exportId,
        format,
        timestamp: new Date(),
        status: 'success'
      }].slice(-10)); // Keep last 10 exports

      // Clear progress after short delay
      setTimeout(() => {
        setExportProgress(null);
      }, 1000);

      return result;

    } catch (error) {
      console.error('❌ Export failed in context:', error);
      setExportError(error.message);
      setExportProgress(null);
      
      // Update history with failure
      setExportHistory(prev => [...prev, {
        format,
        timestamp: new Date(),
        status: 'failed',
        error: error.message
      }].slice(-10));

      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [year, period, month, quarter]);

  /**
   * Export specific component or data
   */
  const exportComponent = useCallback(async (componentId, format = ExportFormats.PDF, options = {}) => {
    // Implementation for exporting specific components
    return exportDashboard(format, {
      ...options,
      componentId
    });
  }, [exportDashboard]);

  /**
   * Quick export methods for common formats
   */
  const exportToPDF = useCallback(async (options = {}) => {
    return exportDashboard(ExportFormats.PDF, options);
  }, [exportDashboard]);

  const exportToPowerPoint = useCallback(async (options = {}) => {
    return exportDashboard(ExportFormats.POWERPOINT, options);
  }, [exportDashboard]);

  const exportToExcel = useCallback(async (options = {}) => {
    return exportDashboard(ExportFormats.EXCEL, options);
  }, [exportDashboard]);

  const exportToImage = useCallback(async (options = {}) => {
    return exportDashboard(ExportFormats.IMAGE, options);
  }, [exportDashboard]);

  /**
   * Get available export formats
   */
  const getAvailableFormats = useCallback(() => {
    return Object.values(ExportFormats);
  }, []);

  /**
   * Clear export error
   */
  const clearError = useCallback(() => {
    setExportError(null);
  }, []);

  /**
   * Get export status
   */
  const getExportStatus = useCallback((exportId) => {
    return exportManager.getExportStatus(exportId);
  }, []);

  const value = {
    // State
    isExporting,
    exportProgress,
    exportError,
    exportHistory,

    // Methods
    exportDashboard,
    exportComponent,
    exportToPDF,
    exportToPowerPoint,
    exportToExcel,
    exportToImage,
    getAvailableFormats,
    clearError,
    getExportStatus
  };

  return (
    <ExportContext.Provider value={value}>
      {children}
    </ExportContext.Provider>
  );
};