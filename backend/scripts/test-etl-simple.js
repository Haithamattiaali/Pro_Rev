const xlsx = require('xlsx');
const daysValidation = require('../services/daysValidation.service');

async function testETLSimple() {
  console.log('📋 Simple ETL Test for Pro rev.xlsx\n');
  
  const filePath = '/Users/haithamdata/Downloads/Pro rev.xlsx';
  
  try {
    // Step 1: Read Excel file
    console.log('📖 Reading Excel file...');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    
    console.log(`✅ Found ${jsonData.length} rows in "${sheetName}"\n`);
    
    // Step 2: Analyze the data structure
    console.log('🔍 Data Structure Analysis:');
    const columns = Object.keys(jsonData[0] || {});
    console.log('Columns found:', columns.join(', '));
    
    // Step 3: Check for the critical issue - January days
    console.log('\n⚠️  Checking for the edge case (January with days=1):');
    
    const januaryRecords = jsonData.filter(row => 
      row.Month === 'Jan' && row.Year === 2025
    );
    
    console.log(`\nFound ${januaryRecords.length} January 2025 records`);
    
    // Group by days value to see the issue
    const dayGroups = {};
    januaryRecords.forEach(row => {
      const days = row.Days || row['Days '] || 'undefined';
      if (!dayGroups[days]) dayGroups[days] = [];
      dayGroups[days].push(row.Customer || row.customer);
    });
    
    console.log('\nJanuary records grouped by days value:');
    Object.entries(dayGroups).forEach(([days, customers]) => {
      console.log(`   Days=${days}: ${customers.length} records`);
      console.log(`      Customers: ${customers.slice(0, 3).join(', ')}${customers.length > 3 ? '...' : ''}`);
    });
    
    // Step 4: Test validation for each unique month/year/days combination
    console.log('\n🔧 Testing Days Validation:');
    
    // Get unique periods
    const periods = new Map();
    jsonData.forEach(row => {
      const key = `${row.Month}-${row.Year}`;
      if (!periods.has(key)) {
        periods.set(key, {
          month: row.Month,
          year: row.Year,
          daysValues: new Set()
        });
      }
      periods.get(key).daysValues.add(row.Days || row['Days '] || 30);
    });
    
    // Current date for validation context
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'short' });
    
    console.log(`\nCurrent date context: ${currentMonth} ${currentYear}`);
    console.log('Validation results by period:\n');
    
    for (const [key, data] of periods) {
      const daysArray = Array.from(data.daysValues);
      console.log(`${key}:`);
      
      for (const days of daysArray) {
        const validation = await daysValidation.validateDays(
          data.year,
          data.month,
          days
        );
        
        // Determine period type
        let periodType = 'Unknown';
        if (data.year < currentYear || 
            (data.year === currentYear && getMonthNumber(data.month) < getMonthNumber(currentMonth))) {
          periodType = 'Past';
        } else if (data.year === currentYear && data.month === currentMonth) {
          periodType = 'Current';
        } else {
          periodType = 'Future';
        }
        
        console.log(`   Days=${days} (${periodType} month)`);
        console.log(`      Calendar days: ${validation.calendarDays || 'N/A'}`);
        console.log(`      Valid: ${validation.isValid ? '✅' : '❌'}`);
        
        if (!validation.isValid) {
          console.log(`      Action: ${validation.requiresConfirmation ? 'User confirmation required' : 'Auto-correct'}`);
          console.log(`      Message: ${validation.message || 'No message'}`);
          if (validation.correctedDays) {
            console.log(`      Will correct to: ${validation.correctedDays} days`);
          }
        }
      }
      console.log('');
    }
    
    // Step 5: Show impact of validation
    console.log('📊 Impact Analysis:\n');
    
    // Calculate impact for January with days=1
    const janRecord = januaryRecords.find(r => (r.Days || r['Days ']) === 1);
    if (janRecord) {
      console.log('Example: January record with days=1');
      console.log(`   Customer: ${janRecord.Customer}`);
      console.log(`   Revenue: ${janRecord.Revenue}`);
      console.log(`   Target: ${janRecord.Target}`);
      console.log(`   Days: ${janRecord.Days || janRecord['Days ']}`);
      
      // Calculate with wrong days
      const monthlyAchievement = (janRecord.Revenue / janRecord.Target) * 100;
      const dailyTarget = janRecord.Target / 31; // January has 31 days
      const periodTargetWrong = dailyTarget * 1; // Using wrong days=1
      const dailyAchievementWrong = (janRecord.Revenue / periodTargetWrong) * 100;
      
      // Calculate with correct days
      const periodTargetCorrect = dailyTarget * 31; // Using correct days=31
      const dailyAchievementCorrect = (janRecord.Revenue / periodTargetCorrect) * 100;
      
      console.log('\n   Calculation comparison:');
      console.log(`   Monthly Achievement: ${monthlyAchievement.toFixed(2)}%`);
      console.log(`   Daily Achievement (days=1): ${dailyAchievementWrong.toFixed(2)}% ❌ MISLEADING!`);
      console.log(`   Daily Achievement (days=31): ${dailyAchievementCorrect.toFixed(2)}% ✅ CORRECT`);
    }
    
    // Step 6: Summary
    console.log('\n📋 Summary:');
    console.log(`   Total records: ${jsonData.length}`);
    console.log(`   Unique periods: ${periods.size}`);
    console.log(`   Records with days=1 in January: ${dayGroups['1'] ? dayGroups['1'].length : 0}`);
    console.log(`   Records with days=31 in January: ${dayGroups['31'] ? dayGroups['31'].length : 0}`);
    
    console.log('\n✅ ETL validation test completed!');
    console.log('\n⚠️  Key Finding: The file contains January records with days=1 which would');
    console.log('   cause misleading daily achievement calculations if not corrected.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
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

// Run test
testETLSimple();