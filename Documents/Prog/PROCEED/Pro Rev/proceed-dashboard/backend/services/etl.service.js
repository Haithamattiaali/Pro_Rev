const xlsx = require('xlsx');
const db = require('../database/db-wrapper');
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
    
    // Start transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      for (const row of data) {
        try {
          // Validate and clean data
          const cleanedData = this.validateAndCleanRow(row);
          if (!cleanedData) {
            errors++;
            continue;
          }
          
          // Upsert data
          const result = await this.upsertRecord(cleanedData);
          if (result.changes > 0) {
            if (result.operation === 'insert') inserted++;
            else updated++;
          }
        } catch (err) {
          console.error('Error processing row:', row, err);
          errors++;
        }
      }
      
      // Commit transaction
      await db.run('COMMIT');
      
      return {
        success: true,
        totalRecords: data.length,
        inserted,
        updated,
        errors
      };
    } catch (error) {
      // Rollback on error
      await db.run('ROLLBACK');
      throw error;
    }
  }

  validateAndCleanRow(row) {
    // Required fields
    if (!row.Customer || !row.Service_Type || !row.Year || !row.Month) {
      console.warn('Missing required fields:', row);
      return null;
    }
    
    return {
      customer: String(row.Customer).trim(),
      service_type: String(row.Service_Type).trim(),
      year: parseInt(row.Year) || new Date().getFullYear(),
      month: String(row.Month).trim(),
      cost: parseFloat(row.Cost) || 0,
      target: parseFloat(row.Target) || 0,
      revenue: parseFloat(row.Revenue) || 0,
      receivables_collected: parseFloat(row['Receivables Collected']) || 0
    };
  }

  async upsertRecord(data) {
    const sql = `
      INSERT INTO revenue_data (
        customer, service_type, year, month,
        cost, target, revenue, receivables_collected,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(customer, service_type, year, month)
      DO UPDATE SET
        cost = excluded.cost,
        target = excluded.target,
        revenue = excluded.revenue,
        receivables_collected = excluded.receivables_collected,
        updated_at = datetime('now')
    `;
    
    const params = [
      data.customer,
      data.service_type,
      data.year,
      data.month,
      data.cost,
      data.target,
      data.revenue,
      data.receivables_collected
    ];
    
    const result = await db.run(sql, params);
    result.operation = result.changes > 0 && result.id ? 'insert' : 'update';
    return result;
  }

  async getMonthNumber(monthName) {
    return this.monthMap[monthName] || 0;
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
    
    return await db.all(sql, [year, ...monthNames]);
  }
}

module.exports = new ETLService();