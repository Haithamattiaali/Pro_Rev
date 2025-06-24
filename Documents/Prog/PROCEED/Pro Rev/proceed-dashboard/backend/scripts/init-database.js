const fs = require('fs');
const path = require('path');
const etlService = require('../services/etl.service');
const db = require('../database/db-wrapper');

async function initializeDatabase() {
  try {
    console.log('Initializing database with master table data...');
    
    // Initialize schema first
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.run(statement);
      }
    }
    
    // Read the JSON file
    const jsonPath = '/Users/haithamdata/Documents/Prog/Occasional/New ETL/master_table.json';
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`Found ${jsonData.length} records to import`);
    
    // Process the data
    const result = await etlService.insertData(jsonData);
    
    console.log('Database initialization complete!');
    console.log('Results:', result);
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();