
class ExportService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  async downloadFile(url, filename) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  buildQueryString(params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query.append(key, value);
      }
    });
    return query.toString();
  }

  async exportOverview(year, period, month = null, quarter = null) {
    const params = { year, period };
    if (month) params.month = month;
    if (quarter) params.quarter = quarter;
    
    const queryString = this.buildQueryString(params);
    const url = `${this.baseURL}/export/overview?${queryString}`;
    const filename = `proceed-overview-${period}-${year}.xlsx`;
    
    await this.downloadFile(url, filename);
  }

  async exportBusinessUnits(year, period, month = null, quarter = null) {
    const params = { year, period };
    if (month) params.month = month;
    if (quarter) params.quarter = quarter;
    
    const queryString = this.buildQueryString(params);
    const url = `${this.baseURL}/export/business-units?${queryString}`;
    const filename = `proceed-business-units-${period}-${year}.xlsx`;
    
    await this.downloadFile(url, filename);
  }

  async exportCustomers(year, period, month = null, quarter = null) {
    const params = { year, period };
    if (month) params.month = month;
    if (quarter) params.quarter = quarter;
    
    const queryString = this.buildQueryString(params);
    const url = `${this.baseURL}/export/customers?${queryString}`;
    const filename = `proceed-customers-${period}-${year}.xlsx`;
    
    await this.downloadFile(url, filename);
  }

  async exportTrends(year, serviceType = null) {
    const params = { year };
    if (serviceType) params.serviceType = serviceType;
    
    const queryString = this.buildQueryString(params);
    const url = `${this.baseURL}/export/trends?${queryString}`;
    const filename = `proceed-trends-${year}.xlsx`;
    
    await this.downloadFile(url, filename);
  }
}

export default new ExportService();