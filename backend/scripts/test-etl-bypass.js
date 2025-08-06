const etlService = require('../services/etl.service');

async function testETLBypass() {
  console.log('🚀 Testing ETL with validation bypass\n');
  
  const filePath = '/Users/haithamdata/Downloads/Pro rev.xlsx';
  
  try {
    // Process with validation skip to see if data gets inserted
    console.log('📋 Processing with skipValidation flag...\n');
    
    const userDecisions = {
      skipValidation: true
    };
    
    const results = await etlService.processExcelFile(filePath, userDecisions);
    
    console.log('Results:', JSON.stringify(results, null, 2));
    
    if (results.revenueData) {
      console.log('\n✅ Revenue data processed:');
      console.log(`  Total records: ${results.revenueData.totalRecords}`);
      console.log(`  Inserted: ${results.revenueData.inserted}`);
      console.log(`  Updated: ${results.revenueData.updated}`);
      console.log(`  Errors: ${results.revenueData.errors}`);
      console.log(`  Corrected: ${results.revenueData.corrected}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testETLBypass();