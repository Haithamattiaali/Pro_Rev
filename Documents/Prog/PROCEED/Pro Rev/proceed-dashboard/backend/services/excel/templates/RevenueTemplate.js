const BaseTemplate = require('./BaseTemplate');

/**
 * RevenueTemplate - Specialized template for revenue reports
 * Extends BaseTemplate with revenue-specific formatting and sections
 */
class RevenueTemplate extends BaseTemplate {
  constructor(config = {}) {
    super({
      reportPrefix: 'Revenue Dashboard',
      includeCharts: true,
      includeAnalysis: true,
      ...config
    });

    // Revenue-specific configurations
    this.revenueConfig = {
      achievementThresholds: {
        excellent: 100,
        good: 80,
        warning: 60,
        critical: 0
      },
      profitMarginThresholds: {
        excellent: 30,
        good: 20,
        warning: 10,
        critical: 0
      }
    };
  }

  /**
   * Create overview report
   * @param {Object} data - Overview data
   * @param {Object} options - Report options
   * @returns {RevenueTemplate} - Returns this for chaining
   */
  createOverviewReport(data, options = {}) {
    this.initialize(options)
      .createSheet('Overview')
      .addReportHeader('Overview Report', {
        period: data.period,
        year: data.year,
        filters: options.filters
      });

    // Key Metrics Summary
    this.addSummarySection('Key Performance Indicators', [
      { label: 'Total Revenue', value: data.overview?.revenue, format: 'currency' },
      { label: 'Target', value: data.overview?.target, format: 'currency' },
      { label: 'Achievement', value: data.overview?.achievement, format: 'percentage' },
      { label: 'Total Cost', value: data.overview?.cost, format: 'currency' },
      { label: 'Gross Profit', value: data.overview?.profit, format: 'currency' },
      { label: 'Profit Margin', value: data.overview?.profitMargin, format: 'percentage' },
      { label: 'Receivables Collected', value: data.overview?.receivables, format: 'currency' },
      { label: 'Active Customers', value: data.overview?.customerCount, format: 'number' },
      { label: 'Service Types', value: data.overview?.serviceCount, format: 'number' }
    ]);

    this.builder.addEmptyRows(2);

    // Service Type Breakdown
    if (data.serviceBreakdown && data.serviceBreakdown.length > 0) {
      const serviceHeaders = [
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

      this.addDataSection(
        'Service Type Performance',
        serviceHeaders,
        serviceData,
        {
          includeTotals: true,
          colorCodePercentages: true,
          sumColumns: ['Revenue', 'Target', 'Cost', 'Profit']
        }
      );
    }

    // Add monthly trends if available
    if (data.monthlyTrends && options.includeCharts) {
      this.builder.addEmptyRows(2);
      this.addChart({
        title: 'Monthly Revenue Trends',
        type: 'line',
        data: data.monthlyTrends
      });
    }

    return this;
  }

  /**
   * Create business unit report
   * @param {Array} data - Business unit data
   * @param {Object} options - Report options
   * @returns {RevenueTemplate} - Returns this for chaining
   */
  createBusinessUnitReport(data, options = {}) {
    this.initialize(options)
      .createSheet('Business Units')
      .addReportHeader('Business Unit Performance', {
        period: options.period,
        year: options.year
      });

    const headers = [
      'Business Unit',
      'Revenue',
      'Target',
      'Achievement %',
      'Cost',
      'Profit',
      'Profit Margin %',
      'Customers',
      'Receivables'
    ];

    const formattedData = data.map(unit => ({
      'Business Unit': unit.businessUnit,
      'Revenue': unit.revenue,
      'Target': unit.target,
      'Achievement %': unit.achievement,
      'Cost': unit.cost,
      'Profit': unit.profit,
      'Profit Margin %': unit.profitMargin,
      'Customers': unit.customerCount,
      'Receivables': unit.receivables
    }));

    this.addDataSection(
      null, // No section title needed
      headers,
      formattedData,
      {
        includeTotals: true,
        colorCodePercentages: true,
        sumColumns: ['Revenue', 'Target', 'Cost', 'Profit', 'Receivables']
      }
    );

    // Add analysis section if enabled
    if (this.config.includeAnalysis) {
      this._addBusinessUnitAnalysis(data);
    }

    return this;
  }

  /**
   * Create customer report with multiple sheets
   * @param {Object} data - Customer data object
   * @param {Object} options - Report options
   * @returns {RevenueTemplate} - Returns this for chaining
   */
  createCustomerReport(data, options = {}) {
    this.initialize(options);

    // Sheet 1: Customer Performance
    if (data.customers && data.customers.length > 0) {
      this.createSheet('Customer Performance')
        .addReportHeader('Customer Performance Analysis', {
          period: options.period,
          year: options.year
        });

      const customerHeaders = [
        'Customer',
        'Revenue',
        'Target',
        'Achievement %',
        'Cost',
        'Profit',
        'Profit Margin %',
        'Service Types',
        'Receivables'
      ];

      const formattedCustomers = data.customers.map(customer => ({
        'Customer': customer.customer,
        'Revenue': customer.revenue,
        'Target': customer.target,
        'Achievement %': customer.achievement,
        'Cost': customer.cost,
        'Profit': customer.profit,
        'Profit Margin %': customer.revenue > 0 ? (customer.profit / customer.revenue) * 100 : 0,
        'Service Types': customer.serviceCount,
        'Receivables': customer.receivables
      }));

      this.addDataSection(
        null,
        customerHeaders,
        formattedCustomers,
        {
          includeTotals: true,
          colorCodePercentages: true
        }
      );
    }

    // Sheet 2: Achievement Analysis
    if (data.achievementRanges && data.achievementRanges.length > 0) {
      this.createSheet('Achievement Analysis')
        .addReportHeader('Customer Achievement Distribution', {
          period: options.period,
          year: options.year
        });

      const achievementHeaders = [
        'Achievement Range',
        'Customer Count',
        'Total Revenue',
        'Average Achievement %',
        '% of Total Customers'
      ];

      const totalCustomers = data.achievementRanges.reduce((sum, range) => sum + range.count, 0);
      
      const formattedAchievements = data.achievementRanges.map(range => ({
        'Achievement Range': range.range,
        'Customer Count': range.count,
        'Total Revenue': range.revenue,
        'Average Achievement %': range.avgAchievement,
        '% of Total Customers': totalCustomers > 0 ? (range.count / totalCustomers) * 100 : 0
      }));

      this.addDataSection(
        null,
        achievementHeaders,
        formattedAchievements,
        {
          colorCodePercentages: true
        }
      );

      // Add pie chart placeholder
      if (options.includeCharts) {
        this.addChart({
          title: 'Customer Distribution by Achievement',
          type: 'pie',
          data: formattedAchievements
        });
      }
    }

    // Sheet 3: Service Type Analysis
    if (data.serviceBreakdown && data.serviceBreakdown.length > 0) {
      this.createSheet('Service Analysis')
        .addReportHeader('Customer Service Type Analysis', {
          period: options.period,
          year: options.year
        });

      const serviceHeaders = [
        'Service Type',
        'Customer Count',
        'Total Revenue',
        'Total Target',
        'Achievement %',
        'Total Cost',
        'Total Profit',
        'Avg Profit Margin %'
      ];

      const formattedServices = data.serviceBreakdown.map(service => ({
        'Service Type': service.serviceType,
        'Customer Count': service.customerCount,
        'Total Revenue': service.revenue,
        'Total Target': service.target,
        'Achievement %': service.achievement,
        'Total Cost': service.cost,
        'Total Profit': service.profit,
        'Avg Profit Margin %': service.revenue > 0 ? (service.profit / service.revenue) * 100 : 0
      }));

      this.addDataSection(
        null,
        serviceHeaders,
        formattedServices,
        {
          includeTotals: true,
          colorCodePercentages: true,
          sumColumns: ['Total Revenue', 'Total Target', 'Total Cost', 'Total Profit']
        }
      );
    }

    return this;
  }

  /**
   * Create monthly trends report
   * @param {Array} data - Monthly trends data
   * @param {Object} options - Report options
   * @returns {RevenueTemplate} - Returns this for chaining
   */
  createTrendsReport(data, options = {}) {
    this.initialize(options)
      .createSheet('Monthly Trends')
      .addReportHeader('Monthly Performance Trends', {
        year: options.year
      });

    const headers = [
      'Month',
      'Revenue',
      'Target',
      'Achievement %',
      'Cost',
      'Profit',
      'Profit Margin %',
      'YoY Growth %'
    ];

    const formattedData = data.map((month, index) => ({
      'Month': month.name,
      'Revenue': month.revenue,
      'Target': month.target,
      'Achievement %': month.achievement,
      'Cost': month.cost,
      'Profit': month.profit,
      'Profit Margin %': month.profitMargin,
      'YoY Growth %': month.yoyGrowth || 0
    }));

    this.addDataSection(
      null,
      headers,
      formattedData,
      {
        includeTotals: true,
        colorCodePercentages: true
      }
    );

    // Add trend analysis
    if (this.config.includeAnalysis) {
      this._addTrendAnalysis(data);
    }

    // Add charts
    if (options.includeCharts) {
      this.builder.addEmptyRows(2);
      
      // Revenue vs Target chart
      this.addChart({
        title: 'Revenue vs Target Trend',
        type: 'column',
        data: data.map(m => ({
          month: m.name,
          revenue: m.revenue,
          target: m.target
        }))
      });

      // Profit margin trend
      this.addChart({
        title: 'Profit Margin Trend',
        type: 'line',
        data: data.map(m => ({
          month: m.name,
          profitMargin: m.profitMargin
        }))
      });
    }

    return this;
  }

  // Private methods for analysis sections

  _addBusinessUnitAnalysis(data) {
    this.builder.addEmptyRows(2);
    
    // Performance summary
    const topPerformers = data
      .filter(unit => unit.achievement >= this.revenueConfig.achievementThresholds.excellent)
      .sort((a, b) => b.achievement - a.achievement)
      .slice(0, 5);

    const underPerformers = data
      .filter(unit => unit.achievement < this.revenueConfig.achievementThresholds.warning)
      .sort((a, b) => a.achievement - b.achievement)
      .slice(0, 5);

    if (topPerformers.length > 0) {
      this.addDataSection(
        'Top Performing Business Units',
        ['Business Unit', 'Achievement %', 'Revenue'],
        topPerformers.map(unit => ({
          'Business Unit': unit.businessUnit,
          'Achievement %': unit.achievement,
          'Revenue': unit.revenue
        })),
        { colorCodePercentages: true }
      );
    }

    if (underPerformers.length > 0) {
      this.builder.addEmptyRows(2);
      this.addDataSection(
        'Units Requiring Attention',
        ['Business Unit', 'Achievement %', 'Gap to Target'],
        underPerformers.map(unit => ({
          'Business Unit': unit.businessUnit,
          'Achievement %': unit.achievement,
          'Gap to Target': unit.target - unit.revenue
        })),
        { colorCodePercentages: true }
      );
    }
  }

  _addTrendAnalysis(data) {
    this.builder.addEmptyRows(2);

    // Calculate key metrics
    const avgRevenue = data.reduce((sum, m) => sum + m.revenue, 0) / data.length;
    const avgAchievement = data.reduce((sum, m) => sum + m.achievement, 0) / data.length;
    const totalRevenue = data.reduce((sum, m) => sum + m.revenue, 0);
    const totalTarget = data.reduce((sum, m) => sum + m.target, 0);

    // Best and worst months
    const bestMonth = data.reduce((best, month) => 
      month.revenue > best.revenue ? month : best
    );
    const worstMonth = data.reduce((worst, month) => 
      month.revenue < worst.revenue ? month : worst
    );

    this.addSummarySection('Trend Analysis', [
      { label: 'Average Monthly Revenue', value: avgRevenue, format: 'currency' },
      { label: 'Average Achievement', value: avgAchievement, format: 'percentage' },
      { label: 'Total Annual Revenue', value: totalRevenue, format: 'currency' },
      { label: 'Total Annual Target', value: totalTarget, format: 'currency' },
      { label: 'Best Month', value: `${bestMonth.name} (${this.formatter.formatCurrency(bestMonth.revenue).v})`, format: 'text' },
      { label: 'Worst Month', value: `${worstMonth.name} (${this.formatter.formatCurrency(worstMonth.revenue).v})`, format: 'text' }
    ]);
  }

  /**
   * Override formatting for revenue-specific rules
   */
  _formatCellValue(value, header, options) {
    // For now, disable special formatting until we properly integrate it
    // Just return the base formatted value
    return super._formatCellValue(value, header, options);
  }

  _getProfitMarginColor(value) {
    const thresholds = this.revenueConfig.profitMarginThresholds;
    if (value >= thresholds.excellent) {
      return { rgb: this.formatter.brandColors.success };
    } else if (value >= thresholds.good) {
      return { rgb: this.formatter.brandColors.accentBlue };
    } else if (value >= thresholds.warning) {
      return { rgb: this.formatter.brandColors.warning };
    } else {
      return { rgb: this.formatter.brandColors.error };
    }
  }
}

module.exports = RevenueTemplate;