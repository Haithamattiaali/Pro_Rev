import React, { useState } from 'react';
import { X, FileSpreadsheet, Check } from 'lucide-react';

const ExportSelectionDialog = ({ 
  isOpen, 
  onClose, 
  onExport, 
  availableSections,
  title = "Export Data",
  loading = false 
}) => {
  const [selectedSections, setSelectedSections] = useState(
    availableSections.reduce((acc, section) => ({
      ...acc,
      [section.id]: section.defaultSelected !== false
    }), {})
  );

  if (!isOpen) return null;

  const handleToggleSection = (sectionId) => {
    setSelectedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedSections).every(v => v);
    setSelectedSections(
      availableSections.reduce((acc, section) => ({
        ...acc,
        [section.id]: !allSelected
      }), {})
    );
  };

  const handleExport = () => {
    const sectionsToExport = availableSections.filter(
      section => selectedSections[section.id]
    );
    onExport(sectionsToExport);
  };

  const selectedCount = Object.values(selectedSections).filter(v => v).length;
  const allSelected = selectedCount === availableSections.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-[#9e1f63]" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center justify-between pb-3 border-b">
              <button
                onClick={handleSelectAll}
                className="text-sm font-medium text-[#9e1f63] hover:text-[#721548] transition-colors"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-gray-500">
                {selectedCount} of {availableSections.length} selected
              </span>
            </div>

            {/* Section List */}
            <div className="space-y-2">
              {availableSections.map((section) => (
                <label
                  key={section.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={selectedSections[section.id]}
                      onChange={() => handleToggleSection(section.id)}
                      className="w-4 h-4 text-[#9e1f63] focus:ring-[#9e1f63] border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{section.name}</div>
                    {section.description && (
                      <div className="text-sm text-gray-500 mt-0.5">
                        {section.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedCount === 0 || loading}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium
              flex items-center gap-2
              transition-all duration-200
              ${selectedCount === 0 || loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#9e1f63] text-white hover:bg-[#721548] shadow-sm hover:shadow'
              }
            `}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Export Selected
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportSelectionDialog;