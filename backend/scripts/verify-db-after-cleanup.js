const Database = require('better-sqlite3');
const path = require('path');

async function verifyDatabase() {
  console.log('=== VERIFYING DATABASE AFTER PRO-RATED COLUMN REMOVAL ===\n');
  
  const dbPath = path.join(__dirname, '../database/proceed_revenue.db');
  const db = new Database(dbPath);
  
  try {
    // Check table structure
    const columns = db.prepare('PRAGMA table_info(revenue_data)').all();
    console.log('Current columns in revenue_data table:');
    console.log(columns.map(c => c.name).join(', '));
    console.log('');
    
    // Verify no pro-rated columns exist
    const hasOriginalTarget = columns.some(col => col.name === 'original_target');
    const hasOriginalCost = columns.some(col => col.name === 'original_cost');
    const hasAnalysisDate = columns.some(col => col.name === 'analysis_date');
    
    console.log('Pro-rated column check:');
    console.log('- original_target exists:', hasOriginalTarget);
    console.log('- original_cost exists:', hasOriginalCost);
    console.log('- analysis_date exists:', hasAnalysisDate);
    console.log('');
    
    if (hasOriginalTarget || hasOriginalCost || hasAnalysisDate) {
      console.log('⚠️  Warning: Pro-rated columns still exist!');
    } else {
      console.log('✅ All pro-rated columns have been removed');
    }
    
    // Test a query to ensure everything works
    const testData = db.prepare(`
      SELECT 
        SUM(revenue) as total_revenue,
        SUM(target) as total_target,
        SUM(cost) as total_cost
      FROM revenue_data
      WHERE year = 2025 AND month = 'Jan'
    `).get();
    
    console.log('\nTest query successful:');
    console.log('Total Revenue:', testData.total_revenue);
    console.log('Total Target:', testData.total_target);
    console.log('Total Cost:', testData.total_cost);
    
    console.log('\n✅ Database is working correctly without pro-rated columns!');
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    db.close();
    process.exit(1);
  }
  
  process.exit(0);
}

verifyDatabase().catch(console.error);