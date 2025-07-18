const ExcelBuilder = require('../core/ExcelBuilder');
const ExcelFormatter = require('../core/ExcelFormatter');

/**
 * BaseTemplate - Abstract base class for Excel export templates
 * Provides common functionality and structure for all export templates
 */
class BaseTemplate {
  constructor(config = {}) {
    this.builder = new ExcelBuilder();
    this.formatter = new ExcelFormatter();
    
    // Default configuration - can be overridden by subclasses
    this.config = {
      includeTimestamp: true,
      includeMetadata: true,
      dateFormat: 'dd/mm/yyyy',
      companyName: 'PROCEED',
      reportPrefix: 'Revenue Dashboard',
      ...config
    };

    // Sheet configurations
    this.sheets = [];
    this.currentSheetIndex = -1;
  }

  /**
   * Initialize the template with basic setup
   * @param {Object} options - Initialization options
   * @returns {BaseTemplate} - Returns this for chaining
   */
  initialize(options = {}) {
    this.options = { ...this.config, ...options };
    this.builder.configure({
      dateFormat: this.options.dateFormat,
      numberFormat: '#,##0.00',
      currencyFormat: '"SAR "#,##0.00',
      percentFormat: '0.0%'
    });
    return this;
  }

  /**
   * Add report header with branding
   * @param {string} title - Report title
   * @param {Object} metadata - Additional metadata
   * @returns {BaseTemplate} - Returns this for chaining
   */
  addReportHeader(title, metadata = {}) {
    const currentDate = new Date();
    const headerRows = [];

    // Company name
    headerRows.push([this.config.companyName]);
    
    // Report title
    headerRows.push([`${this.config.reportPrefix} - ${title}`]);
    
    // Metadata
    if (this.config.includeMetadata) {
      if (metadata.period) {
        headerRows.push([`Period: ${metadata.period} ${metadata.year || currentDate.getFullYear()}`]);
      }
      if (this.config.includeTimestamp) {
        headerRows.push([`Generated: ${currentDate.toLocaleString()}`]);
      }
      if (metadata.filters) {
        headerRows.push([`Filters: ${this._formatFilters(metadata.filters)}`]);
      }
    }

    // Add empty row for spacing
    headerRows.push([]);

    // Add rows to builder
    headerRows.forEach((row, index) => {
      this.builder.addRow(row);
      if (index === 0) {
        // Company name - merge cells and apply branding
        const lastCol = this._getColumnLetter(7); // Assuming 8 columns
        this.builder.mergeCells(`A${index + 1}:${lastCol}${index + 1}`);
      } else if (index === 1) {
        // Report title - merge cells
        const lastCol = this._getColumnLetter(7);
        this.builder.mergeCells(`A${index + 1}:${lastCol}${index + 1}`);
      }
    });

    return this;
  }

  /**
   * Add a data section with headers
   * @param {string} sectionTitle - Section title
   * @param {Array} headers - Column headers
   * @param {Array} data - Data rows
   * @param {Object} options - Section options
   * @returns {BaseTemplate} - Returns this for chaining
   */
  addDataSection(sectionTitle, headers, data, options = {}) {
    // Add section title if provided
    if (sectionTitle) {
      this.builder.addRow([sectionTitle]);
      this.builder.addEmptyRows(1);
    }

    // Add headers
    this.builder.setHeaders(headers, { 
      height: 25
    });

    // Add data rows
    if (data && data.length > 0) {
      data.forEach(row => {
        const formattedRow = this._formatDataRow(row, headers, options);
        this.builder.addRow(formattedRow);
      });
    } else {
      // Add "No data" message if empty
      const noDataRow = new Array(headers.length).fill('');
      noDataRow[0] = 'No data available';
      this.builder.addRow(noDataRow);
    }

    // Add totals row if specified
    if (options.includeTotals && data.length > 0) {
      this._addTotalsRow(headers, data, options);
    }

    // Auto-size columns by default
    if (options.autoSize !== false) {
      this.builder.autoSizeColumns({
        minWidth: options.minColumnWidth || 12,
        maxWidth: options.maxColumnWidth || 50
      });
    }

    return this;
  }

  /**
   * Add a summary section with key metrics
   * @param {string} title - Summary title
   * @param {Array} metrics - Array of {label, value, format} objects
   * @param {Object} options - Summary options
   * @returns {BaseTemplate} - Returns this for chaining
   */
  addSummarySection(title, metrics, options = {}) {
    // Add title
    this.builder.addRow([title]);
    this.builder.addEmptyRows(1);

    // Add metric rows
    metrics.forEach(metric => {
      const formattedValue = this._formatMetricValue(metric.value, metric.format);
      this.builder.addRow([metric.label, formattedValue]);
    });

    // Set column widths for summary
    this.builder.setColumnWidths([30, 20]);

    return this;
  }

  /**
   * Add a chart placeholder
   * @param {Object} chartConfig - Chart configuration
   * @returns {BaseTemplate} - Returns this for chaining
   */
  addChart(chartConfig) {
    // Add placeholder for chart
    this.builder.addEmptyRows(2);
    this.builder.addRow(['[Chart: ' + chartConfig.title + ']']);
    this.builder.addEmptyRows(15); // Space for chart
    
    // Store chart configuration for later processing
    this.builder.addChart({
      ...chartConfig,
      position: this.builder.currentSheet.data.length - 15
    });

    return this;
  }

