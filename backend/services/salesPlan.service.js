const db = require('../database/db-wrapper');

class SalesPlanService {
  // Get sales plan overview data
  async getSalesPlanOverview(year, period = 'YTD', month = null, quarter = null, serviceType = null) {
    try {
      // Get period filter
      const periodFilter = this.getPeriodFilter(year, period, month, quarter);
      
      // Add service type filter
      let serviceCondition = '';
      let serviceParams = [];
      if (serviceType && serviceType !== 'all') {
        serviceCondition = ' AND service_type = ?';
        serviceParams = [serviceType];
      }
      
      // Get aggregated totals
      const totalsSql = `
        SELECT 
          SUM(baseline_forecast) as total_baseline_forecast,
          SUM(opportunity_value) as total_opportunity_value,
          SUM(baseline_forecast + opportunity_value) as total_forecast,
          COUNT(DISTINCT gl) as gl_count,
          COUNT(DISTINCT service_type) as service_count
        FROM sales_plan_data
        WHERE year = ? ${periodFilter.condition}${serviceCondition}
      `;
      
      const totals = await db.get(totalsSql, [year, ...periodFilter.params, ...serviceParams]);
      
      // Get monthly breakdown
      const monthlySql = `
        SELECT 
          month,
          SUM(baseline_forecast) as baseline_forecast,
          SUM(opportunity_value) as opportunity_value,
          SUM(baseline_forecast + opportunity_value) as total
        FROM sales_plan_data
        WHERE year = ? ${periodFilter.condition}${serviceCondition}
        GROUP BY month
        ORDER BY 
          CASE month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END
      `;
      
      const monthlyData = await db.all(monthlySql, [year, ...periodFilter.params, ...serviceParams]);
      
      // Get actual date range from the monthly data
      let actualDateRange = null;
      if (monthlyData && monthlyData.length > 0) {
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const months = monthlyData.map(d => d.month);
        const sortedMonths = months.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
        
        actualDateRange = {
          firstMonth: sortedMonths[0],
          lastMonth: sortedMonths[sortedMonths.length - 1],
          monthCount: sortedMonths.length,
          months: sortedMonths
        };
      }
      
      // Get service type breakdown (only if not filtered by service)
      let serviceTypeData = [];
      if (!serviceType || serviceType === 'all') {
        const serviceTypeSql = `
          SELECT 
            service_type,
            SUM(baseline_forecast) as baseline_forecast,
            SUM(opportunity_value) as opportunity_value,
            SUM(baseline_forecast + opportunity_value) as total
          FROM sales_plan_data
          WHERE year = ? ${periodFilter.condition}
          GROUP BY service_type
        `;
        
        serviceTypeData = await db.all(serviceTypeSql, [year, ...periodFilter.params]);
      }
      
      return {
        totals: totals || {
          total_baseline_forecast: 0,
          total_opportunity_value: 0,
          total_forecast: 0,
          gl_count: 0,
          service_count: 0
        },
        monthlyData,
        serviceTypeData,
        year,
        period,
        actualDateRange
      };
    } catch (error) {
      console.error('Error getting sales plan overview:', error);
      throw error;
    }
  }
  
  // Get monthly sales plan data for chart
  async getSalesPlanMonthly(year, period = 'YTD', month = null, quarter = null, serviceType = null) {
    try {
      // Add service type filter
      let serviceCondition = '';
      let serviceParams = [];
      if (serviceType && serviceType !== 'all') {
        serviceCondition = ' AND service_type = ?';
        serviceParams = [serviceType];
      }
      
      // Add month filtering based on period
      let monthFilter = '';
      const monthParams = [];
      
      if (period === 'MTD' && month) {
        // For MTD, show only the specified month
        monthFilter = ' AND month = ?';
        monthParams.push(this.getMonthName(month));
      } else if (period === 'QTD' && quarter) {
        // For QTD, show only the 3 months of the specified quarter
        const startMonth = (quarter - 1) * 3 + 1;
        const quarterMonths = [];
        for (let m = startMonth; m < startMonth + 3; m++) {
          quarterMonths.push(this.getMonthName(m));
        }
        monthFilter = ` AND month IN (${quarterMonths.map(() => '?').join(',')})`;
        monthParams.push(...quarterMonths);
      } else if (period === 'YTD') {
        // For sales plan data, YTD should show full year forecast
        // No month filtering needed - show all 12 months for both current and past years
      }
      
      const sql = `
        SELECT 
          month,
          SUM(baseline_forecast) as baseline_forecast,
          SUM(opportunity_value) as opportunity_value,
          SUM(baseline_forecast + opportunity_value) as total
        FROM sales_plan_data
        WHERE year = ?${serviceCondition}${monthFilter}
        GROUP BY month
        ORDER BY 
          CASE month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END
      `;
      
      const data = await db.all(sql, [year, ...serviceParams, ...monthParams]);
      
      // Format for chart
      return {
        chart: data.map(row => ({
          month: row.month,
          baseline: row.baseline_forecast || 0,
          opportunities: row.opportunity_value || 0,
          total: row.total || 0
        })),
        year
      };
    } catch (error) {
      console.error('Error getting monthly sales plan:', error);
      throw error;
    }
  }
  
