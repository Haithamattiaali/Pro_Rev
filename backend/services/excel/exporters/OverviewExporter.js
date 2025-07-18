const RevenueTemplate = require('../templates/RevenueTemplate');
const exportConfig = require('../utils/exportConfig');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');

/**
 * OverviewExporter - Handles overview report exports using the new architecture
 * Demonstrates the sustainable approach with separation of concerns
 */
class OverviewExporter {
  constructor(dataService) {
    this.dataService = dataService;
  }

  /**
   * Export overview data
   * @param {Object} params - Export parameters
   * @returns {Promise<Buffer>} - Excel file buffer
   */
  async export(params) {
    try {
      // Validate request
      const validation = exportConfig.validateExportRequest(params);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Get configuration
      const config = exportConfig.getConfig('overview', params.config);

      // Fetch data
      const data = await this._fetchData(params);
      
      // Check if data exists
      if (!data || !data.overview) {
        throw new Error(ERROR_MESSAGES.noData);
      }

      // Create a fresh template instance for each export
      const template = new RevenueTemplate();
      
      // Create report using template
      template.createOverviewReport(data, {
        period: params.period,
        year: params.year,
        filters: this._getActiveFilters(params),
        ...config.options
      });

      // Generate filename
      const filename = exportConfig.getFilename('overview', params);

      // Build and return buffer
      const buffer = template.buildAsBuffer();
      
      return {
        buffer,
        filename,
        message: SUCCESS_MESSAGES.exportComplete
      };

    } catch (error) {
      console.error('Overview export error:', error);
      throw error;
    }
  }

  /**
   * Export custom overview sections
   * @param {Object} params - Export parameters with section selection
   * @returns {Promise<Buffer>} - Excel file buffer
   */
  async exportCustom(params) {
    try {
      const { sections = [], data: providedData } = params;
      
      // Use provided data or fetch it
      const data = providedData || await this._fetchData(params);
      
      // Create a fresh template instance
      const template = new RevenueTemplate();
      
      // Initialize template
      template.initialize(params.config || {});
      
      // Create custom sheet
      template.createSheet('Custom Overview');
      
      // Add report header
      template.addReportHeader('Custom Overview Export', {
        period: params.period,
        year: params.year,
        exportDate: new Date()
      });

      // Add selected sections
      for (const section of sections) {
        await this._addSection(section, data, params, template);
      }

      // Generate filename
      const filename = exportConfig.getFilename('custom', {
        ...params,
        type: 'overview'
      });

      // Build and return
      const buffer = template.buildAsBuffer();
      
      return {
        buffer,
        filename,
        message: SUCCESS_MESSAGES.exportComplete
      };

    } catch (error) {
      console.error('Custom overview export error:', error);
      throw error;
    }
  }

  // Private helper methods

  async _fetchData(params) {
    const { year, period, month, quarter } = params;
    
    return await this.dataService.getOverviewData(
      parseInt(year),
      period,
      month ? (month === 'all' ? 'all' : parseInt(month)) : null,
      quarter ? (quarter === 'all' ? 'all' : parseInt(quarter)) : null
    );
  }

  _getActiveFilters(params) {
    const filters = {};
    
    if (params.period) filters.Period = params.period;
    if (params.month) filters.Month = params.month;
    if (params.quarter) filters.Quarter = `Q${params.quarter}`;
    if (params.serviceType) filters['Service Type'] = params.serviceType;
    
    return filters;
  }

  async _addSection(section, data, params, template) {
    switch (section) {
      case 'summary':
        this._addSummarySection(data, template);
        break;
        
      case 'serviceBreakdown':
        this._addServiceBreakdownSection(data, template);
        break;
        
      case 'monthlyTrends':
        await this._addMonthlyTrendsSection(data, params, template);
        break;
        
      case 'keyMetrics':
        this._addKeyMetricsSection(data, template);
        break;
        
      case 'analysis':
        this._addAnalysisSection(data, template);
        break;
        
      default:
        console.warn(`Unknown section: ${section}`);
    }
    
    // Add spacing between sections
    template.builder.addEmptyRows(2);
  }

  _addSummarySection(data) {
    this.template.addSummarySection('Executive Summary', [
      { label: 'Total Revenue', value: data.overview?.revenue, format: 'currency' },
      { label: 'Target Achievement', value: data.overview?.achievement, format: 'percentage' },
      { label: 'Gross Profit', value: data.overview?.profit, format: 'currency' },
      { label: 'Profit Margin', value: data.overview?.profitMargin, format: 'percentage' },
      { label: 'Active Customers', value: data.overview?.customerCount, format: 'number' }
    ]);
  }

