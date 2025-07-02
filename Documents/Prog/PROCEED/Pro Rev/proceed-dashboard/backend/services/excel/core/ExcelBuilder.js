const XLSX = require('xlsx');

/**
 * ExcelBuilder - Core class for building Excel workbooks with fluent API
 * Provides a clean, chainable interface for creating Excel files
 */
class ExcelBuilder {
  constructor() {
    this.workbook = XLSX.utils.book_new();
    this.currentSheet = null;
    this.sheets = {};
    this.formatters = [];
    this.config = {
      dateFormat: 'dd/mm/yyyy',
      numberFormat: '#,##0.00',
      percentFormat: '0.0%',
      currencyFormat: '"SAR "#,##0.00'
    };
  }

  /**
   * Set configuration options
   * @param {Object} config - Configuration object
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  configure(config) {
    this.config = { ...this.config, ...config };
    return this;
  }

  /**
   * Create a new sheet
   * @param {string} sheetName - Name of the sheet
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  addSheet(sheetName) {
    this.currentSheet = {
      name: sheetName,
      data: [],
      merges: [],
      cols: [],
      rows: [],
      styles: []
    };
    this.sheets[sheetName] = this.currentSheet;
    return this;
  }

  /**
   * Set headers for current sheet
   * @param {Array} headers - Array of header strings
   * @param {Object} options - Header options (style, height, etc.)
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  setHeaders(headers, options = {}) {
    if (!this.currentSheet) {
      throw new Error('No sheet selected. Call addSheet() first.');
    }

    const headerRow = headers.map(header => {
      const cell = {
        v: header,
        t: 's'
      };
      // Only add style if it's provided and not empty
      if (options.style && Object.keys(options.style).length > 0) {
        cell.s = options.style;
      }
      return cell;
    });

    this.currentSheet.data.push(headerRow);
    
    if (options.height) {
      this.currentSheet.rows.push({ hpt: options.height });
    }

    return this;
  }

  /**
   * Add data rows to current sheet
   * @param {Array} rows - Array of data rows
   * @param {Object} options - Row options
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  addDataRows(rows, options = {}) {
    if (!this.currentSheet) {
      throw new Error('No sheet selected. Call addSheet() first.');
    }

    rows.forEach(row => {
      const dataRow = Array.isArray(row) ? row : Object.values(row);
      const cellRow = dataRow.map(cell => this._createCell(cell, options));
      this.currentSheet.data.push(cellRow);
    });

    return this;
  }

  /**
   * Add a single row
   * @param {Array|Object} row - Row data
   * @param {Object} options - Row options
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  addRow(row, options = {}) {
    return this.addDataRows([row], options);
  }

  /**
   * Add an empty row
   * @param {number} count - Number of empty rows to add
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  addEmptyRows(count = 1) {
    if (!this.currentSheet) {
      throw new Error('No sheet selected. Call addSheet() first.');
    }

    for (let i = 0; i < count; i++) {
      this.currentSheet.data.push([]);
    }
    return this;
  }

  /**
   * Merge cells
   * @param {string} range - Cell range to merge (e.g., 'A1:C1')
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  mergeCells(range) {
    if (!this.currentSheet) {
      throw new Error('No sheet selected. Call addSheet() first.');
    }

    this.currentSheet.merges.push(range);
    return this;
  }

  /**
   * Set column widths
   * @param {Array} widths - Array of column width objects
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  setColumnWidths(widths) {
    if (!this.currentSheet) {
      throw new Error('No sheet selected. Call addSheet() first.');
    }

    this.currentSheet.cols = widths.map(width => {
      if (typeof width === 'number') {
        return { wch: width };
      }
      return width;
    });
    return this;
  }

  /**
   * Auto-size columns based on content
   * @param {Object} options - Auto-size options
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  autoSizeColumns(options = {}) {
    if (!this.currentSheet) {
      throw new Error('No sheet selected. Call addSheet() first.');
    }

    const minWidth = options.minWidth || 10;
    const maxWidth = options.maxWidth || 50;
    const padding = options.padding || 2;

    // Calculate max width for each column
    const columnWidths = [];
    this.currentSheet.data.forEach(row => {
      row.forEach((cell, colIndex) => {
        const cellLength = String(cell.v || '').length + padding;
        columnWidths[colIndex] = Math.max(
          columnWidths[colIndex] || minWidth,
          Math.min(cellLength, maxWidth)
        );
      });
    });

    this.currentSheet.cols = columnWidths.map(width => ({ wch: width }));
    return this;
  }

  /**
   * Apply formatting to a range
   * @param {string} range - Cell range (e.g., 'B2:B10')
   * @param {string|Object} format - Format name or custom format object
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  applyFormatting(range, format) {
    if (!this.currentSheet) {
      throw new Error('No sheet selected. Call addSheet() first.');
    }

    const formatObj = typeof format === 'string' 
      ? this._getFormatByName(format)
      : format;

    this.currentSheet.styles.push({ range, format: formatObj });
    return this;
  }

  /**
   * Apply conditional formatting
   * @param {string} range - Cell range
   * @param {Array} rules - Conditional formatting rules
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  applyConditionalFormatting(range, rules) {
    // Store conditional formatting rules for later application
    if (!this.currentSheet.conditionalFormats) {
      this.currentSheet.conditionalFormats = [];
    }
    this.currentSheet.conditionalFormats.push({ range, rules });
    return this;
  }

  /**
   * Add a chart
   * @param {Object} chartConfig - Chart configuration
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  addChart(chartConfig) {
    if (!this.currentSheet) {
      throw new Error('No sheet selected. Call addSheet() first.');
    }

    if (!this.currentSheet.charts) {
      this.currentSheet.charts = [];
    }
    this.currentSheet.charts.push(chartConfig);
    return this;
  }

  /**
   * Add a formula
   * @param {string} cell - Cell reference (e.g., 'A10')
   * @param {string} formula - Excel formula
   * @returns {ExcelBuilder} - Returns this for chaining
   */
  addFormula(cell, formula) {
    if (!this.currentSheet) {
      throw new Error('No sheet selected. Call addSheet() first.');
    }

    if (!this.currentSheet.formulas) {
      this.currentSheet.formulas = [];
    }
    this.currentSheet.formulas.push({ cell, formula });
    return this;
  }

