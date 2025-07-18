const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Create Excel templates with correct column order
function createTemplates() {
  // Revenue Data Template
  const revenueHeaders = [
    'Customer',
    'Service_Type', 
    'Year',
    'Month',
    'Days',  // Now positioned right after Month
    'Cost',
    'Target',
    'Revenue',
    'Receivables Collected'
  ];

  // Sample data for revenue template
  const revenueSampleData = [
    {
      'Customer': 'Example Customer',
      'Service_Type': 'Service A',
      'Year': 2025,
      'Month': 'Jan',
      'Days': 31,  // Calendar days worked in the month
      'Cost': 100000,
      'Target': 150000,
      'Revenue': 140000,
      'Receivables Collected': 120000
    }
  ];

  // Create revenue workbook
  const revenueWb = XLSX.utils.book_new();
  const revenueData = [revenueHeaders];
  
  // Add sample data
  revenueSampleData.forEach(row => {
    revenueData.push(revenueHeaders.map(header => row[header]));
  });

  const revenueWs = XLSX.utils.aoa_to_sheet(revenueData);
  
  // Set column widths
  revenueWs['!cols'] = [
    { wch: 25 }, // Customer
    { wch: 20 }, // Service_Type
    { wch: 10 }, // Year
    { wch: 10 }, // Month
    { wch: 10 }, // Days
    { wch: 15 }, // Cost
    { wch: 15 }, // Target
    { wch: 15 }, // Revenue
    { wch: 20 }  // Receivables Collected
  ];

  XLSX.utils.book_append_sheet(revenueWb, revenueWs, 'Revenue Data');

  // Sales Plan Template
  const salesPlanHeaders = [
    'gl',
    'month',
    'days',  // Now positioned right after month
    'year',
    'service_type',
    'baseline_forecast',
    'opportunity_value'
  ];

  // Sample data for sales plan template
  const salesPlanSampleData = [
    {
      'gl': '1000',
      'month': 'Jan',
      'days': 31,  // Calendar days worked in the month
      'year': 2025,
      'service_type': 'Service A',
      'baseline_forecast': 100000,
      'opportunity_value': 20000
    }
  ];

  // Create sales plan workbook
  const salesPlanWb = XLSX.utils.book_new();
  const salesPlanData = [salesPlanHeaders];
  
  // Add sample data
  salesPlanSampleData.forEach(row => {
    salesPlanData.push(salesPlanHeaders.map(header => row[header]));
  });

  const salesPlanWs = XLSX.utils.aoa_to_sheet(salesPlanData);
  
  // Set column widths
  salesPlanWs['!cols'] = [
    { wch: 15 }, // gl
    { wch: 10 }, // month
    { wch: 10 }, // days
    { wch: 10 }, // year
    { wch: 20 }, // service_type
    { wch: 18 }, // baseline_forecast
    { wch: 18 }  // opportunity_value
  ];

  XLSX.utils.book_append_sheet(salesPlanWb, salesPlanWs, 'Sales Plan');

  // Save templates
  const templatesDir = path.join(__dirname, '..', 'templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  const revenueTemplatePath = path.join(templatesDir, 'revenue_data_template.xlsx');
  const salesPlanTemplatePath = path.join(templatesDir, 'sales_plan_template.xlsx');

  XLSX.writeFile(revenueWb, revenueTemplatePath);
  XLSX.writeFile(salesPlanWb, salesPlanTemplatePath);

  console.log('Excel templates created successfully:');
  console.log(`- Revenue Data Template: ${revenueTemplatePath}`);
  console.log(`- Sales Plan Template: ${salesPlanTemplatePath}`);
  console.log('\nColumn order for Revenue Data:');
  console.log('Customer | Service_Type | Year | Month | Days | Cost | Target | Revenue | Receivables Collected');
  console.log('\nColumn order for Sales Plan:');
  console.log('gl | month | days | year | service_type | baseline_forecast | opportunity_value');
}

// Run the script
createTemplates();