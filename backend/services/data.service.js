const db = require('../database/db-wrapper');
const { calculateGrossProfit, calculateGrossProfitMargin, calculatePerformanceCost } = require('../utils/profitCalculations');

class DataService {
  constructor() {
    this.monthMap = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
  }

  // Helper function to get calendar days in a month
  getCalendarDaysInMonth(year, monthName) {
    const monthIndex = this.monthMap[monthName] - 1; // JavaScript months are 0-based
    if (monthIndex === undefined || monthIndex < 0) return 30; // Default fallback
    
    // Get the last day of the month by going to next month's day 0
    const date = new Date(year, monthIndex + 1, 0);
    return date.getDate();
  }

  // SQL CASE statement for calendar days calculation
  getCalendarDaysSQL() {
    return `CASE month
      WHEN 'Jan' THEN 31
      WHEN 'Feb' THEN CASE WHEN year % 4 = 0 AND (year % 100 != 0 OR year % 400 = 0) THEN 29 ELSE 28 END
      WHEN 'Mar' THEN 31
      WHEN 'Apr' THEN 30
      WHEN 'May' THEN 31
      WHEN 'Jun' THEN 30
      WHEN 'Jul' THEN 31
      WHEN 'Aug' THEN 31
      WHEN 'Sep' THEN 30
      WHEN 'Oct' THEN 31
      WHEN 'Nov' THEN 30
      WHEN 'Dec' THEN 31
    END`;
  }

  // New method to handle multi-select filters
  getMultiSelectMonths(filters) {
    const { months = [], quarters = [], years = [] } = filters;
    
    console.log('🗓️ getMultiSelectMonths called with:', { 
      months, 
      quarters, 
      years,
      monthsType: typeof months,
      quartersType: typeof quarters,
      monthsArray: Array.isArray(months),
      quartersArray: Array.isArray(quarters),
      monthsContent: months,
      quartersContent: quarters
    });
    
    // If no years selected, return empty array (no data)
    if (!years || years.length === 0) {
      return [];
    }
    
    const allMonths = [];

    // If specific months are selected, use them
    if (months.length > 0) {
      months.forEach(monthNum => {
        const monthName = Object.keys(this.monthMap).find(name => this.monthMap[name] === monthNum);
        if (monthName) {
          allMonths.push(monthName);
        }
      });
    }

    // If specific quarters are selected, convert to months
    if (quarters.length > 0) {
      quarters.forEach(quarterNum => {
        const startMonth = (quarterNum - 1) * 3 + 1;
        const endMonth = quarterNum * 3;
        
        console.log(`🗓️ Quarter ${quarterNum} maps to months ${startMonth}-${endMonth}`);
        
        Object.entries(this.monthMap).forEach(([name, num]) => {
          if (num >= startMonth && num <= endMonth && !allMonths.includes(name)) {
            console.log(`🗓️   Adding month: ${name} (${num})`);
            allMonths.push(name);
          }
        });
      });
    }

    // If no months or quarters selected but year is selected, use full year
    if (months.length === 0 && quarters.length === 0 && years.length > 0) {
      return Object.keys(this.monthMap);
    }

    // Sort months in chronological order
    const sortedMonths = allMonths.sort((a, b) => this.monthMap[a] - this.monthMap[b]);
    
    console.log('🗓️ getMultiSelectMonths returning:', sortedMonths);
    console.log('🗓️ Month numbers:', sortedMonths.map(m => `${m}(${this.monthMap[m]})`).join(', '));
    
    // Validation: Check if we have the expected months for Q1+Q2
    if (quarters.length === 2 && quarters.includes(1) && quarters.includes(2)) {
      const expectedMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const hasUnexpectedMonths = sortedMonths.some(m => !expectedMonths.includes(m));
      if (hasUnexpectedMonths) {
        console.error('🚨 ERROR: Unexpected months in Q1+Q2 selection:', sortedMonths.filter(m => !expectedMonths.includes(m)));
      }
    }
    
    return sortedMonths;
  }

