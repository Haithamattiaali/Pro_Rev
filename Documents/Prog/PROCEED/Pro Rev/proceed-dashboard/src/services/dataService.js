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
      case 'QTD':
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
      case 'YTD':
      default:
        monthStart = 1;
        monthEnd = maxMonth;
        break;
    }
    
    return Object.entries(monthMap)
      .filter(([name, num]) => num >= monthStart && num <= monthEnd)
      .map(([name]) => name);
  }
}

export default new DataService();