  // Get multi-select monthly sales plan data
  async getSalesPlanMonthlyMultiSelect(filters, serviceType = null) {
    try {
      const { years = [], months = [], quarters = [] } = filters;
      
      console.log('🔧 SalesPlanService: Processing monthly multi-select with filters:', filters);
      
      // Build WHERE conditions
      const conditions = ['1=1'];
      const params = [];
      
      // Years filter
      if (years.length > 0) {
        conditions.push(`year IN (${years.map(() => '?').join(',')})`);
        params.push(...years);
      }
      
      // Months filter
      if (months.length > 0) {
        const monthNames = months.map(m => this.getMonthName(m));
        conditions.push(`month IN (${monthNames.map(() => '?').join(',')})`);
        params.push(...monthNames);
      }
      
      // Quarters filter
      if (quarters.length > 0) {
        const quarterMonths = [];
        quarters.forEach(q => {
          const startMonth = (q - 1) * 3 + 1;
          for (let m = startMonth; m < startMonth + 3; m++) {
            quarterMonths.push(this.getMonthName(m));
          }
        });
        conditions.push(`month IN (${quarterMonths.map(() => '?').join(',')})`);
        params.push(...quarterMonths);
      }
      
      // Service type filter
      if (serviceType && serviceType !== 'all') {
        conditions.push('service_type = ?');
        params.push(serviceType);
      }
      
      const whereClause = conditions.join(' AND ');
      
      // Get monthly data aggregated across selected periods
      const sql = `
        SELECT 
          month,
          SUM(baseline_forecast) as baseline_forecast,
          SUM(opportunity_value) as opportunity_value,
          SUM(baseline_forecast + opportunity_value) as total
        FROM sales_plan_data
        WHERE ${whereClause}
        GROUP BY month
        ORDER BY 
          CASE month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END
      `;
      
      console.log('🔧 SQL:', sql);
      console.log('🔧 Params:', params);
      
      const data = await db.all(sql, params);
      
      // Format for chart
      return {
        chart: data.map(row => ({
          month: row.month,
          baseline: row.baseline_forecast || 0,
          opportunities: row.opportunity_value || 0,
          total: row.total || 0
        })),
        filters,
        multiSelect: true
      };
    } catch (error) {
      console.error('Error in getSalesPlanMonthlyMultiSelect:', error);
      throw error;
    }
  }
  
  // Get sales plan by GL account
  async getSalesPlanByGL(year, period = 'YTD', month = null, quarter = null, serviceType = null) {
    try {
      const periodFilter = this.getPeriodFilter(year, period, month, quarter);
      
      // Add service type filter
      let serviceCondition = '';
      let serviceParams = [];
      if (serviceType && serviceType !== 'all') {
        serviceCondition = ' AND service_type = ?';
        serviceParams = [serviceType];
      }
      
      const sql = `
        SELECT 
          gl,
          service_type,
          SUM(baseline_forecast) as baseline_forecast,
          SUM(opportunity_value) as opportunity_value,
          SUM(baseline_forecast + opportunity_value) as total
        FROM sales_plan_data
        WHERE year = ? ${periodFilter.condition}${serviceCondition}
        GROUP BY gl, service_type
        ORDER BY gl, service_type
      `;
      
      const data = await db.all(sql, [year, ...periodFilter.params, ...serviceParams]);
      
      return {
        data,
        year,
        period
      };
    } catch (error) {
      console.error('Error getting sales plan by GL:', error);
      throw error;
    }
  }
  
