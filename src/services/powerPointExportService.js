class PowerPointExportService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  async exportOverview(year, period, month = null, quarter = null) {
    const params = new URLSearchParams({
      year,
      period,
      ...(month && { month }),
      ...(quarter && { quarter })
    });

    return this.downloadFile(`/export/powerpoint/overview?${params}`, `proceed-overview-powerpoint-${period}-${year}.xlsx`);
  }

  async exportBusinessUnits(year, period, month = null, quarter = null) {
    const params = new URLSearchParams({
      year,
      period,
      ...(month && { month }),
      ...(quarter && { quarter })
    });

    return this.downloadFile(`/export/powerpoint/business-units?${params}`, `proceed-business-units-powerpoint-${period}-${year}.xlsx`);
  }

  async exportCustomers(year, period, month = null, quarter = null) {
    const params = new URLSearchParams({
      year,
      period,
      ...(month && { month }),
      ...(quarter && { quarter })
    });

    return this.downloadFile(`/export/powerpoint/customers?${params}`, `proceed-customers-powerpoint-${period}-${year}.xlsx`);
  }

  async exportTrends(year, serviceType = null) {
    const params = new URLSearchParams({
      year,
      ...(serviceType && { serviceType })
    });

    return this.downloadFile(`/export/powerpoint/trends?${params}`, `proceed-trends-powerpoint-${year}.xlsx`);
  }

  async exportTable(data, headers, title = 'Data Export') {
    const response = await fetch(`${this.baseUrl}/export/powerpoint/table`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data,
        headers,
        title
      })
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const filename = title.toLowerCase().replace(/\s+/g, '-') + '-powerpoint.xlsx';
    this.triggerDownload(blob, filename);
  }

  async downloadFile(endpoint, filename) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    
    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    this.triggerDownload(blob, filename);
  }

  triggerDownload(blob, filename) {
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

export const powerPointExportService = new PowerPointExportService();