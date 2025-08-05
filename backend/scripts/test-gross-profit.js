const db = require('../database/db-wrapper');
const dataService = require('../services/data.service');

async function testGrossProfitCalculations() {
  console.log('=== Testing Gross Profit Calculations ===\n');
  
  try {
    // Test historical month (June 2025)
    console.log('1. Testing Historical Month (June 2025):');
    const historicalData = await dataService.getOverviewData(2025, 'MTD', 6);
    console.log(`   - Target: ${historicalData.overview.target}`);
    console.log(`   - Cost: ${historicalData.overview.cost}`);
    console.log(`   - Gross Profit: ${historicalData.overview.profit}`);
    console.log(`   - Gross Profit Margin: ${historicalData.overview.profitMargin.toFixed(2)}%`);
    console.log(`   - Expected Profit: ${historicalData.overview.target - historicalData.overview.cost}`);
    console.log(`   - Calculation Correct: ${historicalData.overview.profit === (historicalData.overview.target - historicalData.overview.cost) ? '✓' : '✗'}`);
    
    // Test current month (July 2025)
    console.log('\n2. Testing Current Month (July 2025):');
    const currentData = await dataService.getOverviewData(2025, 'MTD', 7);
    
    // Get raw data to see original values
    const rawDataSql = `
      SELECT 
        SUM(target) as pro_rated_target,
        SUM(original_target) as original_target,
        SUM(cost) as pro_rated_cost,
        SUM(original_cost) as original_cost
      FROM revenue_data
      WHERE year = 2025 AND month = 'Jul'
    `;
    const rawData = await db.get(rawDataSql);
    
    console.log(`   - Pro-rated Target: ${currentData.overview.target}`);
    console.log(`   - Pro-rated Cost: ${currentData.overview.cost}`);
    console.log(`   - Original Target: ${rawData.original_target}`);
    console.log(`   - Original Cost: ${rawData.original_cost}`);
    console.log(`   - Gross Profit (pro-rated): ${currentData.overview.profit}`);
    console.log(`   - Gross Profit Margin: ${currentData.overview.profitMargin.toFixed(2)}%`);
    console.log(`   - Expected Margin: ${((rawData.original_target - rawData.original_cost) / rawData.original_target * 100).toFixed(2)}%`);
    console.log(`   - Margin uses full month values: ${Math.abs(currentData.overview.profitMargin - ((rawData.original_target - rawData.original_cost) / rawData.original_target * 100)) < 0.01 ? '✓' : '✗'}`);
    
    // Test service breakdown
    console.log('\n3. Testing Service Breakdown:');
    if (currentData.serviceBreakdown && currentData.serviceBreakdown.length > 0) {
      currentData.serviceBreakdown.forEach(service => {
        console.log(`   ${service.service_type}:`);
        console.log(`     - Target: ${service.target}, Cost: ${service.cost}`);
        console.log(`     - Expected Profit: ${service.target - service.cost}`);
      });
    }
    
    // Test Business Units
    console.log('\n4. Testing Business Units:');
    const businessUnits = await dataService.getBusinessUnitData(2025, 'MTD', 7);
    if (businessUnits.length > 0) {
      const unit = businessUnits[0];
      console.log(`   ${unit.businessUnit}:`);
      console.log(`     - Profit: ${unit.profit}`);
      console.log(`     - Profit Margin: ${unit.profitMargin.toFixed(2)}%`);
      console.log(`     - Target: ${unit.target}, Cost: ${unit.cost}`);
      console.log(`     - Profit = Target - Cost: ${unit.profit === (unit.target - unit.cost) ? '✓' : '✗'}`);
    }
    
    // Test Customers
    console.log('\n5. Testing Customer Data:');
    const customers = await dataService.getCustomerData(2025, 'MTD', 7);
    if (customers.length > 0) {
      const customer = customers[0];
      console.log(`   ${customer.customer}:`);
      console.log(`     - Profit: ${customer.profit}`);
      console.log(`     - Profit Margin: ${customer.profitMargin.toFixed(2)}%`);
      console.log(`     - Target: ${customer.target}, Cost: ${customer.cost}`);
      console.log(`     - Profit = Target - Cost: ${customer.profit === (customer.target - customer.cost) ? '✓' : '✗'}`);
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testGrossProfitCalculations();