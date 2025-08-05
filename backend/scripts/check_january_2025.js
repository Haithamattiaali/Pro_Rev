const db = require('../database/db-wrapper');

async function checkJanuary2025() {
  console.log('=== JANUARY 2025 DATA CHECK ===\n');
  
  // Get raw data
  const rawData = await db.all(`
    SELECT 
      customer,
      service_type,
      cost,
      target,
      revenue,
      days
    FROM revenue_data
    WHERE year = 2025 AND month = 'Jan'
    ORDER BY customer, service_type
  `);

  console.log('Raw data from database:');
  console.log('Customer | Service | Cost | Target | Revenue | Days');
  console.log('---------|---------|------|--------|---------|-----');
  
  let totalCost = 0;
  let totalTarget = 0;
  let totalRevenue = 0;
  
  rawData.forEach(row => {
    console.log(
      `${String(row.customer).substring(0, 15).padEnd(15)} | ${String(row.service_type).substring(0, 12).padEnd(12)} | ${row.cost.toFixed(2)} | ${row.target.toFixed(2)} | ${row.revenue.toFixed(2)} | ${row.days || 'null'}`
    );
    totalCost += row.cost;
    totalTarget += row.target;
    totalRevenue += row.revenue;
  });
  
  console.log('\n=== TOTALS ===');
  console.log(`Total Revenue: ${totalRevenue.toFixed(2)}`);
  console.log(`Total Target: ${totalTarget.toFixed(2)}`);
  console.log(`Total Cost (raw): ${totalCost.toFixed(2)}`);
  console.log(`Achievement: ${(totalRevenue/totalTarget * 100).toFixed(2)}%`);
  
  console.log('\n=== PERFORMANCE-BASED CALCULATIONS ===');
  const achievementRatio = totalRevenue / totalTarget;
  const performanceCost = achievementRatio * totalCost;
  console.log(`Achievement Ratio: ${achievementRatio.toFixed(4)}`);
  console.log(`Performance Cost: ${performanceCost.toFixed(2)}`);
  console.log(`Gross Profit: ${(totalRevenue - performanceCost).toFixed(2)}`);
  console.log(`GP Margin: ${((totalRevenue - performanceCost) / totalRevenue * 100).toFixed(2)}%`);
  
  // Check for any day-based calculations
  console.log('\n=== DAY-BASED ANALYSIS ===');
  const uniqueDays = [...new Set(rawData.map(r => r.days))];
  console.log(`Unique days values in data: ${uniqueDays.join(', ')}`);
  
  if (uniqueDays.includes(15)) {
    console.log('\nIf applying 15/31 day proration:');
    console.log(`Pro-rated cost: ${(totalCost * (15/31)).toFixed(2)}`);
  }
  
  process.exit(0);
}

checkJanuary2025().catch(console.error);