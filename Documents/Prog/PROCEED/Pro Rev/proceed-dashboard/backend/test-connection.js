const axios = require('axios');

const baseURL = 'http://localhost:3001/api';

async function testConnection() {
  console.log('Testing database connection stability...\n');
  
  const endpoints = [
    '/health',
    '/overview?year=2025&period=YTD',
    '/overview?year=2025&period=MTD&month=6',
    '/overview?year=2025&period=QTD&quarter=2',
    '/business-units?year=2025&period=YTD',
    '/customers?year=2025&period=YTD',
    '/trends/monthly?year=2025',
    '/years'
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(baseURL + endpoint);
      console.log(`✓ ${endpoint} - Success (${response.data.status || 'Data retrieved'})`);
      successCount++;
    } catch (error) {
      console.log(`✗ ${endpoint} - Failed: ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\nConnection Test Summary:`);
  console.log(`Total tests: ${endpoints.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`\nDatabase connection is ${failCount === 0 ? 'SOLID ✓' : 'UNSTABLE ✗'}`);
}

// Run test every 5 seconds for 30 seconds to check stability
let testCount = 0;
const maxTests = 6;

function runTests() {
  testCount++;
  console.log(`\n========== Test Run ${testCount}/${maxTests} ==========`);
  
  testConnection().then(() => {
    if (testCount < maxTests) {
      setTimeout(runTests, 5000);
    } else {
      console.log('\n✓ All stability tests completed!');
      process.exit(0);
    }
  });
}

runTests();