  // Get opportunities data
  async getOpportunities(filters = {}) {
    try {
      let conditions = [];
      let params = [];
      
      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }
      
      if (filters.service) {
        conditions.push('service = ?');
        params.push(filters.service);
      }
      
      if (filters.location) {
        conditions.push('location LIKE ?');
        params.push(`%${filters.location}%`);
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Use subquery to get distinct projects first
      const sql = `
        SELECT * FROM (
          SELECT DISTINCT project, service, location, scope_of_work, requirements,
                 status, est_monthly_revenue, est_gp_percent, 
                 MAX(id) as id, MAX(created_at) as created_at, MAX(updated_at) as updated_at
          FROM opportunities_data
          ${whereClause}
          GROUP BY project
        )
        ORDER BY est_monthly_revenue DESC
      `;
      
      const opportunities = await db.all(sql, params);
      
      // Get summary statistics with proper aggregation
      const summarySql = `
        SELECT 
          COUNT(DISTINCT project) as total_count,
          SUM(revenue) as total_revenue,
          AVG(CASE WHEN gp > 0 THEN gp ELSE NULL END) as avg_gp_percent,
          COUNT(DISTINCT status) as status_count,
          COUNT(DISTINCT service) as service_count
        FROM (
          SELECT DISTINCT project, est_monthly_revenue as revenue, 
                 est_gp_percent as gp, status, service
          FROM opportunities_data
          ${whereClause}
        )
      `;
      
      const summary = await db.get(summarySql, params);
      
      return {
        opportunities,
        summary: summary || {
          total_count: 0,
          total_revenue: 0,
          avg_gp_percent: 0,
          status_count: 0,
          service_count: 0
        },
        filters: filters,
        data: opportunities
      };
    } catch (error) {
      console.error('Error getting opportunities:', error);
      // Return empty result instead of throwing
      return {
        opportunities: [],
        summary: {
          total_count: 0,
          total_revenue: 0,
          avg_gp_percent: 0,
          status_count: 0,
          service_count: 0
        },
        filters: filters,
        data: []
      };
    }
  }
  
  // Get opportunities by status
  async getOpportunitiesByStatus() {
    try {
      const sql = `
        SELECT 
          COALESCE(status, 'Unspecified') as status,
          COUNT(DISTINCT project) as count,
          SUM(revenue) as total_revenue,
          AVG(CASE WHEN gp > 0 THEN gp ELSE NULL END) as avg_gp_percent
        FROM (
          SELECT DISTINCT project, status, est_monthly_revenue as revenue, est_gp_percent as gp
          FROM opportunities_data
        )
        GROUP BY status
        ORDER BY total_revenue DESC
      `;
      
      const data = await db.all(sql);
      
      // Calculate totals
      const totals = {
        total_count: 0,
        total_revenue: 0
      };
      
      data.forEach(row => {
        totals.total_count += row.count;
        totals.total_revenue += row.total_revenue || 0;
      });
      
      return {
        byStatus: data,
        totals
      };
    } catch (error) {
      console.error('Error getting opportunities by status:', error);
      throw error;
    }
  }
  
  // Get opportunities by service type
  async getOpportunitiesByService() {
    try {
      const sql = `
        SELECT 
          service,
          COUNT(DISTINCT project) as count,
          SUM(revenue) as total_revenue,
          AVG(CASE WHEN gp > 0 THEN gp ELSE NULL END) as avg_gp_percent
        FROM (
          SELECT DISTINCT project, service, est_monthly_revenue as revenue, est_gp_percent as gp
          FROM opportunities_data
        )
        GROUP BY service
        ORDER BY total_revenue DESC
      `;
      
      const data = await db.all(sql);
      
      return {
        byService: data
      };
    } catch (error) {
      console.error('Error getting opportunities by service:', error);
      throw error;
    }
  }
  
  // Get opportunities by location with insights
  async getOpportunitiesByLocation() {
    try {
      const sql = `
        SELECT 
          COALESCE(location, 'Unspecified') as location,
          COUNT(DISTINCT project) as count,
          SUM(revenue) as total_revenue,
          AVG(CASE WHEN gp > 0 THEN gp ELSE NULL END) as avg_gp_percent,
          MAX(revenue) as max_revenue
        FROM (
          SELECT DISTINCT project, location, est_monthly_revenue as revenue, est_gp_percent as gp
          FROM opportunities_data
        )
        GROUP BY location
        ORDER BY total_revenue DESC
        LIMIT 5
      `;
      
      const locations = await db.all(sql);
      
      // Get top opportunity for each location
      for (const loc of locations) {
        try {
          const topOpp = await db.get(`
            SELECT project, est_monthly_revenue, est_gp_percent
            FROM opportunities_data
            WHERE COALESCE(location, 'Unspecified') = ?
            ORDER BY est_monthly_revenue DESC
            LIMIT 1
          `, [loc.location]);
          loc.topOpportunity = topOpp || null;
        } catch (e) {
          console.error('Error getting top opportunity for location:', e);
          loc.topOpportunity = null;
        }
      }
      
      return {
        locations,
        totalLocations: await db.get('SELECT COUNT(DISTINCT location) as count FROM opportunities_data')
      };
    } catch (error) {
      console.error('Error getting opportunities by location:', error);
      throw error;
    }
  }
  
