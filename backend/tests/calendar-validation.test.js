const Database = require('better-sqlite3');
const path = require('path');

// Helper function to determine if a year is a leap year
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// JavaScript implementation of days in month
function getDaysInMonthJS(year, month) {
  return new Date(year, month, 0).getDate();
}

// SQL implementation that matches our database logic
function getDaysInMonthSQL(db, year, month) {
  const query = `
    SELECT 
      CASE 
        WHEN ? IN (1, 3, 5, 7, 8, 10, 12) THEN 31
        WHEN ? IN (4, 6, 9, 11) THEN 30
        WHEN ? = 2 AND (? % 4 = 0 AND (? % 100 != 0 OR ? % 400 = 0)) THEN 29
        ELSE 28
      END as days
  `;
  
  const result = db.prepare(query).get(month, month, month, year, year, year);
  return result.days;
}

// Test data for comprehensive validation
const testCases = [
  // Regular year (2023)
  { year: 2023, month: 1, expectedDays: 31, description: 'January 2023' },
  { year: 2023, month: 2, expectedDays: 28, description: 'February 2023 (non-leap)' },
  { year: 2023, month: 3, expectedDays: 31, description: 'March 2023' },
  { year: 2023, month: 4, expectedDays: 30, description: 'April 2023' },
  { year: 2023, month: 5, expectedDays: 31, description: 'May 2023' },
  { year: 2023, month: 6, expectedDays: 30, description: 'June 2023' },
  { year: 2023, month: 7, expectedDays: 31, description: 'July 2023' },
  { year: 2023, month: 8, expectedDays: 31, description: 'August 2023' },
  { year: 2023, month: 9, expectedDays: 30, description: 'September 2023' },
  { year: 2023, month: 10, expectedDays: 31, description: 'October 2023' },
  { year: 2023, month: 11, expectedDays: 30, description: 'November 2023' },
  { year: 2023, month: 12, expectedDays: 31, description: 'December 2023' },
  
  // Leap year (2024)
  { year: 2024, month: 1, expectedDays: 31, description: 'January 2024' },
  { year: 2024, month: 2, expectedDays: 29, description: 'February 2024 (leap)' },
  { year: 2024, month: 3, expectedDays: 31, description: 'March 2024' },
  { year: 2024, month: 4, expectedDays: 30, description: 'April 2024' },
  { year: 2024, month: 5, expectedDays: 31, description: 'May 2024' },
  { year: 2024, month: 6, expectedDays: 30, description: 'June 2024' },
  { year: 2024, month: 7, expectedDays: 31, description: 'July 2024' },
  { year: 2024, month: 8, expectedDays: 31, description: 'August 2024' },
  { year: 2024, month: 9, expectedDays: 30, description: 'September 2024' },
  { year: 2024, month: 10, expectedDays: 31, description: 'October 2024' },
  { year: 2024, month: 11, expectedDays: 30, description: 'November 2024' },
  { year: 2024, month: 12, expectedDays: 31, description: 'December 2024' },
  
  // Edge cases
  { year: 2000, month: 2, expectedDays: 29, description: 'February 2000 (divisible by 400 - leap)' },
  { year: 1900, month: 2, expectedDays: 28, description: 'February 1900 (divisible by 100 but not 400 - not leap)' },
  { year: 2100, month: 2, expectedDays: 28, description: 'February 2100 (divisible by 100 but not 400 - not leap)' },
  { year: 2400, month: 2, expectedDays: 29, description: 'February 2400 (divisible by 400 - leap)' },
];

// Additional edge cases for thoroughness
const additionalTests = [
  // Test multiple leap years
  { year: 2020, month: 2, expectedDays: 29, description: 'February 2020 (leap)' },
  { year: 2016, month: 2, expectedDays: 29, description: 'February 2016 (leap)' },
  { year: 2012, month: 2, expectedDays: 29, description: 'February 2012 (leap)' },
  { year: 2008, month: 2, expectedDays: 29, description: 'February 2008 (leap)' },
  { year: 2004, month: 2, expectedDays: 29, description: 'February 2004 (leap)' },
  
  // Test non-leap years
  { year: 2021, month: 2, expectedDays: 28, description: 'February 2021 (non-leap)' },
  { year: 2022, month: 2, expectedDays: 28, description: 'February 2022 (non-leap)' },
  { year: 2025, month: 2, expectedDays: 28, description: 'February 2025 (non-leap)' },
  
  // Test century years
  { year: 1800, month: 2, expectedDays: 28, description: 'February 1800 (century non-leap)' },
  { year: 1600, month: 2, expectedDays: 29, description: 'February 1600 (century leap)' },
];

