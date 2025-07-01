import React from 'react';
import ExportButton from './ExportButton';

const TableExportButton = ({ 
  data, 
  filename = 'table-export',
  headers = null,
  title = null,
  className = '',
  useBackend = true // Use backend for better Excel formatting
}) => {
  const exportTableToExcel = async () => {
    // If no custom headers provided, generate from data keys
    const tableHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : []);
    
    if (useBackend) {
      // Use backend endpoint for proper Excel formatting
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      try {
        const response = await fetch(`${baseURL}/export/table`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data,
            headers: tableHeaders,
            title: title || filename,
            filename
          })
        });

        if (!response.ok) {
          throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Backend export failed, falling back to CSV:', error);
        exportAsCSV(data, tableHeaders, filename);
      }
    } else {
      exportAsCSV(data, tableHeaders, filename);
    }
  };

  const exportAsCSV = (data, tableHeaders, filename) => {
    // Create a simple CSV content as fallback
    let csvContent = tableHeaders.join(',') + '\n';
    
    data.forEach(row => {
      const values = tableHeaders.map(header => {
        const value = row[header];
        // Handle values that might contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      });
      csvContent += values.join(',') + '\n';
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ExportButton
      onClick={exportTableToExcel}
      variant="inline"
      size="small"
      label=""
      className={`opacity-70 hover:opacity-100 ${className}`}
    />
  );
};

export default TableExportButton;