import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ExportPreview = ({ isOpen, onClose, options, dashboardRef }) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && dashboardRef?.current) {
      generatePreview();
    }
  }, [isOpen]);

  const generatePreview = async () => {
    setLoading(true);
    try {
      // Use html2canvas for preview generation
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 0.5, // Lower scale for preview
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      setPreviewImage(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Export Preview
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Preview Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-gray-500">Generating preview...</p>
                </div>
              </div>
            ) : previewImage ? (
              <div className="space-y-4">
                {/* Format Pills */}
                <div className="flex space-x-2">
                  {options.formats.map((format) => (
                    <span
                      key={format}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {format.toUpperCase()}
                    </span>
                  ))}
                </div>

                {/* Preview Image */}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={previewImage}
                    alt="Dashboard Preview"
                    className="w-full h-auto"
                  />
                </div>

                {/* Export Settings Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Export Settings</h4>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-gray-500">Quality:</dt>
                    <dd className="text-gray-900 capitalize">{options.quality}</dd>
                    
                    <dt className="text-gray-500">Preserve Links:</dt>
                    <dd className="text-gray-900">{options.preserveLinks ? 'Yes' : 'No'}</dd>
                    
                    <dt className="text-gray-500">Interactive Elements:</dt>
                    <dd className="text-gray-900">{options.includeInteractions ? 'Included' : 'Static'}</dd>
                    
                    <dt className="text-gray-500">Export Scope:</dt>
                    <dd className="text-gray-900 capitalize">{options.scope.type}</dd>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Failed to generate preview</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Close Preview
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ExportPreview;