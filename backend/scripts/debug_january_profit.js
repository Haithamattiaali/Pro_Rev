const db = require('../database/db-wrapper');
const { calculateGrossProfit, calculatePerformanceCost } = require('../utils/profitCalculations');

async function debugJanuaryProfit() {
  console.log('=== DEBUGGING JANUARY 2025 GROSS PROFIT ===\n');
  
  // Get the exact SQL being run
  const sql = `
    SELECT 
      SUM(revenue) as total_revenue,
      SUM(COALESCE(target, 0)) as total_target,
      SUM(COALESCE(cost, 0)) as total_cost,
      SUM(receivables_collected) as total_receivables,
      COUNT(DISTINCT customer) as customer_count,
      COUNT(DISTINCT service_type) as service_count,
      CASE 
        WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
        ELSE 0 
      END as achievement_percentage
    FROM revenue_data
    WHERE year = 2025 AND month IN ('Jan')
  `;
  
  console.log('Running SQL query...\n');
  const overview = await db.get(sql);
  
  console.log('Raw query result:');
  console.log(JSON.stringify(overview, null, 2));
  
  console.log('\n=== CALCULATION STEPS ===');
  console.log(`Revenue: ${overview.total_revenue}`);
  console.log(`Target: ${overview.total_target}`);
  console.log(`Cost (raw from DB): ${overview.total_cost}`);
  
  // Calculate performance cost
  const perfCost = calculatePerformanceCost(
    overview.total_revenue || 0, 
    overview.total_target || 0, 
    overview.total_cost || 0
  );
  console.log(`\nPerformance Cost: ${perfCost}`);
  console.log(`Formula: (${overview.total_revenue} / ${overview.total_target}) * ${overview.total_cost}`);
  
  // Calculate gross profit
  const grossProfit = calculateGrossProfit(
    overview.total_revenue || 0, 
    overview.total_target || 0, 
    overview.total_cost || 0
  );
  console.log(`\nGross Profit: ${grossProfit}`);
  console.log(`Formula: ${overview.total_revenue} - ((${overview.total_revenue} / ${overview.total_target}) * ${overview.total_cost})`);
  
  // Check if there's any 15/31 calculation
  console.log('\n=== CHECKING FOR 15/31 PRORATION ===');
  console.log(`Cost * (15/31) = ${overview.total_cost * (15/31)}`);
  console.log(`Gross Profit * (15/31) = ${grossProfit * (15/31)}`);
  
  // What would give us 1,288,208?
  console.log('\n=== REVERSE ENGINEERING 1,288,208 ===');
  const targetGP = 1288208;
  console.log(`If GP should be ${targetGP}:`);
  console.log(`Then proportional cost = Revenue - GP = ${overview.total_revenue - targetGP}`);
  console.log(`Which implies original cost = ${(overview.total_revenue - targetGP) / (overview.total_revenue / overview.total_target)}`);
  
  process.exit(0);
}

debugJanuaryProfit().catch(console.error);