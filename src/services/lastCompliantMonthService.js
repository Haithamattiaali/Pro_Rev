import api from './api.service';

/**
 * Service to determine the last compliant month from uploaded data
 * This replaces system date logic with data-aware logic for YTD/QTD/MTD filters
 */
class LastCompliantMonthService {
  constructor() {
    // Cache with 5-minute TTL
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  /**
   * Get the last compliant month for a given year
   * @param {number} year - The year to check
   * @returns {Promise<{month: string, monthNumber: number, hasData: boolean}>}
   */
  async getLastCompliantMonth(year) {
    const cacheKey = `lastCompliant_${year}`;
    const cached = this.cache.get(cacheKey);

    // Return cached value if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      // Fetch validation data from API
      const validation = await api.getAnalysisValidation(year);
      
      // Process the validation data
      const result = this.processValidationData(validation);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Failed to get last compliant month for year ${year}:`, error);
      
      // Return default if API fails
      return {
        month: null,
        monthNumber: null,
        hasData: false,
        error: error.message
      };
    }
  }

  /**
   * Process validation data to extract last compliant month
   * @private
   */
  processValidationData(validation) {
    if (!validation || !validation.compliantMonths || validation.compliantMonths.length === 0) {
      return {
        month: null,
        monthNumber: null,
        hasData: false
      };
    }

    // Get the last compliant month from the array
    const lastMonth = validation.analysisPeriod?.end || validation.compliantMonths[validation.compliantMonths.length - 1];
    const monthNumber = this.getMonthNumber(lastMonth);

    return {
      month: lastMonth,
      monthNumber: monthNumber,
      hasData: true,
      compliantMonths: validation.compliantMonths,
      isComplete: validation.analysisPeriod?.isComplete || false
    };
  }

  /**
   * Convert month name to number (1-12)
   * @private
   */
  getMonthNumber(monthName) {
    const monthMap = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    return monthMap[monthName] || null;
  }

  /**
   * Get month name from number (1-12)
   * @private
   */
  getMonthName(monthNumber) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNumber - 1] || null;
  }

  /**
   * Clear the cache (call after data upload)
   */
  clearCache() {
    this.cache.clear();
    console.log('LastCompliantMonthService cache cleared');
  }

  /**
   * Clear cache for specific year
   */
  clearCacheForYear(year) {
    const cacheKey = `lastCompliant_${year}`;
    this.cache.delete(cacheKey);
    console.log(`LastCompliantMonthService cache cleared for year ${year}`);
  }

  /**
   * Get all compliant months for a year
   * @param {number} year - The year to check
   * @returns {Promise<string[]>} Array of compliant month names
   */
  async getCompliantMonths(year) {
    const result = await this.getLastCompliantMonth(year);
    return result.compliantMonths || [];
  }

  /**
   * Check if a specific month has data
   * @param {number} year - The year to check
   * @param {string} month - Month name (e.g., 'Jan', 'Feb')
   * @returns {Promise<boolean>}
   */
  async hasMonthData(year, month) {
    const result = await this.getLastCompliantMonth(year);
    return result.compliantMonths?.includes(month) || false;
  }

  /**
   * Get the quarter number for the last compliant month
   * @param {number} year - The year to check
   * @returns {Promise<number|null>} Quarter number (1-4) or null
   */
  async getLastCompliantQuarter(year) {
    const result = await this.getLastCompliantMonth(year);
    if (!result.monthNumber) return null;
    
    return Math.ceil(result.monthNumber / 3);
  }

  /**
   * Check if we're in a partial quarter (not all 3 months have data)
   * @param {number} year - The year to check
   * @returns {Promise<boolean>}
   */
  async isPartialQuarter(year) {
    const result = await this.getLastCompliantMonth(year);
    if (!result.hasData) return false;

    const lastQuarter = await this.getLastCompliantQuarter(year);
    if (!lastQuarter) return false;

    // Get months in the last quarter
    const quarterMonths = this.getQuarterMonths(lastQuarter);
    const compliantQuarterMonths = quarterMonths.filter(month => 
      result.compliantMonths.includes(month)
    );

    return compliantQuarterMonths.length < 3;
  }

  /**
   * Get month names for a quarter
   * @private
   */
  getQuarterMonths(quarter) {
    const quarters = {
      1: ['Jan', 'Feb', 'Mar'],
      2: ['Apr', 'May', 'Jun'],
      3: ['Jul', 'Aug', 'Sep'],
      4: ['Oct', 'Nov', 'Dec']
    };
    return quarters[quarter] || [];
  }

  /**
   * Get display information for the last compliant period
   * @param {number} year - The year to check
   * @returns {Promise<{text: string, tooltip: string}>}
   */
  async getDataAvailabilityDisplay(year) {
    const result = await this.getLastCompliantMonth(year);
    
    if (!result.hasData) {
      return {
        text: 'No data available',
        tooltip: `No compliant data found for ${year}. Please upload data.`,
        hasData: false
      };
    }

    const isPartial = await this.isPartialQuarter(year);
    const quarterNum = await this.getLastCompliantQuarter(year);
    
    return {
      text: `Data through ${result.month} ${year}`,
      tooltip: isPartial 
        ? `Q${quarterNum} is partial - only data through ${result.month}`
        : `Complete data available through ${result.month} ${year}`,
      hasData: true,
      lastMonth: result.month,
      isPartialQuarter: isPartial
    };
  }
}

// Export singleton instance
export const lastCompliantMonthService = new LastCompliantMonthService();

// Also export the class for testing
export default LastCompliantMonthService;