  getPeriodMonths(year, period, month = null, quarter = null) {
    console.log('🗓️ getPeriodMonths called with:', { year, period, month, quarter });
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    let monthStart, monthEnd;
    
    // For MTD, use the current month
    // For QTD/YTD, use all months up to current month
    const maxMonth = 12; // Allow all months since we have data for full year
    
    switch (period) {
      case 'NONE':
        // No data should be shown
        console.log('🗓️ Period is NONE, returning empty array');
        return [];
      case 'MTD':
        // If specific month is provided, use it; otherwise use current month
        if (month && month !== 'all') {
          monthStart = month;
          monthEnd = month;
          console.log('🗓️ MTD with specific month:', month);
        } else if (month === 'all') {
          monthStart = 1;
          monthEnd = 12;
          console.log('🗓️ MTD with all months');
        } else {
          // Use current month for MTD
          monthStart = currentMonth;
          monthEnd = currentMonth;
          console.log('🗓️ MTD with current month:', currentMonth);
        }
        break;
      case 'QTD':
        // If specific quarter is provided, use it; otherwise use current quarter
        let targetQuarter;
        if (quarter && quarter !== 'all') {
          targetQuarter = quarter;
        } else if (quarter === 'all') {
          monthStart = 1;
          monthEnd = 12;
          break;
        } else {
          // Use current quarter
          targetQuarter = Math.ceil(currentMonth / 3);
        }
        monthStart = (targetQuarter - 1) * 3 + 1;
        monthEnd = Math.min(targetQuarter * 3, currentMonth);
        break;
      case 'YTD':
        // Show full year data
        monthStart = 1;
        monthEnd = 12; // Changed to show full year instead of up to current month
        break;
      case 'YEAR':
        // Year shows all 12 months
        monthStart = 1;
        monthEnd = 12;
        console.log('🗓️ YEAR - all 12 months');
        break;
      default:
        monthStart = 1;
        monthEnd = currentMonth;
        break;
    }
    
    const result = Object.entries(this.monthMap)
      .filter(([name, num]) => num >= monthStart && num <= monthEnd)
      .map(([name]) => name);
    
    console.log('🗓️ getPeriodMonths returning:', { monthStart, monthEnd, months: result });
    return result;
  }

