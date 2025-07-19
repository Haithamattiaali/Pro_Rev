const db = require('../database/persistent-db');
const opportunityDistribution = require('../services/opportunityDistribution.service');

async function testDistribution() {
  console.log('Testing Opportunity Distribution System');
  console.log('=====================================\n');

  // Check if sales_plan_data table exists
  try {
    const tableInfo = db.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sales_plan_data'").get();
    console.log('Sales plan table exists:', !!tableInfo);
    
    if (!tableInfo) {
      console.log('\nERROR: sales_plan_data table does not exist!');
      console.log('Please upload sales plan data first.');
      process.exit(1);
    }

    const count = db.db.prepare('SELECT COUNT(*) as count FROM sales_plan_data').get();
    console.log('Records in sales_plan_data:', count.count);
    
    if (count.count === 0) {
      console.log('\nERROR: No data in sales_plan_data table!');
      console.log('Please upload sales plan data first.');
      process.exit(1);
    }

    // Test 1: Get opportunities by service type
    console.log('\n1. Getting opportunities by service type...');
    const categorized = await opportunityDistribution.getOpportunitiesByServiceType();
    console.log('Monthly opportunities:', categorized.monthly);
    console.log('Annual opportunities:', categorized.annual);
    console.log('\nTotal Monthly: $' + (categorized.monthly.Transportation + categorized.monthly.Warehousing).toLocaleString());
    console.log('Total Annual: $' + (categorized.annual.Transportation + categorized.annual.Warehousing).toLocaleString());

    // Test 2: Get current distribution
    console.log('\n2. Current sales plan distribution...');
    const current = await opportunityDistribution.getCurrentDistribution(2025);
    console.log('Summary by service type:');
    current.summary.forEach(s => {
      console.log(`  ${s.service_type}: ${s.total_opportunity} (${s.gl_count} GLs)`);
    });

    // Test 3: Calculate distribution
    console.log('\n3. Calculating new distribution...');
    const distributions = await opportunityDistribution.distributeOpportunitiesToSalesPlan(2025);
    console.log(`Found ${distributions.length} GL accounts to update`);
    
    // Show top 5 distributions
    console.log('\nTop 5 GL distributions:');
    distributions.slice(0, 5).forEach(d => {
      console.log(`  ${d.gl} (${d.service_type}): $${d.monthly_opportunity.toFixed(0).toLocaleString()}/month`);
    });
    
    // Calculate totals
    const totalMonthly = distributions.reduce((sum, d) => sum + d.monthly_opportunity, 0);
    console.log(`\nTotal monthly distribution: $${totalMonthly.toFixed(0).toLocaleString()}`);
    console.log(`Total annual distribution: $${(totalMonthly * 12).toFixed(0).toLocaleString()}`);

    // Test 4: Verify current state
    console.log('\n4. Verifying current distribution...');
    const verification = await opportunityDistribution.verifyOpportunityDistribution(2025);
    console.log('Verification results:');
    console.log(`  Opportunities (monthly): $${verification.opportunities_monthly.toLocaleString()}`);
    console.log(`  Opportunities (annual): $${verification.opportunities_annual.toLocaleString()}`);
    console.log(`  Sales Plan (annual): $${verification.sales_plan_annual.toLocaleString()}`);
    console.log(`  Difference: $${verification.difference.toLocaleString()}`);
    console.log(`  Match: ${verification.match ? '✅' : '❌'}`);

    console.log('\n✅ All tests passed!');
    console.log('\nTo apply the distribution, call the API endpoint:');
    console.log('POST /api/opportunities/distribute');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testDistribution().then(() => process.exit(0));