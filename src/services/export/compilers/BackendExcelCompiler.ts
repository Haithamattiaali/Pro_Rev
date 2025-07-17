import { UniversalExportRepresentation, ExportDocument } from '../core/types';
import exportService from '../../exportService';

/**
 * BackendExcelCompiler - Uses the new sustainable Excel export backend system
 * Instead of generating Excel client-side, this delegates to the backend
 * which uses the new modular Excel architecture
 */
export class BackendExcelCompiler {
  async compile(uer: UniversalExportRepresentation, context?: any): Promise<ExportDocument> {
    try {
      console.log('BackendExcelCompiler - Starting compilation with context:', context);
      
      // Extract context information
      const { periodFilter, exportType = 'overview' } = context || {};
      
      if (!periodFilter) {
        throw new Error('Period filter context is required for Excel export');
      }

      const { year, period, month, quarter } = periodFilter;
      
      // Determine export type based on current page or context
      let exportEndpoint: string;
      let filename: string;
      
      // Check current route to determine export type
      const currentPath = window.location.pathname;
      
      if (currentPath.includes('business-units') || exportType === 'businessUnits') {
        exportEndpoint = 'business-units';
        filename = `proceed-business-units-${period}-${year}.xlsx`;
      } else if (currentPath.includes('customers') || exportType === 'customers') {
        exportEndpoint = 'customers';
        filename = `proceed-customers-${period}-${year}.xlsx`;
      } else if (currentPath.includes('trends') || exportType === 'trends') {
        exportEndpoint = 'trends';
        filename = `proceed-trends-${year}.xlsx`;
      } else if (currentPath.includes('sales-plan') || exportType === 'salesPlan') {
        exportEndpoint = 'sales-plan';
        filename = `proceed-sales-plan-${period}-${year}.xlsx`;
      } else {
        // Default to overview
        exportEndpoint = 'overview';
        filename = `proceed-overview-${period}-${year}.xlsx`;
      }
      
      // Use direct export method to get the blob
      const blob = await this.directExport(exportEndpoint, year, period, month, quarter);
      
      return {
        format: 'excel',
        data: blob,
        filename,
        size: blob.size,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
      
    } catch (error) {
      console.error('BackendExcelCompiler error:', error);
      throw new Error(`Excel export failed: ${error.message}`);
    }
  }


  /**
   * Alternative approach: Direct API call without using exportService
   * This gives us more control over the response handling
   */
  private async directExport(
    exportType: string, 
    year: number, 
    period: string, 
    month?: number | null, 
    quarter?: number | null
  ): Promise<Blob> {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const params = new URLSearchParams();
    
    params.append('year', year.toString());
    params.append('period', period);
    if (month) params.append('month', month.toString());
    if (quarter) params.append('quarter', quarter.toString());
    
    const response = await fetch(`${baseURL}/export/${exportType}?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Export failed: ${errorText}`);
    }
    
    return await response.blob();
  }
}