  _addServiceBreakdownSection(data) {
    if (!data.serviceBreakdown || data.serviceBreakdown.length === 0) {
      return;
    }

    const headers = [
      'Service Type',
      'Revenue',
      'Target',
      'Achievement %',
      'Cost',
      'Profit',
      'Profit Margin %'
    ];

    const serviceData = data.serviceBreakdown.map(service => ({
      'Service Type': service.service_type,
      'Revenue': service.revenue,
      'Target': service.target,
      'Achievement %': service.achievement_percentage,
      'Cost': service.cost,
      'Profit': service.revenue - service.cost,
      'Profit Margin %': service.revenue > 0 ? ((service.revenue - service.cost) / service.revenue) * 100 : 0
    }));

    template.addDataSection(
      'Service Type Performance',
      headers,
      serviceData,
      {
        includeTotals: true,
        colorCodePercentages: true,
        sumColumns: ['Revenue', 'Target', 'Cost', 'Profit']
      }
    );
  }

  async _addMonthlyTrendsSection(data, params) {
    // Fetch monthly trends if not included in overview data
    const trendsData = data.monthlyTrends || 
      await this.dataService.getMonthlyTrends(parseInt(params.year));

    if (!trendsData || trendsData.length === 0) {
      return;
    }

    const headers = [
      'Month',
      'Revenue',
      'Target',
      'Achievement %',
      'Profit',
      'Profit Margin %'
    ];

    const formattedTrends = trendsData.map(month => ({
      'Month': month.name,
      'Revenue': month.revenue,
      'Target': month.target,
      'Achievement %': month.achievement,
      'Profit': month.profit,
      'Profit Margin %': month.profitMargin
    }));

    template.addDataSection(
      'Monthly Performance Trends',
      headers,
      formattedTrends,
      {
        includeTotals: true,
        colorCodePercentages: true
      }
    );
  }

  _addKeyMetricsSection(data) {
    // Add a visual key metrics section
    const metrics = [
      {
        metric: 'Revenue vs Target',
        actual: data.overview?.revenue || 0,
        target: data.overview?.target || 0,
        variance: (data.overview?.revenue || 0) - (data.overview?.target || 0),
        status: (data.overview?.achievement || 0) >= 100 ? 'On Track' : 'Below Target'
      },
      {
        metric: 'Profit Performance',
        actual: data.overview?.profit || 0,
        target: (data.overview?.revenue || 0) * 0.2, // Assuming 20% target margin
        variance: (data.overview?.profit || 0) - ((data.overview?.revenue || 0) * 0.2),
        status: (data.overview?.profitMargin || 0) >= 20 ? 'Healthy' : 'Needs Attention'
      }
    ];

    const headers = ['Key Metric', 'Actual', 'Target', 'Variance', 'Status'];
    
    template.addDataSection(
      'Key Performance Metrics',
      headers,
      metrics.map(m => ({
        'Key Metric': m.metric,
        'Actual': m.actual,
        'Target': m.target,
        'Variance': m.variance,
        'Status': m.status
      })),
      {
        colorCodePercentages: false
      }
    );
  }

  _addAnalysisSection(data) {
    const analysis = [];

    // Achievement analysis
    if (data.overview?.achievement < 80) {
      analysis.push({
        'Finding': 'Revenue Achievement Below Target',
        'Impact': 'High',
        'Recommendation': 'Focus on high-margin services and customer retention'
      });
    }

    // Profit margin analysis
    if (data.overview?.profitMargin < 15) {
      analysis.push({
        'Finding': 'Low Profit Margins',
        'Impact': 'Medium',
        'Recommendation': 'Review cost structure and pricing strategy'
      });
    }

    // Service mix analysis
    if (data.serviceBreakdown && data.serviceBreakdown.length > 0) {
      const underperforming = data.serviceBreakdown.filter(s => s.achievement_percentage < 60);
      if (underperforming.length > 0) {
        analysis.push({
          'Finding': `${underperforming.length} services underperforming`,
          'Impact': 'Medium',
          'Recommendation': 'Evaluate service portfolio and resource allocation'
        });
      }
    }

    if (analysis.length > 0) {
      template.addDataSection(
        'Performance Analysis',
        ['Finding', 'Impact', 'Recommendation'],
        analysis
      );
    }
  }
}

module.exports = OverviewExporter;