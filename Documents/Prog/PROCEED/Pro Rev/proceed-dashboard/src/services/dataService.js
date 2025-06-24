import apiService from './api.service';

class DataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  getCacheKey(method, ...args) {
    return `${method}_${args.join('_')}`;
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

  async getOverviewData(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null) {
    const key = this.getCacheKey('overview', year, period, month, quarter);
    return this.getCachedData(key, () => apiService.getOverviewData(year, period, month, quarter));
  }

  async getBusinessUnitData(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null) {
    const key = this.getCacheKey('businessUnits', year, period, month, quarter);
    return this.getCachedData(key, () => apiService.getBusinessUnitData(year, period, month, quarter));
  }

  async getCustomerData(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null) {
    const key = this.getCacheKey('customers', year, period, month, quarter);
    return this.getCachedData(key, () => apiService.getCustomerData(year, period, month, quarter));
  }

  async getMonthlyTrends(year = new Date().getFullYear()) {
    const key = this.getCacheKey('monthlyTrends', year);
    return this.getCachedData(key, () => apiService.getMonthlyTrends(year));
  }

  async getCustomerAchievement(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null) {
    const key = this.getCacheKey('customerAchievement', year, period, month, quarter);
    return this.getCachedData(key, () => apiService.getCustomerAchievement(year, period, month, quarter));
  }

  async getAvailableYears() {
    const key = this.getCacheKey('years');
    return this.getCachedData(key, () => apiService.getAvailableYears());
  }

  clearCache() {
    this.cache.clear();
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
  getPeriodLabel(period) {
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
}

export default new DataService();