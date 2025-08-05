const Database = require('better-sqlite3');
const path = require('path');

async function removeProRatedColumns() {
  console.log('=== SAFELY REMOVING PRO-RATED COLUMNS ===\n');
  
  const dbPath = path.join(__dirname, '../database/proceed_revenue.db');
  const db = new Database(dbPath);
  
  try {
    // Start a transaction
    const migrate = db.transaction(() => {
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
        return;
      }
      
      // Drop any views that depend on revenue_data
      console.log('\nDropping dependent views...');
      const views = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='view' AND sql LIKE '%revenue_data%'
      `).all();
      
      views.forEach(view => {
        console.log(`Dropping view: ${view.name}`);
        db.prepare(`DROP VIEW IF EXISTS ${view.name}`).run();
      });
      
      // Create new table without pro-rated columns
      console.log('\nCreating new table without pro-rated columns...');
      db.exec(`
        CREATE TABLE revenue_data_new (
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
      
      // Drop old table
      console.log('Dropping old table...');
      db.exec('DROP TABLE revenue_data');
      
      // Rename new table
      console.log('Renaming new table...');
      db.exec('ALTER TABLE revenue_data_new RENAME TO revenue_data');
      
      // Recreate any necessary views
      console.log('\nRecreating views...');
      db.exec(`
        CREATE VIEW IF NOT EXISTS revenue_summary AS
        SELECT 
          year,
          month,
          SUM(revenue) as total_revenue,
          SUM(target) as total_target,
          SUM(cost) as total_cost,
          COUNT(DISTINCT customer) as customer_count
        FROM revenue_data
        GROUP BY year, month
      `);
      
      // Verify the changes
      const newColumns = db.prepare("PRAGMA table_info(revenue_data)").all();
      console.log('\nNew columns:', newColumns.map(c => c.name).join(', '));
      
      // Check row count to ensure data integrity
      const count = db.prepare('SELECT COUNT(*) as count FROM revenue_data').get();
      console.log('\nTotal records after migration:', count.count);
    });
    
    // Execute the transaction
    migrate();
    
    console.log('\n✅ Pro-rated columns successfully removed!');
    
    // Close database
    db.close();
    
  } catch (error) {
    console.error('Error removing columns:', error);
    db.close();
    process.exit(1);
  }
  
  process.exit(0);
}

removeProRatedColumns().catch(console.error);