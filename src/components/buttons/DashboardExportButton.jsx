import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Presentation, Image, FileJson, Download, ChevronDown } from 'lucide-react';
import { useExport } from '../../contexts/ExportContext';
import { ExportFormats } from '../../services/exportCore/uirSchema';
import clsx from 'clsx';

const exportOptions = [
  {
    format: ExportFormats.PDF,
    label: 'Export as PDF',
    icon: FileText,
    description: 'High-quality PDF document'
  },
  {
    format: ExportFormats.POWERPOINT,
    label: 'Export as PowerPoint',
    icon: Presentation,
    description: 'Editable presentation slides'
  },
  {
    format: ExportFormats.EXCEL,
    label: 'Export as Excel',
    icon: FileSpreadsheet,
    description: 'Data tables and charts'
  },
  {
    format: ExportFormats.IMAGE,
    label: 'Export as Image',
    icon: Image,
    description: 'PNG screenshot'
  },
  {
    format: ExportFormats.JSON,
    label: 'Export as JSON',
    icon: FileJson,
    description: 'Raw data format'
  }
];

export default function DashboardExportButton({ 
  variant = 'primary', 
  size = 'medium',
  className = '',
  showLabel = true,
  defaultFormat = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(defaultFormat);
  const { exportDashboard, isExporting, exportProgress, exportError, clearError } = useExport();

  console.log('🎨 DashboardExportButton rendered with props:', { variant, size, showLabel, defaultFormat });

  const handleExport = async (format) => {
    console.log('🔘 Export button clicked for format:', format);
    setIsOpen(false);
    setSelectedFormat(format);
    
    try {
      console.log('📤 Calling exportDashboard...');
      await exportDashboard(format);
      console.log('✅ Export call completed');
    } catch (error) {
      // Error is handled by context
      console.error('❌ Export failed in button handler:', error);
    }
  };

  const buttonClasses = clsx(
    'relative flex items-center gap-2 font-medium transition-all duration-200',
    {
      // Size variants
      'px-3 py-1.5 text-sm': size === 'small',
      'px-4 py-2 text-sm': size === 'medium',
      'px-6 py-3 text-base': size === 'large',
      
      // Style variants
      'bg-brand-primary text-white hover:bg-brand-primary-dark shadow-md hover:shadow-lg': 
        variant === 'primary',
      'bg-white text-brand-primary border border-brand-primary hover:bg-brand-primary hover:text-white': 
        variant === 'secondary',
      'text-gray-600 hover:text-brand-primary hover:bg-gray-100': 
        variant === 'inline',
      
      // States
      'opacity-50 cursor-not-allowed': isExporting,
      'rounded-lg': variant !== 'inline',
      'rounded': variant === 'inline',
    },
    className
  );

  const progressBarClasses = clsx(
    'absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all duration-300 rounded-b',
    {
      'opacity-0': !isExporting || !exportProgress,
      'opacity-100': isExporting && exportProgress
    }
  );

  const IconComponent = defaultFormat 
    ? exportOptions.find(opt => opt.format === defaultFormat)?.icon || Download 
    : Download;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => defaultFormat ? handleExport(defaultFormat) : setIsOpen(!isOpen)}
        disabled={isExporting}
        className={buttonClasses}
        title={isExporting ? 'Exporting...' : 'Export dashboard'}
      >
        <IconComponent size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
        {showLabel && (
          <span>
            {isExporting ? 'Exporting...' : 'Export'}
          </span>
        )}
        {!defaultFormat && (
          <ChevronDown 
            size={size === 'small' ? 14 : 16} 
            className={clsx('transition-transform', {
              'rotate-180': isOpen
            })}
          />
        )}
        
        {/* Progress bar */}
        <div 
          className={progressBarClasses}
          style={{ width: `${exportProgress?.percentage || 0}%` }}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && !defaultFormat && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.format}
                onClick={() => handleExport(option.format)}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                disabled={isExporting}
              >
                <Icon size={20} className="text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Error tooltip */}
      {exportError && (
        <div className="absolute top-full mt-2 right-0 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm max-w-xs z-50">
          <div className="font-medium mb-1">Export failed</div>
          <div className="text-xs">{exportError}</div>
          <button
            onClick={clearError}
            className="text-xs underline mt-1 hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Progress indicator */}
      {isExporting && exportProgress && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] z-50">
          <div className="text-sm font-medium text-gray-700 mb-1">
            Exporting {selectedFormat || 'dashboard'}...
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {exportProgress.stage || 'Processing'}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-brand-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress.percentage || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Click outside handler */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}