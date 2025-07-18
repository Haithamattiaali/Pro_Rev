const OverviewExporter = require('./exporters/OverviewExporter');
const exportConfig = require('./utils/exportConfig');
const { ERROR_MESSAGES, PERFORMANCE_SETTINGS } = require('./utils/constants');

/**
 * ExcelExportService - Main facade for the sustainable Excel export system
 * Provides a clean API while leveraging the modular architecture
 */
class ExcelExportService {
  constructor(dataService) {
    this.dataService = dataService;
    
    // Initialize exporters
    this.exporters = {
      overview: new OverviewExporter(dataService)
      // Add more exporters as they are implemented:
      // businessUnit: new BusinessUnitExporter(dataService),
      // customer: new CustomerExporter(dataService),
      // trends: new TrendsExporter(dataService)
    };

    // Export queue for managing concurrent exports
    this.exportQueue = [];
    this.activeExports = 0;
  }

  /**
   * Export overview data
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} - Export result with buffer and filename
   */
  async exportOverview(params) {
    return this._executeExport('overview', params);
  }

  /**
   * Export business unit data
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} - Export result
   */
  async exportBusinessUnits(params) {
    // For now, fallback to legacy implementation
    // Will be replaced when BusinessUnitExporter is implemented
    return this._legacyExport('businessUnit', params);
  }

  /**
   * Export customer data
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} - Export result
   */
  async exportCustomers(params) {
    // For now, fallback to legacy implementation
    // Will be replaced when CustomerExporter is implemented
    return this._legacyExport('customer', params);
  }

  /**
   * Export trends data
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} - Export result
   */
  async exportTrends(params) {
    // For now, fallback to legacy implementation
    // Will be replaced when TrendsExporter is implemented
    return this._legacyExport('trends', params);
  }

  /**
   * Export custom selection
   * @param {string} type - Export type
   * @param {Object} params - Export parameters including sections
   * @returns {Promise<Object>} - Export result
   */
  async exportCustom(type, params) {
    const exporter = this.exporters[type];
    
    if (!exporter || !exporter.exportCustom) {
      throw new Error(`Custom export not available for type: ${type}`);
    }

    return this._executeExport(type, params, 'exportCustom');
  }

  /**
   * Export generic table data
   * @param {Object} params - Table export parameters
   * @returns {Promise<Object>} - Export result
   */
  async exportTable(params) {
    const { data, headers, title } = params;
    
    if (!data || !headers) {
      throw new Error(ERROR_MESSAGES.missingRequired);
    }

    // Use a simple template for table exports
    const BaseTemplate = require('./templates/BaseTemplate');
    const template = new BaseTemplate();
    
    template
      .initialize()
      .createSheet(title || 'Data Export')
      .addDataSection(null, headers, data, {
        autoSize: true,
        includeTotals: params.includeTotals
      });

    const buffer = template.buildAsBuffer();
    const filename = exportConfig.getFilename('custom', {
      type: 'table',
      ...params
    });

    return { buffer, filename };
  }

  /**
   * Get export configuration
   * @param {string} type - Export type
   * @returns {Object} - Export configuration
   */
  getExportConfig(type) {
    return exportConfig.getConfig(type);
  }

  /**
   * Validate export request
   * @param {Object} request - Export request
   * @returns {Object} - Validation result
   */
  validateRequest(request) {
    return exportConfig.validateExportRequest(request);
  }

  // Private methods

  async _executeExport(type, params, method = 'export') {
    // Check if we're at max concurrent exports
    if (this.activeExports >= PERFORMANCE_SETTINGS.maxConcurrentExports) {
      return this._queueExport(type, params, method);
    }

    this.activeExports++;

    try {
      const exporter = this.exporters[type];
      
      if (!exporter) {
        throw new Error(`Exporter not found for type: ${type}`);
      }

      const result = await exporter[method](params);
      
      return result;

    } catch (error) {
      console.error(`Export error for ${type}:`, error);
      throw error;

    } finally {
      this.activeExports--;
      this._processQueue();
    }
  }

  async _queueExport(type, params, method) {
    return new Promise((resolve, reject) => {
      this.exportQueue.push({
        type,
        params,
        method,
        resolve,
        reject,
        timestamp: Date.now()
      });
    });
  }

  _processQueue() {
    if (this.exportQueue.length === 0 || this.activeExports >= PERFORMANCE_SETTINGS.maxConcurrentExports) {
      return;
    }

    const job = this.exportQueue.shift();
    
    this._executeExport(job.type, job.params, job.method)
      .then(job.resolve)
      .catch(job.reject);
  }

  // Temporary legacy fallback - will be removed after full migration
  async _legacyExport(type, params) {
    // Import legacy service
    const legacyService = require('../excel-export.service');
    
    switch (type) {
      case 'businessUnit': {
        const data = await this.dataService.getBusinessUnitData(
          parseInt(params.year),
          params.period,
          params.month ? parseInt(params.month) : null,
          params.quarter ? parseInt(params.quarter) : null
        );
        const workbook = legacyService.exportBusinessUnitData(data, params.year, params.period);
        const buffer = legacyService.workbookToBuffer(workbook);
        const filename = exportConfig.getFilename('businessUnit', params);
        return { buffer, filename };
      }
      
      case 'customer': {
        const [customerData, achievementData, serviceBreakdown] = await Promise.all([
          this.dataService.getCustomerData(
            parseInt(params.year),
            params.period,
            params.month ? parseInt(params.month) : null,
            params.quarter ? parseInt(params.quarter) : null
          ),
          this.dataService.getCustomerAchievement(
            parseInt(params.year),
            params.period,
            params.month ? parseInt(params.month) : null,
            params.quarter ? parseInt(params.quarter) : null
          ),
          this.dataService.getCustomerServiceBreakdown(
            parseInt(params.year),
            params.period,
            params.month ? parseInt(params.month) : null,
            params.quarter ? parseInt(params.quarter) : null
          )
        ]);
        
        const workbook = legacyService.exportCustomerData(
          customerData,
          achievementData,
          serviceBreakdown,
          params.year,
          params.period
        );
        const buffer = legacyService.workbookToBuffer(workbook);
        const filename = exportConfig.getFilename('customer', params);
        return { buffer, filename };
      }
      
      case 'trends': {
        const data = await this.dataService.getMonthlyTrends(
          parseInt(params.year),
          params.serviceType
        );
        const workbook = legacyService.exportMonthlyTrends(data, params.year);
        const buffer = legacyService.workbookToBuffer(workbook);
        const filename = exportConfig.getFilename('trends', params);
        return { buffer, filename };
      }
      
      default:
        throw new Error(`Unknown export type: ${type}`);
    }
  }
}

module.exports = ExcelExportService;