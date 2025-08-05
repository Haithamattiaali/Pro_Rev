import React from 'react';
import { useExport } from '../../contexts/ExportContext';

export default function TestExportButton() {
  const { exportDashboard, isExporting, exportError } = useExport();

  const handleTestExport = async () => {
    console.log('🧪 Test export button clicked!');
    try {
      const result = await exportDashboard('pdf');
      console.log('🧪 Test export result:', result);
    } catch (error) {
      console.error('🧪 Test export error:', error);
    }
  };

  return (
    <button
      onClick={handleTestExport}
      disabled={isExporting}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
    >
      {isExporting ? 'Testing...' : 'Test Export'}
      {exportError && <span className="ml-2 text-red-200">Error!</span>}
    </button>
  );
}