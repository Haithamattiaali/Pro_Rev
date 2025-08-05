const Database = require('better-sqlite3');
const path = require('path');

async function removeProRatedColumns() {
  console.log('=== REMOVING PRO-RATED COLUMNS ===\n');
  
  // Connect directly to the database
  const dbPath = path.join(__dirname, '../database/proceed_revenue.db');
  const db = new Database(dbPath);
  
  try {
    // First, check current columns
    const columns = db.prepare("PRAGMA table_info(revenue_data)").all();
    console.log('Current columns:', columns.map(c => c.name).join(', '));
    
    const hasOriginalTarget = columns.some(col => col.name === 'original_target');
    const hasOriginalCost = columns.some(col => col.name === 'original_cost');
    const hasAnalysisDate = columns.some(col => col.name === 'analysis_date');
    
    console.log('\nPro-rated columns found:');
    console.log('- original_target:', hasOriginalTarget);
    console.log('- original_cost:', hasOriginalCost);
    console.log('- analysis_date:', hasAnalysisDate);
    
    if (!hasOriginalTarget && !hasOriginalCost && !hasAnalysisDate) {
      console.log('\nNo pro-rated columns found. Database is clean.');
      process.exit(0);
    }
    
    // SQLite doesn't support DROP COLUMN in older versions, so we need to recreate the table
    console.log('\nCreating new table without pro-rated columns...');
    
    // Create new table with desired structure
    db.exec(`
      CREATE TABLE IF NOT EXISTS revenue_data_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer TEXT NOT NULL,
        service_type TEXT NOT NULL,
        year INTEGER NOT NULL,
        month TEXT NOT NULL,
        cost REAL DEFAULT 0,
        target REAL DEFAULT 0,
        revenue REAL DEFAULT 0,
        receivables_collected REAL DEFAULT 0,
        days INTEGER DEFAULT 30,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(customer, service_type, year, month)
      )
    `);
    
    // Copy data from old table to new table
    console.log('Copying data to new table...');
    db.exec(`
      INSERT INTO revenue_data_new (
        id, customer, service_type, year, month, 
        cost, target, revenue, receivables_collected, days,
        created_at, updated_at
      )
      SELECT 
        id, customer, service_type, year, month,
        cost, target, revenue, receivables_collected, days,
        created_at, updated_at
      FROM revenue_data
    `);
    
    // Drop old table and rename new table
    console.log('Replacing old table...');
    db.exec('DROP TABLE revenue_data');
    db.exec('ALTER TABLE revenue_data_new RENAME TO revenue_data');
    
    // Verify the changes
    const newColumns = db.prepare("PRAGMA table_info(revenue_data)").all();
    console.log('\nNew columns:', newColumns.map(c => c.name).join(', '));
    
    // Check row count to ensure data integrity
    const count = db.prepare('SELECT COUNT(*) as count FROM revenue_data').get();
    console.log('\nTotal records after migration:', count.count);
    
    console.log('\n✅ Pro-rated columns successfully removed!');
    
    // Close database connection
    db.close();
    
  } catch (error) {
    console.error('Error removing columns:', error);
    db.close();
    process.exit(1);
  }
  
  process.exit(0);
}

removeProRatedColumns().catch(console.error);