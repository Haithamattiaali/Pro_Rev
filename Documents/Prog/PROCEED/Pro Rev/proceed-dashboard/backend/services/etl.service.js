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
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = xlsx.utils.sheet_to_json(worksheet);
      
      // Process and insert data
      const results = await this.insertData(jsonData);
      
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