const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

async function testMatrixAPI() {
  console.log('Testing Opportunities Matrix API...\n');
  
  try {
    // Test the matrix endpoint
    console.log(`Fetching from: ${API_BASE_URL}/opportunities/matrix`);
    
    const response = await fetch(`${API_BASE_URL}/opportunities/matrix`);
    
    if (!response.ok) {
      console.error(`❌ API returned status ${response.status}: ${response.statusText}`);
      const error = await response.text();
      console.error('Error response:', error);
      return false;
    }
    
    const data = await response.json();
    
    // Validate response structure
    console.log('✅ API responded successfully');
    console.log('\nResponse structure:');
    console.log(`- Opportunities: ${data.opportunities?.length || 0}`);
    console.log(`- Matrix quadrants: ${Object.keys(data.matrix || {}).length}`);
    console.log(`- Revenue threshold: ${data.thresholds?.revenue || 'N/A'}`);
    console.log(`- GP threshold: ${((data.thresholds?.gp || 0) * 100).toFixed(1)}%`);
    
    if (data.statistics) {
      console.log('\nStatistics:');
      console.log(`- Total opportunities: ${data.statistics.totalOpportunities}`);
      console.log(`- Total monthly revenue: SAR ${data.statistics.totalMonthlyRevenue?.toLocaleString() || 0}`);
      console.log(`- Average GP: ${((data.statistics.averageGP || 0) * 100).toFixed(1)}%`);
      
      if (data.statistics.quadrants) {
        console.log('\nQuadrant breakdown:');
        Object.entries(data.statistics.quadrants).forEach(([key, stats]) => {
          console.log(`- ${key}: ${stats.count} opportunities, ${((stats.averageGP || 0) * 100).toFixed(1)}% avg GP`);
        });
      }
    }
    
    console.log('\n✅ Matrix API test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  // Check if server is running
  console.log('Note: Make sure the backend server is running on port 3001\n');
  
  testMatrixAPI()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = testMatrixAPI;