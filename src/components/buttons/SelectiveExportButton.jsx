import React, { useState } from 'react';
import { FileSpreadsheet, ChevronDown } from 'lucide-react';
import ExportSelectionDialog from '../dialogs/ExportSelectionDialog';
import exportService from '../../services/exportService';

const SelectiveExportButton = ({
  pageType, // 'overview', 'business-units', 'customers', etc.
  data,
  period,
  variant = 'primary',
  size = 'medium',
  className = '',
  customSections = null, // Allow custom section definitions
  onExportComplete = () => {}
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Define available sections based on page type
  const getAvailableSections = () => {
    if (customSections) return customSections;

    switch (pageType) {
      case 'overview':
        return [
          {
            id: 'summary',
            name: 'Summary Metrics',
            description: 'Revenue, Cost, Gross Profit, and Achievement percentages',
            defaultSelected: true
          },
          {
            id: 'serviceBreakdown',
            name: 'Service Type Breakdown',
            description: 'Performance by Warehouse and Transportation services',
            defaultSelected: true
          },
          {
            id: 'monthlyTrends',
            name: 'Monthly Trends',
            description: 'Revenue trends across all months',
            defaultSelected: false
          }
        ];

      case 'business-units':
        return [
          {
            id: 'performance',
            name: 'Business Unit Performance',
            description: 'Revenue, Cost, and Gross Profit by business unit',
            defaultSelected: true
          },
          {
            id: 'achievements',
            name: 'Achievement Analysis',
            description: 'Target achievement percentages',
            defaultSelected: true
          },
          {
            id: 'monthlyBreakdown',
            name: 'Monthly Breakdown',
            description: 'Detailed monthly performance data',
            defaultSelected: false
          }
        ];

      case 'customers':
        return [
          {
            id: 'topCustomers',
            name: 'Top Customers',
            description: 'Performance metrics for top revenue generators',
            defaultSelected: true
          },
          {
            id: 'serviceBreakdown',
            name: 'Service Type Analysis',
            description: 'Customer breakdown by service types',
            defaultSelected: true
          },
          {
            id: 'allCustomers',
            name: 'All Customers List',
            description: 'Complete customer database with all metrics',
            defaultSelected: false
          },
          {
            id: 'achievements',
            name: 'Achievement Analysis',
            description: 'Target vs actual performance',
            defaultSelected: false
          }
        ];

      default:
        return [];
    }
  };

  const handleExport = async (selectedSections) => {
    setLoading(true);
    try {
      const sectionIds = selectedSections.map(s => s.id);
      
      // Create custom export data based on selections
      const exportData = {
        sections: sectionIds,
        data: data,
        period: period
      };

      // Use different export methods based on page type
      switch (pageType) {
        case 'overview':
          await exportService.exportCustomOverview(exportData);
          break;
        case 'business-units':
          await exportService.exportCustomBusinessUnits(exportData);
          break;
        case 'customers':
          await exportService.exportCustomCustomers(exportData);
          break;
        default:
          await exportService.exportTable(data, `${pageType}_export`);
      }

      onExportComplete();
      setShowDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-5 py-2.5 text-base'
  };

  const variantClasses = {
    primary: `
      bg-[#9e1f63] text-white 
      hover:bg-[#721548] 
      shadow-sm hover:shadow-md
    `,
    secondary: `
      bg-white text-[#9e1f63] 
      border border-[#9e1f63] 
      hover:bg-[#9e1f63] hover:text-white
    `,
    inline: `
      text-gray-600 hover:text-[#9e1f63] 
      hover:bg-gray-50
    `
  };

  const iconSize = {
    small: 'w-4 h-4',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        disabled={loading}
        className={`
          inline-flex items-center gap-2
          font-medium rounded-lg
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
      >
        <FileSpreadsheet className={iconSize[size]} />
        <span>Export</span>
        <ChevronDown className={`${iconSize[size]} -ml-1`} />
      </button>

      <ExportSelectionDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onExport={handleExport}
        availableSections={getAvailableSections()}
        title={`Export ${pageType.charAt(0).toUpperCase() + pageType.slice(1).replace('-', ' ')} Data`}
        loading={loading}
      />
    </>
  );
};

export default SelectiveExportButton;