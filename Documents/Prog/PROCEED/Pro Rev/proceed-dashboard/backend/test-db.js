const dataService = require('./services/data.service');

async function test() {
  try {
    console.log('Testing database connection...');
    
    // Test getBusinessUnitData
    console.log('\nTesting getBusinessUnitData:');
    const businessUnits = await dataService.getBusinessUnitData(2025, 'YTD');
    console.log('Business units count:', businessUnits.length);
    console.log('First unit:', businessUnits[0]);
    
    // Test getCustomerData
    console.log('\nTesting getCustomerData:');
    const customers = await dataService.getCustomerData(2025, 'YTD');
    console.log('Customers count:', customers.length);
    console.log('First customer:', customers[0]);
    
    console.log('\nAll tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();