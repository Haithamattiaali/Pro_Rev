import connectionManager from './connectionManager';

class ApiService {
  constructor() {
    // Start health checks when service is initialized
    connectionManager.startHealthChecks();
  }

  async request(endpoint, options = {}) {
    try {
      // Ensure connection before making request
      await connectionManager.ensureConnection();
      
      // Use connection manager for requests with retry logic
      return await connectionManager.requestWithRetry(endpoint, options);
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Overview data
  async getOverviewData(year, period = 'YTD', month = null, quarter = null) {
    let url = `/overview?year=${year}&period=${period}`;
    if (month !== null) url += `&month=${month}`;
    if (quarter !== null) url += `&quarter=${quarter}`;
    return this.request(url);
  }

  // Business unit data
  async getBusinessUnitData(year, period = 'YTD', month = null, quarter = null) {
    let url = `/business-units?year=${year}&period=${period}`;
    if (month !== null) url += `&month=${month}`;
    if (quarter !== null) url += `&quarter=${quarter}`;
    return this.request(url);
  }

  // Customer data
  async getCustomerData(year, period = 'YTD', month = null, quarter = null) {
    let url = `/customers?year=${year}&period=${period}`;
    if (month !== null) url += `&month=${month}`;
    if (quarter !== null) url += `&quarter=${quarter}`;
    return this.request(url);
  }

  // Monthly trends
  async getMonthlyTrends(year, serviceType = null) {
    let url = `/trends/monthly?year=${year}`;
    if (serviceType) url += `&serviceType=${encodeURIComponent(serviceType)}`;
    return this.request(url);
  }

  // Customer achievement
  async getCustomerAchievement(year, period = 'YTD', month = null, quarter = null) {
    let url = `/customers/achievement?year=${year}&period=${period}`;
    if (month !== null) url += `&month=${month}`;
    if (quarter !== null) url += `&quarter=${quarter}`;
    return this.request(url);
  }

  // Customer service breakdown
  async getCustomerServiceBreakdown(year, period = 'YTD', month = null, quarter = null) {
    let url = `/customers/service-breakdown?year=${year}&period=${period}`;
    if (month !== null) url += `&month=${month}`;
    if (quarter !== null) url += `&quarter=${quarter}`;
    return this.request(url);
  }

  // Available years
  async getAvailableYears() {
    return this.request('/years');
  }

  // Upload Excel file
  async uploadExcelFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type - let browser set it for FormData
      }
    });
  }

  // Health check
  async checkHealth() {
    return this.request('/health');
  }
}

export default new ApiService();