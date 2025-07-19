const xlsx = require('xlsx');
const fs = require('fs');

// Read the downloaded template
const buffer = fs.readFileSync('/tmp/test-template.xlsx');
const workbook = xlsx.read(buffer, { type: 'buffer' });

console.log('Excel Template Verification');
console.log('==========================\n');

// Check sheets
console.log('Sheets in workbook:');
workbook.SheetNames.forEach(name => console.log(`  - ${name}`));

// Check Opportunities sheet
if (workbook.SheetNames.includes('Opportunities')) {
  console.log('\nOpportunities Sheet Analysis:');
  const sheet = workbook.Sheets['Opportunities'];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  console.log(`  Total rows: ${data.length}`);
  
  if (data.length > 0) {
    console.log('\n  Column headers:');
    Object.keys(data[0]).forEach(col => console.log(`    - ${col}`));
    
    console.log('\n  First 3 rows:');
    data.slice(0, 3).forEach((row, i) => {
      console.log(`\n  Row ${i + 1}:`);
      console.log(`    Project: ${row['Project']}`);
      console.log(`    Service: ${row['Service']}`);
      console.log(`    Status: ${row['Status']}`);
      console.log(`    Monthly Revenue: ${row['Est. Monthly Revenue']}`);
      console.log(`    GP%: ${row['Est. GP%']}%`);
    });
  }
} else {
  console.log('\n❌ Opportunities sheet not found!');
}

// Check Revenue Data sheet
if (workbook.SheetNames.includes('Revenue Data')) {
  const sheet = workbook.Sheets['Revenue Data'];
  const data = xlsx.utils.sheet_to_json(sheet);
  console.log(`\nRevenue Data sheet: ${data.length} rows`);
}

// Check Sales Plan sheet
if (workbook.SheetNames.includes('Sales Plan')) {
  const sheet = workbook.Sheets['Sales Plan'];
  const data = xlsx.utils.sheet_to_json(sheet);
  console.log(`Sales Plan sheet: ${data.length} rows`);
  
  // Check if opportunities are distributed
  if (data.length > 0) {
    const withOpportunities = data.filter(row => row.opportunity_value > 0);
    console.log(`  Rows with opportunity values: ${withOpportunities.length}`);
    
    // Calculate totals
    const totalOpportunity = data.reduce((sum, row) => sum + (row.opportunity_value || 0), 0);
    console.log(`  Total opportunity value: $${totalOpportunity.toLocaleString()}`);
  }
}