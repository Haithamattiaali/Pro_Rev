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
  async getMonthlyTrends(year) {
    return this.request(`/trends/monthly?year=${year}`);
  }

  // Customer achievement
  async getCustomerAchievement(year, period = 'YTD', month = null, quarter = null) {
    let url = `/customers/achievement?year=${year}&period=${period}`;
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