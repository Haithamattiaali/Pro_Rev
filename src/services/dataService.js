import apiService from './api.service';
import { lastCompliantMonthService } from './lastCompliantMonthService';

class DataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes (increased from 5)
    this.staleTimeout = 60 * 60 * 1000; // 1 hour - data is considered stale but usable
    this.prefetchQueue = new Set();
    this.loadingStates = new Map(); // Track loading states per endpoint
    this.cacheStats = { hits: 0, misses: 0, staleServed: 0 };
    
    // Log cache initialization
    console.log('🗄️ DataService: Cache initialized', {
      environment: import.meta.env.MODE,
      cacheTimeout: '30 minutes',
      staleTimeout: '60 minutes',
      timestamp: new Date().toISOString()
    });
    
    // Initialize cache warming on startup
    setTimeout(() => this.warmCache(), 1000);
  }

  clearCache() {
    console.log('🗑️ DataService: Clearing all cached data');
    this.cache.clear();
    this.loadingStates.clear();
    // Also clear the last compliant month cache
    lastCompliantMonthService.clearCache();
  }

  getCacheKey(method, ...args) {
    // Handle arrays in cache keys
    const processedArgs = args.map(arg => {
      if (Array.isArray(arg)) {
        return arg.sort().join(',');
      }
      if (typeof arg === 'object' && arg !== null) {
        // Normalize object keys to ensure consistent serialization
        return JSON.stringify(arg, Object.keys(arg).sort());
      }
      return arg;
    });
    const key = `${method}_${processedArgs.join('_')}`;
    
    // Debug logging in production
    if (import.meta.env.PROD) {
      console.log(`[Cache] Generated key: ${key.substring(0, 50)}...`);
    }
    
    return key;
  }

  // Enhanced cache with stale-while-revalidate pattern - now returns metadata
  async getCachedData(key, fetcher, options = {}) {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    // Check if we have fresh cached data
    if (cached && (now - cached.timestamp < this.cacheTimeout)) {
      this.cacheStats.hits++;
      console.log(`✅ Cache hit for ${key}`);
      if (import.meta.env.PROD) {
        console.log(`[Cache] Hit stats:`, {
          key: key.substring(0, 30),
          age: Math.round((now - cached.timestamp) / 1000) + 's',
          totalHits: this.cacheStats.hits,
          hitRate: this.getCacheStats().hitRate
        });
      }
      return {
        data: cached.data,
        isFromCache: true,
        isFresh: true,
        age: now - cached.timestamp
      };
    }
    
    // Check if we have stale but usable data
    if (cached && (now - cached.timestamp < this.staleTimeout) && !options.forceFresh) {
      this.cacheStats.staleServed++;
      console.log(`♻️ Serving stale data for ${key}, refreshing in background`);
      
      // Refresh in background without blocking
      this.refreshInBackground(key, fetcher);
      
      return {
        data: cached.data,
        isFromCache: true,
        isFresh: false,
        age: now - cached.timestamp
      };
    }
    
    // No cache or too stale - need to fetch
    this.cacheStats.misses++;
    console.log(`❌ Cache miss for ${key}`);
    if (import.meta.env.PROD) {
      console.log(`[Cache] Miss stats:`, {
        key: key.substring(0, 30),
        cacheSize: this.cache.size,
        totalMisses: this.cacheStats.misses,
        hitRate: this.getCacheStats().hitRate
      });
    }
    
    // Check if already loading this endpoint
    if (this.loadingStates.has(key)) {
      console.log(`⏳ Already loading ${key}, waiting...`);
      const data = await this.loadingStates.get(key);
      // Check if data was cached while we were waiting
      const newCached = this.cache.get(key);
      if (newCached) {
        return {
          data,
          isFromCache: true,
          isFresh: true,
          age: Date.now() - newCached.timestamp
        };
      }
      return {
        data,
        isFromCache: false,
        isFresh: true,
        age: 0
      };
    }
    
    // Create loading promise
    const loadingPromise = this.fetchWithRetry(key, fetcher);
    this.loadingStates.set(key, loadingPromise);
    
    try {
      const data = await loadingPromise;
      return {
        data,
        isFromCache: false,
        isFresh: true,
        age: 0
      };
    } finally {
      this.loadingStates.delete(key);
    }
  }
  
  async fetchWithRetry(key, fetcher) {
    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // If we have any cached data (even very stale), return it
      const cached = this.cache.get(key);
      if (cached) {
        console.log(`🔄 Returning stale cache due to error for ${key}`);
        return cached.data;
      }
      
      // Return empty arrays for list endpoints to prevent errors
      if (key.includes('customers') || key.includes('businessUnits') || key.includes('trends') || 
          key.includes('achievement') || key.includes('breakdown') || key.includes('opportunities') ||
          key.includes('years')) {
        return [];
      }
      // Return empty object for other endpoints
      return {};
    }
  }
  
  async refreshInBackground(key, fetcher) {
    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      console.log(`✅ Background refresh completed for ${key}`);
    } catch (error) {
      console.error(`Background refresh failed for ${key}:`, error);
    }
  }
  
  // Warm cache with commonly accessed data
  async warmCache() {
    console.log('🔥 Warming cache with common data...');
    const currentYear = new Date().getFullYear();
    
    try {
      // Prefetch common data patterns
      const warmupPromises = [
        // Overview data for current year
        this.getOverviewData(currentYear, 'YTD'),
        this.getOverviewData(currentYear, 'QTD'),
        this.getOverviewData(currentYear, 'MTD'),
        
        // Business unit data
        this.getBusinessUnitData(currentYear, 'YTD'),
        
        // Customer data
        this.getCustomerData(currentYear, 'YTD'),
        
        // Available years
        this.getAvailableYears(),
        
        // Monthly trends
        this.getMonthlyTrends(currentYear)
      ];
      
      await Promise.all(warmupPromises);
      console.log('✅ Cache warming completed');
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }
  
  // Get cache statistics
  getCacheStats() {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0 ? (this.cacheStats.hits / totalRequests * 100).toFixed(1) : 0;
    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size
    };
  }
  
  // Prefetch data for adjacent periods
  async prefetchAdjacentPeriods(year, period, month, quarter) {
    console.log('🔮 Prefetching adjacent periods...');
    
    const prefetchPromises = [];
    
    // Prefetch adjacent months for MTD
    if (period === 'MTD' && month) {
      if (month > 1) {
        prefetchPromises.push(this.getOverviewData(year, 'MTD', month - 1));
      }
      if (month < 12) {
        prefetchPromises.push(this.getOverviewData(year, 'MTD', month + 1));
      }
    }
    
    // Prefetch adjacent quarters for QTD
    if (period === 'QTD' && quarter) {
      if (quarter > 1) {
        prefetchPromises.push(this.getOverviewData(year, 'QTD', null, quarter - 1));
      }
      if (quarter < 4) {
        prefetchPromises.push(this.getOverviewData(year, 'QTD', null, quarter + 1));
      }
    }
    
    // Always prefetch other period types
    const periods = ['MTD', 'QTD', 'YTD'].filter(p => p !== period);
    periods.forEach(p => {
      prefetchPromises.push(this.getOverviewData(year, p));
    });
    
    // Execute prefetch in background
    Promise.all(prefetchPromises).catch(err => {
      console.error('Prefetch error:', err);
    });
  }

  // New method that returns cache metadata along with data
  async getOverviewDataWithCache(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null, multiSelectParams = null) {
    if (import.meta.env.PROD) {
      console.log('[DataService] getOverviewDataWithCache called:', {
        year, period, month, quarter,
        hasMultiSelect: !!multiSelectParams,
        multiSelectParams: multiSelectParams ? JSON.stringify(multiSelectParams).substring(0, 100) : null
      });
    }
    const key = multiSelectParams 
      ? this.getCacheKey('overview', multiSelectParams.years, multiSelectParams.periods, multiSelectParams.viewMode)
      : this.getCacheKey('overview', year, period, month, quarter);
    return this.getCachedData(key, () => apiService.getOverviewData(year, period, month, quarter, multiSelectParams));
  }

  // Original method for backward compatibility
  async getOverviewData(year = new Date().getFullYear(), period = 'YTD', month = null, quarter = null, multiSelectParams = null) {
    const result = await this.getOverviewDataWithCache(year, period, month, quarter, multiSelectParams);
    return result.data;
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
    // Handle null, undefined, or non-numeric values consistently
    const numValue = value == null ? 0 : Number(value);
    
    // Handle NaN and Infinity cases
    if (!isFinite(numValue)) {
      return '0.0%';
    }
    
    return `${numValue.toFixed(1)}%`;
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
  // Updated to handle multi-select scenarios
  getPeriodMonths(year, period, month = null, quarter = null, multiSelectData = null) {
    const monthMap = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    
    // Handle multi-select mode
    if (multiSelectData && multiSelectData.multiSelectMode) {
      const months = [];
      
      // Handle multi-select quarters
      if (multiSelectData.selectedQuarters && multiSelectData.selectedQuarters.length > 0) {
        multiSelectData.selectedQuarters.forEach(q => {
          const startMonth = (q - 1) * 3 + 1;
          const endMonth = q * 3;
          for (let m = startMonth; m <= endMonth; m++) {
            const monthName = Object.entries(monthMap).find(([_, num]) => num === m)?.[0];
            if (monthName && !months.includes(monthName)) {
              months.push(monthName);
            }
          }
        });
        // Sort months chronologically
        return months.sort((a, b) => monthMap[a] - monthMap[b]);
      }
      
      // Handle multi-select months
      if (multiSelectData.selectedMonths && multiSelectData.selectedMonths.length > 0) {
        multiSelectData.selectedMonths.forEach(m => {
          const monthName = Object.entries(monthMap).find(([_, num]) => num === m)?.[0];
          if (monthName && !months.includes(monthName)) {
            months.push(monthName);
          }
        });
        // Sort months chronologically
        return months.sort((a, b) => monthMap[a] - monthMap[b]);
      }
    }
    
    // Original logic for non-multi-select mode
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

  // Wrapper methods for lastCompliantMonthService
  async getLastCompliantMonth(year) {
    return lastCompliantMonthService.getLastCompliantMonth(year);
  }

  async getDataAvailabilityDisplay(year) {
    return lastCompliantMonthService.getDataAvailabilityDisplay(year);
  }

  clearCacheForYear(year) {
    // Clear dataService cache for year
    const keysToDelete = [];
    for (const [key, value] of this.cache.entries()) {
      if (key.includes(`_${year}_`) || key.endsWith(`_${year}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    
    // Also clear last compliant month cache for year
    lastCompliantMonthService.clearCacheForYear(year);
  }
}

export default new DataService();