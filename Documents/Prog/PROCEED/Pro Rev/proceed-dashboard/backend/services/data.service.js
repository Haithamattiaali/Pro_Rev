const db = require('../database/db-wrapper');

class DataService {
  constructor() {
    this.monthMap = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
  }

  getPeriodMonths(year, period, month = null, quarter = null) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    let monthStart, monthEnd;
    
    // Adjust for current year vs past years
    const maxMonth = year < currentYear ? 12 : currentMonth;
    
    switch (period) {
      case 'MTD':
        // If specific month is provided, use it; otherwise use current/max month
        if (month && month !== 'all') {
          monthStart = month;
          monthEnd = month;
        } else if (month === 'all') {
          monthStart = 1;
          monthEnd = maxMonth;
        } else {
          monthStart = maxMonth;
          monthEnd = maxMonth;
        }
        break;
      case 'QTD':
        // If specific quarter is provided, use it; otherwise use current quarter
        let targetQuarter;
        if (quarter && quarter !== 'all') {
          targetQuarter = quarter;
        } else if (quarter === 'all') {
          monthStart = 1;
          monthEnd = maxMonth;
          break;
        } else {
          targetQuarter = Math.ceil(maxMonth / 3);
        }
        monthStart = (targetQuarter - 1) * 3 + 1;
        monthEnd = Math.min(targetQuarter * 3, maxMonth);
        break;
      case 'YTD':
      default:
        monthStart = 1;
        monthEnd = maxMonth;
        break;
    }
    
