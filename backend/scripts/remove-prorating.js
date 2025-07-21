const db = require('../database/persistent-db');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('Removing Pro-Rating Leftovers');
console.log('========================================\n');

// Step 1: Update forecast service to use regular cost instead of original_cost
console.log('Step 1: Fixing forecast service...');
const forecastServicePath = path.join(__dirname, '../services/forecast.service.js');
try {
  let forecastContent = fs.readFileSync(forecastServicePath, 'utf8');
  
  // Replace COALESCE(original_cost, cost) with just cost
  const originalUsages = (forecastContent.match(/COALESCE\(original_cost, cost\)/g) || []).length;
  forecastContent = forecastContent.replace(/COALESCE\(original_cost, cost\)/g, 'cost');
  
  fs.writeFileSync(forecastServicePath, forecastContent);
  console.log(`✓ Fixed ${originalUsages} instances of COALESCE(original_cost, cost) in forecast service`);
} catch (error) {
  console.error('✗ Error updating forecast service:', error.message);
}

// Step 2: Check if columns are being used
console.log('\nStep 2: Checking column usage...');
try {
  // Check if any records have different values
  const diffCheck = db.db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN target != original_target THEN 1 ELSE 0 END) as different_targets,
      SUM(CASE WHEN cost != original_cost THEN 1 ELSE 0 END) as different_costs
    FROM revenue_data
  `).get();
  
  console.log(`Total records: ${diffCheck.total}`);
  console.log(`Records with different targets: ${diffCheck.different_targets}`);
  console.log(`Records with different costs: ${diffCheck.different_costs}`);
  
  if (diffCheck.different_targets > 0 || diffCheck.different_costs > 0) {
    console.log('\n⚠️  Warning: Some records have different original values.');
    console.log('Run fix-targets.js first to ensure all values are synchronized.');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Error checking column usage:', error.message);
}

// Step 3: Create backup before making schema changes
console.log('\nStep 3: Creating database backup...');
try {
  const backupPath = path.join(__dirname, '../database/backup_before_prorating_removal.db');
  const dbPath = path.join(__dirname, '../database/proceed_revenue.db');
  
  // Copy database file
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✓ Backup created at: ${backupPath}`);
} catch (error) {
  console.error('✗ Error creating backup:', error.message);
  process.exit(1);
}

// Step 4: Remove columns from database
console.log('\nStep 4: Removing pro-rating columns from database...');
try {
  // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
  db.db.transaction(() => {
    // First, save view definitions
    const views = db.db.prepare(`
      SELECT name, sql FROM sqlite_master 
      WHERE type='view' AND (sql LIKE '%revenue_data%' OR name LIKE '%revenue%')
    `).all();
    
    console.log(`Found ${views.length} views to preserve`);
    
    // Drop views that depend on revenue_data
    views.forEach(view => {
      db.db.prepare(`DROP VIEW IF EXISTS ${view.name}`).run();
    });
    
    // Create new table without pro-rating columns
    db.db.prepare(`
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(customer, service_type, year, month)
      )
    `).run();
    
    // Copy data
    db.db.prepare(`
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
    `).run();
    
    // Drop old table
    db.db.prepare('DROP TABLE revenue_data').run();
    
    // Rename new table
    db.db.prepare('ALTER TABLE revenue_data_new RENAME TO revenue_data').run();
    
    // Recreate indexes
    db.db.prepare('CREATE INDEX idx_revenue_customer ON revenue_data(customer)').run();
    db.db.prepare('CREATE INDEX idx_revenue_service_type ON revenue_data(service_type)').run();
    db.db.prepare('CREATE INDEX idx_revenue_year_month ON revenue_data(year, month)').run();
    db.db.prepare('CREATE INDEX idx_revenue_composite ON revenue_data(customer, service_type, year, month)').run();
    
    // Recreate views
    views.forEach(view => {
      db.db.prepare(view.sql).run();
      console.log(`✓ Recreated view: ${view.name}`);
    });
  })();
  
  console.log('✓ Successfully removed original_target, original_cost, and analysis_date columns');
} catch (error) {
  console.error('✗ Error removing columns:', error.message);
  process.exit(1);
}

// Step 5: Clean up migration scripts
console.log('\nStep 5: Updating migration scripts...');
try {
  const migrationPath = path.join(__dirname, 'run-migrations.js');
  let migrationContent = fs.readFileSync(migrationPath, 'utf8');
  
  // Comment out pro-rating related migrations
  const lines = migrationContent.split('\n');
  let inProRatingBlock = false;
  let modifiedLines = [];
  
  for (let line of lines) {
    if (line.includes('hasOriginalTarget') || line.includes('hasOriginalCost') || line.includes('hasAnalysisDate')) {
      inProRatingBlock = true;
      modifiedLines.push('  // ' + line + ' // REMOVED: Pro-rating no longer used');
    } else if (inProRatingBlock && line.trim() === '}') {
      modifiedLines.push('  // ' + line + ' // REMOVED: Pro-rating no longer used');
      inProRatingBlock = false;
    } else if (inProRatingBlock) {
      modifiedLines.push('  // ' + line + ' // REMOVED: Pro-rating no longer used');
    } else {
      modifiedLines.push(line);
    }
  }
  
  fs.writeFileSync(migrationPath, modifiedLines.join('\n'));
  console.log('✓ Updated migration script to comment out pro-rating migrations');
} catch (error) {
  console.error('✗ Error updating migration script:', error.message);
}

// Step 6: Summary
console.log('\n========================================');
console.log('Summary of Changes:');
console.log('========================================');
console.log('1. ✓ Fixed forecast service to use regular cost');
console.log('2. ✓ Created database backup');
console.log('3. ✓ Removed original_target column');
console.log('4. ✓ Removed original_cost column');
console.log('5. ✓ Removed analysis_date column');
console.log('6. ✓ Updated migration scripts');
console.log('\nPro-rating has been completely removed from the system!');
console.log('\nNext steps:');
console.log('- Delete scripts/fix-targets.js (no longer needed)');
console.log('- Delete scripts/validate-calendar-calculations.js (no longer needed)');
console.log('- Review and update any documentation mentioning pro-rating');