  // Get opportunities pipeline (value bands)
  async getOpportunitiesPipeline() {
    try {
      const bands = [
        { name: 'Quick Wins', min: 0, max: 50000, description: 'Under 50K SAR' },
        { name: 'Standard Deals', min: 50000, max: 200000, description: '50K - 200K SAR' },
        { name: 'Major Opportunities', min: 200000, max: 500000, description: '200K - 500K SAR' },
        { name: 'Strategic Accounts', min: 500000, max: 999999999, description: 'Over 500K SAR' }
      ];
      
      const pipeline = [];
      
      for (const band of bands) {
        const sql = `
          SELECT 
            COUNT(DISTINCT project) as count,
            SUM(revenue) as total_revenue,
            AVG(CASE WHEN gp > 0 THEN gp ELSE NULL END) as avg_gp_percent,
            MIN(gp) as min_gp,
            MAX(gp) as max_gp
          FROM (
            SELECT DISTINCT project, est_monthly_revenue as revenue, est_gp_percent as gp
            FROM opportunities_data
            WHERE est_monthly_revenue >= ? AND est_monthly_revenue < ?
          )
        `;
        
        const bandData = await db.get(sql, [band.min, band.max]);
        
        pipeline.push({
          ...band,
          ...bandData,
          opportunities: await db.all(`
            SELECT DISTINCT project, location, service, est_monthly_revenue, est_gp_percent
            FROM opportunities_data
            WHERE est_monthly_revenue >= ? AND est_monthly_revenue < ?
            GROUP BY project
            ORDER BY est_monthly_revenue DESC
            LIMIT 5
          `, [band.min, band.max])
        });
      }
      
      return { pipeline };
    } catch (error) {
      console.error('Error getting opportunities pipeline:', error);
      throw error;
    }
  }
  
  // Get actionable insights
  async getOpportunitiesInsights() {
    try {
      // Quick wins: High GP%, low value
      const quickWins = await db.all(`
        SELECT DISTINCT project, location, service, est_monthly_revenue, est_gp_percent
        FROM opportunities_data
        WHERE est_gp_percent >= 30 AND est_monthly_revenue < 100000
        GROUP BY project
        ORDER BY est_gp_percent DESC, est_monthly_revenue DESC
        LIMIT 5
      `);
      
      // At risk: Low GP%, high value
      const atRisk = await db.all(`
        SELECT DISTINCT project, location, service, est_monthly_revenue, est_gp_percent
        FROM opportunities_data
        WHERE est_gp_percent < 20 AND est_monthly_revenue > 200000
        GROUP BY project
        ORDER BY est_monthly_revenue DESC
        LIMIT 5
      `);
      
      // Top 5 by revenue
      const topRevenue = await db.all(`
        SELECT DISTINCT project, location, service, est_monthly_revenue, est_gp_percent
        FROM opportunities_data
        GROUP BY project
        ORDER BY est_monthly_revenue DESC
        LIMIT 5
      `);
      
      // Overall metrics with proper aggregation
      const metrics = await db.get(`
        SELECT 
          COUNT(DISTINCT project) as total_count,
          SUM(revenue) as total_revenue,
          AVG(revenue) as avg_deal_size,
          AVG(CASE WHEN gp > 0 THEN gp ELSE NULL END) as avg_gp_percent,
          SUM(CASE WHEN gp >= 30 THEN 1 ELSE 0 END) as high_gp_count,
          SUM(CASE WHEN gp < 20 THEN 1 ELSE 0 END) as low_gp_count
        FROM (
          SELECT DISTINCT project, est_monthly_revenue as revenue, est_gp_percent as gp
          FROM opportunities_data
        )
      `);
      
      return {
        quickWins,
        atRisk,
        topRevenue,
        metrics
      };
    } catch (error) {
      console.error('Error getting opportunities insights:', error);
      throw error;
    }
  }
  