// Main validation function
function validateCalendarDays() {
  console.log('=== Calendar Days Validation Test ===\n');
  
  // Create in-memory database for testing
  const db = new Database(':memory:');
  
  let allTestsPassed = true;
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  // Run all test cases
  const allTests = [...testCases, ...additionalTests];
  
  console.log(`Running ${allTests.length} test cases...\n`);
  
  allTests.forEach(test => {
    try {
      const jsResult = getDaysInMonthJS(test.year, test.month);
      const sqlResult = getDaysInMonthSQL(db, test.year, test.month);
      
      const jsPass = jsResult === test.expectedDays;
      const sqlPass = sqlResult === test.expectedDays;
      const bothMatch = jsResult === sqlResult;
      
      if (jsPass && sqlPass && bothMatch) {
        results.passed++;
        console.log(`✓ ${test.description}: ${test.expectedDays} days (JS: ${jsResult}, SQL: ${sqlResult})`);
      } else {
        results.failed++;
        allTestsPassed = false;
        const error = `✗ ${test.description}: Expected ${test.expectedDays}, got JS: ${jsResult}, SQL: ${sqlResult}`;
        console.log(error);
        results.errors.push(error);
      }
    } catch (error) {
      results.failed++;
      allTestsPassed = false;
      const errorMsg = `✗ ${test.description}: Error - ${error.message}`;
      console.log(errorMsg);
      results.errors.push(errorMsg);
    }
  });
  
  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${allTests.length}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  
  // Leap year validation
  console.log('\n=== Leap Year Validation ===');
  const leapYearTests = [
    { year: 2000, expected: true },
    { year: 1900, expected: false },
    { year: 2100, expected: false },
    { year: 2400, expected: true },
    { year: 2024, expected: true },
    { year: 2023, expected: false },
  ];
  
  leapYearTests.forEach(test => {
    const result = isLeapYear(test.year);
    const status = result === test.expected ? '✓' : '✗';
    console.log(`${status} ${test.year}: ${result ? 'Leap' : 'Not leap'} (expected: ${test.expected ? 'Leap' : 'Not leap'})`);
  });
  
  // Pro-rating calculation validation
  console.log('\n=== Pro-rating Calculation Validation ===');
  validateProRatingCalculations(db);
  
  db.close();
  
  return allTestsPassed;
}

// Validate pro-rating calculations
function validateProRatingCalculations(db) {
  const testScenarios = [
    { year: 2025, month: 1, day: 15, value: 1000, description: 'Mid-January 2025' },
    { year: 2025, month: 2, day: 14, value: 1000, description: 'Mid-February 2025' },
    { year: 2024, month: 2, day: 15, value: 1000, description: 'Mid-February 2024 (leap)' },
    { year: 2025, month: 12, day: 31, value: 1000, description: 'End of December 2025' },
    { year: 2025, month: 1, day: 1, value: 1000, description: 'First day of January 2025' },
  ];
  
  testScenarios.forEach(scenario => {
    const daysInMonth = getDaysInMonthJS(scenario.year, scenario.month);
    const proRatedValue = (scenario.value * scenario.day) / daysInMonth;
    const expectedProRated = Math.round(proRatedValue * 100) / 100;
    
    console.log(`${scenario.description}:`);
    console.log(`  Original: ${scenario.value}, Days: ${scenario.day}/${daysInMonth}, Pro-rated: ${expectedProRated.toFixed(2)}`);
    
    // Validate SQL calculation
    const sqlQuery = `
      SELECT 
        ROUND(CAST(? AS REAL) * ? / 
          CASE 
            WHEN ? IN (1, 3, 5, 7, 8, 10, 12) THEN 31
            WHEN ? IN (4, 6, 9, 11) THEN 30
            WHEN ? = 2 AND (? % 4 = 0 AND (? % 100 != 0 OR ? % 400 = 0)) THEN 29
            ELSE 28
          END, 2) as pro_rated
    `;
    
    const sqlResult = db.prepare(sqlQuery).get(
      scenario.value, scenario.day,
      scenario.month, scenario.month, scenario.month,
      scenario.year, scenario.year, scenario.year
    );
    
    const sqlMatches = Math.abs(sqlResult.pro_rated - expectedProRated) < 0.01;
    console.log(`  SQL Result: ${sqlResult.pro_rated.toFixed(2)} ${sqlMatches ? '✓' : '✗'}`);
  });
}

// Export for use in other tests or scripts
module.exports = {
  validateCalendarDays,
  isLeapYear,
  getDaysInMonthJS,
  getDaysInMonthSQL
};

// Run validation if this file is executed directly
if (require.main === module) {
  const allPassed = validateCalendarDays();
  process.exit(allPassed ? 0 : 1);
}