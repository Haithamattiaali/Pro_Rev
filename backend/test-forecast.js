const forecastService = require('./services/forecast.service');

// Test different forecast methods
async function testForecastMethods() {
  console.log('Testing forecast methods...\n');
  
  const historicalStart = new Date('2025-01-01');
  const historicalEnd = new Date('2025-06-30');
  const forecastStart = new Date('2025-07-01');
  const forecastEnd = new Date('2025-12-31');
  
  const methods = [
    { name: 'linear', config: {} },
    { name: 'movingAverage', config: {} },
    { name: 'exponential', config: {} },
    { name: 'seasonal', config: {} },
    { name: 'arima', config: {} }
  ];
  
  for (const { name, config } of methods) {
    console.log(`\nTesting ${name} method...`);
    try {
      const result = await forecastService.generateForecast({
        historicalStart,
        historicalEnd,
        forecastStart,
        forecastEnd,
        method: name,
        methodConfig: config
      });
      
      console.log(`✓ ${name} method: SUCCESS`);
      console.log(`  - Historical data points: ${result.historical.length}`);
      console.log(`  - Forecast periods: ${result.forecast.length}`);
      if (result.forecast.length > 0) {
        const first = result.forecast[0];
        console.log(`  - First forecast: ${first.month} ${first.year} = ${first.total}`);
        console.log(`  - Bounds: lower=${first.lower}, upper=${first.upper}`);
      }
    } catch (error) {
      console.log(`✗ ${name} method: FAILED`);
      console.log(`  - Error: ${error.message}`);
      console.log(`  - Stack: ${error.stack}`);
    }
  }
}

testForecastMethods().then(() => {
  console.log('\nTests completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});