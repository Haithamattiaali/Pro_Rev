const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Import validation functions
const { getDaysInMonthJS, getDaysInMonthSQL } = require('../tests/calendar-validation.test');

// Get database path
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/var/data/proceed_revenue.db' 
  : path.join(__dirname, '../database/proceed_revenue.db');

if (!fs.existsSync(dbPath)) {
  console.error('Database not found at:', dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

console.log('=== Validating Calendar Calculations in Current Database ===\n');

// Check if we have any data with pro-rated values
const checkQuery = `
  SELECT DISTINCT 
    strftime('%Y', analysis_date) as year,
    CAST(strftime('%m', analysis_date) AS INTEGER) as month,
    COUNT(*) as record_count,
    SUM(CASE WHEN original_target != target THEN 1 ELSE 0 END) as pro_rated_targets,
    SUM(CASE WHEN original_cost != cost THEN 1 ELSE 0 END) as pro_rated_costs
  FROM revenue_data
  WHERE analysis_date IS NOT NULL
  GROUP BY year, month
  ORDER BY year DESC, month DESC
  LIMIT 12
`;

const monthlyData = db.prepare(checkQuery).all();

console.log('Recent months in database:\n');

monthlyData.forEach(row => {
  const jsCalc = getDaysInMonthJS(parseInt(row.year), row.month);
  const sqlCalc = getDaysInMonthSQL(db, parseInt(row.year), row.month);
  const match = jsCalc === sqlCalc ? '✓' : '✗';
  
  console.log(`${row.year}-${String(row.month).padStart(2, '0')}: ${row.record_count} records, ` +
    `${row.pro_rated_targets} pro-rated targets, ${row.pro_rated_costs} pro-rated costs, ` +
    `Days: ${jsCalc} ${match}`);
});

// Validate specific pro-rating calculations
console.log('\n=== Validating Pro-Rating Calculations ===\n');

const validationQuery = `
  SELECT 
    customer,
    service_type,
    analysis_date,
    CAST(strftime('%Y', analysis_date) AS INTEGER) as calc_year,
    CAST(strftime('%m', analysis_date) AS INTEGER) as calc_month,
    CAST(strftime('%d', analysis_date) AS INTEGER) as day,
    original_target,
    target,
    original_cost,
    cost,
    CASE 
      WHEN CAST(strftime('%m', analysis_date) AS INTEGER) IN (1, 3, 5, 7, 8, 10, 12) THEN 31
      WHEN CAST(strftime('%m', analysis_date) AS INTEGER) IN (4, 6, 9, 11) THEN 30
      WHEN CAST(strftime('%m', analysis_date) AS INTEGER) = 2 AND (CAST(strftime('%Y', analysis_date) AS INTEGER) % 4 = 0 AND (CAST(strftime('%Y', analysis_date) AS INTEGER) % 100 != 0 OR CAST(strftime('%Y', analysis_date) AS INTEGER) % 400 = 0)) THEN 29
      ELSE 28
    END as days_in_month,
    ROUND(original_target * CAST(strftime('%d', analysis_date) AS INTEGER) / 
      CASE 
        WHEN CAST(strftime('%m', analysis_date) AS INTEGER) IN (1, 3, 5, 7, 8, 10, 12) THEN 31
        WHEN CAST(strftime('%m', analysis_date) AS INTEGER) IN (4, 6, 9, 11) THEN 30
        WHEN CAST(strftime('%m', analysis_date) AS INTEGER) = 2 AND (CAST(strftime('%Y', analysis_date) AS INTEGER) % 4 = 0 AND (CAST(strftime('%Y', analysis_date) AS INTEGER) % 100 != 0 OR CAST(strftime('%Y', analysis_date) AS INTEGER) % 400 = 0)) THEN 29
        ELSE 28
      END, 2) as calculated_target,
    ROUND(original_cost * CAST(strftime('%d', analysis_date) AS INTEGER) / 
      CASE 
        WHEN CAST(strftime('%m', analysis_date) AS INTEGER) IN (1, 3, 5, 7, 8, 10, 12) THEN 31
        WHEN CAST(strftime('%m', analysis_date) AS INTEGER) IN (4, 6, 9, 11) THEN 30
        WHEN CAST(strftime('%m', analysis_date) AS INTEGER) = 2 AND (CAST(strftime('%Y', analysis_date) AS INTEGER) % 4 = 0 AND (CAST(strftime('%Y', analysis_date) AS INTEGER) % 100 != 0 OR CAST(strftime('%Y', analysis_date) AS INTEGER) % 400 = 0)) THEN 29
        ELSE 28
      END, 2) as calculated_cost
  FROM revenue_data
  WHERE original_target != target OR original_cost != cost
  ORDER BY analysis_date DESC
  LIMIT 10
`;

const proRatedRecords = db.prepare(validationQuery).all();

if (proRatedRecords.length === 0) {
  console.log('No pro-rated records found in the database.');
} else {
  console.log(`Found ${proRatedRecords.length} pro-rated records. Validating calculations:\n`);
  
  let validCount = 0;
  let invalidCount = 0;
  
  proRatedRecords.forEach((record, index) => {
    const targetMatch = Math.abs(record.target - record.calculated_target) < 0.01;
    const costMatch = Math.abs(record.cost - record.calculated_cost) < 0.01;
    const jsCalcDays = getDaysInMonthJS(record.calc_year, record.calc_month);
    const daysMatch = jsCalcDays === record.days_in_month;
    
    if (targetMatch && costMatch && daysMatch) {
      validCount++;
      console.log(`✓ Record ${index + 1}: ${record.customer} - ${record.service_type}`);
      console.log(`  Date: ${record.analysis_date} (Day ${record.day}/${record.days_in_month})`);
      console.log(`  Target: ${record.original_target} → ${record.target} (calc: ${record.calculated_target})`);
      console.log(`  Cost: ${record.original_cost} → ${record.cost} (calc: ${record.calculated_cost})`);
    } else {
      invalidCount++;
      console.log(`✗ Record ${index + 1}: ${record.customer} - ${record.service_type}`);
      console.log(`  Date: ${record.analysis_date} (Day ${record.day}/${record.days_in_month})`);
      console.log(`  Target: ${record.original_target} → ${record.target} (calc: ${record.calculated_target}) ${!targetMatch ? 'MISMATCH' : ''}`);
      console.log(`  Cost: ${record.original_cost} → ${record.cost} (calc: ${record.calculated_cost}) ${!costMatch ? 'MISMATCH' : ''}`);
      console.log(`  Days: DB=${record.days_in_month}, JS=${jsCalcDays} ${!daysMatch ? 'MISMATCH' : ''}`);
    }
    console.log();
  });
  
  console.log(`Summary: ${validCount} valid, ${invalidCount} invalid calculations`);
}

// Check for any February data to validate leap year handling
console.log('\n=== Checking February Data (Leap Year Validation) ===\n');

const februaryQuery = `
  SELECT DISTINCT
    strftime('%Y', analysis_date) as year,
    COUNT(*) as record_count,
    CASE 
      WHEN CAST(strftime('%Y', analysis_date) AS INTEGER) % 4 = 0 
        AND (CAST(strftime('%Y', analysis_date) AS INTEGER) % 100 != 0 
        OR CAST(strftime('%Y', analysis_date) AS INTEGER) % 400 = 0) 
      THEN 'Leap Year (29 days)'
      ELSE 'Regular Year (28 days)'
    END as year_type
  FROM revenue_data
  WHERE strftime('%m', analysis_date) = '02'
  GROUP BY year
  ORDER BY year DESC
`;

const februaryData = db.prepare(februaryQuery).all();

if (februaryData.length === 0) {
  console.log('No February data found in the database.');
} else {
  februaryData.forEach(row => {
    console.log(`February ${row.year}: ${row.record_count} records - ${row.year_type}`);
  });
}

db.close();

console.log('\n=== Validation Complete ===');