    return Object.entries(this.monthMap)
      .filter(([name, num]) => num >= monthStart && num <= monthEnd)
      .map(([name]) => name);
  }

  async getOverviewData(year, period, month = null, quarter = null) {
    const months = this.getPeriodMonths(year, period, month, quarter);
    const placeholders = months.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        SUM(revenue) as total_revenue,
        SUM(target) as total_target,
        SUM(cost) as total_cost,
        SUM(receivables_collected) as total_receivables,
        COUNT(DISTINCT customer) as customer_count,
        COUNT(DISTINCT service_type) as service_count,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement_percentage
      FROM revenue_data
      WHERE year = ? AND month IN (${placeholders})
    `;
    
    const overview = await db.get(sql, [year, ...months]);
    
    // Get service breakdown
    const serviceBreakdownSql = `
      SELECT 
        service_type,
        SUM(revenue) as revenue,
        SUM(target) as target,
        SUM(cost) as cost,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement_percentage
      FROM revenue_data
      WHERE year = ? AND month IN (${placeholders})
      GROUP BY service_type
      ORDER BY revenue DESC
    `;
    
    const serviceBreakdown = await db.all(serviceBreakdownSql, [year, ...months]);
    
    return {
      period,
      year,
      overview: {
        revenue: overview.total_revenue || 0,
        target: overview.total_target || 0,
        cost: overview.total_cost || 0,
        receivables: overview.total_receivables || 0,
        achievement: overview.achievement_percentage || 0,
        customerCount: overview.customer_count || 0,
        serviceCount: overview.service_count || 0,
        profit: (overview.total_revenue || 0) - (overview.total_cost || 0),
        profitMargin: overview.total_revenue > 0 
          ? ((overview.total_revenue - overview.total_cost) / overview.total_revenue) * 100 
          : 0
      },
      serviceBreakdown
    };
  }

  async getBusinessUnitData(year, period, month = null, quarter = null) {
    const months = this.getPeriodMonths(year, period, month, quarter);
    const placeholders = months.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        service_type as businessUnit,
        SUM(revenue) as revenue,
        SUM(target) as target,
        SUM(cost) as cost,
        SUM(receivables_collected) as receivables,
        COUNT(DISTINCT customer) as customerCount,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement
      FROM revenue_data
      WHERE year = ? AND month IN (${placeholders})
      GROUP BY service_type
      ORDER BY revenue DESC
    `;
    
    const data = await db.all(sql, [year, ...months]);
    
    return data.map(unit => ({
      ...unit,
      profit: unit.revenue - unit.cost,
      profitMargin: unit.revenue > 0 ? ((unit.revenue - unit.cost) / unit.revenue) * 100 : 0
    }));
  }

  async getCustomerData(year, period, month = null, quarter = null) {
    const months = this.getPeriodMonths(year, period, month, quarter);
    const placeholders = months.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        customer,
        SUM(revenue) as revenue,
        SUM(target) as target,
        SUM(cost) as cost,
        SUM(receivables_collected) as receivables,
        GROUP_CONCAT(DISTINCT service_type) as services,
        COUNT(DISTINCT service_type) as serviceCount,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement
      FROM revenue_data
      WHERE year = ? AND month IN (${placeholders})
      GROUP BY customer
      ORDER BY revenue DESC
    `;
    
    const data = await db.all(sql, [year, ...months]);
    
    return data.map(customer => ({
      ...customer,
      profit: customer.revenue - customer.cost,
      profitMargin: customer.revenue > 0 ? ((customer.revenue - customer.cost) / customer.revenue) * 100 : 0,
      services: customer.services ? customer.services.split(',') : []
    }));
  }

  async getMonthlyTrends(year, serviceType = null) {
    let sql;
    let params = [year];
    
    if (serviceType) {
      sql = `
        SELECT 
          month,
          SUM(revenue) as revenue,
          SUM(target) as target,
          SUM(cost) as cost,
          SUM(receivables_collected) as receivables
        FROM revenue_data
        WHERE year = ? AND service_type = ?
        GROUP BY month
        ORDER BY 
          CASE month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END
      `;
      params.push(serviceType);
    } else {
      sql = `
        SELECT 
          month,
          SUM(revenue) as revenue,
          SUM(target) as target,
          SUM(cost) as cost,
          SUM(receivables_collected) as receivables
        FROM revenue_data
        WHERE year = ?
        GROUP BY month
        ORDER BY 
          CASE month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END
      `;
    }
    
    return await db.all(sql, params);
  }

  async getCustomerAchievement(year, period, month = null, quarter = null) {
    const months = this.getPeriodMonths(year, period, month, quarter);
    const placeholders = months.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        customer,
        service_type,
        SUM(revenue) as revenue,
        SUM(target) as target,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement
      FROM revenue_data
      WHERE year = ? AND month IN (${placeholders})
      GROUP BY customer, service_type
      ORDER BY customer, service_type
    `;
    
    const data = await db.all(sql, [year, ...months]);
    
    // Group by customer
    const grouped = {};
    data.forEach(row => {
      if (!grouped[row.customer]) {
        grouped[row.customer] = {
          customer: row.customer,
          services: [],
          totalRevenue: 0,
          totalTarget: 0
        };
      }
      
      grouped[row.customer].services.push({
        serviceType: row.service_type,
        revenue: row.revenue,
        target: row.target,
        achievement: row.achievement
      });
      
      grouped[row.customer].totalRevenue += row.revenue;
      grouped[row.customer].totalTarget += row.target;
    });
    
    return Object.values(grouped).map(customer => ({
      ...customer,
      overallAchievement: customer.totalTarget > 0 
        ? (customer.totalRevenue / customer.totalTarget) * 100 
        : 0
    }));
  }

  async getCustomerServiceBreakdown(year, period, month = null, quarter = null) {
    const months = this.getPeriodMonths(year, period, month, quarter);
    const placeholders = months.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        customer,
        service_type,
        SUM(revenue) as revenue
      FROM revenue_data
      WHERE year = ? AND month IN (${placeholders})
      GROUP BY customer, service_type
      ORDER BY customer, revenue DESC
    `;
    
    const data = await db.all(sql, [year, ...months]);
    
    // Group by customer
    const grouped = {};
    data.forEach(row => {
      if (!grouped[row.customer]) {
        grouped[row.customer] = {
          customer: row.customer,
          transportation: 0,
          warehouses: 0,
          total: 0
        };
      }
      
      if (row.service_type === 'Transportation') {
        grouped[row.customer].transportation = row.revenue;
      } else if (row.service_type === 'Warehouses') {
        grouped[row.customer].warehouses = row.revenue;
      }
      grouped[row.customer].total += row.revenue;
    });
    
    return Object.values(grouped);
  }

  async getAvailableYears() {
    const sql = `
      SELECT DISTINCT year 
      FROM revenue_data 
      ORDER BY year DESC
    `;
    
    const years = await db.all(sql);
    return years.map(row => row.year);
  }
}

module.exports = new DataService();