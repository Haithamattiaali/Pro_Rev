import apiService from './api.service';

class DataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  clearCache() {
    console.log('🗑️ DataService: Clearing all cached data');
    this.cache.clear();
  }

  getCacheKey(method, ...args) {
    // Handle arrays in cache keys
    const processedArgs = args.map(arg => {
      if (Array.isArray(arg)) {
        return arg.sort().join(',');
      }
      return arg;
    });
    return `${method}_${processedArgs.join('_')}`;
  }

  async getCachedData(key, fetcher) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  async getOverviewData(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null, multiSelectParams = null) {
    const key = multiSelectParams 
      ? this.getCacheKey('overview', multiSelectParams.years, multiSelectParams.periods, multiSelectParams.viewMode)
      : this.getCacheKey('overview', year, period, month, quarter);
    return this.getCachedData(key, () => apiService.getOverviewData(year, period, month, quarter, multiSelectParams));
  }

  async getBusinessUnitData(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null, multiSelectParams = null) {
    const key = multiSelectParams 
      ? this.getCacheKey('businessUnits', multiSelectParams.years, multiSelectParams.periods, multiSelectParams.viewMode)
      : this.getCacheKey('businessUnits', year, period, month, quarter);
    return this.getCachedData(key, () => apiService.getBusinessUnitData(year, period, month, quarter, multiSelectParams));
  }

  async getCustomerData(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null, multiSelectParams = null) {
    const key = multiSelectParams 
      ? this.getCacheKey('customers', multiSelectParams.years, multiSelectParams.periods, multiSelectParams.viewMode)
      : this.getCacheKey('customers', year, period, month, quarter);
    return this.getCachedData(key, () => apiService.getCustomerData(year, period, month, quarter, multiSelectParams));
  }

  async getMonthlyTrends(year = new Date().getFullYear(), serviceType = null) {
    const key = this.getCacheKey('monthlyTrends', year, serviceType);
    return this.getCachedData(key, () => apiService.getMonthlyTrends(year, serviceType));
  }

  async getCustomerAchievement(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null) {
    const key = this.getCacheKey('customerAchievement', year, period, month, quarter);
    return this.getCachedData(key, () => apiService.getCustomerAchievement(year, period, month, quarter));
  }

  async getCustomerServiceBreakdown(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null) {
    const key = this.getCacheKey('customerServiceBreakdown', year, period, month, quarter);
    return this.getCachedData(key, () => apiService.getCustomerServiceBreakdown(year, period, month, quarter));
  }

  async getAvailableYears() {
    const key = this.getCacheKey('years');
    return this.getCachedData(key, () => apiService.getAvailableYears());
  }

  // Format currency
  formatCurrency(value) {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  // Format percentage
  formatPercentage(value) {
    return `${(value || 0).toFixed(1)}%`;
  }

  // Calculate achievement percentage
  calculateAchievement(actual, target) {
    if (!target || target === 0) return 0;
    return (actual / target) * 100;
  }

  // Get period label
  getPeriodLabel(period, month = null, quarter = null) {
    // Month names
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    if (period === 'MTD' && month) {
      return monthNames[month - 1] || 'Month to Date';
    }
    
    if (period === 'QTD' && quarter) {
      return `Q${quarter}`;
    }
    
    const labels = {
      MTD: 'Month to Date',
      QTD: 'Quarter to Date',
      YTD: 'Year to Date'
    };
    return labels[period] || period;
  }

  // Get current period based on date
  getCurrentPeriod() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    
    return {
      month,
      quarter,
      year: now.getFullYear(),
      monthName: now.toLocaleString('en-US', { month: 'short' }),
      quarterName: `Q${quarter}`
    };
  }

  // Get period months based on year, period type, and optional month/quarter
  getPeriodMonths(year, period, month = null, quarter = null) {
    const monthMap = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    let monthStart, monthEnd;
    
    // Adjust for current year vs past years
    const maxMonth = year < currentYear ? 12 : currentMonth;
    
    switch (period) {
      case 'MTD':
        // If specific month is provided, use it; otherwise use current/max month
        if (month && month !== 'all') {
          monthStart = month;
          monthEnd = month;
        } else if (month === 'all') {
          monthStart = 1;
          monthEnd = maxMonth;
        } else {
          monthStart = maxMonth;
          monthEnd = maxMonth;
        }
        break;
      case 'QTD': {
        // If specific quarter is provided, use it; otherwise use current quarter
        let targetQuarter;
        if (quarter && quarter !== 'all') {
          targetQuarter = quarter;
        } else if (quarter === 'all') {
          monthStart = 1;
          monthEnd = maxMonth;
          break;
        } else {
          targetQuarter = Math.ceil(maxMonth / 3);
        }
        monthStart = (targetQuarter - 1) * 3 + 1;
        monthEnd = Math.min(targetQuarter * 3, maxMonth);
        break;
      }
      case 'YTD':
      default:
        monthStart = 1;
        monthEnd = maxMonth;
        break;
    }
    
    return Object.entries(monthMap)
      .filter(([_name, num]) => num >= monthStart && num <= monthEnd)
      .map(([name]) => name);
  }

  // Forecast methods
  async getForecastData(params) {
    // If params is just a year (legacy), convert to object
    if (typeof params === 'number') {
      params = { year: params };
    }
    
    const cacheKey = `forecast-${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, () => apiService.getForecastData(params));
  }

  async generateForecast(params) {
    const result = await apiService.generateForecast(params);
    // Clear all forecast cache entries
    Object.keys(this.cache).forEach(key => {
      if (key.startsWith('forecast-')) {
        delete this.cache[key];
      }
    });
    return result;
  }

  async getForecastOpportunities() {
    const cacheKey = 'forecast-opportunities';
    return this.getCachedData(cacheKey, () => apiService.getForecastOpportunities());
  }

  async createForecastOpportunity(opportunity) {
    const result = await apiService.createForecastOpportunity(opportunity);
    // Clear opportunities cache
    delete this.cache['forecast-opportunities'];
    return result;
  }

  async updateForecastOpportunity(id, updates) {
    const result = await apiService.updateForecastOpportunity(id, updates);
    // Clear opportunities cache
    delete this.cache['forecast-opportunities'];
    return result;
  }

  async deleteForecastOpportunity(id) {
    const result = await apiService.deleteForecastOpportunity(id);
    // Clear opportunities cache
    delete this.cache['forecast-opportunities'];
    return result;
  }

  async getForecastConfig() {
    const cacheKey = 'forecast-config';
    return this.getCachedData(cacheKey, () => apiService.getForecastConfig());
  }

  async updateForecastConfig(config) {
    const result = await apiService.updateForecastConfig(config);
    // Clear config cache
    delete this.cache['forecast-config'];
    return result;
  }

  async exportForecast(year) {
    return apiService.exportForecast(year);
  }

  // Sales Plan methods
  async getSalesPlanOverview(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null, serviceType = null, multiSelectParams = null) {
    if (multiSelectParams && multiSelectParams.periods?.length > 0) {
      const key = this.getCacheKey('salesPlanOverviewMulti', JSON.stringify(multiSelectParams), serviceType);
      return this.getCachedData(key, () => apiService.getSalesPlanOverview(year, period, month, quarter, serviceType, multiSelectParams));
    }
    const key = this.getCacheKey('salesPlanOverview', year, period, month, quarter, serviceType);
    return this.getCachedData(key, () => apiService.getSalesPlanOverview(year, period, month, quarter, serviceType));
  }

  async getSalesPlanMonthly(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null, serviceType = null, multiSelectParams = null) {
    if (multiSelectParams && multiSelectParams.periods?.length > 0) {
      const key = this.getCacheKey('salesPlanMonthlyMulti', JSON.stringify(multiSelectParams), serviceType);
      return this.getCachedData(key, () => apiService.getSalesPlanMonthly(year, period, month, quarter, serviceType, multiSelectParams));
    }
    const key = this.getCacheKey('salesPlanMonthly', year, period, month, quarter, serviceType);
    return this.getCachedData(key, () => apiService.getSalesPlanMonthly(year, period, month, quarter, serviceType));
  }

  async getSalesPlanByGL(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null, serviceType = null, multiSelectParams = null) {
    if (multiSelectParams && multiSelectParams.periods?.length > 0) {
      const key = this.getCacheKey('salesPlanByGLMulti', JSON.stringify(multiSelectParams), serviceType);
      return this.getCachedData(key, () => apiService.getSalesPlanByGL(year, period, month, quarter, serviceType, multiSelectParams));
    }
    const key = this.getCacheKey('salesPlanByGL', year, period, month, quarter, serviceType);
    return this.getCachedData(key, () => apiService.getSalesPlanByGL(year, period, month, quarter, serviceType));
  }

  async getOpportunities(filters = {}) {
    const key = this.getCacheKey('opportunities', JSON.stringify(filters));
    return this.getCachedData(key, () => apiService.getOpportunities(filters));
  }

  async getOpportunitiesByStatus() {
    const key = this.getCacheKey('opportunitiesByStatus');
    return this.getCachedData(key, () => apiService.getOpportunitiesByStatus());
  }

  async getOpportunitiesByService() {
    const key = this.getCacheKey('opportunitiesByService');
    return this.getCachedData(key, () => apiService.getOpportunitiesByService());
  }

  async getOpportunitiesByLocation() {
    const key = this.getCacheKey('opportunitiesByLocation');
    return this.getCachedData(key, () => apiService.getOpportunitiesByLocation());
  }

  async getOpportunitiesPipeline() {
    const key = this.getCacheKey('opportunitiesPipeline');
    return this.getCachedData(key, () => apiService.getOpportunitiesPipeline());
  }

  async getOpportunitiesInsights() {
    const key = this.getCacheKey('opportunitiesInsights');
    return this.getCachedData(key, () => apiService.getOpportunitiesInsights());
  }

  async getOpportunitiesPipelineByStatus() {
    const key = this.getCacheKey('opportunitiesPipelineByStatus');
    return this.getCachedData(key, () => apiService.getOpportunitiesPipelineByStatus());
  }

  async getOpportunitiesServiceAnalysis() {
    const key = this.getCacheKey('opportunitiesServiceAnalysis');
    return this.getCachedData(key, () => apiService.getOpportunitiesServiceAnalysis());
  }

  async getOpportunitiesMatrix() {
    const key = this.getCacheKey('opportunitiesMatrix');
    return this.getCachedData(key, () => apiService.getOpportunitiesMatrix());
  }

  // Get analysis period validation for a specific year
  async getAnalysisPeriodValidation(year) {
    const key = this.getCacheKey('validation', year);
    return this.getCachedData(key, () => apiService.getAnalysisPeriodValidation(year));
  }
}

export default new DataService();