  // Get opportunities pipeline by status
  async getOpportunitiesPipelineByStatus() {
    try {
      // Define pipeline stages in order
      const stages = [
        { key: 'No Status', weight: 0.3, order: 0 },
        { key: 'Contract Signing', weight: 0.7, order: 1 },
        { key: 'Contract review', weight: 0.5, order: 2 },
        { key: 'Running business with extending opportunities', weight: 0.9, order: 3 }
      ];
      
      // Get data for each stage
      const pipeline = [];
      for (const stage of stages) {
        const stageData = await db.get(`
          SELECT 
            COUNT(DISTINCT project) as count,
            COALESCE(SUM(revenue), 0) as total_revenue,
            COALESCE(AVG(CASE WHEN gp > 0 THEN gp ELSE NULL END), 0) as avg_gp_percent,
            COALESCE(MIN(gp), 0) as min_gp,
            COALESCE(MAX(gp), 0) as max_gp
          FROM (
            SELECT DISTINCT project, est_monthly_revenue as revenue, est_gp_percent as gp
            FROM opportunities_data
            WHERE ${stage.key === 'No Status' 
              ? "(status IS NULL OR status = '' OR TRIM(status) = '' OR LOWER(TRIM(status)) = 'no status')" 
              : 'LOWER(TRIM(status)) = LOWER(?)'}
          )
        `, stage.key === 'No Status' ? [] : [stage.key]);
        
        // Get projects in this stage
        const projects = await db.all(`
          SELECT DISTINCT project, service, location, est_monthly_revenue, est_gp_percent
          FROM opportunities_data
          WHERE ${stage.key === 'No Status' 
            ? "(status IS NULL OR status = '' OR TRIM(status) = '')" 
            : 'LOWER(TRIM(status)) = LOWER(?)'}
          GROUP BY project
          ORDER BY est_monthly_revenue DESC
          LIMIT 5
        `, stage.key === 'No Status' ? [] : [stage.key]);
        
        pipeline.push({
          stage: stage.key,
          order: stage.order,
          weight: stage.weight,
          ...stageData,
          weighted_revenue: (stageData?.total_revenue || 0) * stage.weight,
          projects
        });
      }
      
      // Get totals
      const totals = {
        total_opportunities: pipeline.reduce((sum, stage) => sum + (stage.count || 0), 0),
        total_revenue: pipeline.reduce((sum, stage) => sum + (stage.total_revenue || 0), 0),
        weighted_revenue: pipeline.reduce((sum, stage) => sum + (stage.weighted_revenue || 0), 0)
      };
      
      return { pipeline, totals };
    } catch (error) {
      console.error('Error getting pipeline by status:', error);
      throw error;
    }
  }
  
  // Get opportunities by service with detailed metrics
  async getOpportunitiesServiceAnalysis() {
    try {
      const services = await db.all(`
        SELECT 
          service,
          COUNT(DISTINCT project) as count,
          COALESCE(SUM(revenue), 0) as total_revenue,
          COALESCE(AVG(gp), 0) as avg_gp_percent,
          COALESCE(MIN(gp), 0) as min_gp,
          COALESCE(MAX(gp), 0) as max_gp
        FROM (
          SELECT DISTINCT project, service, est_monthly_revenue as revenue, est_gp_percent as gp
          FROM opportunities_data
        )
        GROUP BY service
        ORDER BY total_revenue DESC
      `);
      
      // Get service categories (2PL vs 3PL)
      const serviceCategories = {
        '2PL': { count: 0, revenue: 0, avg_gp: 0 },
        '3PL': { count: 0, revenue: 0, avg_gp: 0 }
      };
      
      for (const service of services) {
        const category = service.service.startsWith('3PL') ? '3PL' : '2PL';
        serviceCategories[category].count += service.count;
        serviceCategories[category].revenue += service.total_revenue;
        serviceCategories[category].avg_gp = 
          (serviceCategories[category].avg_gp * (serviceCategories[category].count - service.count) + 
           service.avg_gp_percent * service.count) / serviceCategories[category].count;
      }
      
      return { services, serviceCategories };
    } catch (error) {
      console.error('Error getting service analysis:', error);
      throw error;
    }
  }
  
