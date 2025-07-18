const excelExport = require('../services/excel-export.service');
const fs = require('fs');
const path = require('path');

// Example data with days column positioned after month
const monthlyTrendsData = [
  { name: 'Jan', days: 31, revenue: 1000000, target: 1200000, achievement: 83.3, cost: 800000, profit: 200000, profitMargin: 20 },
  { name: 'Feb', days: 28, revenue: 950000, target: 1100000, achievement: 86.4, cost: 760000, profit: 190000, profitMargin: 20 },
  { name: 'Mar', days: 31, revenue: 1150000, target: 1300000, achievement: 88.5, cost: 900000, profit: 250000, profitMargin: 21.7 },
  { name: 'Apr', days: 30, revenue: 1200000, target: 1350000, achievement: 88.9, cost: 950000, profit: 250000, profitMargin: 20.8 },
  { name: 'May', days: 31, revenue: 1300000, target: 1400000, achievement: 92.9, cost: 1000000, profit: 300000, profitMargin: 23.1 },
  { name: 'Jun', days: 30, revenue: 1350000, target: 1450000, achievement: 93.1, cost: 1050000, profit: 300000, profitMargin: 22.2 }
];

// Export monthly trends with days column
const workbook = excelExport.exportMonthlyTrends(monthlyTrendsData, 2025);
const buffer = excelExport.workbookToBuffer(workbook);

// Save example file
const exampleDir = path.join(__dirname, '..', 'examples');
if (!fs.existsSync(exampleDir)) {
  fs.mkdirSync(exampleDir, { recursive: true });
}

const examplePath = path.join(exampleDir, 'monthly_trends_with_days.xlsx');
fs.writeFileSync(examplePath, buffer);

console.log('Example Excel file created with days column:');
console.log(examplePath);
console.log('\nColumn order in the exported file:');
console.log('Month | Days | Revenue | Target | Achievement % | Cost | Profit | Profit Margin %');
console.log('\nThe "Days" column is now positioned right after "Month" column.');