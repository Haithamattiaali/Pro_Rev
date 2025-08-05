const db = require('../database/persistent-db');

console.log('Checking database contents...\n');

try {
  // Count total records
  const totalRecords = db.db.prepare('SELECT COUNT(*) as count FROM revenue_data').get();
  console.log(`Total records: ${totalRecords.count}`);
  
  // Get sample data
  const sampleData = db.db.prepare('SELECT * FROM revenue_data LIMIT 5').all();
  console.log('\nSample records:');
  console.log(JSON.stringify(sampleData, null, 2));
  
  // Check data by year and month
  const summary = db.db.prepare(`
    SELECT year, month, COUNT(*) as count, 
           SUM(revenue) as total_revenue,
           SUM(target) as total_target,
           SUM(original_target) as total_original_target
    FROM revenue_data 
    GROUP BY year, month 
    ORDER BY year, month
  `).all();
  
  console.log('\nData summary by year/month:');
  summary.forEach(row => {
    console.log(`${row.year} ${row.month}: ${row.count} records, Revenue: ${row.total_revenue}, Target: ${row.total_target}, Original Target: ${row.total_original_target}`);
  });
  
} catch (error) {
  console.error('Error:', error);
}

process.exit(0);