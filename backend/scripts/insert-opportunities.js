const db = require('../database/persistent-db');

const opportunities = [
  {
    "project": "Automotive Parts Distribution",
    "service": "3PL - Automotive Logistics",
    "location": "Jeddah",
    "scope_of_work": "Distribution center for automotive spare parts",
    "requirements": "Parts cataloging, dealer network distribution, warranty handling",
    "status": "Contract Signing",
    "est_monthly_revenue": "420000",
    "est_gp_percent": "0.28"
  },
  {
    "project": "Construction Materials Transport",
    "service": "2PL - Heavy Transport",
    "location": "Eastern Province",
    "scope_of_work": "Transportation of construction materials to major projects",
    "requirements": "Heavy-duty fleet, project site delivery, safety compliance",
    "status": "No Status",
    "est_monthly_revenue": "550000",
    "est_gp_percent": "0.12"
  },
  {
    "project": "Document Management Services",
    "service": "2PL - Document Storage",
    "location": "Riyadh",
    "scope_of_work": "Physical document storage and retrieval",
    "requirements": "Secure facility, indexing system, retrieval SLA",
    "status": "Contract review",
    "est_monthly_revenue": "28000",
    "est_gp_percent": "0.22"
  },
  {
    "project": "E-commerce Fulfillment Hub",
    "service": "3PL - E-commerce Fulfillment",
    "location": "Jeddah",
    "scope_of_work": "Complete e-commerce fulfillment solution with same-day delivery capability",
    "requirements": "Automated sorting, pick & pack, integration with major platforms",
    "status": "Running business with extending opportunities",
    "est_monthly_revenue": "650000",
    "est_gp_percent": "0.42"
  },
  {
    "project": "FMCG Regional Distribution",
    "service": "2PL - Transportation",
    "location": "Riyadh",
    "scope_of_work": "Regional distribution for major FMCG brands",
    "requirements": "Fleet of 100+ vehicles, route optimization, real-time tracking",
    "status": "Running business with extending opportunities",
    "est_monthly_revenue": "1200000",
    "est_gp_percent": "0.15"
  },
  {
    "project": "Fresh Produce Supply Chain",
    "service": "2PL - Fresh & Frozen",
    "location": "Riyadh",
    "scope_of_work": "Cold chain management for fresh produce imports",
    "requirements": "Temperature zones, quality control, rapid distribution",
    "status": "Running business with extending opportunities",
    "est_monthly_revenue": "380000",
    "est_gp_percent": "0.25"
  },
  {
    "project": "Industrial Equipment Logistics",
    "service": "2PL - Project Logistics",
    "location": "Jubail",
    "scope_of_work": "Logistics support for industrial projects",
    "requirements": "Heavy lifting equipment, project management, safety protocols",
    "status": "No Status",
    "est_monthly_revenue": "290000",
    "est_gp_percent": "0.2"
  },
  {
    "project": "Local Courier Services",
    "service": "2PL - Last Mile Delivery",
    "location": "Makkah",
    "scope_of_work": "Local delivery services for small businesses",
    "requirements": "Motorcycle fleet, mobile app, cash collection",
    "status": "No Status",
    "est_monthly_revenue": "45000",
    "est_gp_percent": "0.08"
  },
  {
    "project": "Luxury Goods Storage",
    "service": "2PL - Specialized Storage",
    "location": "Jeddah",
    "scope_of_work": "High-security storage for luxury goods",
    "requirements": "Climate control, 24/7 security, white-glove handling",
    "status": "Running business with extending opportunities",
    "est_monthly_revenue": "120000",
    "est_gp_percent": "0.48"
  },
  {
    "project": "Medical Equipment Distribution",
    "service": "2PL - Healthcare Logistics",
    "location": "Riyadh",
    "scope_of_work": "Distribution of medical equipment to hospitals",
    "requirements": "Specialized handling, installation support, compliance",
    "status": "Contract review",
    "est_monthly_revenue": "95000",
    "est_gp_percent": "0.4"
  },
  {
    "project": "National Distribution Center Expansion",
    "service": "3PL - Warehousing & Distribution",
    "location": "Riyadh",
    "scope_of_work": "Full warehouse management, inventory control, and distribution services",
    "requirements": "50,000 sqm facility, 24/7 operations, advanced WMS",
    "status": "Contract review",
    "est_monthly_revenue": "850000",
    "est_gp_percent": "0.35"
  },
  {
    "project": "Pharmaceutical Cold Chain Network",
    "service": "2PL - Cold Chain",
    "location": "Dammam",
    "scope_of_work": "Temperature-controlled storage and distribution for pharmaceuticals",
    "requirements": "GDP compliance, real-time temperature monitoring, validated processes",
    "status": "Contract Signing",
    "est_monthly_revenue": "720000",
    "est_gp_percent": "0.38"
  },
  {
    "project": "Retail Chain Supply Management",
    "service": "3PL - Integrated Logistics",
    "location": "Multiple",
    "scope_of_work": "End-to-end supply chain management for retail chain",
    "requirements": "Multi-location operations, inventory management, last-mile delivery",
    "status": "Contract review",
    "est_monthly_revenue": "980000",
    "est_gp_percent": "0.18"
  },
  {
    "project": "Seasonal Storage Solution",
    "service": "2PL - Temporary Storage",
    "location": "Riyadh",
    "scope_of_work": "Seasonal inventory storage",
    "requirements": "Flexible terms, basic warehousing",
    "status": "No Status",
    "est_monthly_revenue": "35000",
    "est_gp_percent": "0.15"
  },
  {
    "project": "Tech Startup Fulfillment",
    "service": "3PL - Small Business Solutions",
    "location": "Riyadh",
    "scope_of_work": "Fulfillment services for growing tech startup",
    "requirements": "Flexible space, scalable operations, tech integration",
    "status": "Contract Signing",
    "est_monthly_revenue": "85000",
    "est_gp_percent": "0.45"
  }
];

// Clear existing data
db.db.prepare('DELETE FROM opportunities_data').run();

// Insert new data
const stmt = db.db.prepare(`
  INSERT INTO opportunities_data (
    project, service, location, scope_of_work, requirements,
    status, est_monthly_revenue, est_gp_percent,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

let inserted = 0;
for (const opp of opportunities) {
  try {
    stmt.run(
      opp.project,
      opp.service,
      opp.location,
      opp.scope_of_work,
      opp.requirements,
      opp.status,
      parseFloat(opp.est_monthly_revenue),
      parseFloat(opp.est_gp_percent)
    );
    inserted++;
  } catch (error) {
    console.error('Error inserting:', opp.project, error);
  }
}

console.log(`Inserted ${inserted} opportunities`);

// Verify the data
const count = db.db.prepare('SELECT COUNT(*) as count FROM opportunities_data').get();
console.log('Total opportunities in database:', count.count);

// Check status distribution
const statuses = db.db.prepare('SELECT status, COUNT(*) as count FROM opportunities_data GROUP BY status').all();
console.log('\nStatus distribution:');
statuses.forEach(s => console.log(`  ${s.status}: ${s.count}`));

process.exit(0);