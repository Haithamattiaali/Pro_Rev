const XLSX = require('xlsx');

class ExcelExportService {
  constructor() {
    this.brandColors = {
      primary: { argb: 'FF9E1F63' },
      primaryDark: { argb: 'FF721548' },
      secondary: { argb: 'FF424046' },
      accent: { argb: 'FF005B8C' },
      white: { argb: 'FFFFFFFF' }
    };
  }

  createWorkbook() {
    return XLSX.utils.book_new();
  }

  formatCurrency(value) {
    return value || 0;
  }

  formatPercentage(value) {
    return value || 0;
  }

  // Export Overview Data
  exportOverviewData(data) {
    const wb = this.createWorkbook();
    
    // Overview Sheet
    const overviewData = [
      ['PROCEED REVENUE DASHBOARD - OVERVIEW REPORT'],
      [`Period: ${data.period} ${data.year}`],
      [],
      ['Key Metrics'],
      ['Metric', 'Value'],
      ['Total Revenue', this.formatCurrency(data.overview.revenue)],
      ['Target', this.formatCurrency(data.overview.target)],
      ['Achievement', `${this.formatPercentage(data.overview.achievement)}%`],
      ['Total Cost', this.formatCurrency(data.overview.cost)],
      ['Gross Profit', this.formatCurrency(data.overview.profit)],
      ['Profit Margin', `${this.formatPercentage(data.overview.profitMargin)}%`],
      ['Receivables Collected', this.formatCurrency(data.overview.receivables)],
      ['Active Customers', data.overview.customerCount],
      ['Service Types', data.overview.serviceCount],
      [],
      ['Service Type Breakdown'],
      ['Service Type', 'Revenue', 'Target', 'Achievement %', 'Cost', 'Profit', 'Profit Margin %']
    ];

    // Add service breakdown data
    if (data.serviceBreakdown && data.serviceBreakdown.length > 0) {
      data.serviceBreakdown.forEach(service => {
        overviewData.push([
          service.service_type,
          this.formatCurrency(service.revenue),
          this.formatCurrency(service.target),
          `${this.formatPercentage(service.achievement_percentage)}%`,
          this.formatCurrency(service.cost),
          this.formatCurrency(service.revenue - service.cost),
          `${this.formatPercentage(service.revenue > 0 ? ((service.revenue - service.cost) / service.revenue) * 100 : 0)}%`
        ]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(overviewData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Service Type
      { wch: 15 }, // Revenue
      { wch: 15 }, // Target
      { wch: 15 }, // Achievement
      { wch: 15 }, // Cost
      { wch: 15 }, // Profit
      { wch: 15 }  // Profit Margin
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Overview');
    return wb;
  }

  // Export Business Unit Data
  exportBusinessUnitData(data, year, period) {
    const wb = this.createWorkbook();
    
    const buData = [
      ['PROCEED REVENUE DASHBOARD - BUSINESS UNIT REPORT'],
      [`Period: ${period} ${year}`],
      [],
      ['Business Unit', 'Revenue', 'Target', 'Achievement %', 'Cost', 'Profit', 'Profit Margin %', 'Customers', 'Receivables']
    ];

    // Add business unit data
    if (data && data.length > 0) {
      data.forEach(unit => {
        buData.push([
          unit.businessUnit,
          this.formatCurrency(unit.revenue),
          this.formatCurrency(unit.target),
          `${this.formatPercentage(unit.achievement)}%`,
          this.formatCurrency(unit.cost),
          this.formatCurrency(unit.profit),
          `${this.formatPercentage(unit.profitMargin)}%`,
          unit.customerCount,
          this.formatCurrency(unit.receivables)
        ]);
      });

      // Add totals row
      const totals = data.reduce((acc, unit) => ({
        revenue: acc.revenue + unit.revenue,
        target: acc.target + unit.target,
        cost: acc.cost + unit.cost,
        profit: acc.profit + unit.profit,
        customers: acc.customers + unit.customerCount,
        receivables: acc.receivables + unit.receivables
      }), { revenue: 0, target: 0, cost: 0, profit: 0, customers: 0, receivables: 0 });

      buData.push([]);
      buData.push([
        'TOTAL',
        this.formatCurrency(totals.revenue),
        this.formatCurrency(totals.target),
        `${this.formatPercentage(totals.target > 0 ? (totals.revenue / totals.target) * 100 : 0)}%`,
        this.formatCurrency(totals.cost),
        this.formatCurrency(totals.profit),
        `${this.formatPercentage(totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0)}%`,
        totals.customers,
        this.formatCurrency(totals.receivables)
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(buData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Business Unit
      { wch: 15 }, // Revenue
      { wch: 15 }, // Target
      { wch: 15 }, // Achievement
      { wch: 15 }, // Cost
      { wch: 15 }, // Profit
      { wch: 15 }, // Profit Margin
      { wch: 12 }, // Customers
      { wch: 15 }  // Receivables
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Business Units');
    return wb;
  }

  // Export Customer Data
  exportCustomerData(customerData, achievementData, serviceBreakdown, year, period) {
    const wb = this.createWorkbook();
    
    // Customer Performance Sheet
    const perfData = [
      ['PROCEED REVENUE DASHBOARD - CUSTOMER REPORT'],
      [`Period: ${period} ${year}`],
      [],
      ['Customer Performance'],
      ['Customer', 'Revenue', 'Target', 'Achievement %', 'Cost', 'Profit', 'Service Types', 'Receivables']
    ];

    if (customerData && customerData.length > 0) {
      customerData.forEach(customer => {
        perfData.push([
          customer.customer,
          this.formatCurrency(customer.revenue),
          this.formatCurrency(customer.target),
          `${this.formatPercentage(customer.achievement)}%`,
          this.formatCurrency(customer.cost),
          this.formatCurrency(customer.profit),
          customer.serviceCount,
          this.formatCurrency(customer.receivables)
        ]);
      });
    }

    const ws1 = XLSX.utils.aoa_to_sheet(perfData);
    ws1['!cols'] = [
      { wch: 30 }, // Customer
      { wch: 15 }, // Revenue
      { wch: 15 }, // Target
      { wch: 15 }, // Achievement
      { wch: 15 }, // Cost
      { wch: 15 }, // Profit
      { wch: 15 }, // Service Types
      { wch: 15 }  // Receivables
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Customer Performance');

    // Achievement Summary Sheet
    if (achievementData && achievementData.length > 0) {
      const achData = [
        ['Customer Achievement Summary'],
        [],
        ['Achievement Range', 'Customer Count', 'Total Revenue', 'Average Achievement %']
      ];

      achievementData.forEach(range => {
        achData.push([
          range.range,
          range.count,
          this.formatCurrency(range.revenue),
          `${this.formatPercentage(range.avgAchievement)}%`
        ]);
      });

      const ws2 = XLSX.utils.aoa_to_sheet(achData);
      ws2['!cols'] = [
        { wch: 20 }, // Range
        { wch: 15 }, // Count
        { wch: 15 }, // Revenue
        { wch: 20 }  // Avg Achievement
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'Achievement Summary');
    }

    // Service Type Breakdown Sheet
    if (serviceBreakdown && serviceBreakdown.length > 0) {
      const serviceData = [
        ['Customer Service Type Breakdown'],
        [],
        ['Service Type', 'Customer Count', 'Total Revenue', 'Total Target', 'Achievement %', 'Total Cost', 'Total Profit']
      ];

      serviceBreakdown.forEach(service => {
        serviceData.push([
          service.serviceType,
          service.customerCount,
          this.formatCurrency(service.revenue),
          this.formatCurrency(service.target),
          `${this.formatPercentage(service.achievement)}%`,
          this.formatCurrency(service.cost),
          this.formatCurrency(service.profit)
        ]);
      });

      const ws3 = XLSX.utils.aoa_to_sheet(serviceData);
      ws3['!cols'] = [
        { wch: 25 }, // Service Type
        { wch: 15 }, // Customer Count
        { wch: 15 }, // Revenue
        { wch: 15 }, // Target
        { wch: 15 }, // Achievement
        { wch: 15 }, // Cost
        { wch: 15 }  // Profit
      ];
      XLSX.utils.book_append_sheet(wb, ws3, 'Service Breakdown');
    }

    return wb;
  }

  // Export Monthly Trends Data
  exportMonthlyTrends(data, year) {
    const wb = this.createWorkbook();
    
    const trendData = [
      ['PROCEED REVENUE DASHBOARD - MONTHLY TRENDS'],
      [`Year: ${year}`],
      [],
      ['Month', 'Revenue', 'Target', 'Achievement %', 'Cost', 'Profit', 'Profit Margin %']
    ];

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (data && data.length > 0) {
      data.forEach(month => {
        trendData.push([
          month.name,
          this.formatCurrency(month.revenue),
          this.formatCurrency(month.target),
          `${this.formatPercentage(month.achievement)}%`,
          this.formatCurrency(month.cost),
          this.formatCurrency(month.profit),
          `${this.formatPercentage(month.profitMargin)}%`
        ]);
      });

      // Add totals
      const totals = data.reduce((acc, month) => ({
        revenue: acc.revenue + month.revenue,
        target: acc.target + month.target,
        cost: acc.cost + month.cost,
        profit: acc.profit + month.profit
      }), { revenue: 0, target: 0, cost: 0, profit: 0 });

      trendData.push([]);
      trendData.push([
        'TOTAL',
        this.formatCurrency(totals.revenue),
        this.formatCurrency(totals.target),
        `${this.formatPercentage(totals.target > 0 ? (totals.revenue / totals.target) * 100 : 0)}%`,
        this.formatCurrency(totals.cost),
        this.formatCurrency(totals.profit),
        `${this.formatPercentage(totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0)}%`
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(trendData);
    ws['!cols'] = [
      { wch: 12 }, // Month
      { wch: 15 }, // Revenue
      { wch: 15 }, // Target
      { wch: 15 }, // Achievement
      { wch: 15 }, // Cost
      { wch: 15 }, // Profit
      { wch: 15 }  // Profit Margin
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Trends');
    return wb;
  }

  // Export generic table data
  exportTableData(data, headers, title = 'Table Export') {
    const wb = this.createWorkbook();
    
    // Create sheet data
    const sheetData = [
      [title],
      [`Export Date: ${new Date().toLocaleDateString()}`],
      [],
      headers
    ];

    // Add data rows
    data.forEach(row => {
      const rowData = headers.map(header => {
        const value = row[header];
        // Format currencies and percentages
        if (header.toLowerCase().includes('revenue') || 
            header.toLowerCase().includes('cost') || 
            header.toLowerCase().includes('target') ||
            header.toLowerCase().includes('profit')) {
          return this.formatCurrency(value);
        } else if (header.toLowerCase().includes('achievement') || 
                   header.toLowerCase().includes('margin') ||
                   header.toLowerCase().includes('percentage')) {
          return `${this.formatPercentage(value)}%`;
        }
        return value;
      });
      sheetData.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Auto-size columns
    const colWidths = headers.map(header => ({ wch: Math.max(header.length + 5, 15) }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    return wb;
  }

  // Convert workbook to buffer
  workbookToBuffer(workbook) {
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  // Custom export methods for selective exports
  async exportCustomOverview(sections, period, data) {
    const wb = this.createWorkbook();
    
    if (sections.includes('summary')) {
      const summaryData = [
        ['PROCEED REVENUE DASHBOARD - OVERVIEW SUMMARY'],
        [`Period: ${period}`],
        [],
        ['Key Metrics'],
        ['Metric', 'Value'],
        ['Total Revenue', this.formatCurrency(data?.overview?.revenue)],
        ['Target', this.formatCurrency(data?.overview?.target)],
        ['Achievement', `${this.formatPercentage(data?.overview?.achievement)}%`],
        ['Total Cost', this.formatCurrency(data?.overview?.cost)],
        ['Gross Profit', this.formatCurrency(data?.overview?.profit)],
        ['Profit Margin', `${this.formatPercentage(data?.overview?.profitMargin)}%`]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(summaryData);
      ws['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    }
    
    if (sections.includes('serviceBreakdown') && data?.serviceBreakdown) {
      const serviceData = [
        ['Service Type Breakdown'],
        [],
        ['Service Type', 'Revenue', 'Target', 'Achievement %', 'Cost', 'Profit']
      ];
      
      data.serviceBreakdown.forEach(service => {
        serviceData.push([
          service.service_type,
          this.formatCurrency(service.revenue),
          this.formatCurrency(service.target),
          `${this.formatPercentage(service.achievement_percentage)}%`,
          this.formatCurrency(service.cost),
          this.formatCurrency(service.revenue - service.cost)
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(serviceData);
      ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Service Breakdown');
    }
    
    if (sections.includes('monthlyTrends') && data?.monthlyTrends) {
      const trendData = [
        ['Monthly Trends'],
        [],
        ['Month', 'Revenue', 'Target', 'Achievement %']
      ];
      
      data.monthlyTrends.forEach(month => {
        trendData.push([
          month.name,
          this.formatCurrency(month.revenue),
          this.formatCurrency(month.target),
          `${this.formatPercentage(month.achievement)}%`
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(trendData);
      ws['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Monthly Trends');
    }
    
    return wb;
  }

  async exportCustomBusinessUnits(sections, period, data) {
    const wb = this.createWorkbook();
    
    if (sections.includes('performance') && data?.businessUnits) {
      const perfData = [
        ['Business Unit Performance'],
        [`Period: ${period}`],
        [],
        ['Business Unit', 'Revenue', 'Cost', 'Gross Profit', 'Profit Margin %']
      ];
      
      data.businessUnits.forEach(unit => {
        perfData.push([
          unit.businessUnit,
          this.formatCurrency(unit.revenue),
          this.formatCurrency(unit.cost),
          this.formatCurrency(unit.profit),
          `${this.formatPercentage(unit.profitMargin)}%`
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(perfData);
      ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Performance');
    }
    
    if (sections.includes('achievements') && data?.businessUnits) {
      const achData = [
        ['Achievement Analysis'],
        [],
        ['Business Unit', 'Target', 'Actual', 'Achievement %']
      ];
      
      data.businessUnits.forEach(unit => {
        achData.push([
          unit.businessUnit,
          this.formatCurrency(unit.target),
          this.formatCurrency(unit.revenue),
          `${this.formatPercentage(unit.achievement)}%`
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(achData);
      ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Achievements');
    }
    
    if (sections.includes('monthlyBreakdown') && data?.monthlyBreakdown) {
      const monthlyData = [
        ['Monthly Breakdown'],
        [],
        ['Month', 'Business Unit', 'Revenue', 'Cost', 'Profit']
      ];
      
      data.monthlyBreakdown.forEach(item => {
        monthlyData.push([
          item.month,
          item.businessUnit,
          this.formatCurrency(item.revenue),
          this.formatCurrency(item.cost),
          this.formatCurrency(item.profit)
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(monthlyData);
      ws['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Monthly Breakdown');
    }
    
    return wb;
  }

  async exportCustomCustomers(sections, period, data) {
    const wb = this.createWorkbook();
    
    if (sections.includes('topCustomers') && data?.topCustomers) {
      const topData = [
        ['Top Customers'],
        [`Period: ${period}`],
        [],
        ['Customer', 'Revenue', 'Target', 'Achievement %', 'Profit']
      ];
      
      data.topCustomers.forEach(customer => {
        topData.push([
          customer.customer,
          this.formatCurrency(customer.revenue),
          this.formatCurrency(customer.target),
          `${this.formatPercentage(customer.achievement)}%`,
          this.formatCurrency(customer.profit)
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(topData);
      ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Top Customers');
    }
    
    if (sections.includes('serviceBreakdown') && data?.serviceBreakdown) {
      const serviceData = [
        ['Customer Service Analysis'],
        [],
        ['Service Type', 'Customer Count', 'Total Revenue', 'Total Profit']
      ];
      
      data.serviceBreakdown.forEach(service => {
        serviceData.push([
          service.serviceType,
          service.customerCount,
          this.formatCurrency(service.revenue),
          this.formatCurrency(service.profit)
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(serviceData);
      ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Service Analysis');
    }
    
    if (sections.includes('allCustomers') && data?.allCustomers) {
      const allData = [
        ['All Customers'],
        [],
        ['Customer', 'Revenue', 'Target', 'Achievement %', 'Cost', 'Profit', 'Service Types']
      ];
      
      data.allCustomers.forEach(customer => {
        allData.push([
          customer.customer,
          this.formatCurrency(customer.revenue),
          this.formatCurrency(customer.target),
          `${this.formatPercentage(customer.achievement)}%`,
          this.formatCurrency(customer.cost),
          this.formatCurrency(customer.profit),
          customer.serviceCount || 0
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(allData);
      ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws, 'All Customers');
    }
    
    if (sections.includes('achievements') && data?.achievements) {
      const achData = [
        ['Achievement Analysis'],
        [],
        ['Achievement Range', 'Customer Count', 'Total Revenue']
      ];
      
      data.achievements.forEach(range => {
        achData.push([
          range.range,
          range.count,
          this.formatCurrency(range.revenue)
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(achData);
      ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Achievements');
    }
    
    return wb;
  }
}

module.exports = new ExcelExportService();