const { EXPORT_DEFAULTS, SHEET_NAMES } = require('./constants');

/**
 * ExportConfig - Configuration management for Excel exports
 * Provides flexible configuration options for different export types
 */
class ExportConfig {
  constructor() {
    // Default configurations for different export types
    this.configs = {
      overview: {
        sheets: [
          {
            name: SHEET_NAMES.overview,
            sections: ['summary', 'serviceBreakdown', 'monthlyTrends']
          }
        ],
        options: {
          ...EXPORT_DEFAULTS,
          includeCharts: true,
          includeAnalysis: true
        },
        formatting: {
          currencyColumns: ['Revenue', 'Target', 'Cost', 'Profit', 'Receivables'],
          percentageColumns: ['Achievement %', 'Profit Margin %'],
          colorCodePercentages: true,
          includeTotals: true
        }
      },

      businessUnit: {
        sheets: [
          {
            name: SHEET_NAMES.businessUnits,
            sections: ['performance', 'monthlyBreakdown']
          },
          {
            name: SHEET_NAMES.analysis,
            sections: ['topPerformers', 'underPerformers', 'trends'],
            conditional: true // Only include if analysis is enabled
          }
        ],
        options: {
          ...EXPORT_DEFAULTS,
          includeAnalysis: true
        },
        formatting: {
          currencyColumns: ['Revenue', 'Target', 'Cost', 'Profit', 'Receivables'],
          percentageColumns: ['Achievement %', 'Profit Margin %'],
          numberColumns: ['Customers'],
          colorCodePercentages: true,
          includeTotals: true,
          highlightTopPerformers: true
        }
      },

      customer: {
        sheets: [
          {
            name: SHEET_NAMES.customerPerformance,
            sections: ['customerList', 'topCustomers']
          },
          {
            name: SHEET_NAMES.achievementAnalysis,
            sections: ['achievementDistribution', 'achievementChart']
          },
          {
            name: SHEET_NAMES.serviceAnalysis,
            sections: ['serviceBreakdown', 'serviceChart']
          }
        ],
        options: {
          ...EXPORT_DEFAULTS,
          includeCharts: true,
          maxCustomersPerSheet: 10000
        },
        formatting: {
          currencyColumns: ['Revenue', 'Target', 'Cost', 'Profit', 'Receivables', 'Total Revenue'],
          percentageColumns: ['Achievement %', 'Profit Margin %', 'Avg Achievement %'],
          numberColumns: ['Service Types', 'Customer Count'],
          colorCodePercentages: true,
          includeTotals: true
        }
      },

      trends: {
        sheets: [
          {
            name: SHEET_NAMES.monthlyTrends,
            sections: ['monthlyData', 'monthlyCharts']
          },
          {
            name: SHEET_NAMES.quarterlyTrends,
            sections: ['quarterlyData', 'quarterlyCharts'],
            conditional: true
          },
          {
            name: SHEET_NAMES.yearlyComparison,
            sections: ['yearlyData', 'yearlyAnalysis'],
            conditional: true
          }
        ],
        options: {
          ...EXPORT_DEFAULTS,
          includeCharts: true,
          includeAnalysis: true,
          includePreviousYear: true
        },
        formatting: {
          currencyColumns: ['Revenue', 'Target', 'Cost', 'Profit'],
          percentageColumns: ['Achievement %', 'Profit Margin %', 'YoY Growth %'],
          colorCodePercentages: true,
          includeTotals: true,
          highlightTrends: true
        }
      },

      custom: {
        sheets: [], // Dynamically configured
        options: {
          ...EXPORT_DEFAULTS
        },
        formatting: {
          autoDetectColumns: true
        }
      }
    };

    // Column type detection patterns
    this.columnPatterns = {
      currency: /revenue|cost|profit|target|receivables|amount|price|value|total/i,
      percentage: /achievement|margin|percentage|%|rate|ratio/i,
      date: /date|time|created|updated|modified/i,
      number: /count|quantity|qty|number|#|id/i
    };
  }

  /**
   * Get configuration for export type
   * @param {string} type - Export type
   * @param {Object} overrides - Configuration overrides
   * @returns {Object} - Merged configuration
   */
  getConfig(type, overrides = {}) {
    const baseConfig = this.configs[type] || this.configs.custom;
    
    return this._deepMerge(baseConfig, overrides);
  }

