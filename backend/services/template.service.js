const xlsx = require('xlsx');
const dataService = require('./data.service');
const db = require('../database/db-wrapper');

class TemplateService {
  constructor() {
    this.monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }

  /**
   * Generate Excel template with current dashboard data
   * @param {number} year - Optional year filter (defaults to all years)
   * @returns {Buffer} Excel file buffer
   */
  async generateTemplate(year = null) {
    try {
      // Create workbook
      const wb = xlsx.utils.book_new();
      
      // Sheet 1: Revenue Data
      const revenueData = await this.fetchAllRevenueData(year);
      const revenueTemplateData = this.formatDataForTemplate(revenueData);
      const wsRevenue = xlsx.utils.json_to_sheet(revenueTemplateData, {
        header: ['Customer', 'Service_Type', 'Year', 'Month', 'Cost', 'Target', 'Revenue', 'Receivables Collected']
      });
      wsRevenue['!cols'] = [
        { wch: 30 }, // Customer
        { wch: 20 }, // Service_Type
        { wch: 10 }, // Year
        { wch: 10 }, // Month
        { wch: 15 }, // Cost
        { wch: 15 }, // Target
        { wch: 15 }, // Revenue
        { wch: 20 }  // Receivables Collected
      ];
      xlsx.utils.book_append_sheet(wb, wsRevenue, 'Revenue Data');
      
      // Sheet 2: Sales Plan
      const salesPlanData = await this.fetchAllSalesPlanData(year);
      const salesPlanTemplateData = this.formatSalesPlanForTemplate(salesPlanData);
      const wsSalesPlan = xlsx.utils.json_to_sheet(salesPlanTemplateData, {
        header: ['gl', 'month', 'year', 'service_type', 'baseline_forecast', 'opportunity_value']
      });
      wsSalesPlan['!cols'] = [
        { wch: 15 }, // gl
        { wch: 10 }, // month
        { wch: 10 }, // year
        { wch: 20 }, // service_type
        { wch: 20 }, // baseline_forecast
        { wch: 20 }  // opportunity_value
      ];
      xlsx.utils.book_append_sheet(wb, wsSalesPlan, 'Sales Plan');
      
      // Sheet 3: Opportunities
      const opportunitiesData = await this.fetchAllOpportunitiesData();
      const opportunitiesTemplateData = this.formatOpportunitiesForTemplate(opportunitiesData);
      const wsOpportunities = xlsx.utils.json_to_sheet(opportunitiesTemplateData, {
        header: ['project', 'service', 'location', 'scope_of_work', 'requirements', 'status', 'est_monthly_revenue', 'est_gp_percent']
      });
      wsOpportunities['!cols'] = [
        { wch: 30 }, // project
        { wch: 20 }, // service
        { wch: 20 }, // location
        { wch: 40 }, // scope_of_work
        { wch: 40 }, // requirements
        { wch: 15 }, // status
        { wch: 20 }, // est_monthly_revenue
        { wch: 15 }  // est_gp_percent
      ];
      xlsx.utils.book_append_sheet(wb, wsOpportunities, 'Opportunities');
      
      // Generate buffer
      const buffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });
      
