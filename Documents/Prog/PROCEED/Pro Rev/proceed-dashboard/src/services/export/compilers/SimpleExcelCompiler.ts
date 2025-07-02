import { UniversalExportRepresentation, ExportDocument } from '../core/types';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

// Dynamic import for XLSX
let XLSX: any = null;

export class SimpleExcelCompiler {
  async compile(uer: UniversalExportRepresentation): Promise<ExportDocument> {
    try {
      console.log('SimpleExcelCompiler - Starting compilation');
      
      // Dynamically import XLSX
      if (!XLSX) {
        XLSX = await import('xlsx');
      }
      
      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Extract dashboard data from DOM directly as fallback
      const dashboardData = this.extractDashboardData();
      
      // Create main sheet
      const ws = XLSX.utils.aoa_to_sheet(dashboardData);
      
      // Auto-size columns
      const colWidths = dashboardData[0]?.map((_, i) => ({ wch: 20 })) || [];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Dashboard Data');

      // Generate Excel buffer
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      
      // Create blob
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      return {
        format: 'excel',
        data: blob,
        filename: `proceed-dashboard-${new Date().toISOString().split('T')[0]}.xlsx`,
        size: buffer.byteLength,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    } catch (error) {
      console.error('SimpleExcelCompiler error:', error);
      throw new Error(`Excel export failed: ${error.message}`);
    }
  }

  private extractDashboardData(): any[][] {
    const data: any[][] = [
      ['Proceed Revenue Dashboard Export'],
      [`Generated: ${new Date().toLocaleString()}`],
      []
    ];

    try {
      // Extract metric cards - look for the actual class names used
      const metricCards = document.querySelectorAll('.bg-white.rounded-lg.shadow-sm.p-6, .dashboard-card');
      console.log('Found metric cards:', metricCards.length);
      
      if (metricCards.length > 0) {
        data.push(['Key Metrics']);
        data.push(['Metric', 'Value', 'Additional Info']);
        
        metricCards.forEach(card => {
          // Look for title in various possible locations
          const title = card.querySelector('h3, .text-sm.font-medium, .text-gray-500, .metric-label')?.textContent || 
                       card.querySelector('p')?.textContent || '';
          
          // Look for value in various formats
          const value = card.querySelector('.text-3xl, .text-2xl, .text-xl, .font-bold:not(h3), .metric-value')?.textContent || '';
          
          // Look for trend or additional info
          const trend = card.querySelector('.text-green-600, .text-red-600, .text-sm:not(.font-medium)')?.textContent || '';
          
          if (title || value) {
            data.push([title.trim(), value.trim(), trend.trim()]);
          }
        });
        data.push([]);
      }

      // Also check for specific metric patterns
      const specificMetrics = document.querySelectorAll('[class*="revenue"], [class*="cost"], [class*="profit"], [class*="target"]');
      console.log('Found specific metrics:', specificMetrics.length);

      // Extract tables - look for actual table elements and data-table class
      const tables = document.querySelectorAll('table, .data-table, [class*="table"]');
      console.log('Found tables:', tables.length);
      
      tables.forEach((table, index) => {
        // Skip if it's not actually a table-like structure
        if (!table.querySelector('tr, tbody, thead') && !table.querySelectorAll('[class*="row"]').length) {
          return;
        }
        
        const caption = table.closest('.dashboard-card')?.querySelector('h2, h3, .section-title')?.textContent || 
                       table.querySelector('caption')?.textContent ||
                       `Table ${index + 1}`;
        
        data.push([caption]);
        
        // Extract headers
        const headers: string[] = [];
        const headerElements = table.querySelectorAll('thead th, th, [class*="header"]');
        headerElements.forEach(th => {
          const text = th.textContent?.trim();
          if (text) headers.push(text);
        });
        if (headers.length > 0) {
          data.push(headers);
        }

        // Extract rows
        const rows = table.querySelectorAll('tbody tr, tr:not(:has(th))');
        rows.forEach(tr => {
          const row: string[] = [];
          const cells = tr.querySelectorAll('td, [class*="cell"]');
          cells.forEach(td => {
            const text = td.textContent?.trim();
            if (text) row.push(text);
          });
          if (row.length > 0) {
            data.push(row);
          }
        });
        
        data.push([]);
      });

      // Try to extract gauge/chart values
      const gauges = document.querySelectorAll('[class*="gauge"], [class*="chart"]');
      if (gauges.length > 0) {
        data.push(['Performance Indicators']);
        gauges.forEach(gauge => {
          const label = gauge.querySelector('[class*="label"], [class*="title"]')?.textContent || '';
          const value = gauge.querySelector('[class*="value"], [class*="percent"]')?.textContent || '';
          if (label && value) {
            data.push([label.trim(), value.trim()]);
          }
        });
        data.push([]);
      }

      // If still no data, try a more general approach
      if (data.length <= 3) {
        console.log('Trying general data extraction...');
        
        // Look for any structured data in the dashboard
        const dashboard = document.querySelector('[data-dashboard="true"], .space-y-6, main');
        if (dashboard) {
          data.push(['Dashboard Content']);
          data.push([]);
          
          // Extract all text content with structure
          const sections = dashboard.querySelectorAll('.dashboard-card, .bg-white.rounded-lg, [class*="card"]');
          sections.forEach((section, idx) => {
            const title = section.querySelector('h1, h2, h3, .font-bold, .font-semibold')?.textContent?.trim();
            if (title) {
              data.push([`Section ${idx + 1}: ${title}`]);
              
              // Get all text elements in this section
              const textElements = section.querySelectorAll('p, span, div');
              const extracted = new Set<string>();
              
              textElements.forEach(elem => {
                const text = elem.textContent?.trim();
                // Only add if it's meaningful and not already added
                if (text && text.length > 2 && text.length < 200 && !extracted.has(text)) {
                  // Check if it looks like a label-value pair
                  const parent = elem.parentElement;
                  const siblings = Array.from(parent?.children || []);
                  const myIndex = siblings.indexOf(elem);
                  
                  if (myIndex > 0 && siblings[myIndex - 1]?.textContent?.trim()) {
                    const label = siblings[myIndex - 1].textContent.trim();
                    if (label !== text) {
                      data.push([label, text]);
                      extracted.add(label);
                      extracted.add(text);
                    }
                  } else if (!extracted.has(text)) {
                    data.push([text]);
                    extracted.add(text);
                  }
                }
              });
              
              data.push([]);
            }
          });
        }
      }

      // Final check
      if (data.length <= 3) {
        data.push(['No dashboard data found to export']);
        data.push(['Please ensure the dashboard is loaded and try again']);
        data.push([]);
        data.push(['Debug Info:']);
        data.push(['URL:', window.location.href]);
        data.push(['Dashboard elements found:', document.querySelectorAll('[data-dashboard], .dashboard-card, table').length.toString()]);
      }

    } catch (error) {
      console.error('Error extracting dashboard data:', error);
      data.push(['Error extracting dashboard data']);
      data.push([error.message || 'Unknown error']);
    }

    return data;
  }
}

export default SimpleExcelCompiler;