  // Get opportunities matrix data (Revenue vs GP%) - Improved version
  async getOpportunitiesMatrix() {
    try {
      // First check if table exists and has data
      const tableCheck = await db.get(`
        SELECT COUNT(*) as count 
        FROM opportunities_data
      `);
      
      if (!tableCheck || tableCheck.count === 0) {
        // No opportunities data found - return empty structure without logging
        return {
          opportunities: [],
          matrix: {
            highValueHighGP: [],
            highValueLowGP: [],
            lowValueHighGP: [],
            lowValueLowGP: []
          },
          thresholds: {
            revenue: 250000,
            gp: 0.25
          },
          statistics: {
            totalOpportunities: 0,
            totalMonthlyRevenue: 0,
            totalAnnualRevenue: 0,
            averageGP: 0
          }
        };
      }
      
      // Get all unique opportunities (latest entry per project)
      const opportunities = await db.all(`
        SELECT 
          o1.project,
          o1.service,
          o1.location,
          o1.status,
          o1.est_monthly_revenue as revenue,
          o1.est_gp_percent as gp_percent,
          o1.est_monthly_revenue * 12 as annual_revenue,
          o1.scope_of_work,
          o1.requirements
        FROM opportunities_data o1
        INNER JOIN (
          SELECT project, MAX(id) as max_id
          FROM opportunities_data
          WHERE est_monthly_revenue > 0
          GROUP BY project
        ) o2 ON o1.project = o2.project AND o1.id = o2.max_id
        ORDER BY o1.est_monthly_revenue DESC
      `);
      
      if (opportunities.length === 0) {
        return {
          opportunities: [],
          matrix: {
            highValueHighGP: [],
            highValueLowGP: [],
            lowValueHighGP: [],
            lowValueLowGP: []
          },
          thresholds: {
            revenue: 250000,
            gp: 0.25
          },
          statistics: {
            totalOpportunities: 0,
            totalMonthlyRevenue: 0,
            totalAnnualRevenue: 0,
            averageGP: 0
          }
        };
      }
      
      // Calculate dynamic thresholds using percentiles for better distribution
      const revenues = opportunities.map(o => o.revenue).sort((a, b) => a - b);
      const gps = opportunities.map(o => o.gp_percent).sort((a, b) => a - b);
      
      // Use 40th percentile for more balanced quadrants
      const revenuePercentileIndex = Math.floor(revenues.length * 0.4);
      const gpPercentileIndex = Math.floor(gps.length * 0.4);
      
      const revenueThreshold = revenues[revenuePercentileIndex] || 250000;
      const gpThreshold = gps[gpPercentileIndex] || 0.25;
      
      // Categorize opportunities into quadrants
      const matrix = {
        highValueHighGP: [],
        highValueLowGP: [],
        lowValueHighGP: [],
        lowValueLowGP: []
      };
      
      for (const opp of opportunities) {
        // Ensure we have valid numeric values
        const revenue = parseFloat(opp.revenue) || 0;
        const gpPercent = parseFloat(opp.gp_percent) || 0;
        
        const opportunity = {
          ...opp,
          revenue,
          gp_percent: gpPercent,
          annual_revenue: revenue * 12,
          // Add calculated fields for UI
          monthly_gp_amount: revenue * gpPercent,
          annual_gp_amount: revenue * 12 * gpPercent
        };
        
        if (revenue >= revenueThreshold && gpPercent >= gpThreshold) {
          matrix.highValueHighGP.push(opportunity);
        } else if (revenue >= revenueThreshold && gpPercent < gpThreshold) {
          matrix.highValueLowGP.push(opportunity);
        } else if (revenue < revenueThreshold && gpPercent >= gpThreshold) {
          matrix.lowValueHighGP.push(opportunity);
        } else {
          matrix.lowValueLowGP.push(opportunity);
        }
      }
      
      // Calculate overall statistics
      const totalMonthlyRevenue = opportunities.reduce((sum, o) => sum + (o.revenue || 0), 0);
      const totalAnnualRevenue = totalMonthlyRevenue * 12;
      const averageGP = opportunities.reduce((sum, o) => sum + (o.gp_percent || 0), 0) / opportunities.length;
      
      // Calculate quadrant statistics
      const quadrantStats = {};
      for (const [key, opps] of Object.entries(matrix)) {
        const monthlyRev = opps.reduce((sum, o) => sum + o.revenue, 0);
        const avgGP = opps.length > 0 
          ? opps.reduce((sum, o) => sum + o.gp_percent, 0) / opps.length 
          : 0;
        
        quadrantStats[key] = {
          count: opps.length,
          monthlyRevenue: monthlyRev,
          annualRevenue: monthlyRev * 12,
          averageGP: avgGP,
          percentOfTotal: (opps.length / opportunities.length) * 100
        };
      }
      
      return {
        opportunities: opportunities.map(o => ({
          ...o,
          revenue: parseFloat(o.revenue) || 0,
          gp_percent: parseFloat(o.gp_percent) || 0,
          annual_revenue: (parseFloat(o.revenue) || 0) * 12
        })),
        matrix,
        thresholds: {
          revenue: revenueThreshold,
          gp: gpThreshold
        },
        statistics: {
          totalOpportunities: opportunities.length,
          totalMonthlyRevenue,
          totalAnnualRevenue,
          averageGP,
          quadrants: quadrantStats
        }
      };
    } catch (error) {
      console.error('Error getting opportunities matrix:', error);
      // Return empty structure on error
      return {
        opportunities: [],
        matrix: {
          highValueHighGP: [],
          highValueLowGP: [],
          lowValueHighGP: [],
          lowValueLowGP: []
        },
        thresholds: {
          revenue: 250000,
          gp: 0.25
        },
        statistics: {
          totalOpportunities: 0,
          totalMonthlyRevenue: 0,
          totalAnnualRevenue: 0,
          averageGP: 0
        }
      };
    }
  }
  