  // New method with multi-select support
  async getOverviewDataMultiSelect(filters) {
    const { years = [new Date().getFullYear()], months = [], quarters = [] } = filters;
    
    console.log('📊 Backend getOverviewDataMultiSelect called with:', {
      filters,
      years,
      months,
      quarters,
      hasYears: years.length > 0,
      hasMonths: months.length > 0,
      hasQuarters: quarters.length > 0,
      rawFilters: JSON.stringify(filters)
    });
    
    // Get all applicable months
    const selectedMonths = this.getMultiSelectMonths({ years, months, quarters });
    
    console.log('📊 Backend selected months after conversion:', selectedMonths);
    console.log('📊 Backend will query with:', {
      yearCount: years.length,
      monthCount: selectedMonths.length,
      years: years,
      months: selectedMonths
    });
    
    if (selectedMonths.length === 0 || years.length === 0) {
      return {
        filters,
        overview: {
          revenue: 0,
          target: 0,
          cost: 0,
          receivables: 0,
          achievement: 0,
          customerCount: 0,
          serviceCount: 0,
          profit: 0,
          profitMargin: 0
        },
        serviceBreakdown: []
      };
    }

    // Build SQL with IN clauses for multiple selections
    const yearPlaceholders = years.map(() => '?').join(',');
    const monthPlaceholders = selectedMonths.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        SUM(revenue) as total_revenue,
        SUM(COALESCE(target, 0)) as total_target,
        SUM(COALESCE(original_cost, cost, 0)) as total_cost,
        SUM(receivables_collected) as total_receivables,
        COUNT(DISTINCT customer) as customer_count,
        COUNT(DISTINCT service_type) as service_count,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement_percentage
      FROM revenue_data
      WHERE year IN (${yearPlaceholders}) AND month IN (${monthPlaceholders})
    `;
    
    console.log('📊 Multi-select SQL params:', { years, selectedMonths });
    console.log('📊 SQL Query:', sql);
    console.log('📊 SQL Parameters:', [...years, ...selectedMonths]);
    console.log('📊 SQL Month placeholders:', monthPlaceholders);
    console.log('📊 Month values for IN clause:', selectedMonths);
    
    const overview = await db.get(sql, [...years, ...selectedMonths]);
    console.log('📊 Multi-select overview result:', overview);
    
    // Get service breakdown
    const serviceBreakdownSql = `
      SELECT 
        service_type,
        SUM(revenue) as revenue,
        SUM(target) as target,
        SUM(COALESCE(original_cost, cost, 0)) as cost,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement_percentage
      FROM revenue_data
      WHERE year IN (${yearPlaceholders}) AND month IN (${monthPlaceholders})
      GROUP BY service_type
      ORDER BY revenue DESC
    `;
    
    const serviceBreakdown = await db.all(serviceBreakdownSql, [...years, ...selectedMonths]);
    
    // Debug: Check what months are actually in the result
    const debugSql = `
      SELECT DISTINCT month, COUNT(*) as record_count
      FROM revenue_data
      WHERE year IN (${yearPlaceholders}) AND month IN (${monthPlaceholders})
      GROUP BY month
      ORDER BY 
        CASE month
          WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
          WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
          WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
          WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END
    `;
    const monthsInResult = await db.all(debugSql, [...years, ...selectedMonths]);
    console.log('📊 DEBUG - Months actually in result:', monthsInResult);
    
    // Additional debug: Show raw data sample
    const sampleDataSql = `
      SELECT customer, service_type, year, month, revenue, target
      FROM revenue_data
      WHERE year IN (${yearPlaceholders}) AND month IN (${monthPlaceholders})
      LIMIT 5
    `;
    const sampleData = await db.all(sampleDataSql, [...years, ...selectedMonths]);
    console.log('📊 DEBUG - Sample data rows:', sampleData);
    
    return {
      filters,
      overview: {
        revenue: overview.total_revenue || 0,
        target: overview.total_target || 0,
        cost: calculatePerformanceCost(overview.total_revenue || 0, overview.total_target || 0, overview.total_cost || 0),
        originalCost: overview.total_cost || 0, // Keep original for reference
        receivables: overview.total_receivables || 0,
        achievement: overview.achievement_percentage || 0,
        customerCount: overview.customer_count || 0,
        serviceCount: overview.service_count || 0,
        profit: calculateGrossProfit(overview.total_revenue || 0, overview.total_target || 0, overview.total_cost || 0),
        profitMargin: calculateGrossProfitMargin(
          calculateGrossProfit(overview.total_revenue || 0, overview.total_target || 0, overview.total_cost || 0),
          overview.total_revenue || 0
        )
      },
      serviceBreakdown
    };
  }

  async getOverviewData(year, period, month = null, quarter = null) {
    console.log('📊 Backend getOverviewData called with:', { year, period, month, quarter });
    
    // Check if year is null or undefined
    if (!year || period === 'NONE') {
      console.log('📊 Backend: No year or NONE period, returning empty data');
      return {
        period,
        year,
        overview: {
          revenue: 0,
          target: 0,
          cost: 0,
          receivables: 0,
          achievement: 0,
          customerCount: 0,
          serviceCount: 0,
          profit: 0,
          profitMargin: 0
        },
        serviceBreakdown: [],
      };
    }
    
    // Get validated months and validation info
    const validatedData = await this.getValidatedPeriodMonths(year, period, month, quarter);
    const months = validatedData.months;
    console.log('📊 Backend: Months to query:', months);
    
    // If no valid months, return empty data with validation message
    if (months.length === 0) {
      return {
        period,
        year,
        overview: {
          revenue: 0,
          target: 0,
          cost: 0,
          receivables: 0,
          achievement: 0,
          customerCount: 0,
          serviceCount: 0,
          profit: 0,
          profitMargin: 0
        },
        serviceBreakdown: [],
      };
    }
    
    const placeholders = months.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        SUM(revenue) as total_revenue,
        SUM(COALESCE(target, 0)) as total_target,
        SUM(COALESCE(original_cost, cost, 0)) as total_cost,
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
    
    console.log('📊 Backend: Executing SQL with params:', { year, months, placeholders });
    const overview = await db.get(sql, [year, ...months]);
    
    // Get service breakdown
    const serviceBreakdownSql = `
      SELECT 
        service_type,
        SUM(revenue) as revenue,
        SUM(target) as target,
        SUM(COALESCE(original_cost, cost, 0)) as cost,
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
        cost: calculatePerformanceCost(overview.total_revenue || 0, overview.total_target || 0, overview.total_cost || 0),
        originalCost: overview.total_cost || 0, // Keep original for reference
        receivables: overview.total_receivables || 0,
        achievement: overview.achievement_percentage || 0,
        customerCount: overview.customer_count || 0,
        serviceCount: overview.service_count || 0,
        profit: calculateGrossProfit(overview.total_revenue || 0, overview.total_target || 0, overview.total_cost || 0),
        profitMargin: calculateGrossProfitMargin(
          calculateGrossProfit(overview.total_revenue || 0, overview.total_target || 0, overview.total_cost || 0),
          overview.total_revenue || 0
        )
      },
      serviceBreakdown
    };
  }

  async getBusinessUnitData(year, period, month = null, quarter = null) {
    // Check if year is null or undefined
    if (!year || period === 'NONE') {
      return {
        businessUnits: [],
        monthlyBreakdown: []
      };
    }
    
    // Get validated months
    const validatedData = await this.getValidatedPeriodMonths(year, period, month, quarter);
    const months = validatedData.months;
    
    if (months.length === 0) {
      return [];
    }
    
    const placeholders = months.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        service_type as businessUnit,
        SUM(revenue) as revenue,
        SUM(target) as target,
        SUM(COALESCE(original_cost, cost, 0)) as cost,
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
      cost: calculatePerformanceCost(unit.revenue || 0, unit.target || 0, unit.cost || 0),
      originalCost: unit.cost || 0, // Keep original for reference
      profit: calculateGrossProfit(unit.revenue || 0, unit.target || 0, unit.cost || 0),
      profitMargin: calculateGrossProfitMargin(
        calculateGrossProfit(unit.revenue || 0, unit.target || 0, unit.cost || 0),
        unit.revenue || 0
      )
    }));
  }

  async getCustomerData(year, period, month = null, quarter = null) {
    // Check if year is null or undefined
    if (!year || period === 'NONE') {
      return [];
    }
    
    // Get validated months
    const validatedData = await this.getValidatedPeriodMonths(year, period, month, quarter);
    const months = validatedData.months;
    
    if (months.length === 0) {
      return [];
    }
    
    const placeholders = months.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        customer,
        SUM(revenue) as revenue,
        SUM(target) as target,
        SUM(COALESCE(original_cost, cost, 0)) as cost,
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
      cost: calculatePerformanceCost(customer.revenue || 0, customer.target || 0, customer.cost || 0),
      originalCost: customer.cost || 0, // Keep original for reference
      profit: calculateGrossProfit(customer.revenue || 0, customer.target || 0, customer.cost || 0),
      profitMargin: calculateGrossProfitMargin(
        calculateGrossProfit(customer.revenue || 0, customer.target || 0, customer.cost || 0),
        customer.revenue || 0
      ),
      services: customer.services ? customer.services.split(',') : []
    }));
  }

  // Multi-select business unit data
  async getBusinessUnitDataMultiSelect(filters) {
    const { years = [], months = [], quarters = [] } = filters;
    
    // Get all applicable months
    const selectedMonths = this.getMultiSelectMonths({ years, months, quarters });
    
    if (selectedMonths.length === 0 || years.length === 0) {
      return {
        filters,
        businessUnits: [],
        monthlyBreakdown: []
      };
    }
    
    const monthPlaceholders = selectedMonths.map(() => '?').join(',');
    const yearPlaceholders = years.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        service_type as businessUnit,
        SUM(revenue) as revenue,
        SUM(target) as target,
        SUM(COALESCE(original_cost, cost, 0)) as cost,
        SUM(receivables_collected) as receivables,
        COUNT(DISTINCT customer) as customerCount,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement
      FROM revenue_data
      WHERE year IN (${yearPlaceholders}) AND month IN (${monthPlaceholders})
      GROUP BY service_type
      ORDER BY revenue DESC
    `;
    
    const data = await db.all(sql, [...years, ...selectedMonths]);
    
    return {
      filters,
      businessUnits: data.map(unit => ({
        ...unit,
        cost: calculatePerformanceCost(unit.revenue || 0, unit.target || 0, unit.cost || 0),
        originalCost: unit.cost || 0,
        profit: calculateGrossProfit(unit.revenue || 0, unit.target || 0, unit.cost || 0),
        profitMargin: calculateGrossProfitMargin(
          calculateGrossProfit(unit.revenue || 0, unit.target || 0, unit.cost || 0),
          unit.revenue || 0
        )
      }))
    };
  }

  // Multi-select customer data
  async getCustomerDataMultiSelect(filters) {
    const { years = [], months = [], quarters = [] } = filters;
    
    // Get all applicable months
    const selectedMonths = this.getMultiSelectMonths({ years, months, quarters });
    
    if (selectedMonths.length === 0 || years.length === 0) {
      return {
        filters,
        customers: []
      };
    }
    
    const monthPlaceholders = selectedMonths.map(() => '?').join(',');
    const yearPlaceholders = years.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        customer,
        SUM(revenue) as revenue,
        SUM(target) as target,
        SUM(COALESCE(original_cost, cost, 0)) as cost,
        SUM(receivables_collected) as receivables,
        GROUP_CONCAT(DISTINCT service_type) as services,
        COUNT(DISTINCT service_type) as serviceCount,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement
      FROM revenue_data
      WHERE year IN (${yearPlaceholders}) AND month IN (${monthPlaceholders})
      GROUP BY customer
      ORDER BY revenue DESC
    `;
    
    const data = await db.all(sql, [...years, ...selectedMonths]);
    
    return {
      filters,
      customers: data.map(customer => ({
        ...customer,
        cost: calculatePerformanceCost(customer.revenue || 0, customer.target || 0, customer.cost || 0),
        originalCost: customer.cost || 0,
        profit: calculateGrossProfit(customer.revenue || 0, customer.target || 0, customer.cost || 0),
        profitMargin: calculateGrossProfitMargin(
          calculateGrossProfit(customer.revenue || 0, customer.target || 0, customer.cost || 0),
          customer.revenue || 0
        ),
        services: customer.services ? customer.services.split(',') : []
      }))
    };
  }

  async getMonthlyTrends(year, serviceType = null) {
    // Get validation data to filter out non-compliant months
    const validation = await this.getAnalysisPeriodValidation(year);
    
    // If no compliant months, return empty array
    if (validation.compliantMonths.length === 0) {
      return [];
    }
    
    // Build placeholders for compliant months
    const monthPlaceholders = validation.compliantMonths.map(() => '?').join(',');
    
    let sql;
    let params = [year, ...validation.compliantMonths];
    
    if (serviceType) {
      sql = `
        SELECT 
          month,
          SUM(revenue) as revenue,
          SUM(target) as target,
          SUM(COALESCE(original_cost, cost, 0)) as cost,
          SUM(receivables_collected) as receivables
        FROM revenue_data
        WHERE year = ? AND month IN (${monthPlaceholders}) AND service_type = ?
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
          SUM(COALESCE(original_cost, cost, 0)) as cost,
          SUM(receivables_collected) as receivables
        FROM revenue_data
        WHERE year = ? AND month IN (${monthPlaceholders})
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
    const validatedData = await this.getValidatedPeriodMonths(year, period, month, quarter);
    const months = validatedData.months;
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
    const validatedData = await this.getValidatedPeriodMonths(year, period, month, quarter);
    const months = validatedData.months;
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

  // Get gross profit data with pro-rated targets
  async getGrossProfitData(year, period, month = null, quarter = null) {
    // Get validated months
    const validatedData = await this.getValidatedPeriodMonths(year, period, month, quarter);
    const months = validatedData.months;
    
    if (months.length === 0) {
      return {
        period,
        year,
        grossProfit: 0,
        revenue: 0,
        cost: 0,
        target: 0,
        originalTarget: 0,
        achievement: 0,
        profitMargin: 0,
        serviceBreakdown: [],
      };
    }
    
    const placeholders = months.map(() => '?').join(',');
    
    // Get aggregated data with both target and original_target
    const sql = `
      SELECT 
        SUM(revenue) as total_revenue,
        SUM(COALESCE(original_cost, cost, 0)) as total_cost,
        SUM(COALESCE(target, 0)) as total_target,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement_percentage
      FROM revenue_data
      WHERE year = ? AND month IN (${placeholders})
    `;
    
    const data = await db.get(sql, [year, ...months]);
    
    // Get service type breakdown
    const serviceBreakdownSql = `
      SELECT 
        service_type,
        SUM(revenue) as revenue,
        SUM(COALESCE(original_cost, cost, 0)) as cost,
        SUM(target) as target,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement
      FROM revenue_data
      WHERE year = ? AND month IN (${placeholders})
      GROUP BY service_type
      ORDER BY revenue DESC
    `;
    
    const serviceBreakdown = await db.all(serviceBreakdownSql, [year, ...months]);
    
    // Update service breakdown with new profit calculation and performance costs
    const processedServiceBreakdown = serviceBreakdown.map(service => ({
      ...service,
      cost: calculatePerformanceCost(service.revenue || 0, service.target || 0, service.cost || 0),
      originalCost: service.cost || 0, // Keep original for reference
      profit: calculateGrossProfit(service.revenue || 0, service.target || 0, service.cost || 0),
      profit_margin: calculateGrossProfitMargin(
        calculateGrossProfit(service.revenue || 0, service.target || 0, service.cost || 0),
        service.revenue || 0
      )
    }));
    
    // Calculate gross profit with new formula
    const grossProfit = calculateGrossProfit(data.total_revenue || 0, data.total_target || 0, data.total_cost || 0);
    const profitMargin = calculateGrossProfitMargin(grossProfit, data.total_revenue || 0);
    
    return {
      period,
      year,
      grossProfit,
      revenue: data.total_revenue || 0,
      cost: data.total_cost || 0,
      target: data.total_target || 0,
      achievement: data.achievement_percentage || 0,
      profitMargin,
      serviceBreakdown: processedServiceBreakdown
    };
  }

  // Get analysis period validation for a specific year
  async getAnalysisPeriodValidation(year) {
    const sql = `
      SELECT 
        month,
        COUNT(CASE WHEN revenue > 0 THEN 1 END) as has_revenue,
        COUNT(CASE WHEN cost > 0 THEN 1 END) as has_cost,
        COUNT(CASE WHEN target > 0 THEN 1 END) as has_target,
        SUM(revenue) as total_revenue,
        SUM(cost) as total_cost,
        SUM(target) as total_target
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
    
    const monthsData = await db.all(sql, [year]);
    
    // Analyze which months have complete data (revenue, cost, and target)
    const compliantMonths = [];
    const nonCompliantMonths = [];
    const missingDataDetails = {};
    
    monthsData.forEach(month => {
      const isCompliant = month.has_revenue > 0 && month.has_cost > 0 && month.has_target > 0;
      
      if (isCompliant) {
        compliantMonths.push(month.month);
      } else {
        nonCompliantMonths.push(month.month);
        
        const missing = [];
        if (month.has_revenue === 0 || month.total_revenue === 0) missing.push('revenue');
        if (month.has_cost === 0 || month.total_cost === 0) missing.push('cost');
        if (month.has_target === 0 || month.total_target === 0) missing.push('target');
        
        missingDataDetails[month.month] = missing;
      }
    });
    
    // Determine the analysis period boundaries
    let analysisPeriodStart = null;
    let analysisPeriodEnd = null;
    
    if (compliantMonths.length > 0) {
      // Find the first and last compliant months
      const monthNumbers = compliantMonths.map(m => this.monthMap[m]);
      analysisPeriodStart = compliantMonths[monthNumbers.indexOf(Math.min(...monthNumbers))];
      analysisPeriodEnd = compliantMonths[monthNumbers.indexOf(Math.max(...monthNumbers))];
    }
    
    return {
      year,
      compliantMonths,
      nonCompliantMonths,
      missingDataDetails,
      analysisPeriod: {
        start: analysisPeriodStart,
        end: analysisPeriodEnd,
        isComplete: compliantMonths.length === 12,
        monthCount: compliantMonths.length
      },
      validationMessage: this.generateValidationMessage(compliantMonths, nonCompliantMonths, missingDataDetails)
    };
  }

  generateValidationMessage(compliantMonths, nonCompliantMonths, missingDataDetails) {
    if (compliantMonths.length === 0) {
      return {
        type: 'error',
        message: 'No analysis period available. Please upload data with revenue, cost, and target for at least one month.'
      };
    }
    
    if (nonCompliantMonths.length === 0) {
      return {
        type: 'success',
        message: 'All months have complete data for analysis.'
      };
    }
    
    // Generate detailed message about missing data
    const missingDetails = nonCompliantMonths.map(month => {
      const missing = missingDataDetails[month];
      return `${month} (missing: ${missing.join(', ')})`;
    });
    
    return {
      type: 'warning',
      message: `Analysis period: ${compliantMonths[0]} to ${compliantMonths[compliantMonths.length - 1]}. ` +
               `Some months have incomplete data: ${missingDetails.join(', ')}. ` +
               `Consider uploading the missing data for complete analysis.`
    };
  }

  // Get filtered period months based on analysis period validation
  async getValidatedPeriodMonths(year, period, month = null, quarter = null) {
    const validation = await this.getAnalysisPeriodValidation(year);
    const requestedMonths = this.getPeriodMonths(year, period, month, quarter);
    
    // Filter to only include compliant months
    const validMonths = requestedMonths.filter(m => validation.compliantMonths.includes(m));
    
    return {
      months: validMonths,
      validation: validation,
      hasNonCompliantMonths: requestedMonths.length > validMonths.length
    };
  }
}

module.exports = new DataService();