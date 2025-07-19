const db = require('../database/persistent-db');

class OpportunityDistributionService {
  constructor() {
    // Service type mapping based on our analysis
    this.serviceTypeMapping = {
      // Transportation services
      '2PL - Heavy Transport': 'Transportation',
      '2PL - Transportation': 'Transportation',
      '2PL - Fresh & Frozen': 'Transportation',
      '2PL - Project Logistics': 'Transportation',
      '2PL - Last Mile Delivery': 'Transportation',
      '2PL - Healthcare Logistics': 'Transportation',
      '2PL - Cold Chain': 'Transportation',
      
      // Warehousing services
      '3PL - Automotive Logistics': 'Warehousing',
      '2PL - Document Storage': 'Warehousing',
      '3PL - E-commerce Fulfillment': 'Warehousing',
      '2PL - Specialized Storage': 'Warehousing',
      '3PL - Warehousing & Distribution': 'Warehousing',
      '3PL - Integrated Logistics': 'Warehousing',
      '2PL - Temporary Storage': 'Warehousing',
      '3PL - Small Business Solutions': 'Warehousing'
    };
  }

  // Get opportunities grouped by service type
  async getOpportunitiesByServiceType() {
    try {
      const opportunities = await db.all(`
        SELECT 
          service,
          SUM(est_monthly_revenue) as total_revenue,
          COUNT(*) as count
        FROM opportunities_data
        GROUP BY service
      `);

      // Categorize opportunities (monthly values)
      const categorized = {
        Transportation: 0,
        Warehousing: 0
      };

      opportunities.forEach(opp => {
        const category = this.serviceTypeMapping[opp.service] || 'Warehousing';
        categorized[category] += opp.total_revenue;
      });

      // Return both monthly and annual values
      return {
        monthly: categorized,
        annual: {
          Transportation: categorized.Transportation * 12,
          Warehousing: categorized.Warehousing * 12
        }
      };
    } catch (error) {
      console.error('Error getting opportunities by service type:', error);
      throw error;
    }
  }

  // Distribute opportunities across sales plan GLs
  async distributeOpportunitiesToSalesPlan(year = 2025) {
    try {
      // Get total opportunities by category
      const opportunityData = await this.getOpportunitiesByServiceType();
      const opportunityTotals = opportunityData.monthly; // Use monthly values
      
      console.log('Monthly Opportunity Totals:', opportunityTotals);
      console.log('Annual Opportunity Totals:', opportunityData.annual);

      // Get GL accounts by service type for the year
      const glsByService = await db.all(`
        SELECT 
          service_type,
          gl,
          COUNT(DISTINCT month) as month_count,
          SUM(baseline_forecast) as total_baseline
        FROM sales_plan_data
        WHERE year = ?
        GROUP BY service_type, gl
      `, [year]);

      // Calculate totals for proportional distribution
      const serviceTypeTotals = {
        Transportation: 0,
        Warehousing: 0
      };

      glsByService.forEach(gl => {
        serviceTypeTotals[gl.service_type] += gl.total_baseline;
      });

      // Prepare update statements
      const updates = [];
      
      glsByService.forEach(gl => {
        // Calculate this GL's proportion of the service type total
        const proportion = serviceTypeTotals[gl.service_type] > 0
          ? gl.total_baseline / serviceTypeTotals[gl.service_type]
          : 0;
        
        // Calculate monthly opportunity value for this GL
        // opportunityTotals already contains monthly values
        const monthlyOpportunityTotal = opportunityTotals[gl.service_type] || 0;
        const monthlyOpportunity = monthlyOpportunityTotal * proportion;
        
        updates.push({
          gl: gl.gl,
          service_type: gl.service_type,
          monthly_opportunity: monthlyOpportunity,
          total_opportunity: monthlyOpportunity * 12
        });
      });

      return updates;
    } catch (error) {
      console.error('Error distributing opportunities:', error);
      throw error;
    }
  }

  // Update sales plan with distributed opportunities
  async updateSalesPlanOpportunities(year = 2025) {
    try {
      const distributions = await this.distributeOpportunitiesToSalesPlan(year);
      
      const transaction = db.transaction(() => {
        // Update each GL/month combination
        const stmt = db.db.prepare(`
          UPDATE sales_plan_data
          SET opportunity_value = ?
          WHERE gl = ? AND service_type = ? AND year = ? AND month = ?
        `);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        distributions.forEach(dist => {
          months.forEach(month => {
            stmt.run(
              dist.monthly_opportunity,
              dist.gl,
              dist.service_type,
              year,
              month
            );
          });
        });
      });

      transaction();

      // Verify the update
      const verification = await this.verifyOpportunityDistribution(year);
      
      return {
        success: true,
        distributions,
        verification
      };
    } catch (error) {
      console.error('Error updating sales plan opportunities:', error);
      throw error;
    }
  }

  // Verify that total opportunities match
  async verifyOpportunityDistribution(year = 2025) {
    try {
      // Get total from opportunities table
      const opportunityTotal = await db.get(`
        SELECT SUM(est_monthly_revenue) as total
        FROM opportunities_data
      `);

      // Get total from sales plan (annualized)
      const salesPlanTotal = await db.get(`
        SELECT SUM(opportunity_value) as total
        FROM sales_plan_data
        WHERE year = ?
      `, [year]);

      // Compare monthly totals
      const opportunitiesMonthlyTotal = opportunityTotal.total;
      const opportunitiesAnnualTotal = opportunitiesMonthlyTotal * 12;
      const salesPlanAnnualTotal = salesPlanTotal.total;
      const salesPlanMonthlyAvg = salesPlanAnnualTotal / 12;

      return {
        opportunities_monthly: opportunitiesMonthlyTotal,
        opportunities_annual: opportunitiesAnnualTotal,
        sales_plan_monthly_avg: salesPlanMonthlyAvg,
        sales_plan_annual: salesPlanAnnualTotal,
        match: Math.abs(opportunitiesAnnualTotal - salesPlanAnnualTotal) < 0.01,
        difference: opportunitiesAnnualTotal - salesPlanAnnualTotal
      };
    } catch (error) {
      console.error('Error verifying distribution:', error);
      throw error;
    }
  }

  // Get current distribution for reporting
  async getCurrentDistribution(year = 2025) {
    try {
      const distribution = await db.all(`
        SELECT 
          service_type,
          gl,
          SUM(opportunity_value) as annual_opportunity,
          AVG(opportunity_value) as monthly_opportunity,
          COUNT(DISTINCT month) as months
        FROM sales_plan_data
        WHERE year = ?
        GROUP BY service_type, gl
        ORDER BY service_type, annual_opportunity DESC
      `, [year]);

      const summary = await db.all(`
        SELECT 
          service_type,
          SUM(opportunity_value) as total_opportunity,
          COUNT(DISTINCT gl) as gl_count
        FROM sales_plan_data
        WHERE year = ?
        GROUP BY service_type
      `, [year]);

      return {
        distribution,
        summary
      };
    } catch (error) {
      console.error('Error getting current distribution:', error);
      throw error;
    }
  }
}

module.exports = new OpportunityDistributionService();