  /**
   * Create a new sheet
   * @param {string} sheetName - Name of the sheet
   * @returns {BaseTemplate} - Returns this for chaining
   */
  createSheet(sheetName) {
    this.builder.addSheet(sheetName);
    this.currentSheetIndex++;
    this.sheets.push(sheetName);
    return this;
  }

  /**
   * Build the final workbook
   * @returns {Object} - Excel workbook object
   */
  build() {
    // Apply any final formatting
    this._applyFinalFormatting();
    
    // Build and return workbook
    return this.builder.build();
  }

  /**
   * Build and return as buffer
   * @returns {Buffer} - Excel file buffer
   */
  buildAsBuffer() {
    this._applyFinalFormatting();
    return this.builder.buildAsBuffer();
  }

  // Protected methods for subclasses to override

  /**
   * Format a data row - can be overridden by subclasses
   * @param {Object|Array} row - Row data
   * @param {Array} headers - Column headers
   * @param {Object} options - Formatting options
   * @returns {Array} - Formatted row
   */
  _formatDataRow(row, headers, options) {
    if (Array.isArray(row)) {
      return row;
    }

    // Convert object to array based on headers
    return headers.map(header => {
      const value = this._getNestedValue(row, header);
      const formatted = this._formatCellValue(value, header, options);
      // If formatter returns an object, just return the value
      return formatted && typeof formatted === 'object' && 'v' in formatted ? formatted.v : formatted;
    });
  }

  /**
   * Format a cell value based on its type and header
   * @param {*} value - Cell value
   * @param {string} header - Column header
   * @param {Object} options - Formatting options
   * @returns {*} - Formatted value
   */
  _formatCellValue(value, header, options) {
    const lowerHeader = header.toLowerCase();

    // For now, return raw values until we integrate formatting properly
    // The ExcelBuilder will handle basic formatting
    
    // Currency columns - return number
    if (lowerHeader.includes('revenue') || 
        lowerHeader.includes('cost') || 
        lowerHeader.includes('profit') ||
        lowerHeader.includes('target') ||
        lowerHeader.includes('receivables')) {
      return value || 0;
    }

    // Percentage columns - return number
    if (lowerHeader.includes('achievement') || 
        lowerHeader.includes('margin') ||
        lowerHeader.includes('percentage') ||
        lowerHeader.includes('%')) {
      return value || 0;
    }

    // Date columns
    if (lowerHeader.includes('date') || lowerHeader.includes('time')) {
      return value || '';
    }

    // Number columns
    if (typeof value === 'number') {
      return value;
    }

    return value || '';
  }

  /**
   * Add a totals row
   * @param {Array} headers - Column headers
   * @param {Array} data - Data rows
   * @param {Object} options - Totals options
   */
  _addTotalsRow(headers, data, options) {
    const totals = this._calculateTotals(headers, data, options);
    // For now, add totals without special formatting
    this.builder.addRow(totals);
  }

  /**
   * Calculate totals for numeric columns
   * @param {Array} headers - Column headers
   * @param {Array} data - Data rows
   * @param {Object} options - Calculation options
   * @returns {Array} - Totals row
   */
  _calculateTotals(headers, data, options) {
    const totals = new Array(headers.length).fill(0);
    totals[0] = 'TOTAL'; // First column label

    // Columns to sum (by header name)
    const sumColumns = options.sumColumns || this._getDefaultSumColumns(headers);

    headers.forEach((header, index) => {
      if (index === 0) return; // Skip first column

      if (sumColumns.includes(header)) {
        totals[index] = data.reduce((sum, row) => {
          const value = Array.isArray(row) ? row[index] : this._getNestedValue(row, header);
          return sum + (parseFloat(value) || 0);
        }, 0);
      } else {
        totals[index] = ''; // Non-summed columns
      }
    });

    return totals;
  }

  /**
   * Get default columns to sum based on header names
   * @param {Array} headers - Column headers
   * @returns {Array} - Headers to sum
   */
  _getDefaultSumColumns(headers) {
    return headers.filter(header => {
      const lower = header.toLowerCase();
      return lower.includes('revenue') ||
             lower.includes('cost') ||
             lower.includes('profit') ||
             lower.includes('target') ||
             lower.includes('receivables') ||
             lower.includes('amount') ||
             lower.includes('total');
    });
  }

  /**
   * Apply final formatting to the workbook
   */
  _applyFinalFormatting() {
    // Can be overridden by subclasses for custom final formatting
  }

  // Utility methods

  /**
   * Get nested value from object
   * @param {Object} obj - Source object
   * @param {string} path - Property path (supports dot notation)
   * @returns {*} - Value at path
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  }

  /**
   * Format filters for display
   * @param {Object} filters - Filter object
   * @returns {string} - Formatted filter string
   */
  _formatFilters(filters) {
    return Object.entries(filters)
      .filter(([_, value]) => value != null && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  /**
   * Format metric value based on format type
   * @param {*} value - Metric value
   * @param {string} format - Format type
   * @returns {*} - Formatted value
   */
  _formatMetricValue(value, format) {
    // For now, return raw values until we integrate formatting properly
    switch (format) {
      case 'currency':
        return value || 0;
      case 'percentage':
        return value || 0;
      case 'number':
        return value || 0;
      case 'date':
        return value || '';
      default:
        return value || '';
    }
  }

  /**
   * Get column letter from index (0-based)
   * @param {number} index - Column index
   * @returns {string} - Column letter (A, B, ..., Z, AA, ...)
   */
  _getColumnLetter(index) {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode(65 + (index % 26)) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  }
}

module.exports = BaseTemplate;