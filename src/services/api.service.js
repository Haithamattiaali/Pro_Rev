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
  async getOverviewData(year, period = 'YTD', month = null, quarter = null, multiSelectParams = null) {
    // If multiSelectParams provided, use multi-select endpoint
    console.log('🌐 API: getOverviewData called with:', {
      year,
      period,
      month,
      quarter,
      multiSelectParams,
      hasMultiSelect: !!multiSelectParams,
      periodsLength: multiSelectParams?.periods?.length
    });
    
    if (multiSelectParams && multiSelectParams.periods && multiSelectParams.periods.length > 0) {
      console.log('🌐 API: Using multi-select endpoint with periods:', multiSelectParams.periods);
      return this.getOverviewDataMultiSelect(multiSelectParams);
    }
    
    let url = `/overview?year=${year}&period=${period}`;
    if (month !== null) url += `&month=${month}`;
    if (quarter !== null) url += `&quarter=${quarter}`;
    console.log('🌐 API: Requesting overview data:', url);
    return this.request(url);
  }
  
  // Multi-select overview data
  async getOverviewDataMultiSelect(params) {
    const { years = [], periods = [], viewMode = 'quarterly' } = params;
    console.log('🌐 API: Requesting multi-select overview data:', params);
    console.log('🌐 API: POST body:', JSON.stringify({ years, periods, viewMode }));
    
    const response = await this.request('/overview/multi-select', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ years, periods, viewMode })
    });
    
    // Ensure response format matches expected format
    if (response.filters) {
      return {
        ...response,
        period: 'MULTI',
        year: years[0],
        month: null,
        quarter: null
      };
    }
    
    return response;
  }

  // Business unit data
  async getBusinessUnitData(year, period = 'YTD', month = null, quarter = null, multiSelectParams = null) {
    // If multiSelectParams provided, use multi-select endpoint
    if (multiSelectParams && multiSelectParams.periods?.length > 0) {
      return this.getBusinessUnitDataMultiSelect(multiSelectParams);
    }
    
    let url = `/business-units?year=${year}&period=${period}`;
    if (month !== null) url += `&month=${month}`;
    if (quarter !== null) url += `&quarter=${quarter}`;
    return this.request(url);
  }
  
  // Multi-select business unit data
  async getBusinessUnitDataMultiSelect(params) {
    const { years = [], periods = [], viewMode = 'quarterly' } = params;
    console.log('🌐 API: Requesting multi-select business unit data:', params);
    
    return this.request('/business-units/multi-select', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ years, periods, viewMode })
    });
  }

  // Customer data
  async getCustomerData(year, period = 'YTD', month = null, quarter = null, multiSelectParams = null) {
    // If multiSelectParams provided, use multi-select endpoint
    if (multiSelectParams && multiSelectParams.periods?.length > 0) {
      return this.getCustomerDataMultiSelect(multiSelectParams);
    }
    
    let url = `/customers?year=${year}&period=${period}`;
    if (month !== null) url += `&month=${month}`;
    if (quarter !== null) url += `&quarter=${quarter}`;
    return this.request(url);
  }
  
  // Multi-select customer data
  async getCustomerDataMultiSelect(params) {
    const { years = [], periods = [], viewMode = 'quarterly' } = params;
    console.log('🌐 API: Requesting multi-select customer data:', params);
    
    return this.request('/customers/multi-select', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ years, periods, viewMode })
    });
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

  // Download Excel template
  async downloadTemplate(year = null) {
    try {
      await connectionManager.ensureConnection();
      
      const params = year ? `?year=${year}` : '';
      const response = await fetch(`${connectionManager.baseUrl}/template/download${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download template');
      }

      return response.blob();
    } catch (error) {
      console.error('Template download error:', error);
      throw error;
    }
  }

  // Upload Excel file
  async uploadExcelFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    // For file uploads, we need to bypass the connection manager's
    // Content-Type header setting and make a direct fetch request
    try {
      console.log('Starting file upload...');
      await connectionManager.ensureConnection();
      
      console.log('Uploading to:', `${connectionManager.baseUrl}/upload`);
      const response = await fetch(`${connectionManager.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include credentials for CORS
        // Don't set Content-Type - let browser set it automatically for FormData
        signal: AbortSignal.timeout(300000) // 5 minutes timeout for uploads
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    return this.request('/health');
  }

  // Get analysis period validation
  async getAnalysisValidation(year) {
    return this.request(`/analysis-validation/${year}`);
  }

  // Forecast API methods
  async getForecastData(params) {
    // If params is just a year (legacy), convert to object
    if (typeof params === 'number') {
      return this.request(`/forecast?year=${params}`);
    }
    
    // New API with date range and method parameters
    const queryParams = new URLSearchParams({
      historicalStart: params.historicalStart?.toISOString(),
      historicalEnd: params.historicalEnd?.toISOString(),
      forecastStart: params.forecastStart?.toISOString(),
      forecastEnd: params.forecastEnd?.toISOString(),
      method: params.method || 'linear',
      methodConfig: JSON.stringify(params.methodConfig || {})
    });
    
    return this.request(`/forecast?${queryParams.toString()}`);
  }

  async generateForecast(params) {
    return this.request('/forecast/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        historicalStart: params.historicalStart?.toISOString(),
        historicalEnd: params.historicalEnd?.toISOString(),
        forecastStart: params.forecastStart?.toISOString(),
        forecastEnd: params.forecastEnd?.toISOString(),
        method: params.method || 'linear',
        methodConfig: params.methodConfig || {},
        ...params
      })
    });
  }

  async getForecastOpportunities() {
    return this.request('/forecast/opportunities');
  }

  async createForecastOpportunity(opportunity) {
    return this.request('/forecast/opportunities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(opportunity)
    });
  }

  async updateForecastOpportunity(id, updates) {
    return this.request(`/forecast/opportunities/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
  }

  async deleteForecastOpportunity(id) {
    return this.request(`/forecast/opportunities/${id}`, {
      method: 'DELETE'
    });
  }

  async getForecastConfig() {
    return this.request('/forecast/config');
  }

  async updateForecastConfig(config) {
    return this.request('/forecast/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config)
    });
  }

  async exportForecast(year) {
    const response = await fetch(`${connectionManager.baseUrl}/export/forecast?year=${year}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast_${year}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Sales Plan API methods
  async getSalesPlanOverview(year, period = 'YTD', month = null, quarter = null, serviceType = null, multiSelectParams = null) {
    // If multiSelectParams provided, use multi-select endpoint
    if (multiSelectParams && multiSelectParams.periods && multiSelectParams.periods.length > 0) {
      return this.getSalesPlanOverviewMultiSelect(multiSelectParams, serviceType);
    }
    
    let url = `/sales-plan/overview?year=${year}&period=${period}`;
    if (month !== null) url += `&month=${month}`;
    if (quarter !== null) url += `&quarter=${quarter}`;
    if (serviceType !== null && serviceType !== 'all') url += `&serviceType=${serviceType}`;
    return this.request(url);
  }
  
  // Multi-select sales plan overview
  async getSalesPlanOverviewMultiSelect(params, serviceType = null) {
    const { years = [], periods = [], viewMode = 'quarterly' } = params;
    
    const body = { years, periods, viewMode };
    if (serviceType !== null && serviceType !== 'all') {
      body.serviceType = serviceType;
    }
    
    return this.request('/sales-plan/overview/multi-select', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }

  async getSalesPlanMonthly(year, period = 'YTD', month = null, quarter = null, serviceType = null) {
    let url = `/sales-plan/monthly?year=${year}&period=${period}`;
    if (month !== null) url += `&month=${month}`;
    if (quarter !== null) url += `&quarter=${quarter}`;
    if (serviceType !== null && serviceType !== 'all') url += `&serviceType=${serviceType}`;
    return this.request(url);
  }

  async getSalesPlanByGL(year, period = 'YTD', month = null, quarter = null, serviceType = null, multiSelectParams = null) {
    // If multiSelectParams provided, use multi-select endpoint
    if (multiSelectParams && multiSelectParams.periods && multiSelectParams.periods.length > 0) {
      return this.getSalesPlanByGLMultiSelect(multiSelectParams, serviceType);
    }
    
    let url = `/sales-plan/by-gl?year=${year}&period=${period}`;
    if (month !== null) url += `&month=${month}`;
    if (quarter !== null) url += `&quarter=${quarter}`;
    if (serviceType !== null && serviceType !== 'all') url += `&serviceType=${serviceType}`;
    return this.request(url);
  }
  
  // Multi-select sales plan by GL
  async getSalesPlanByGLMultiSelect(params, serviceType = null) {
    const { years = [], periods = [], viewMode = 'quarterly' } = params;
    console.log('🌐 API: Requesting multi-select sales plan by GL:', params);
    
    const body = { years, periods, viewMode };
    if (serviceType !== null && serviceType !== 'all') {
      body.serviceType = serviceType;
    }
    
    return this.request('/sales-plan/by-gl/multi-select', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }

  // Opportunities API methods
  async getOpportunities(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    const queryString = queryParams.toString();
    return this.request(`/opportunities${queryString ? `?${queryString}` : ''}`);
  }

  async getOpportunitiesByStatus() {
    return this.request('/opportunities/by-status');
  }

  async getOpportunitiesByService() {
    return this.request('/opportunities/by-service');
  }

  async getOpportunitiesByLocation() {
    return this.request('/opportunities/by-location');
  }

  async getOpportunitiesPipeline() {
    return this.request('/opportunities/pipeline');
  }

  async getOpportunitiesInsights() {
    return this.request('/opportunities/insights');
  }

  async getOpportunitiesPipelineByStatus() {
    return this.request('/opportunities/pipeline-by-status');
  }

  async getOpportunitiesServiceAnalysis() {
    return this.request('/opportunities/service-analysis');
  }

  async getOpportunitiesMatrix() {
    return this.request('/opportunities/matrix');
  }

  // Get analysis period validation for a specific year
  async getAnalysisPeriodValidation(year) {
    return this.request(`/analysis-validation/${year}`);
  }
}

export default new ApiService();