  // Get sales plan by business unit
  async getSalesPlanByBusinessUnit(year, period = 'YTD', month = null, quarter = null) {
    try {
      const periodFilter = this.getPeriodFilter(year, period, month, quarter);
      
      const sql = `
        SELECT 
          service_type as business_unit,
          SUM(baseline_forecast) as baseline_forecast,
          SUM(opportunity_value) as opportunity_value,
          SUM(baseline_forecast + opportunity_value) as total,
          COUNT(DISTINCT gl) as gl_count
        FROM sales_plan_data
        WHERE year = ? ${periodFilter.condition}
        GROUP BY service_type
        ORDER BY total DESC
      `;
      
      const data = await db.all(sql, [year, ...periodFilter.params]);
      
      return {
        data,
        year,
        period
      };
    } catch (error) {
      console.error('Error getting sales plan by business unit:', error);
      throw error;
    }
  }
  
  // Helper method to get period filter
  getPeriodFilter(year, period, month, quarter) {
    const monthMap = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    
    let condition = '';
    let params = [];
    
    if (period === 'MTD' && month && month !== 'all') {
      // Find month name from number
      const monthName = Object.keys(monthMap).find(key => monthMap[key] === parseInt(month));
      if (monthName) {
        condition = ' AND month = ?';
        params.push(monthName);
      }
    } else if (period === 'QTD' && quarter && quarter !== 'all') {
      // Get months for quarter
      const q = parseInt(quarter);
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = q * 3;
      const monthNames = Object.keys(monthMap).filter(
        name => monthMap[name] >= startMonth && monthMap[name] <= endMonth
      );
      condition = ` AND month IN (${monthNames.map(() => '?').join(',')})`;
      params = monthNames;
    } else if (period === 'YTD') {
      // For sales plan data, YTD should show full year forecast
      // No month filtering needed - show all 12 months
    }
    
    return { condition, params };
  }

