const db = require('../database/persistent-db');

console.log('Running database migrations...');

try {
  // Check current schema
  const columns = db.db.prepare("PRAGMA table_info(revenue_data)").all();
  console.log('Current columns:', columns.map(c => c.name).join(', '));
  
  const hasOriginalTarget = columns.some(col => col.name === 'original_target');
  const hasAnalysisDate = columns.some(col => col.name === 'analysis_date');
  const hasOriginalCost = columns.some(col => col.name === 'original_cost');
  
  if (!hasOriginalTarget) {
    console.log('Adding original_target column...');
    db.db.prepare('ALTER TABLE revenue_data ADD COLUMN original_target REAL DEFAULT 0').run();
    db.db.prepare('UPDATE revenue_data SET original_target = target WHERE original_target = 0').run();
    console.log('✓ Added original_target column');
  } else {
    console.log('✓ original_target column already exists');
  }
  
  if (!hasAnalysisDate) {
    console.log('Adding analysis_date column...');
    // SQLite doesn't support non-constant defaults in ALTER TABLE
    db.db.prepare('ALTER TABLE revenue_data ADD COLUMN analysis_date DATE').run();
    // Update existing rows with current date
    db.db.prepare("UPDATE revenue_data SET analysis_date = date('now') WHERE analysis_date IS NULL").run();
    console.log('✓ Added analysis_date column');
  } else {
    console.log('✓ analysis_date column already exists');
  }
  
  if (!hasOriginalCost) {
    console.log('Adding original_cost column...');
    db.db.prepare('ALTER TABLE revenue_data ADD COLUMN original_cost REAL DEFAULT 0').run();
    db.db.prepare('UPDATE revenue_data SET original_cost = cost WHERE original_cost = 0').run();
    console.log('✓ Added original_cost column');
  } else {
    console.log('✓ original_cost column already exists');
  }
  
  // Verify columns were added
  const newColumns = db.db.prepare("PRAGMA table_info(revenue_data)").all();
  console.log('\nUpdated columns:', newColumns.map(c => c.name).join(', '));
  
  console.log('\n✅ Migrations completed successfully!');
} catch (error) {
  console.error('Migration error:', error);
  process.exit(1);
}

process.exit(0);