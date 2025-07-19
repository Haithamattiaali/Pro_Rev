
import connectionManager from './connectionManager';

class ExportService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  async downloadFile(endpoint, filename) {
    try {
      // Ensure connection before making request
      await connectionManager.ensureConnection();
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
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
    const endpoint = `/export/overview?${queryString}`;
    const filename = `proceed-overview-${period}-${year}.xlsx`;
    
    await this.downloadFile(endpoint, filename);
  }

  async exportBusinessUnits(year, period, month = null, quarter = null) {
    const params = { year, period };
    if (month) params.month = month;
    if (quarter) params.quarter = quarter;
    
    const queryString = this.buildQueryString(params);
    const endpoint = `/export/business-units?${queryString}`;
    const filename = `proceed-business-units-${period}-${year}.xlsx`;
    
    await this.downloadFile(endpoint, filename);
  }

  async exportCustomers(year, period, month = null, quarter = null) {
    const params = { year, period };
    if (month) params.month = month;
    if (quarter) params.quarter = quarter;
    
    const queryString = this.buildQueryString(params);
    const endpoint = `/export/customers?${queryString}`;
    const filename = `proceed-customers-${period}-${year}.xlsx`;
    
    await this.downloadFile(endpoint, filename);
  }

  async exportTrends(year, serviceType = null) {
    const params = { year };
    if (serviceType) params.serviceType = serviceType;
    
    const queryString = this.buildQueryString(params);
    const endpoint = `/export/trends?${queryString}`;
    const filename = `proceed-trends-${year}.xlsx`;
    
    await this.downloadFile(endpoint, filename);
  }

  async exportCustomOverview(exportData) {
    const { sections, period, data } = exportData;
    const response = await fetch(`${this.baseURL}/export/custom/overview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      body: JSON.stringify({ sections, period, data })
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const filename = `proceed-overview-custom-${new Date().toISOString().split('T')[0]}.xlsx`;
    this.downloadBlob(blob, filename);
  }

  async exportCustomBusinessUnits(exportData) {
    const { sections, period, data } = exportData;
    const response = await fetch(`${this.baseURL}/export/custom/business-units`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      body: JSON.stringify({ sections, period, data })
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const filename = `proceed-business-units-custom-${new Date().toISOString().split('T')[0]}.xlsx`;
    this.downloadBlob(blob, filename);
  }

  async exportCustomCustomers(exportData) {
    const { sections, period, data } = exportData;
    const response = await fetch(`${this.baseURL}/export/custom/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      body: JSON.stringify({ sections, period, data })
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const filename = `proceed-customers-custom-${new Date().toISOString().split('T')[0]}.xlsx`;
    this.downloadBlob(blob, filename);
  }

  async exportTable(params) {
    const { data, headers, title, filename = 'export' } = params;
    const response = await fetch(`${this.baseURL}/export/table`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      body: JSON.stringify({ data, headers, title, filename })
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    this.downloadBlob(blob, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export default new ExportService();