import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, DocumentArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { exportManager } from '../../services/export/ExportManager';
import ExportProgress from './ExportProgress';
import ExportPreview from './ExportPreview';
import ExportFormatSelector from './ExportFormatSelector';
import { useFilter } from '../../contexts/FilterContext';

const ExportDialog = ({ isOpen, onClose, dashboardRef }) => {
  const { periodFilter } = useFilter();
  const [exportOptions, setExportOptions] = useState({
    scope: { type: 'full' },
    formats: ['pdf'],
    quality: 'high',
    includeInteractions: false,
    includeAnimations: false,
    preserveLinks: true
  });

  const [exportState, setExportState] = useState({
    status: 'idle', // idle, exporting, completed, failed
    sessionId: null,
    progress: null,
    results: null,
    error: null
  });

  const [showPreview, setShowPreview] = useState(false);

  // Detect export type based on current route
  const detectExportType = () => {
    const path = window.location.pathname;
    if (path.includes('business-units')) return 'businessUnits';
    if (path.includes('customers')) return 'customers';
    if (path.includes('trends')) return 'trends';
    if (path.includes('sales-plan')) return 'salesPlan';
    return 'overview'; // default
  };

  // Start export
  const handleExport = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found');
      return;
    }

    console.log('Starting export with options:', exportOptions);
    setExportState({ ...exportState, status: 'exporting', error: null });

    try {
      // Prepare dashboard state with filter context
      const dashboardState = {
        periodFilter,
        exportType: detectExportType() // Detect based on current route
      };
      
      const sessionId = await exportManager.export(
        dashboardRef.current,
        exportOptions,
        dashboardState
      );

      setExportState(prev => ({ ...prev, sessionId }));
      
      // Start progress monitoring
      const progressInterval = setInterval(() => {
        const session = exportManager.getSession(sessionId);
        if (session) {
          setExportState(prev => ({
            ...prev,
            progress: session.progress,
            status: session.status === 'completed' ? 'completed' : 'exporting'
          }));

          if (session.status === 'completed' || session.status === 'failed') {
            clearInterval(progressInterval);
            if (session.status === 'completed') {
              setExportState(prev => ({ ...prev, results: session.results }));
            } else if (session.errors?.length > 0) {
              setExportState(prev => ({ 
                ...prev, 
                status: 'failed',
                error: session.errors[0].message 
              }));
            }
          }
        }
      }, 100);

    } catch (error) {
      setExportState(prev => ({
        ...prev,
        status: 'failed',
        error: error.message
      }));
    }
  };

  // Download results
  const handleDownload = async (format) => {
    if (!exportState.sessionId) return;
    
    try {
      await exportManager.downloadResults(exportState.sessionId, format);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Cancel export
  const handleCancel = async () => {
    if (exportState.sessionId && exportState.status === 'exporting') {
      await exportManager.cancelExport(exportState.sessionId);
      setExportState({ ...exportState, status: 'idle' });
    }
  };

  // Reset dialog when closed
  useEffect(() => {
    if (!isOpen) {
      setExportState({
        status: 'idle',
        sessionId: null,
        progress: null,
        results: null,
        error: null
      });
      setShowPreview(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Dialog Panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <DocumentArrowDownIcon className="h-6 w-6 text-primary" />
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Export Dashboard
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {exportState.status === 'idle' && (
              <>
                {/* Format Selection */}
                <ExportFormatSelector
                  selectedFormats={exportOptions.formats}
                  onFormatsChange={(formats) => 
                    setExportOptions({ ...exportOptions, formats })
                  }
                />

                {/* Export Options */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Export Options</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.preserveLinks}
                        onChange={(e) => 
                          setExportOptions({ ...exportOptions, preserveLinks: e.target.checked })
                        }
                        className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Preserve hyperlinks
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeInteractions}
                        onChange={(e) => 
                          setExportOptions({ ...exportOptions, includeInteractions: e.target.checked })
                        }
                        className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Include interactive elements (where supported)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Quality Selection */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Quality</h3>
                  <div className="flex space-x-2">
                    {['medium', 'high', 'maximum'].map((quality) => (
                      <button
                        key={quality}
                        onClick={() => setExportOptions({ ...exportOptions, quality })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          exportOptions.quality === quality
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {quality.charAt(0).toUpperCase() + quality.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Export Progress */}
            {exportState.status === 'exporting' && exportState.progress && (
              <ExportProgress 
                progress={exportState.progress}
                onCancel={handleCancel}
              />
            )}

            {/* Export Complete */}
            {exportState.status === 'completed' && exportState.results && (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Export Completed Successfully
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Your dashboard has been exported in {exportState.results.documents.length} format{exportState.results.documents.length > 1 ? 's' : ''}.
                </p>
                
                {/* Download Buttons */}
                <div className="flex flex-col space-y-2">
                  {exportState.results.documents.map((doc) => (
                    <button
                      key={doc.format}
                      onClick={() => handleDownload(doc.format)}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                      Download {doc.format.toUpperCase()} ({formatFileSize(doc.size)})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {exportState.status === 'failed' && (
              <div className="rounded-lg bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Export Failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{exportState.error || 'An unexpected error occurred'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between">
            <div>
              {exportState.status === 'idle' && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {exportState.status === 'idle' && (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Export Dashboard
                  </button>
                </>
              )}
              
              {exportState.status === 'completed' && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Close
                </button>
              )}

              {exportState.status === 'failed' && (
                <>
                  <button
                    onClick={() => setExportState({ ...exportState, status: 'idle', error: null })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <ExportPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          options={exportOptions}
          dashboardRef={dashboardRef}
        />
      )}
    </Dialog>
  );
};

// Utility function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default ExportDialog;