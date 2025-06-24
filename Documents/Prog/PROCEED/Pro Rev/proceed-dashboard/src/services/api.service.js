const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Overview data
  async getOverviewData(year, period = 'YTD') {
    return this.request(`/overview?year=${year}&period=${period}`);
  }

  // Business unit data
  async getBusinessUnitData(year, period = 'YTD') {
    return this.request(`/business-units?year=${year}&period=${period}`);
  }

  // Customer data
  async getCustomerData(year, period = 'YTD') {
    return this.request(`/customers?year=${year}&period=${period}`);
  }

  // Monthly trends
  async getMonthlyTrends(year) {
    return this.request(`/trends/monthly?year=${year}`);
  }

  // Customer achievement
  async getCustomerAchievement(year, period = 'YTD') {
    return this.request(`/customers/achievement?year=${year}&period=${period}`);
  }

  // Available years
  async getAvailableYears() {
    return this.request('/years');
  }

  // Upload Excel file
  async uploadExcelFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload Error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Health check
  async checkHealth() {
    return this.request('/health');
  }
}

export default new ApiService();