const forecastService = require('./services/forecast.service');

// Test moving average without caching
async function testMovingAverage() {
  console.log('Testing moving average method in detail...\n');
  
  const historicalStart = new Date('2025-01-01');
  const historicalEnd = new Date('2025-06-30');
  const forecastStart = new Date('2025-07-01');
  const forecastEnd = new Date('2025-12-31');
  
  try {
    // Get historical data
    const monthlyTotals = forecastService.getMonthlyTotals(historicalStart, historicalEnd);
    console.log('Historical data:', monthlyTotals.length, 'months');
    
    // Get forecast months
    const forecastMonths = forecastService.getMonthsBetween(forecastStart, forecastEnd);
    console.log('Forecast months:', forecastMonths.length);
    
    // Run moving average
    const config = { windowSize: 3, weightType: 'simple' };
    const results = forecastService.movingAverage(monthlyTotals, forecastMonths, config);
    
    console.log('\nForecast results:');
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.month} ${r.year}:`);
      console.log(`     - base: ${r.base}`);
      console.log(`     - total: ${r.total}`);
      console.log(`     - lower: ${r.lower}`);
      console.log(`     - upper: ${r.upper}`);
      console.log(`     - has lower: ${r.lower !== undefined}`);
      console.log(`     - has upper: ${r.upper !== undefined}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMovingAverage().then(() => {
  console.log('\nTest completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});