  /**
   * Create custom configuration
   * @param {Object} config - Custom configuration
   * @returns {Object} - Validated configuration
   */
  createCustomConfig(config) {
    // Validate and structure custom config
    const customConfig = {
      sheets: this._validateSheets(config.sheets || []),
      options: { ...EXPORT_DEFAULTS, ...(config.options || {}) },
      formatting: this._validateFormatting(config.formatting || {})
    };

    return customConfig;
  }

  /**
   * Auto-detect column types from data
   * @param {Array} headers - Column headers
   * @param {Array} data - Sample data rows
   * @returns {Object} - Column type mapping
   */
  autoDetectColumnTypes(headers, data = []) {
    const columnTypes = {};
    
    headers.forEach((header, index) => {
      // Check header name patterns
      for (const [type, pattern] of Object.entries(this.columnPatterns)) {
        if (pattern.test(header)) {
          columnTypes[header] = type;
          break;
        }
      }

      // If not detected by header, check data type
      if (!columnTypes[header] && data.length > 0) {
        const sampleValues = data.slice(0, 10).map(row => 
          Array.isArray(row) ? row[index] : row[header]
        );
        
        columnTypes[header] = this._detectValueType(sampleValues);
      }
    });

    return columnTypes;
  }

  /**
   * Get export filename based on configuration
   * @param {string} type - Export type
   * @param {Object} params - Parameters for filename
   * @returns {string} - Generated filename
   */
  getFilename(type, params = {}) {
    const { FILE_NAMING } = require('./constants');
    const pattern = FILE_NAMING.patterns[type] || FILE_NAMING.patterns.custom;
    
    let filename = pattern;
    
    // Replace placeholders
    filename = filename.replace('{prefix}', params.prefix || FILE_NAMING.prefix);
    filename = filename.replace('{type}', type);
    filename = filename.replace('{period}', params.period || 'all');
    filename = filename.replace('{year}', params.year || new Date().getFullYear());
    filename = filename.replace('{date}', new Date().toISOString().split('T')[0]);
    
    // Clean up any remaining placeholders
    filename = filename.replace(/\{[^}]+\}/g, '');
    
    return filename + FILE_NAMING.extension;
  }

  /**
   * Validate export request
   * @param {Object} request - Export request
   * @returns {Object} - Validation result
   */
  validateExportRequest(request) {
    const { VALIDATION_RULES, ERROR_MESSAGES } = require('./constants');
    const errors = [];

    // Validate year
    if (request.year) {
      const year = parseInt(request.year);
      if (year < VALIDATION_RULES.minYear || year > VALIDATION_RULES.maxYear) {
        errors.push(ERROR_MESSAGES.invalidYear);
      }
    }

    // Validate period
    if (request.period && !VALIDATION_RULES.validPeriods.includes(request.period)) {
      errors.push(ERROR_MESSAGES.invalidPeriod);
    }

    // Validate month
    if (request.month) {
      const month = parseInt(request.month);
      if (!VALIDATION_RULES.validMonths.includes(month)) {
        errors.push('Invalid month specified');
      }
    }

    // Validate quarter
    if (request.quarter) {
      const quarter = parseInt(request.quarter);
      if (!VALIDATION_RULES.validQuarters.includes(quarter)) {
        errors.push('Invalid quarter specified');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Private helper methods

  _deepMerge(target, source) {
    const output = { ...target };
    
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        output[key] = this._deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
    
    return output;
  }

  _validateSheets(sheets) {
    return sheets.map(sheet => ({
      name: sheet.name || 'Sheet',
      sections: Array.isArray(sheet.sections) ? sheet.sections : [],
      conditional: sheet.conditional || false
    }));
  }

  _validateFormatting(formatting) {
    return {
      currencyColumns: Array.isArray(formatting.currencyColumns) ? formatting.currencyColumns : [],
      percentageColumns: Array.isArray(formatting.percentageColumns) ? formatting.percentageColumns : [],
      numberColumns: Array.isArray(formatting.numberColumns) ? formatting.numberColumns : [],
      dateColumns: Array.isArray(formatting.dateColumns) ? formatting.dateColumns : [],
      colorCodePercentages: formatting.colorCodePercentages !== false,
      includeTotals: formatting.includeTotals !== false,
      autoDetectColumns: formatting.autoDetectColumns === true
    };
  }

  _detectValueType(values) {
    // Check if all values are numbers
    const nonNullValues = values.filter(v => v != null);
    if (nonNullValues.every(v => typeof v === 'number')) {
      return 'number';
    }

    // Check if values look like dates
    if (nonNullValues.every(v => v instanceof Date || !isNaN(Date.parse(v)))) {
      return 'date';
    }

    // Default to text
    return 'text';
  }
}

module.exports = new ExportConfig();