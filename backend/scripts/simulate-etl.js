const xlsx = require('xlsx');
const path = require('path');
const etlService = require('../services/etl.service');
const daysValidation = require('../services/daysValidation.service');

async function simulateETL() {
  console.log('🚀 Starting ETL Simulation for Pro rev.xlsx\n');
  
  const filePath = '/Users/haithamdata/Downloads/Pro rev.xlsx';
  
  try {
    // Step 1: Read Excel file
    console.log('📖 Step 1: Reading Excel file...');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    
    console.log(`   ✅ Found ${jsonData.length} rows in sheet: ${sheetName}`);
    
    // Display first few rows for verification
    console.log('\n📊 Sample data (first 3 rows):');
    jsonData.slice(0, 3).forEach((row, idx) => {
      console.log(`   Row ${idx + 1}:`, {
        Customer: row.Customer || row.customer,
        Year: row.Year || row.year,
        Month: row.Month || row.month,
        Days: row.Days || row.days || row['Days '],
        Revenue: row.Revenue || row.revenue,
        Target: row.Target || row.target,
        Cost: row.Cost || row.cost
      });
    });
    
    // Step 2: Analyze month/year combinations for validation
    console.log('\n📅 Step 2: Analyzing time periods in the file...');
    const periods = new Map();
    
    jsonData.forEach(row => {
      const year = row.Year || row.year;
      const month = row.Month || row.month;
      const days = row.Days || row.days || row['Days '];
      
      if (year && month) {
        const key = `${month}-${year}`;
        if (!periods.has(key)) {
          periods.set(key, {
            year,
            month,
            days: new Set(),
            count: 0
          });
        }
        periods.get(key).days.add(days);
        periods.get(key).count++;
      }
    });
    
    console.log('\n   Time periods found:');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'short' });
    
    for (const [key, data] of periods) {
      const daysArray = Array.from(data.days);
      console.log(`   ${key}: ${data.count} records, Days values: ${daysArray.join(', ')}`);
      
      // Determine period type
      if (data.year < currentYear || (data.year === currentYear && getMonthNumber(data.month) < getMonthNumber(currentMonth))) {
        console.log(`      → Past month (will auto-correct to calendar days)`);
      } else if (data.year === currentYear && data.month === currentMonth) {
        console.log(`      → Current month (must match elapsed business days)`);
      } else {
        console.log(`      → Future month (simulation/forecast)`);
      }
    }
    
    // Step 3: Run validation simulation
    console.log('\n🔍 Step 3: Running days validation...');
    const validationResults = [];
    
    for (const [key, data] of periods) {
      const daysValue = Array.from(data.days)[0]; // Get first days value for this period
      const validation = await daysValidation.validateDays(
        data.year,
        data.month,
        daysValue
      );
      
      validationResults.push({
        period: key,
        ...validation
      });
      
      console.log(`\n   ${key}:`);
      console.log(`      Provided days: ${daysValue}`);
      console.log(`      Calendar days: ${validation.calendarDays}`);
      console.log(`      Valid: ${validation.isValid ? '✅' : '❌'}`);
      if (!validation.isValid) {
        console.log(`      Action: ${validation.requiresConfirmation ? 'Requires user confirmation' : 'Auto-correct'}`);
        console.log(`      Message: ${validation.message}`);
        if (validation.correctedDays) {
          console.log(`      Will be corrected to: ${validation.correctedDays}`);
        }
      }
    }
    
    // Step 4: Simulate ETL processing
    console.log('\n⚙️  Step 4: Simulating ETL processing...');
    
    // First run without user decisions to see what validations are needed
    const initialResults = await etlService.processExcelFile(filePath);
    
    if (initialResults.validationRequired) {
      console.log('\n⚠️  Validation Required:');
      console.log(`   Auto-corrections: ${initialResults.validationResults.summary.autoCorrections}`);
      console.log(`   Warnings: ${initialResults.validationResults.summary.warnings}`);
      console.log(`   Confirmations needed: ${initialResults.validationResults.summary.confirmationNeeded}`);
      
      if (initialResults.validationResults.summary.confirmationNeeded > 0) {
        console.log('\n   Records requiring confirmation:');
        initialResults.validationResults.confirmations.forEach(conf => {
          console.log(`      ${conf.month}/${conf.year}: ${conf.message}`);
        });
      }
      
      // Simulate user accepting all validations
      console.log('\n✅ Simulating user accepting all validations...');
      const userDecisions = {
        skipValidation: false,
        acceptAll: true,
        decisions: {}
      };
      
      // Create decisions for each confirmation
      initialResults.validationResults.confirmations.forEach(conf => {
        userDecisions.decisions[conf.recordId] = {
          action: 'accept',
          value: conf.suggestedDays || conf.providedDays
        };
      });
      
      // Process with decisions
      const finalResults = await etlService.processExcelFile(filePath, userDecisions);
      
      console.log('\n📊 Final ETL Results:');
      console.log(`   Total records: ${finalResults.totalRecords}`);
      console.log(`   Inserted: ${finalResults.inserted}`);
      console.log(`   Updated: ${finalResults.updated}`);
      console.log(`   Errors: ${finalResults.errors}`);
      
      if (finalResults.summary) {
        console.log('\n   Summary by customer:');
        Object.entries(finalResults.summary).forEach(([customer, data]) => {
          console.log(`      ${customer}: ${data.records} records`);
        });
      }
    } else {
      // No validation required, process completed
      console.log('\n✅ ETL completed without validation issues:');
      console.log(`   Total records: ${initialResults.totalRecords}`);
      console.log(`   Inserted: ${initialResults.inserted}`);
      console.log(`   Updated: ${initialResults.updated}`);
      console.log(`   Errors: ${initialResults.errors}`);
    }
    
    // Step 5: Show sample of how data would be stored
    console.log('\n💾 Step 5: Sample of processed data structure:');
    const sampleRow = jsonData[0];
    const processedSample = {
      customer: sampleRow.Customer || sampleRow.customer,
      service_type: sampleRow['Service type'] || sampleRow.service_type || 'General',
      business_unit: sampleRow['Business Unit'] || sampleRow.business_unit || sampleRow.Customer,
      year: sampleRow.Year || sampleRow.year,
      month: sampleRow.Month || sampleRow.month,
      days: 31, // Example after validation correction
      calendar_days: 31,
      revenue: parseFloat(sampleRow.Revenue || sampleRow.revenue || 0),
      target: parseFloat(sampleRow.Target || sampleRow.target || 0),
      original_cost: parseFloat(sampleRow.Cost || sampleRow.cost || 0),
      cost: 'Pro-rated if current month, else same as original_cost',
      original_target: parseFloat(sampleRow.Target || sampleRow.target || 0),
      analysis_date: new Date().toISOString()
    };
    
    console.log('\n   Sample processed record:');
    console.log(JSON.stringify(processedSample, null, 2));
    
  } catch (error) {
    console.error('\n❌ ETL Simulation Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

function getMonthNumber(monthName) {
  const months = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
    'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
    'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };
  return months[monthName] || 0;
}

// Run simulation
console.log('ETL Simulation Script - Pro rev.xlsx');
console.log('=====================================\n');
simulateETL();