const xlsx = require('xlsx');
const dbWrapper = require('../database/db-wrapper');
const db = require('../database/persistent-db');
const fs = require('fs').promises;

class ETLService {
  constructor() {
    this.monthMap = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
  }

  async processExcelFile(filePath) {
    try {
      console.log('Processing Excel file:', filePath);
      
      // Read Excel file
      const workbook = xlsx.readFile(filePath);
      const results = {
        revenueData: null,
        salesPlan: null,
        opportunities: null,
        sheets: workbook.SheetNames
      };
      
      // Process each sheet
      for (let i = 0; i < workbook.SheetNames.length; i++) {
        const sheetName = workbook.SheetNames[i];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        
        console.log(`Processing sheet: ${sheetName} (${jsonData.length} rows)`);
        
        // Determine sheet type based on name or position
        if (sheetName.toLowerCase().includes('revenue') || i === 0) {
          // Process as revenue data (existing logic)
          results.revenueData = await this.insertData(jsonData);
        } else if (sheetName.toLowerCase().includes('sales plan') || i === 1) {
          // Process as sales plan data
          results.salesPlan = await this.processSalesPlanData(jsonData);
        } else if (sheetName.toLowerCase().includes('opportunities') || i === 2) {
          // Process as opportunities data
          results.opportunities = await this.processOpportunitiesData(jsonData);
        }
      }
      
      // Clean up temp file if exists
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.log('Error deleting temp file:', err);
      }
      
      return results;
    } catch (error) {
      console.error('ETL process error:', error);
      throw error;
    }
  }

  async insertData(data) {
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    // Use direct database access for transactions
    const transaction = db.transaction((records) => {
      // Prepare statement for better performance
      const stmt = db.db.prepare(`
        INSERT INTO revenue_data (
          customer, service_type, year, month,
          cost, original_cost, target, original_target, revenue, receivables_collected,
          analysis_date, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), datetime('now'))
        ON CONFLICT(customer, service_type, year, month)
        DO UPDATE SET
          cost = excluded.cost,
          original_cost = excluded.original_cost,
          target = excluded.target,
          original_target = excluded.original_target,
          revenue = excluded.revenue,
          receivables_collected = excluded.receivables_collected,
          analysis_date = date('now'),
          updated_at = datetime('now')
      `);
      
      for (const record of records) {
        try {
          // Validate and clean data
          const cleanedData = this.validateAndCleanRow(record);
          if (!cleanedData) {
            errors++;
            continue;
          }
          
          // Execute prepared statement
          const result = stmt.run(
            cleanedData.customer,
            cleanedData.service_type,
            cleanedData.year,
            cleanedData.month,
            cleanedData.cost,
            cleanedData.original_cost,
            cleanedData.target,
            cleanedData.original_target,
            cleanedData.revenue,
            cleanedData.receivables_collected
          );
          
          if (result.changes > 0) {
            if (result.lastInsertRowid) inserted++;
            else updated++;
          }
        } catch (err) {
          console.error('Error processing row:', record, err);
          errors++;
        }
      }
    });
    
    try {
      // Execute transaction
      transaction(data);
      
      return {
        success: true,
        totalRecords: data.length,
        inserted,
        updated,
        errors
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  validateAndCleanRow(row) {
    // Required fields
    if (!row.Customer || !row.Service_Type || !row.Year || !row.Month) {
      console.warn('Missing required fields:', row);
      return null;
    }
    
    const year = parseInt(row.Year) || new Date().getFullYear();
    const month = String(row.Month).trim();
    const originalTarget = parseFloat(row.Target) || 0;
    const originalCost = parseFloat(row.Cost) || 0;
    
    // Calculate pro-rated target and cost for current month
    const proRatedTarget = this.calculateProRatedTarget(originalTarget, year, month);
    const proRatedCost = this.calculateProRatedTarget(originalCost, year, month); // Same pro-rating logic
    
    return {
      customer: String(row.Customer).trim(),
      service_type: String(row.Service_Type).trim(),
      year: year,
      month: month,
      cost: proRatedCost,
      original_cost: originalCost,
      target: proRatedTarget,
      original_target: originalTarget,
      revenue: parseFloat(row.Revenue) || 0,
      receivables_collected: parseFloat(row['Receivables Collected']) || 0
    };
  }


  async getMonthNumber(monthName) {
    return this.monthMap[monthName] || 0;
  }

  // Calculate pro-rated target based on elapsed days in the month
  calculateProRatedTarget(originalTarget, year, monthName) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();
    
    const monthNumber = this.monthMap[monthName] || 0;
    
    // If it's not the current month/year, use full target
    if (year !== currentYear || monthNumber !== currentMonth) {
      return originalTarget;
    }
    
    // For current month, calculate pro-rated target
    const daysInMonth = this.getDaysInMonth(year, monthNumber);
    const elapsedDays = currentDay;
    
    // Pro-rate the target based on elapsed days
    const proRatedTarget = (originalTarget / daysInMonth) * elapsedDays;
    
    console.log(`Pro-rating value for ${monthName} ${year}: ${originalTarget} → ${proRatedTarget.toFixed(2)} (${elapsedDays}/${daysInMonth} days)`);
    
    return proRatedTarget;
  }
  
  // Get number of days in a specific month
  getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  async processSalesPlanData(data) {
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    const transaction = db.transaction((records) => {
      const stmt = db.db.prepare(`
        INSERT INTO sales_plan_data (
          gl, month, year, service_type, baseline_forecast, opportunity_value,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(gl, month, year, service_type)
        DO UPDATE SET
          baseline_forecast = excluded.baseline_forecast,
          opportunity_value = excluded.opportunity_value,
          updated_at = datetime('now')
      `);
      
      for (const record of records) {
        try {
          // Validate sales plan data
          const cleanedData = this.validateSalesPlanRow(record);
          if (!cleanedData) {
            errors++;
            continue;
          }
          
          const result = stmt.run(
            cleanedData.gl,
            cleanedData.month,
            cleanedData.year,
            cleanedData.service_type,
            cleanedData.baseline_forecast,
            cleanedData.opportunity_value
          );
          
          if (result.changes > 0) {
            if (result.lastInsertRowid) inserted++;
            else updated++;
          }
        } catch (err) {
          console.error('Error processing sales plan row:', record, err);
          errors++;
        }
      }
    });
    
    try {
      transaction(data);
      
      return {
        success: true,
        type: 'salesPlan',
        totalRecords: data.length,
        inserted,
        updated,
        errors
      };
    } catch (error) {
      console.error('Sales plan transaction failed:', error);
      throw error;
    }
  }
  
  validateSalesPlanRow(row) {
    // Required fields for sales plan
    if (!row.gl || !row.month || !row.year || !row.service_type) {
      console.warn('Missing required sales plan fields:', row);
      return null;
    }
    
    return {
      gl: String(row.gl).trim(),
      month: String(row.month).trim(),
      year: parseInt(row.year) || new Date().getFullYear(),
      service_type: String(row.service_type).trim(),
      baseline_forecast: parseFloat(row.baseline_forecast) || 0,
      opportunity_value: parseFloat(row.opportunity_value) || 0
    };
  }
  
  async processOpportunitiesData(data) {
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    const transaction = db.transaction((records) => {
      // First, clear existing opportunities to prevent duplicates
      db.db.prepare('DELETE FROM opportunities_data').run();
      
      const stmt = db.db.prepare(`
        INSERT INTO opportunities_data (
          project, service, location, scope_of_work, requirements,
          status, est_monthly_revenue, est_gp_percent,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      
      // Track unique projects to prevent duplicates within the same upload
      const seenProjects = new Set();
      
      for (const record of records) {
        try {
          // Validate opportunities data
          const cleanedData = this.validateOpportunityRow(record);
          if (!cleanedData) {
            errors++;
            continue;
          }
          
          // Skip if we've already seen this project in this upload
          if (seenProjects.has(cleanedData.project)) {
            console.log(`Skipping duplicate project: ${cleanedData.project}`);
            continue;
          }
          
          seenProjects.add(cleanedData.project);
          
          const result = stmt.run(
            cleanedData.project,
            cleanedData.service,
            cleanedData.location,
            cleanedData.scope_of_work,
            cleanedData.requirements,
            cleanedData.status,
            cleanedData.est_monthly_revenue,
            cleanedData.est_gp_percent
          );
          
          if (result.changes > 0) {
            inserted++;
          }
        } catch (err) {
          console.error('Error processing opportunity row:', record, err);
          errors++;
        }
      }
    });
    
    try {
      transaction(data);
      
      return {
        success: true,
        type: 'opportunities',
        totalRecords: data.length,
        inserted,
        errors
      };
    } catch (error) {
      console.error('Opportunities transaction failed:', error);
      throw error;
    }
  }
  
  validateOpportunityRow(row) {
    // Required fields for opportunities
    if (!row.Project || !row.Service) {
      console.warn('Missing required opportunity fields:', row);
      return null;
    }
    
    // Parse GP percentage (remove % sign if present)
    let gpPercent = null;
    if (row['Est. GP%'] && String(row['Est. GP%']).trim() !== '') {
      const gpValue = parseFloat(String(row['Est. GP%']).replace('%', ''));
      if (!isNaN(gpValue)) {
        // Convert percentage to decimal (e.g., 25% -> 0.25)
        gpPercent = gpValue / 100;
      }
    }
    
    // Parse monthly revenue (remove commas)
    let monthlyRevenue = null;
    if (row['Est. Monthly Revenue'] && String(row['Est. Monthly Revenue']).trim() !== '') {
      const revenue = parseFloat(String(row['Est. Monthly Revenue']).replace(/,/g, ''));
      if (!isNaN(revenue)) {
        monthlyRevenue = revenue;
      }
    }
    
    return {
      project: String(row.Project).trim(),
      service: String(row.Service).trim(),
      location: row.Location ? String(row.Location).trim() : null,
      scope_of_work: row['Scope of work'] ? String(row['Scope of work']).trim() : null,
      requirements: row.Requirements ? String(row.Requirements).trim() : null,
      status: row.Status ? String(row.Status).trim() : null,
      est_monthly_revenue: monthlyRevenue,
      est_gp_percent: gpPercent
    };
  }

  // Calculate period metrics
  async calculatePeriodMetrics(year, period = 'YTD') {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    let monthStart, monthEnd;
    
    switch (period) {
      case 'MTD':
        monthStart = currentMonth;
        monthEnd = currentMonth;
        break;
      case 'QTD':
        const currentQuarter = Math.ceil(currentMonth / 3);
        monthStart = (currentQuarter - 1) * 3 + 1;
        monthEnd = Math.min(currentQuarter * 3, currentMonth);
        break;
      case 'YTD':
      default:
        monthStart = 1;
        monthEnd = currentMonth;
        break;
    }
    
    const monthNames = Object.keys(this.monthMap).filter(
      name => {
        const num = this.monthMap[name];
        return num >= monthStart && num <= monthEnd;
      }
    );
    
    const sql = `
      SELECT 
        customer,
        service_type,
        SUM(cost) as total_cost,
        SUM(target) as total_target,
        SUM(revenue) as total_revenue,
        SUM(receivables_collected) as total_receivables,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement_percentage
      FROM revenue_data
      WHERE year = ? AND month IN (${monthNames.map(() => '?').join(',')})
      GROUP BY customer, service_type
    `;
    
    return await dbWrapper.all(sql, [year, ...monthNames]);
  }
}

module.exports = new ETLService();