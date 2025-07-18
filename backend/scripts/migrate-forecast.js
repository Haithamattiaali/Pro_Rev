const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

console.log('Starting forecast schema migration...');

// Create direct database connection
const dbPath = path.join(__dirname, '../database/proceed_revenue.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

try {
  // Read the forecast schema SQL file
  const schemaPath = path.join(__dirname, '../database/forecast-schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  // Execute the schema
  const statements = schemaSql.split(';').filter(stmt => stmt.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        db.exec(statement);
        console.log('Executed:', statement.trim().split('\n')[0] + '...');
      } catch (err) {
        console.error('Error executing statement:', err.message);
        console.error('Statement:', statement);
      }
    }
  }
  
  // Verify tables were created
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'forecast_%'").all();
  console.log('\nCreated forecast tables:', tables.map(t => t.name));
  
  // Insert some initial opportunities based on actual data patterns
  const initialOpportunities = [
    {
      customer: 'SABIC',
      service_type: 'Warehouses',
      target_value: 1200000,
      probability: 0.8,
      start_month: 3,
      duration: 12,
      enabled: 1
    },
    {
      customer: 'Aramco',
      service_type: 'Transportation',
      target_value: 800000,
      probability: 0.7,
      start_month: 2,
      duration: 24,
      enabled: 1
    },
    {
      customer: 'NUPCO',
      service_type: 'Transportation',
      target_value: 200000,
      probability: 0.9,
      start_month: 1,
      duration: 6,
      enabled: 1
    },
    {
      customer: 'Almarai',
      service_type: 'Warehouses',
      target_value: 600000,
      probability: 0.6,
      start_month: 4,
      duration: 18,
      enabled: 1
    }
  ];
  
  const insertOpp = db.prepare(`
    INSERT OR IGNORE INTO forecast_opportunities 
    (customer, service_type, target_value, probability, start_month, duration, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const opp of initialOpportunities) {
    insertOpp.run(
      opp.customer,
      opp.service_type,
      opp.target_value,
      opp.probability,
      opp.start_month,
      opp.duration,
      opp.enabled
    );
  }
  
  console.log('\nInserted initial opportunities');
  console.log('Forecast schema migration completed successfully!');
  
  // Close the database connection
  db.close();
  
} catch (error) {
  console.error('Migration failed:', error);
  db.close();
  process.exit(1);
}