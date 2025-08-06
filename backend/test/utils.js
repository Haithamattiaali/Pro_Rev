const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create test database with schema
function createTestDatabase() {
  const dbPath = process.env.TEST_DB_PATH || path.join(__dirname, 'test-db', 'test_revenue.db');
  
  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Remove existing test database
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  
  const db = new Database(dbPath);
  
  // Read and execute schema
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split by semicolon and execute each statement separately
  const statements = schema.split(';').filter(stmt => stmt.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        db.exec(statement);
      } catch (err) {
        console.error('Error executing schema statement:', err.message);
      }
    }
  }
  
  // Add columns that might be missing from the base schema
  try {
    db.exec('ALTER TABLE revenue_data ADD COLUMN original_cost REAL DEFAULT 0');
  } catch (err) {
    // Column might already exist
  }
  try {
    db.exec('ALTER TABLE revenue_data ADD COLUMN original_target REAL DEFAULT 0');
  } catch (err) {
    // Column might already exist
  }
  try {
    db.exec('ALTER TABLE revenue_data ADD COLUMN days INTEGER DEFAULT 0');
  } catch (err) {
    // Column might already exist
  }
  
  // Read and execute forecast schema
  const forecastSchemaPath = path.join(__dirname, '..', 'database', 'forecast-schema.sql');
  if (fs.existsSync(forecastSchemaPath)) {
    const forecastSchema = fs.readFileSync(forecastSchemaPath, 'utf8');
    db.exec(forecastSchema);
  }
  
  return db;
}

// Seed test data
function seedTestData(db) {
  const testData = [
    {
      customer: 'Test Customer A',
      service_type: 'Transportation',
      year: 2025,
      month: 'Jan',
      cost: 100000,
      target: 150000,
      revenue: 140000,
      receivables_collected: 130000,
      original_cost: 100000,
      original_target: 150000,
      days: 31
    },
    {
      customer: 'Test Customer A',
      service_type: 'Warehouses',
      year: 2025,
      month: 'Jan',
      cost: 50000,
      target: 80000,
      revenue: 75000,
      receivables_collected: 70000,
      original_cost: 50000,
      original_target: 80000,
      days: 31
    },
    {
      customer: 'Test Customer B',
      service_type: 'Transportation',
      year: 2025,
      month: 'Jan',
      cost: 80000,
      target: 120000,
      revenue: 110000,
      receivables_collected: 105000,
      original_cost: 80000,
      original_target: 120000,
      days: 31
    },
    {
      customer: 'Test Customer B',
      service_type: 'Warehouses',
      year: 2025,
      month: 'Jan',
      cost: 40000,
      target: 60000,
      revenue: 55000,
      receivables_collected: 52000,
      original_cost: 40000,
      original_target: 60000,
      days: 31
    }
  ];
  
  const stmt = db.prepare(`
    INSERT INTO revenue_data (customer, service_type, year, month, cost, target, revenue, receivables_collected, original_cost, original_target, days)
    VALUES (@customer, @service_type, @year, @month, @cost, @target, @revenue, @receivables_collected, @original_cost, @original_target, @days)
  `);
  
  for (const data of testData) {
    stmt.run(data);
  }
  
  return testData;
}

// Create mock Excel file buffer
function createMockExcelBuffer() {
  const XLSX = require('xlsx');
  
  const data = [
    ['Customer', 'ServiceType', 'Year', 'Month', 'Cost', 'Target', 'Revenue', 'Receivables Collected'],
    ['Test Customer C', 'Transportation', 2025, 'Feb', 120000, 180000, 170000, 160000],
    ['Test Customer C', 'Warehouses', 2025, 'Feb', 60000, 90000, 85000, 80000]
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

// Wait for async operations
function waitForAsync(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  createTestDatabase,
  seedTestData,
  createMockExcelBuffer,
  waitForAsync
};