const db = require('../database/db-wrapper');
const { calculateGrossProfit: calcProfit, calculatePerformanceCost } = require('../utils/profitCalculations');

async function calculateGrossProfit() {
  console.log('=== GROSS PROFIT CALCULATION BREAKDOWN ===\n');
  
  // 1. Get monthly breakdown for 2024
  const monthlyData = await db.all(`
    SELECT 
      month,
      SUM(revenue) as revenue,
      SUM(COALESCE(original_cost, cost, 0)) as cost,
      SUM(target) as target,
      COUNT(*) as record_count
    FROM revenue_data
    WHERE year = 2024
    GROUP BY month
    ORDER BY 
      CASE month
        WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
        WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
        WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
        WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
      END
  `);

  console.log('Monthly Breakdown for 2024:');
  console.log('Month | Revenue | Cost | Target | Profit | Has Complete Data?');
  console.log('------|---------|------|--------|--------|------------------');
  
  let totalRevenue = 0;
  let totalCost = 0;
  let totalTarget = 0;
  let compliantMonths = [];
  
  monthlyData.forEach(month => {
    const performanceCost = calculatePerformanceCost(month.revenue, month.target, month.cost);
    const profit = calcProfit(month.revenue, month.target, month.cost);
    const hasCompleteData = month.revenue > 0 && month.cost > 0 && month.target > 0;
    
    console.log(
      `${month.month.padEnd(5)} | ${month.revenue.toLocaleString().padStart(7)} | ${month.cost.toLocaleString().padStart(7)} | ${month.target.toLocaleString().padStart(7)} | ${profit.toLocaleString().padStart(7)} | ${hasCompleteData ? 'Yes' : 'No'}`
    );
    
    if (hasCompleteData) {
      totalRevenue += month.revenue;
      totalCost += month.cost;
      totalTarget += month.target;
      compliantMonths.push(month.month);
    }
  });
  
  console.log('\n=== COMPLIANT MONTHS (with revenue, cost, AND target) ===');
  console.log('Months included in analysis:', compliantMonths.join(', '));
  
  console.log('\n=== TOTAL CALCULATION (Compliant Months Only) ===');
  console.log(`Total Revenue: SAR ${totalRevenue.toLocaleString()}`);
  console.log(`Total Cost:    SAR ${totalCost.toLocaleString()}`);
  console.log(`Total Target:  SAR ${totalTarget.toLocaleString()}`);
  console.log('-----------------------------------');
  const totalPerformanceCost = calculatePerformanceCost(totalRevenue, totalTarget, totalCost);
  const totalProfit = calcProfit(totalRevenue, totalTarget, totalCost);
  console.log(`Performance Cost: SAR ${totalPerformanceCost.toLocaleString()}`);
  console.log(`GROSS PROFIT:  SAR ${totalProfit.toLocaleString()}`);
  console.log(`Profit Margin: ${(totalProfit / totalRevenue * 100).toFixed(2)}%`);
  console.log(`Achievement:   ${(totalRevenue / totalTarget * 100).toFixed(2)}%`);
  
  // 2. Show breakdown by service type for compliant months
  console.log('\n=== SERVICE TYPE BREAKDOWN (Compliant Months) ===');
  const serviceData = await db.all(`
    SELECT 
      service_type,
      SUM(revenue) as revenue,
      SUM(cost) as cost,
      SUM(target) as target
    FROM revenue_data
    WHERE year = 2024 
    AND month IN (${compliantMonths.map(() => '?').join(',')})
    GROUP BY service_type
  `, compliantMonths);
  
  serviceData.forEach(service => {
    const performanceCost = calculatePerformanceCost(service.revenue, service.target, service.cost);
    const profit = calcProfit(service.revenue, service.target, service.cost);
    console.log(`\n${service.service_type}:`);
    console.log(`  Revenue: SAR ${service.revenue.toLocaleString()}`);
    console.log(`  Original Cost: SAR ${service.cost.toLocaleString()}`);
    console.log(`  Performance Cost: SAR ${performanceCost.toLocaleString()}`);
    console.log(`  Profit:  SAR ${profit.toLocaleString()}`);
  });
  
  // 3. Show customer breakdown for compliant months
  console.log('\n=== TOP 5 CUSTOMERS BY REVENUE (Compliant Months) ===');
  const customerData = await db.all(`
    SELECT 
      customer,
      SUM(revenue) as revenue,
      SUM(cost) as cost,
      SUM(target) as target
    FROM revenue_data
    WHERE year = 2024 
    AND month IN (${compliantMonths.map(() => '?').join(',')})
    GROUP BY customer
    ORDER BY revenue DESC
    LIMIT 5
  `, compliantMonths);
  
  customerData.forEach((customer, index) => {
    const performanceCost = calculatePerformanceCost(customer.revenue, customer.target, customer.cost);
    const profit = calcProfit(customer.revenue, customer.target, customer.cost);
    console.log(`\n${index + 1}. ${customer.customer}:`);
    console.log(`   Revenue: SAR ${customer.revenue.toLocaleString()}`);
    console.log(`   Original Cost: SAR ${customer.cost.toLocaleString()}`);
    console.log(`   Performance Cost: SAR ${performanceCost.toLocaleString()}`);
    console.log(`   Profit:  SAR ${profit.toLocaleString()}`);
  });
  
  process.exit(0);
}

calculateGrossProfit().catch(console.error);