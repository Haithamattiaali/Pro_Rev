const XLSX = require('xlsx');

class PowerPointExportService {
  constructor() {
    // Simple configuration for PowerPoint compatibility
    this.defaultOptions = {
      bookType: 'xlsx',
      type: 'buffer',
      cellStyles: false, // Disable complex styles
      bookSST: false,    // No shared strings for better compatibility
      compression: false // No compression
    };
  }

  createWorkbook() {
    return XLSX.utils.book_new();
  }

  // Format numbers as plain text with thousand separators
  formatNumber(value, decimals = 0) {
    const num = Number(value || 0);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  // Format percentages as plain text
  formatPercentage(value, decimals = 1) {
    const num = Number(value || 0);
    return num.toFixed(decimals) + '%';
  }

  // Export Overview Data for PowerPoint
  exportOverviewForPowerPoint(data) {
    const wb = this.createWorkbook();
    
    // Simple data array - all as strings for PowerPoint
    const overviewData = [
      ['PROCEED REVENUE DASHBOARD - OVERVIEW'],
      [`Period: ${data.period} ${data.year}`],
      [],
      ['KEY METRICS'],
      [],
      ['Total Revenue', this.formatNumber(data.overview.revenue)],
      ['Target', this.formatNumber(data.overview.target)],
      ['Achievement', this.formatPercentage(data.overview.achievement)],
      ['Total Cost', this.formatNumber(data.overview.cost)],
      ['Gross Profit', this.formatNumber(data.overview.profit)],
      ['Profit Margin', this.formatPercentage(data.overview.profitMargin)],
      ['Receivables Collected', this.formatNumber(data.overview.receivables)],
      ['Active Customers', String(data.overview.customerCount)],
      ['Service Types', String(data.overview.serviceCount)],
      [],
      ['SERVICE TYPE BREAKDOWN'],
      ['Service Type', 'Revenue', 'Target', 'Achievement', 'Cost', 'Profit', 'Margin']
    ];

    // Add service breakdown
    if (data.serviceBreakdown && data.serviceBreakdown.length > 0) {
      data.serviceBreakdown.forEach(service => {
        const profit = service.revenue - service.cost;
        const margin = service.revenue > 0 ? (profit / service.revenue) * 100 : 0;
        
        overviewData.push([
          service.service_type,
          this.formatNumber(service.revenue),
          this.formatNumber(service.target),
          this.formatPercentage(service.achievement_percentage),
          this.formatNumber(service.cost),
          this.formatNumber(profit),
          this.formatPercentage(margin)
        ]);
      });
    }

    // Convert to sheet - all cells as text
    const ws = XLSX.utils.aoa_to_sheet(overviewData, { 
      raw: false, // Force string conversion
      dateNF: 'mm/dd/yyyy'
    });
    
    // Simple column widths
    ws['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Overview');
    return wb;
  }

  // Export Business Units for PowerPoint
  exportBusinessUnitsForPowerPoint(data, year, period) {
    const wb = this.createWorkbook();
    
    const buData = [
      ['BUSINESS UNIT PERFORMANCE'],
      [`${period} ${year}`],
      [],
      ['Business Unit', 'Revenue', 'Target', 'Achievement', 'Cost', 'Profit', 'Margin', 'Customers']
    ];

    if (data && data.length > 0) {
      // Add data rows
      data.forEach(unit => {
        buData.push([
          unit.businessUnit,
          this.formatNumber(unit.revenue),
          this.formatNumber(unit.target),
          this.formatPercentage(unit.achievement),
          this.formatNumber(unit.cost),
          this.formatNumber(unit.profit),
          this.formatPercentage(unit.profitMargin),
          String(unit.customerCount)
        ]);
      });

      // Add totals
      const totals = data.reduce((acc, unit) => ({
        revenue: acc.revenue + unit.revenue,
        target: acc.target + unit.target,
        cost: acc.cost + unit.cost,
        profit: acc.profit + unit.profit,
        customers: acc.customers + unit.customerCount
      }), { revenue: 0, target: 0, cost: 0, profit: 0, customers: 0 });

      buData.push([]);
      buData.push([
        'TOTAL',
        this.formatNumber(totals.revenue),
        this.formatNumber(totals.target),
        this.formatPercentage(totals.target > 0 ? (totals.revenue / totals.target) * 100 : 0),
        this.formatNumber(totals.cost),
        this.formatNumber(totals.profit),
        this.formatPercentage(totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0),
        String(totals.customers)
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(buData, { raw: false });
    
    ws['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Business Units');
    return wb;
  }

  // Export Customer Data for PowerPoint
  exportCustomersForPowerPoint(topCustomers, serviceBreakdown, year, period) {
    const wb = this.createWorkbook();
    
    // Top Customers Sheet
    const customerData = [
      ['TOP CUSTOMERS'],
      [`${period} ${year}`],
      [],
      ['Customer', 'Revenue', 'Target', 'Achievement', 'Profit', 'Services']
    ];

    if (topCustomers && topCustomers.length > 0) {
      topCustomers.forEach(customer => {
        customerData.push([
          customer.customer,
          this.formatNumber(customer.revenue),
          this.formatNumber(customer.target),
          this.formatPercentage(customer.achievement),
          this.formatNumber(customer.profit),
          String(customer.serviceCount || 0)
        ]);
      });
    }

    const ws1 = XLSX.utils.aoa_to_sheet(customerData, { raw: false });
    ws1['!cols'] = [
      { wch: 35 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Top Customers');

    // Service Analysis Sheet
    if (serviceBreakdown && serviceBreakdown.length > 0) {
      const serviceData = [
        ['SERVICE TYPE ANALYSIS'],
        [],
        ['Service Type', 'Customers', 'Revenue', 'Profit']
      ];

      serviceBreakdown.forEach(service => {
        serviceData.push([
          service.serviceType,
          String(service.customerCount),
          this.formatNumber(service.revenue),
          this.formatNumber(service.profit)
        ]);
      });

      const ws2 = XLSX.utils.aoa_to_sheet(serviceData, { raw: false });
      ws2['!cols'] = [
        { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'Service Analysis');
    }

    return wb;
  }

  // Export Monthly Trends for PowerPoint
  exportTrendsForPowerPoint(data, year) {
    const wb = this.createWorkbook();
    
    const trendData = [
      ['MONTHLY TRENDS'],
      [`Year: ${year}`],
      [],
      ['Month', 'Revenue', 'Target', 'Achievement', 'Profit', 'Margin']
    ];

    if (data && data.length > 0) {
      data.forEach(month => {
        trendData.push([
          month.name,
          this.formatNumber(month.revenue),
          this.formatNumber(month.target),
          this.formatPercentage(month.achievement),
          this.formatNumber(month.profit),
          this.formatPercentage(month.profitMargin)
        ]);
      });

      // YTD Totals
      const totals = data.reduce((acc, month) => ({
        revenue: acc.revenue + month.revenue,
        target: acc.target + month.target,
        profit: acc.profit + month.profit
      }), { revenue: 0, target: 0, profit: 0 });

      trendData.push([]);
      trendData.push([
        'YTD TOTAL',
        this.formatNumber(totals.revenue),
        this.formatNumber(totals.target),
        this.formatPercentage(totals.target > 0 ? (totals.revenue / totals.target) * 100 : 0),
        this.formatNumber(totals.profit),
        this.formatPercentage(totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0)
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(trendData, { raw: false });
    ws['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Trends');
    return wb;
  }

  // Generic table export for PowerPoint
  exportTableForPowerPoint(data, headers, title = 'Data Export') {
    const wb = this.createWorkbook();
    
    const sheetData = [
      [title.toUpperCase()],
      [`Export Date: ${new Date().toLocaleDateString()}`],
      [],
      headers
    ];

    // Add data rows - all as formatted strings
    data.forEach(row => {
      const rowData = headers.map(header => {
        const value = row[header];
        
        // Format based on header name
        if (header.toLowerCase().includes('revenue') || 
            header.toLowerCase().includes('cost') || 
            header.toLowerCase().includes('target') ||
            header.toLowerCase().includes('profit') ||
            header.toLowerCase().includes('receivables')) {
          return this.formatNumber(value);
        } else if (header.toLowerCase().includes('achievement') || 
                   header.toLowerCase().includes('margin') ||
                   header.toLowerCase().includes('percentage')) {
          return this.formatPercentage(value);
        } else if (typeof value === 'number') {
          return String(value);
        }
        
        return String(value || '');
      });
      sheetData.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData, { raw: false });
    
    // Auto-size columns
    const colWidths = headers.map(header => ({ 
      wch: Math.max(header.length + 5, 15) 
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    return wb;
  }

  // Convert workbook to buffer
  workbookToBuffer(workbook) {
    return XLSX.write(workbook, this.defaultOptions);
  }
}

module.exports = new PowerPointExportService();