  // Multi-select sales plan overview
  async getSalesPlanOverviewMultiSelect(filters, serviceType = null) {
    try {
      const { years = [], months = [], quarters = [] } = filters;
      
      console.log('🔧 SalesPlanService: Processing multi-select with filters:', JSON.stringify(filters, null, 2));
      
      // Build WHERE conditions
      const conditions = ['1=1'];
      const params = [];
      
      // Years filter
      if (years.length > 0) {
        conditions.push(`year IN (${years.map(() => '?').join(',')})`);
        params.push(...years);
      }
      
      // Months filter
      if (months.length > 0) {
        const monthNames = months.map(m => this.getMonthName(m));
        conditions.push(`month IN (${monthNames.map(() => '?').join(',')})`);
        params.push(...monthNames);
      }
      
      // Quarters filter
      if (quarters.length > 0) {
        const quarterMonths = [];
        quarters.forEach(q => {
          const startMonth = (q - 1) * 3 + 1;
          for (let m = startMonth; m < startMonth + 3; m++) {
            quarterMonths.push(this.getMonthName(m));
          }
        });
        conditions.push(`month IN (${quarterMonths.map(() => '?').join(',')})`);
        params.push(...quarterMonths);
      }
      
      // Service type filter
      if (serviceType && serviceType !== 'all') {
        conditions.push('service_type = ?');
        params.push(serviceType);
      }
      
      const whereClause = conditions.join(' AND ');
      
      // Get aggregated totals
      const totalsSql = `
        SELECT 
          SUM(baseline_forecast) as total_baseline_forecast,
          SUM(opportunity_value) as total_opportunity_value,
          SUM(baseline_forecast + opportunity_value) as total_forecast,
          COUNT(DISTINCT gl) as gl_count,
          COUNT(DISTINCT service_type) as service_count
        FROM sales_plan_data
        WHERE ${whereClause}
      `;
      
      console.log('🔍 SQL Query:', totalsSql);
      console.log('🔍 SQL Params:', params);
      
      const totals = await db.get(totalsSql, params);
      console.log('🔍 SQL Result (totals):', totals);
      
      // Get monthly breakdown
      const monthlySql = `
        SELECT 
          month,
          year,
          SUM(baseline_forecast) as baseline_forecast,
          SUM(opportunity_value) as opportunity_value,
          SUM(baseline_forecast + opportunity_value) as total
        FROM sales_plan_data
        WHERE ${whereClause}
        GROUP BY year, month
        ORDER BY year,
          CASE month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END
      `;
      
      const monthlyData = await db.all(monthlySql, params);
      
      // Get service type breakdown
      const serviceTypeSql = `
        SELECT 
          service_type,
          SUM(baseline_forecast) as baseline_forecast,
          SUM(opportunity_value) as opportunity_value,
          SUM(baseline_forecast + opportunity_value) as total
        FROM sales_plan_data
        WHERE ${whereClause}
        GROUP BY service_type
        ORDER BY total DESC
      `;
      
      const serviceTypeData = await db.all(serviceTypeSql, params);
      
      return {
        totals: totals || { 
          total_baseline_forecast: 0, 
          total_opportunity_value: 0, 
          total_forecast: 0,
          gl_count: 0,
          service_count: 0
        },
        monthlyData: monthlyData || [],
        serviceTypeData: serviceTypeData || []
      };
    } catch (error) {
      console.error('Error in getSalesPlanOverviewMultiSelect:', error);
      throw error;
    }
  }

  // Multi-select sales plan by GL
  async getSalesPlanByGLMultiSelect(filters, serviceType = null) {
    try {
      const { years = [], months = [], quarters = [] } = filters;
      
      console.log('🔧 SalesPlanService: Processing GL multi-select with filters:', filters);
      
      // Build WHERE conditions
      const conditions = ['1=1'];
      const params = [];
      
      // Years filter
      if (years.length > 0) {
        conditions.push(`year IN (${years.map(() => '?').join(',')})`);
        params.push(...years);
      }
      
      // Months filter
      if (months.length > 0) {
        const monthNames = months.map(m => this.getMonthName(m));
        conditions.push(`month IN (${monthNames.map(() => '?').join(',')})`);
        params.push(...monthNames);
      }
      
      // Quarters filter
      if (quarters.length > 0) {
        const quarterMonths = [];
        quarters.forEach(q => {
          const startMonth = (q - 1) * 3 + 1;
          for (let m = startMonth; m < startMonth + 3; m++) {
            quarterMonths.push(this.getMonthName(m));
          }
        });
        conditions.push(`month IN (${quarterMonths.map(() => '?').join(',')})`);
        params.push(...quarterMonths);
      }
      
      // Service type filter
      if (serviceType && serviceType !== 'all') {
        conditions.push('service_type = ?');
        params.push(serviceType);
      }
      
      const whereClause = conditions.join(' AND ');
      
      // Get GL breakdown
      const glSql = `
        SELECT 
          gl,
          SUM(baseline_forecast) as baseline_forecast,
          SUM(opportunity_value) as opportunity_value,
          SUM(baseline_forecast + opportunity_value) as total_forecast,
          COUNT(DISTINCT month) as month_count,
          COUNT(DISTINCT service_type) as service_count
        FROM sales_plan_data
        WHERE ${whereClause}
        GROUP BY gl
        ORDER BY total_forecast DESC
      `;
      
      const glData = await db.all(glSql, params);
      
      // Get totals
      const totalsSql = `
        SELECT 
          SUM(baseline_forecast) as total_baseline_forecast,
          SUM(opportunity_value) as total_opportunity_value,
          SUM(baseline_forecast + opportunity_value) as total_forecast
        FROM sales_plan_data
        WHERE ${whereClause}
      `;
      
      const totals = await db.get(totalsSql, params);
      
      return {
        data: glData || [],
        totals: totals || {
          total_baseline_forecast: 0,
          total_opportunity_value: 0,
          total_forecast: 0
        }
      };
    } catch (error) {
      console.error('Error in getSalesPlanByGLMultiSelect:', error);
      throw error;
    }
  }

  // Helper method to get month name
  getMonthName(monthNum) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1] || '';
  }
}

module.exports = new SalesPlanService();