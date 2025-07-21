const db = require('../database/persistent-db');

console.log('Running database migrations...');

try {
  // Check current schema
  const columns = db.db.prepare("PRAGMA table_info(revenue_data)").all();
  console.log('Current columns:', columns.map(c => c.name).join(', '));
  
  //   const hasOriginalTarget = columns.some(col => col.name === 'original_target'); // REMOVED: Pro-rating no longer used
  //   const hasAnalysisDate = columns.some(col => col.name === 'analysis_date'); // REMOVED: Pro-rating no longer used
  //   const hasOriginalCost = columns.some(col => col.name === 'original_cost'); // REMOVED: Pro-rating no longer used
  //    // REMOVED: Pro-rating no longer used
  //   if (!hasOriginalTarget) { // REMOVED: Pro-rating no longer used
  //     console.log('Adding original_target column...'); // REMOVED: Pro-rating no longer used
  //     db.db.prepare('ALTER TABLE revenue_data ADD COLUMN original_target REAL DEFAULT 0').run(); // REMOVED: Pro-rating no longer used
  //     db.db.prepare('UPDATE revenue_data SET original_target = target WHERE original_target = 0').run(); // REMOVED: Pro-rating no longer used
  //     console.log('✓ Added original_target column'); // REMOVED: Pro-rating no longer used
  //   } else { // REMOVED: Pro-rating no longer used
  //     console.log('✓ original_target column already exists'); // REMOVED: Pro-rating no longer used
  //   } // REMOVED: Pro-rating no longer used
  
  //   if (!hasAnalysisDate) { // REMOVED: Pro-rating no longer used
  //     console.log('Adding analysis_date column...'); // REMOVED: Pro-rating no longer used
  //     // SQLite doesn't support non-constant defaults in ALTER TABLE // REMOVED: Pro-rating no longer used
  //     db.db.prepare('ALTER TABLE revenue_data ADD COLUMN analysis_date DATE').run(); // REMOVED: Pro-rating no longer used
  //     // Update existing rows with current date // REMOVED: Pro-rating no longer used
  //     db.db.prepare("UPDATE revenue_data SET analysis_date = date('now') WHERE analysis_date IS NULL").run(); // REMOVED: Pro-rating no longer used
  //     console.log('✓ Added analysis_date column'); // REMOVED: Pro-rating no longer used
  //   } else { // REMOVED: Pro-rating no longer used
  //     console.log('✓ analysis_date column already exists'); // REMOVED: Pro-rating no longer used
  //   } // REMOVED: Pro-rating no longer used
  
  //   if (!hasOriginalCost) { // REMOVED: Pro-rating no longer used
  //     console.log('Adding original_cost column...'); // REMOVED: Pro-rating no longer used
  //     db.db.prepare('ALTER TABLE revenue_data ADD COLUMN original_cost REAL DEFAULT 0').run(); // REMOVED: Pro-rating no longer used
  //     db.db.prepare('UPDATE revenue_data SET original_cost = cost WHERE original_cost = 0').run(); // REMOVED: Pro-rating no longer used
  //     console.log('✓ Added original_cost column'); // REMOVED: Pro-rating no longer used
  //   } else { // REMOVED: Pro-rating no longer used
  //     console.log('✓ original_cost column already exists'); // REMOVED: Pro-rating no longer used
  //   } // REMOVED: Pro-rating no longer used
  
  // Verify columns were added
  const newColumns = db.db.prepare("PRAGMA table_info(revenue_data)").all();
  console.log('\nUpdated columns:', newColumns.map(c => c.name).join(', '));
  
  console.log('\n✅ Migrations completed successfully!');
} catch (error) {
  console.error('Migration error:', error);
  process.exit(1);
}

process.exit(0);