      return buffer;
    } catch (error) {
      console.error('Error generating template:', error);
      throw new Error('Failed to generate template: ' + error.message);
    }
  }

  /**
   * Fetch all revenue data from database
   * @param {number} year - Optional year filter
   * @returns {Array} Raw revenue data
   */
  async fetchAllRevenueData(year) {
    const query = `
      SELECT 
        customer,
        service_type,
        year,
        month,
        cost,
        target,
        revenue,
        receivables_collected
      FROM revenue_data
      ${year ? 'WHERE year = ?' : ''}
      ORDER BY year DESC, 
        CASE month
          WHEN 'Jan' THEN 1
          WHEN 'Feb' THEN 2
          WHEN 'Mar' THEN 3
          WHEN 'Apr' THEN 4
          WHEN 'May' THEN 5
          WHEN 'Jun' THEN 6
          WHEN 'Jul' THEN 7
          WHEN 'Aug' THEN 8
          WHEN 'Sep' THEN 9
          WHEN 'Oct' THEN 10
          WHEN 'Nov' THEN 11
          WHEN 'Dec' THEN 12
        END,
        customer,
        service_type
    `;
    
    try {
      const params = year ? [year] : [];
      const result = await db.all(query, params);
      
      return result || [];
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      throw new Error('Failed to fetch revenue data: ' + error.message);
    }
  }

  /**
   * Format database data for Excel template
   * @param {Array} data - Raw database data
   * @returns {Array} Formatted data for Excel
   */
  formatDataForTemplate(data) {
    return data.map(row => ({
      'Customer': row.customer,
      'Service_Type': row.service_type,
      'Year': row.year,
      'Month': row.month,
      'Cost': row.cost || 0,
      'Target': row.target || 0,
      'Revenue': row.revenue || 0,
      'Receivables Collected': row.receivables_collected || 0
    }));
  }

  /**
   * Fetch all sales plan data from database
   * @param {number} year - Optional year filter
   * @returns {Array} Raw sales plan data
   */
  async fetchAllSalesPlanData(year) {
    const query = `
      SELECT 
        gl,
        month,
        year,
        service_type,
        baseline_forecast,
        opportunity_value
      FROM sales_plan_data
      ${year ? 'WHERE year = ?' : ''}
      ORDER BY year DESC, 
        CASE month
          WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
          WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
          WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
          WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END,
        gl,
        service_type
    `;
    
    try {
      const params = year ? [year] : [];
      const result = await db.all(query, params);
      return result || [];
    } catch (error) {
      console.error('Error fetching sales plan data:', error);
      // Return empty array if table doesn't exist
      return [];
    }
  }

  /**
   * Fetch all opportunities data from database
   * @returns {Array} Raw opportunities data
   */
  async fetchAllOpportunitiesData() {
    const query = `
      SELECT 
        project,
        service,
        location,
        scope_of_work,
        requirements,
        status,
        est_monthly_revenue,
        est_gp_percent
      FROM opportunities_data
      ORDER BY project, service
    `;
    
    try {
      const result = await db.all(query, []);
      return result || [];
    } catch (error) {
      console.error('Error fetching opportunities data:', error);
      // Return empty array if table doesn't exist
      return [];
    }
  }

  /**
   * Format sales plan data for Excel template
   * @param {Array} data - Raw database data
   * @returns {Array} Formatted data for Excel
   */
  formatSalesPlanForTemplate(data) {
    return data.map(row => ({
      'gl': row.gl,
      'month': row.month,
      'year': row.year,
      'service_type': row.service_type,
      'baseline_forecast': row.baseline_forecast || 0,
      'opportunity_value': row.opportunity_value || 0
    }));
  }

  /**
   * Format opportunities data for Excel template
   * @param {Array} data - Raw database data
   * @returns {Array} Formatted data for Excel
   */
  formatOpportunitiesForTemplate(data) {
    return data.map(row => ({
      'project': row.project,
      'service': row.service,
      'location': row.location || '',
      'scope_of_work': row.scope_of_work || '',
      'requirements': row.requirements || '',
      'status': row.status || '',
      'est_monthly_revenue': row.est_monthly_revenue || 0,
      'est_gp_percent': row.est_gp_percent || 0
    }));
  }

  /**
   * Generate template filename with timestamp
   * @returns {string} Filename
   */
  generateFilename() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `proceed-dashboard-template-${dateStr}.xlsx`;
  }

  /**
   * Validate that a template has the correct structure
   * Used for regression testing
   * @param {Buffer} buffer - Excel file buffer
   * @returns {Object} Validation result
   */
  async validateTemplate(buffer) {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      
      // Define expected structure for each sheet
      const expectedSheets = {
        'Revenue Data': [
          'Customer', 'Service_Type', 'Year', 'Month', 
          'Cost', 'Target', 'Revenue', 'Receivables Collected'
        ],
        'Sales Plan': [
          'gl', 'month', 'year', 'service_type', 
          'baseline_forecast', 'opportunity_value'
        ],
        'Opportunities': [
          'project', 'service', 'location', 'scope_of_work', 
          'requirements', 'status', 'est_monthly_revenue', 'est_gp_percent'
        ]
      };
      
      const validationResults = {
        valid: true,
        sheets: {},
        errors: []
      };
      
      // Check each expected sheet
      for (const [sheetName, requiredColumns] of Object.entries(expectedSheets)) {
        if (!workbook.SheetNames.includes(sheetName)) {
          validationResults.valid = false;
          validationResults.errors.push(`Missing sheet: ${sheetName}`);
          continue;
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        validationResults.sheets[sheetName] = {
          rowCount: data.length,
          columns: requiredColumns,
          valid: true
        };
        
        if (data.length > 0) {
          const firstRow = data[0];
          const missingColumns = requiredColumns.filter(col => !(col in firstRow));
          
          if (missingColumns.length > 0) {
            validationResults.valid = false;
            validationResults.sheets[sheetName].valid = false;
            validationResults.errors.push(
              `Sheet '${sheetName}' missing columns: ${missingColumns.join(', ')}`
            );
          }
        }
      }
      
      if (!validationResults.valid) {
        return { 
          valid: false, 
          error: validationResults.errors.join('; '),
          sheets: validationResults.sheets
        };
      }
      
      return validationResults;
    } catch (error) {
      return { 
        valid: false, 
        error: `Invalid Excel file: ${error.message}` 
      };
    }
  }
}

module.exports = new TemplateService();