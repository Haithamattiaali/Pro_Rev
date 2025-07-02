import React from 'react';
import { 
  DocumentTextIcon,
  PresentationChartLineIcon,
  TableCellsIcon,
  PhotoIcon,
  CodeBracketIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const ExportFormatSelector = ({ selectedFormats, onFormatsChange }) => {
  const formats = [
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Best for printing and sharing',
      icon: DocumentTextIcon,
      features: ['High fidelity', 'Print ready', 'Universal format'],
      available: true
    },
    {
      id: 'powerpoint',
      name: 'PowerPoint',
      description: 'Great for presentations',
      icon: PresentationChartLineIcon,
      features: ['Editable slides', 'Native charts', 'Animations'],
      available: true
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'Data analysis and manipulation',
      icon: TableCellsIcon,
      features: ['Raw data', 'Formulas', 'Pivot tables'],
      available: false,
      comingSoon: true
    },
    {
      id: 'image',
      name: 'Image',
      description: 'PNG or JPG screenshots',
      icon: PhotoIcon,
      features: ['High resolution', 'Easy sharing', 'Web ready'],
      available: false,
      comingSoon: true
    }
  ];

  const toggleFormat = (formatId) => {
    if (selectedFormats.includes(formatId)) {
      onFormatsChange(selectedFormats.filter(f => f !== formatId));
    } else {
      onFormatsChange([...selectedFormats, formatId]);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-4">Select Export Formats</h3>
      <div className="grid grid-cols-2 gap-4">
        {formats.map((format) => {
          const isSelected = selectedFormats.includes(format.id);
          const Icon = format.icon;

          return (
            <div
              key={format.id}
              onClick={() => format.available && toggleFormat(format.id)}
              className={`
                relative rounded-lg border-2 p-4 cursor-pointer transition-all
                ${format.available ? '' : 'opacity-50 cursor-not-allowed'}
                ${isSelected
                  ? 'border-primary bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              {/* Selection indicator */}
              {isSelected && format.available && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary" />
                </div>
              )}

              {/* Coming Soon Badge */}
              {format.comingSoon && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Format Icon */}
              <div className="flex items-center mb-3">
                <Icon className="h-8 w-8 text-gray-400" />
              </div>

              {/* Format Info */}
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {format.name}
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                {format.description}
              </p>

              {/* Features */}
              <div className="space-y-1">
                {format.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-primary mr-1.5 mt-0.5">•</span>
                    <span className="text-xs text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Format Info */}
      {selectedFormats.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Selected formats:</span> {selectedFormats.join(', ').toUpperCase()}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExportFormatSelector;