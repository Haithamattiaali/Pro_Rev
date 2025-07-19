const db = require('../database/persistent-db');

// Categorize opportunities based on service type
const opportunities = db.db.prepare('SELECT * FROM opportunities_data').all();

const categorized = {
  Transportation: [],
  Warehousing: []
};

opportunities.forEach(opp => {
  // Transportation: 2PL services (except storage), transportation, delivery, courier
  if (opp.service.includes('2PL') && !opp.service.includes('Storage')) {
    categorized.Transportation.push(opp);
  } 
  // Transportation: Direct transportation services
  else if (opp.service.includes('Transportation') || 
           opp.service.includes('Transport') || 
           opp.service.includes('Delivery') || 
           opp.service.includes('Courier')) {
    categorized.Transportation.push(opp);
  }
  // Warehousing: 3PL services, storage, warehousing, fulfillment
  else if (opp.service.includes('3PL') || 
           opp.service.includes('Storage') || 
           opp.service.includes('Warehousing') || 
           opp.service.includes('Fulfillment')) {
    categorized.Warehousing.push(opp);
  }
  // Default: Unclear services go to warehousing (more comprehensive)
  else {
    categorized.Warehousing.push(opp);
  }
});

console.log('Opportunity Categorization:');
console.log('===========================');

console.log('\nTRANSPORTATION OPPORTUNITIES:');
let transpTotal = 0;
categorized.Transportation.forEach(opp => {
  console.log(`  - ${opp.project} (${opp.service}): ${parseInt(opp.est_monthly_revenue).toLocaleString()}`);
  transpTotal += parseInt(opp.est_monthly_revenue);
});
console.log(`  TOTAL TRANSPORTATION: ${transpTotal.toLocaleString()}`);

console.log('\nWAREHOUSING OPPORTUNITIES:');
let whTotal = 0;
categorized.Warehousing.forEach(opp => {
  console.log(`  - ${opp.project} (${opp.service}): ${parseInt(opp.est_monthly_revenue).toLocaleString()}`);
  whTotal += parseInt(opp.est_monthly_revenue);
});
console.log(`  TOTAL WAREHOUSING: ${whTotal.toLocaleString()}`);

console.log('\nSUMMARY:');
console.log(`  Transportation: ${transpTotal.toLocaleString()} (${(transpTotal/6448000*100).toFixed(1)}%)`);
console.log(`  Warehousing: ${whTotal.toLocaleString()} (${(whTotal/6448000*100).toFixed(1)}%)`);
console.log(`  Grand Total: ${(transpTotal + whTotal).toLocaleString()}`);

// Monthly distribution analysis
console.log('\n\nMONTHLY DISTRIBUTION STRATEGY:');
console.log('================================');
console.log('Based on the actual opportunity data, we should distribute:');
console.log(`- Transportation opportunities: ${transpTotal.toLocaleString()} across 12 months`);
console.log(`- Warehousing opportunities: ${whTotal.toLocaleString()} across 12 months`);
console.log('');
console.log('This would replace the empirical distribution with actual opportunity-based values.');

process.exit(0);