const daysValidation = require('../services/daysValidation.service');

async function testValidationCorrect() {
  console.log('🔧 Testing Days Validation Service with Correct Input\n');
  
  // Test cases from your Excel file
  const testCases = [
    { year: 2025, month: 'Jan', days: 1, description: 'January with 1 day (edge case)' },
    { year: 2025, month: 'Jan', days: 31, description: 'January with 31 days (correct)' },
    { year: 2025, month: 'Feb', days: 30, description: 'February with 30 days (should be 28)' },
    { year: 2025, month: 'Aug', days: 30, description: 'August (current month)' },
    { year: 2025, month: 'Sep', days: 30, description: 'September (future month)' },
    { year: 2025, month: 'Dec', days: 30, description: 'December (future month)' }
  ];
  
  console.log('Current date context:', new Date().toDateString());
  console.log('');
  
  for (const testCase of testCases) {
    console.log(`📊 Testing: ${testCase.description}`);
    console.log(`   Input: ${testCase.month} ${testCase.year}, Days=${testCase.days}`);
    
    // Convert month name to number
    const monthNumber = daysValidation.getMonthNumber(testCase.month);
    
    // Run validation
    const validation = daysValidation.validateDays(
      testCase.year,
      monthNumber,
      testCase.days
    );
    
    console.log(`   Month number: ${monthNumber}`);
    console.log(`   Calendar days: ${daysValidation.getCalendarDays(testCase.year, monthNumber)}`);
    console.log(`   Valid: ${validation.isValid ? '✅' : '❌'}`);
    console.log(`   Type: ${validation.validationType}`);
    
    if (!validation.isValid || validation.requiresConfirmation) {
      console.log(`   Action: ${validation.requiresConfirmation ? 'Requires confirmation' : 'Auto-correct'}`);
      console.log(`   Message: ${validation.message}`);
      if (validation.correctedDays !== testCase.days) {
        console.log(`   Corrected to: ${validation.correctedDays} days`);
      }
      if (validation.suggestedDays) {
        console.log(`   Suggested: ${validation.suggestedDays} days`);
      }
    }
    console.log('');
  }
  
  // Test dataset validation
  console.log('📋 Testing Dataset Validation:\n');
  
  const dataset = [
    { customer: 'ARAC Healthcare', year: 2025, month: 'Jan', days: 1, revenue: 69537, target: 100000 },
    { customer: 'AVALON', year: 2025, month: 'Jan', days: 1, revenue: 282044, target: 80250 },
    { customer: 'VAS', year: 2025, month: 'Jan', days: 31, revenue: 322662, target: 540000 },
    { customer: 'NUPCO', year: 2025, month: 'Feb', days: 30, revenue: 485000, target: 485000 }
  ];
  
  const results = await daysValidation.validateDataset(dataset);
  
  console.log('Validation Summary:');
  console.log(`   Total records: ${results.summary.total}`);
  console.log(`   Valid: ${results.summary.valid}`);
  console.log(`   Errors (auto-correct): ${results.summary.errors}`);
  console.log(`   Warnings: ${results.summary.warnings}`);
  console.log(`   Confirmation needed: ${results.summary.confirmationNeeded}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Records with errors (will auto-correct):');
    results.errors.forEach(record => {
      console.log(`   ${record.customer} - ${record.month}/${record.year}:`);
      console.log(`      Current: ${record.days} days → Correct: ${record.validation.correctedDays} days`);
      console.log(`      ${record.validation.message}`);
    });
  }
  
  if (results.requiresConfirmation.length > 0) {
    console.log('\n⚠️  Records requiring confirmation:');
    results.requiresConfirmation.forEach(record => {
      console.log(`   ${record.customer} - ${record.month}/${record.year}:`);
      console.log(`      ${record.validation.message}`);
    });
  }
  
  console.log('\n✅ Validation test completed!');
}

// Run test
testValidationCorrect();