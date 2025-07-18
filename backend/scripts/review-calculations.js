const db = require('../database/persistent-db');

console.log('=== COMPREHENSIVE CALCULATION REVIEW ===\n');

// Get current date info
const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1; // July = 7
const currentYear = currentDate.getFullYear();
const currentDay = currentDate.getDate();

console.log(`Current Date: ${currentDate.toISOString()}`);
console.log(`Current Month: ${currentMonth} (July)`);
console.log(`Current Day: ${currentDay}`);
console.log(`Days in July: 31`);
console.log(`Pro-rate percentage: ${(currentDay/31*100).toFixed(2)}%\n`);

// 1. Check raw data for July
console.log('=== JULY 2025 RAW DATA ===');
const julyData = db.db.prepare(`
  SELECT customer, service_type, 
         revenue, cost, target, original_target
  FROM revenue_data 
  WHERE year = 2025 AND month = 'Jul'
  ORDER BY customer, service_type
`).all();

let julyTotals = {
  revenue: 0,
  cost: 0,
  target: 0,
  original_target: 0
};

console.log('Customer | Service Type | Revenue | Cost | Target | Original Target');
console.log('---------|--------------|---------|------|--------|----------------');
julyData.forEach(row => {
  console.log(`${row.customer.substring(0,8).padEnd(8)} | ${row.service_type.padEnd(12)} | ${row.revenue.toString().padStart(7)} | ${row.cost.toFixed(0).padStart(6)} | ${row.target.toFixed(0).padStart(6)} | ${row.original_target.toFixed(0).padStart(10)}`);
  julyTotals.revenue += row.revenue;
  julyTotals.cost += row.cost;
  julyTotals.target += row.target;
  julyTotals.original_target += row.original_target;
});

console.log('---------|--------------|---------|------|--------|----------------');
console.log(`TOTALS   |              | ${julyTotals.revenue.toString().padStart(7)} | ${julyTotals.cost.toFixed(0).padStart(6)} | ${julyTotals.target.toFixed(0).padStart(6)} | ${julyTotals.original_target.toFixed(0).padStart(10)}`);

// 2. Check YTD calculations
console.log('\n=== YTD (JAN-JUL) CALCULATIONS ===');
const ytdData = db.db.prepare(`
  SELECT 
    month,
    SUM(revenue) as revenue,
    SUM(cost) as cost,
    SUM(target) as target,
    SUM(original_target) as original_target,
    COUNT(*) as record_count
  FROM revenue_data 
  WHERE year = 2025 AND month IN ('Jan','Feb','Mar','Apr','May','Jun','Jul')
  GROUP BY month
  ORDER BY 
    CASE month
      WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
      WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
      WHEN 'Jul' THEN 7
    END
`).all();

let ytdTotals = {
  revenue: 0,
  cost: 0,
  target: 0,
  original_target: 0
};

console.log('Month | Records | Revenue | Cost | Target | Original Target');
console.log('------|---------|---------|------|--------|----------------');
ytdData.forEach(row => {
  console.log(`${row.month.padEnd(5)} | ${row.record_count.toString().padStart(7)} | ${row.revenue.toFixed(0).padStart(7)} | ${row.cost.toFixed(0).padStart(6)} | ${row.target.toFixed(0).padStart(6)} | ${row.original_target.toFixed(0).padStart(10)}`);
  ytdTotals.revenue += row.revenue;
  ytdTotals.cost += row.cost;
  ytdTotals.target += row.target;
  ytdTotals.original_target += row.original_target;
});

console.log('------|---------|---------|------|--------|----------------');
console.log(`TOTAL | ${ytdData.reduce((sum, r) => sum + r.record_count, 0).toString().padStart(7)} | ${ytdTotals.revenue.toFixed(0).padStart(7)} | ${ytdTotals.cost.toFixed(0).padStart(6)} | ${ytdTotals.target.toFixed(0).padStart(6)} | ${ytdTotals.original_target.toFixed(0).padStart(10)}`);

// 3. Calculate metrics
console.log('\n=== CALCULATED METRICS ===');
const grossProfit = ytdTotals.revenue - ytdTotals.cost;
const grossProfitMargin = (grossProfit / ytdTotals.revenue * 100);
const achievement = (ytdTotals.revenue / ytdTotals.target * 100);
const achievementOriginal = (ytdTotals.revenue / ytdTotals.original_target * 100);

console.log(`Gross Profit: ${grossProfit.toFixed(2)} (Revenue ${ytdTotals.revenue} - Cost ${ytdTotals.cost})`);
console.log(`Gross Profit Margin: ${grossProfitMargin.toFixed(2)}%`);
console.log(`Achievement (Pro-rated): ${achievement.toFixed(2)}%`);
console.log(`Achievement (Original): ${achievementOriginal.toFixed(2)}%`);

// 4. Check for data issues
console.log('\n=== DATA VALIDATION CHECKS ===');

// Check for duplicates
const duplicates = db.db.prepare(`
  SELECT customer, service_type, year, month, COUNT(*) as count
  FROM revenue_data
  GROUP BY customer, service_type, year, month
  HAVING COUNT(*) > 1
`).all();

if (duplicates.length > 0) {
  console.log('WARNING: Duplicate records found!');
  duplicates.forEach(d => console.log(`  ${d.customer} - ${d.service_type} - ${d.year} ${d.month}: ${d.count} records`));
} else {
  console.log('✓ No duplicate records found');
}

// Check pro-rating
console.log('\n=== PRO-RATING VERIFICATION ===');
const proRateCheck = db.db.prepare(`
  SELECT 
    COUNT(*) as total_records,
    SUM(CASE WHEN target < original_target THEN 1 ELSE 0 END) as prorated_records,
    SUM(CASE WHEN month = 'Jul' AND year = 2025 THEN 1 ELSE 0 END) as july_records,
    SUM(CASE WHEN month = 'Jul' AND year = 2025 AND target < original_target THEN 1 ELSE 0 END) as july_prorated
  FROM revenue_data
  WHERE year = 2025
`).get();

console.log(`Total 2025 records: ${proRateCheck.total_records}`);
console.log(`Pro-rated records: ${proRateCheck.prorated_records}`);
console.log(`July records: ${proRateCheck.july_records}`);
console.log(`July pro-rated records: ${proRateCheck.july_prorated}`);

if (proRateCheck.july_prorated === proRateCheck.july_records) {
  console.log('✓ All July records are properly pro-rated');
} else {
  console.log('⚠️  Not all July records are pro-rated!');
}

process.exit(0);