  /**
   * Build the workbook
   * @returns {Object} - XLSX workbook object
   */
  build() {
    // Process each sheet
    Object.entries(this.sheets).forEach(([sheetName, sheetData]) => {
      // Convert data array to worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData.data.map(row => 
        row.map(cell => cell.v)
      ));

      // Apply column widths
      if (sheetData.cols.length > 0) {
        ws['!cols'] = sheetData.cols;
      }

      // Apply row heights
      if (sheetData.rows.length > 0) {
        ws['!rows'] = sheetData.rows;
      }

      // Apply merges
      if (sheetData.merges.length > 0) {
        ws['!merges'] = sheetData.merges.map(range => 
          XLSX.utils.decode_range(range)
        );
      }

      // Apply formulas
      if (sheetData.formulas) {
        sheetData.formulas.forEach(({ cell, formula }) => {
          ws[cell] = { f: formula };
        });
      }

      // Apply styles (Note: XLSX doesn't support styles in the community edition)
      // This is a placeholder for xlsx-style or similar library integration
      if (sheetData.styles.length > 0) {
        this._applyStyles(ws, sheetData.styles);
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(this.workbook, ws, sheetName);
    });

    return this.workbook;
  }

  /**
   * Build and return as buffer
   * @param {Object} options - Write options
   * @returns {Buffer} - Excel file buffer
   */
  buildAsBuffer(options = {}) {
    const workbook = this.build();
    return XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      ...options 
    });
  }

  /**
   * Build and save to file
   * @param {string} filename - Output filename
   * @param {Object} options - Write options
   */
  buildAndSave(filename, options = {}) {
    const workbook = this.build();
    XLSX.writeFile(workbook, filename, options);
  }

  // Private helper methods

  _createCell(value, options = {}) {
    const cell = { v: value };

    // Determine cell type
    if (value === null || value === undefined) {
      cell.v = '';
      cell.t = 's';
    } else if (typeof value === 'number') {
      cell.t = 'n';
    } else if (value instanceof Date) {
      cell.t = 'd';
      cell.v = value;
    } else if (typeof value === 'boolean') {
      cell.t = 'b';
    } else {
      cell.t = 's';
      cell.v = String(value);
    }

    // Apply any cell-level options
    if (options.style && Object.keys(options.style).length > 0) {
      cell.s = options.style;
    }

    return cell;
  }

  _getFormatByName(formatName) {
    const formats = {
      currency: { numFmt: this.config.currencyFormat },
      percentage: { numFmt: this.config.percentFormat },
      number: { numFmt: this.config.numberFormat },
      date: { numFmt: this.config.dateFormat }
    };
    return formats[formatName] || {};
  }

  _applyStyles(worksheet, styles) {
    // This is a placeholder for style application
    // In practice, you'd use xlsx-style or similar library
    // to apply the styles to the worksheet
  }
}

module.exports = ExcelBuilder;