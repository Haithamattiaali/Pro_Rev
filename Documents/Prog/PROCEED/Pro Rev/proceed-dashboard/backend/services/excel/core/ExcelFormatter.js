/**
 * ExcelFormatter - Centralized formatting utilities for Excel exports
 * Provides consistent styling, formatting, and brand compliance
 */
class ExcelFormatter {
  constructor() {
    // Brand colors in ARGB format for Excel
    this.brandColors = {
      primary: 'FF9E1F63',
      primaryDark: 'FF721548',
      primaryLight: 'FFCB5B96',
      secondary: 'FF424046',
      secondaryLight: 'FF6A686F',
      secondaryPale: 'FFE2E1E6',
      accentBlue: 'FF005B8C',
      accentCoral: 'FFE05E3D',
      neutralDark: 'FF2D2D2D',
      neutralMid: 'FF717171',
      neutralLight: 'FFF2F2F4',
      white: 'FFFFFFFF',
      success: 'FF00A651',
      warning: 'FFFFA500',
      error: 'FFDC3545'
    };

    // Predefined styles
    this.styles = {
      // Headers
      brandHeader: {
        font: { bold: true, size: 14, color: { rgb: this.brandColors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: this.brandColors.primary } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this._getAllBorders()
      },
      sectionHeader: {
        font: { bold: true, size: 12, color: { rgb: this.brandColors.primaryDark } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: this.brandColors.secondaryPale } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: this._getAllBorders()
      },
      subHeader: {
        font: { bold: true, size: 11, color: { rgb: this.brandColors.secondary } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: this._getBottomBorder()
      },

      // Data cells
      dataCell: {
        font: { size: 10, color: { rgb: this.brandColors.neutralDark } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: this._getAllBorders('thin', this.brandColors.neutralLight)
      },
      dataCellCenter: {
        font: { size: 10, color: { rgb: this.brandColors.neutralDark } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this._getAllBorders('thin', this.brandColors.neutralLight)
      },
      dataCellRight: {
        font: { size: 10, color: { rgb: this.brandColors.neutralDark } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: this._getAllBorders('thin', this.brandColors.neutralLight)
      },

      // Special cells
      totalRow: {
        font: { bold: true, size: 11, color: { rgb: this.brandColors.primaryDark } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: this.brandColors.neutralLight } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: this._getAllBorders('medium')
      },
      highlightCell: {
        font: { bold: true, size: 10, color: { rgb: this.brandColors.accentBlue } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: this.brandColors.secondaryPale } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this._getAllBorders()
      },

      // Status cells
      successCell: {
        font: { size: 10, color: { rgb: this.brandColors.success } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this._getAllBorders('thin', this.brandColors.neutralLight)
      },
      warningCell: {
        font: { size: 10, color: { rgb: this.brandColors.warning } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this._getAllBorders('thin', this.brandColors.neutralLight)
      },
      errorCell: {
        font: { size: 10, color: { rgb: this.brandColors.error } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this._getAllBorders('thin', this.brandColors.neutralLight)
      }
    };

    // Number formats
    this.numberFormats = {
      currency: '"SAR "#,##0.00',
      currencyNegative: '"SAR "#,##0.00_);[Red]("SAR "#,##0.00)',
      percentage: '0.0%',
      percentageDetailed: '0.00%',
      number: '#,##0',
      numberDecimal: '#,##0.00',
      date: 'dd/mm/yyyy',
      dateTime: 'dd/mm/yyyy hh:mm',
      monthYear: 'mmm yyyy',
      time: 'hh:mm:ss'
    };
  }

  /**
   * Format currency value
   * @param {number} value - Numeric value
   * @param {Object} options - Formatting options
   * @returns {Object} - Cell object with formatting
   */
  formatCurrency(value, options = {}) {
    const isNegative = value < 0;
    return {
      v: value,
      t: 'n',
      s: {
        numFmt: options.showNegative ? this.numberFormats.currencyNegative : this.numberFormats.currency,
        font: isNegative ? { color: { rgb: this.brandColors.error } } : {},
        ...options.style
      }
    };
  }

  /**
   * Format percentage value
   * @param {number} value - Numeric value (0-100)
   * @param {Object} options - Formatting options
   * @returns {Object} - Cell object with formatting
   */
  formatPercentage(value, options = {}) {
    const normalizedValue = value / 100; // Excel expects 0-1 for percentages
    const style = this._getPercentageStyle(value, options);
    
    return {
      v: normalizedValue,
      t: 'n',
      s: {
        numFmt: options.detailed ? this.numberFormats.percentageDetailed : this.numberFormats.percentage,
        ...style,
        ...options.style
      }
    };
  }

  /**
   * Format date value
   * @param {Date|string} value - Date value
   * @param {Object} options - Formatting options
   * @returns {Object} - Cell object with formatting
   */
  formatDate(value, options = {}) {
    const date = value instanceof Date ? value : new Date(value);
    return {
      v: date,
      t: 'd',
      s: {
        numFmt: options.includeTime ? this.numberFormats.dateTime : this.numberFormats.date,
        ...options.style
      }
    };
  }

  /**
   * Format number value
   * @param {number} value - Numeric value
   * @param {Object} options - Formatting options
   * @returns {Object} - Cell object with formatting
   */
  formatNumber(value, options = {}) {
    return {
      v: value,
      t: 'n',
      s: {
        numFmt: options.decimals ? this.numberFormats.numberDecimal : this.numberFormats.number,
        ...options.style
      }
    };
  }

  /**
   * Apply brand header styling to a range
   * @param {Object} worksheet - Worksheet object
   * @param {string} range - Cell range
   * @param {string} styleName - Style name from predefined styles
   */
  applyBrandStyle(worksheet, range, styleName) {
    const style = this.styles[styleName];
    if (!style) {
      console.warn(`Style '${styleName}' not found`);
      return;
    }

    // Apply style to range
    const rangeObj = XLSX.utils.decode_range(range);
    for (let R = rangeObj.s.r; R <= rangeObj.e.r; ++R) {
      for (let C = rangeObj.s.c; C <= rangeObj.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { v: '' };
        worksheet[cellAddress].s = style;
      }
    }
  }

  /**
   * Apply conditional formatting based on value
   * @param {Object} cell - Cell object
   * @param {Array} rules - Array of conditional rules
   * @returns {Object} - Cell with conditional formatting applied
   */
  applyConditionalFormat(cell, rules) {
    const value = cell.v;
    let appliedStyle = {};

    rules.forEach(rule => {
      if (this._evaluateCondition(value, rule.condition, rule.value)) {
        appliedStyle = { ...appliedStyle, ...rule.style };
      }
    });

    return {
      ...cell,
      s: { ...(cell.s || {}), ...appliedStyle }
    };
  }

  /**
   * Create a gradient fill
   * @param {string} startColor - Start color (ARGB)
   * @param {string} endColor - End color (ARGB)
   * @param {string} type - Gradient type ('linear' or 'path')
   * @returns {Object} - Fill object
   */
  createGradientFill(startColor, endColor, type = 'linear') {
    return {
      type: 'gradient',
      gradient: {
        type,
        degree: type === 'linear' ? 90 : undefined,
        stops: [
          { position: 0, color: { rgb: startColor } },
          { position: 1, color: { rgb: endColor } }
        ]
      }
    };
  }

  /**
   * Get achievement color based on percentage
   * @param {number} percentage - Achievement percentage
   * @returns {Object} - Color style object
   */
  getAchievementColor(percentage) {
    if (percentage >= 100) {
      return { color: { rgb: this.brandColors.success } };
    } else if (percentage >= 80) {
      return { color: { rgb: this.brandColors.accentBlue } };
    } else if (percentage >= 60) {
      return { color: { rgb: this.brandColors.warning } };
    } else {
      return { color: { rgb: this.brandColors.error } };
    }
  }

  /**
   * Create a data bar for visual representation
   * @param {number} value - Value (0-100)
   * @param {Object} options - Data bar options
   * @returns {Object} - Data bar configuration
   */
  createDataBar(value, options = {}) {
    const color = options.color || this.brandColors.accentBlue;
    const minValue = options.min || 0;
    const maxValue = options.max || 100;

    return {
      type: 'dataBar',
      minLength: 0,
      maxLength: 100,
      color: { rgb: color },
      minValue,
      maxValue,
      value
    };
  }

  /**
   * Format a row as a total row
   * @param {Array} rowData - Row data
   * @param {Object} options - Formatting options
   * @returns {Array} - Formatted row
   */
  formatTotalRow(rowData, options = {}) {
    return rowData.map((cell, index) => {
      if (index === 0) {
        // First cell typically contains "TOTAL" label
        return {
          v: cell,
          t: 's',
          s: this.styles.totalRow
        };
      } else if (typeof cell === 'number') {
        // Numeric cells in total row
        return {
          v: cell,
          t: 'n',
          s: {
            ...this.styles.totalRow,
            numFmt: options.currency ? this.numberFormats.currency : this.numberFormats.numberDecimal
          }
        };
      } else {
        // Other cells
        return {
          v: cell,
          t: 's',
          s: this.styles.totalRow
        };
      }
    });
  }

  // Private helper methods

  _getAllBorders(style = 'thin', color = null) {
    const borderStyle = {
      style,
      color: color ? { rgb: color } : { rgb: this.brandColors.neutralMid }
    };
    return {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle
    };
  }

  _getBottomBorder(style = 'thin', color = null) {
    return {
      bottom: {
        style,
        color: color ? { rgb: color } : { rgb: this.brandColors.neutralMid }
      }
    };
  }

  _getPercentageStyle(value, options) {
    if (options.colorCode) {
      return this.getAchievementColor(value);
    }
    return {};
  }

  _evaluateCondition(value, condition, compareValue) {
    switch (condition) {
      case '>': return value > compareValue;
      case '>=': return value >= compareValue;
      case '<': return value < compareValue;
      case '<=': return value <= compareValue;
      case '=': return value === compareValue;
      case '!=': return value !== compareValue;
      default: return false;
    }
  }
}

module.exports = ExcelFormatter;