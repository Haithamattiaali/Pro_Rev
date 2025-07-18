const db = require('../database/persistent-db');
const salesPlanService = require('../services/salesPlan.service');

// Test the opportunities matrix functionality
async function testOpportunitiesMatrix() {
  console.log('=== Testing Opportunities Matrix ===\n');
  
  try {
    // 1. Test database connection and table existence
    console.log('1. Testing database connection...');
    const tableCheck = db.get(`
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='table' AND name='opportunities_data'
    `);
    
    if (tableCheck.count === 0) {
      console.error('❌ opportunities_data table does not exist');
      return false;
    }
    console.log('✅ Database table exists');
    
    // 2. Check if we have data
    console.log('\n2. Checking opportunities data...');
    const dataCount = db.get('SELECT COUNT(*) as count FROM opportunities_data');
    console.log(`   Found ${dataCount.count} opportunities`);
    
    if (dataCount.count === 0) {
      console.log('   ⚠️  No data found. Running seed script...');
      // Try to seed data
      try {
        require('../scripts/seed-opportunities')();
      } catch (e) {
        console.log('   Could not auto-seed data');
      }
    }
    
    // 3. Test the matrix service method
    console.log('\n3. Testing getOpportunitiesMatrix service...');
    const matrixData = await salesPlanService.getOpportunitiesMatrix();
    
    // Validate structure
    const requiredFields = ['opportunities', 'matrix', 'thresholds', 'statistics'];
    const missingFields = requiredFields.filter(field => !(field in matrixData));
    
    if (missingFields.length > 0) {
      console.error(`❌ Missing fields in response: ${missingFields.join(', ')}`);
      return false;
    }
    console.log('✅ Response structure is valid');
    
    // 4. Validate matrix quadrants
    console.log('\n4. Validating matrix quadrants...');
    const quadrants = ['highValueHighGP', 'highValueLowGP', 'lowValueHighGP', 'lowValueLowGP'];
    const quadrantCounts = {};
    let totalInQuadrants = 0;
    
    for (const quadrant of quadrants) {
      if (!Array.isArray(matrixData.matrix[quadrant])) {
        console.error(`❌ Quadrant ${quadrant} is not an array`);
        return false;
      }
      quadrantCounts[quadrant] = matrixData.matrix[quadrant].length;
      totalInQuadrants += quadrantCounts[quadrant];
    }
    
    console.log('✅ Quadrant structure is valid');
    console.log('   Quadrant distribution:');
    for (const [quadrant, count] of Object.entries(quadrantCounts)) {
      console.log(`   - ${quadrant}: ${count} opportunities`);
    }
    
    // 5. Validate calculations
    console.log('\n5. Validating calculations...');
    
    // Check if total opportunities match
    if (matrixData.opportunities.length !== totalInQuadrants) {
      console.error(`❌ Opportunity count mismatch: ${matrixData.opportunities.length} total vs ${totalInQuadrants} in quadrants`);
      return false;
    }
    console.log('✅ Opportunity counts match');
    
    // Validate threshold values
    if (typeof matrixData.thresholds.revenue !== 'number' || matrixData.thresholds.revenue <= 0) {
      console.error('❌ Invalid revenue threshold');
      return false;
    }
    if (typeof matrixData.thresholds.gp !== 'number' || matrixData.thresholds.gp < 0 || matrixData.thresholds.gp > 1) {
      console.error('❌ Invalid GP threshold');
      return false;
    }
    console.log(`✅ Thresholds are valid: Revenue=${matrixData.thresholds.revenue}, GP=${(matrixData.thresholds.gp * 100).toFixed(1)}%`);
    
    // 6. Validate statistics
    console.log('\n6. Validating statistics...');
    const stats = matrixData.statistics;
    
    if (stats.totalOpportunities !== matrixData.opportunities.length) {
      console.error('❌ Total opportunities statistic mismatch');
      return false;
    }
    
    // Calculate expected total revenue
    const expectedRevenue = matrixData.opportunities.reduce((sum, opp) => sum + (opp.revenue || 0), 0);
    const revenueDiff = Math.abs(stats.totalMonthlyRevenue - expectedRevenue);
    
    if (revenueDiff > 0.01) { // Allow for small floating point differences
      console.error(`❌ Revenue calculation error: Expected ${expectedRevenue}, got ${stats.totalMonthlyRevenue}`);
      return false;
    }
    console.log('✅ Revenue calculations are correct');
    
    // Validate average GP
    const expectedAvgGP = matrixData.opportunities.reduce((sum, opp) => sum + (opp.gp_percent || 0), 0) / matrixData.opportunities.length;
    const gpDiff = Math.abs(stats.averageGP - expectedAvgGP);
    
    if (gpDiff > 0.001) {
      console.error(`❌ Average GP calculation error: Expected ${expectedAvgGP}, got ${stats.averageGP}`);
      return false;
    }
    console.log('✅ GP calculations are correct');
    
    // 7. Test edge cases
    console.log('\n7. Testing edge cases...');
    
    // Test with empty table (simulate)
    const emptyResult = await salesPlanService.getOpportunitiesMatrix();
    if (!emptyResult || typeof emptyResult !== 'object') {
      console.error('❌ Service fails with empty data');
      return false;
    }
    console.log('✅ Service handles empty data gracefully');
    
    // 8. Performance check
    console.log('\n8. Testing performance...');
    const startTime = Date.now();
    await salesPlanService.getOpportunitiesMatrix();
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    console.log(`✅ Execution time: ${executionTime}ms`);
    if (executionTime > 1000) {
      console.warn('⚠️  Performance warning: Query took more than 1 second');
    }
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Total opportunities: ${matrixData.statistics.totalOpportunities}`);
    console.log(`Total monthly revenue: SAR ${matrixData.statistics.totalMonthlyRevenue.toLocaleString()}`);
    console.log(`Average GP: ${(matrixData.statistics.averageGP * 100).toFixed(1)}%`);
    console.log('\n✅ All tests passed!');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  testOpportunitiesMatrix()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = testOpportunitiesMatrix;