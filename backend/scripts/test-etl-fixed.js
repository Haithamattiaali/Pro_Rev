const etlService = require('../services/etl.service');

async function testETLFixed() {
  console.log('🚀 Testing Fixed ETL Service with Pro rev.xlsx\n');
  
  const filePath = '/Users/haithamdata/Downloads/Pro rev.xlsx';
  
  try {
    // Test without user decisions (should trigger validation)
    console.log('📋 Step 1: Processing file to check validation...\n');
    const results = await etlService.processExcelFile(filePath);
    
    if (results.validationRequired) {
      console.log('✅ Validation triggered as expected!\n');
      console.log('Validation Summary:');
      console.log(`  Auto-corrections needed: ${results.validationResults.summary.errors}`);
      console.log(`  Confirmations needed: ${results.validationResults.summary.confirmationNeeded}`);
      console.log(`  Valid records: ${results.validationResults.summary.valid}`);
      
      if (results.validationResults.errors.length > 0) {
        console.log('\n❌ Records requiring auto-correction:');
        results.validationResults.errors.slice(0, 5).forEach(err => {
          console.log(`  ${err.customer} - ${err.month} ${err.year}: Days ${err.days} → ${err.validation.correctedDays}`);
        });
        if (results.validationResults.errors.length > 5) {
          console.log(`  ... and ${results.validationResults.errors.length - 5} more`);
        }
      }
      
      // Simulate accepting all validations
      console.log('\n📋 Step 2: Processing with auto-corrections accepted...\n');
      const userDecisions = {
        skipValidation: false,
        acceptAll: true,
        decisions: {}
      };
      
      // Process with decisions
      const finalResults = await etlService.processExcelFile(filePath, userDecisions);
      
      if (finalResults.revenueData) {
        console.log('✅ ETL completed successfully!\n');
        console.log('Final Results:');
        console.log(`  Total records: ${finalResults.revenueData.totalRecords}`);
        console.log(`  Inserted: ${finalResults.revenueData.inserted}`);
        console.log(`  Updated: ${finalResults.revenueData.updated}`);
        console.log(`  Errors: ${finalResults.revenueData.errors}`);
        console.log(`  Auto-corrected: ${finalResults.revenueData.corrected}`);
        
        if (finalResults.revenueData.validationSummary) {
          console.log('\nValidation Summary:');
          console.log(`  Auto-corrections applied: ${finalResults.revenueData.validationSummary.autoCorrections}`);
          console.log(`  Confirmations processed: ${finalResults.revenueData.validationSummary.confirmations}`);
          console.log(`  Valid records: ${finalResults.revenueData.validationSummary.validRecords}`);
        }
      }
    } else {
      console.log('⚠️  No validation required - processing directly');
      if (results.revenueData) {
        console.log('\nResults:');
        console.log(`  Total records: ${results.revenueData.totalRecords}`);
        console.log(`  Inserted: ${results.revenueData.inserted}`);
        console.log(`  Updated: ${results.revenueData.updated}`);
        console.log(`  Errors: ${results.revenueData.errors}`);
      }
    }
    
    console.log('\n✅ ETL test completed!');
    
  } catch (error) {
    console.error('\n❌ ETL test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testETLFixed();