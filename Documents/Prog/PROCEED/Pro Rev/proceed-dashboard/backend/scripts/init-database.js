const fs = require('fs');
const path = require('path');
const etlService = require('../services/etl.service');

async function initializeDatabase() {
  try {
    console.log('Initializing database with master table data...');
    
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