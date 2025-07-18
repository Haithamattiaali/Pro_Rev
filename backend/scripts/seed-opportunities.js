const db = require('../database/persistent-db');

// Sample opportunities data for development/testing
const sampleOpportunities = [
  // Strategic Wins (High Revenue, High GP%)
  {
    project: "Saudi Aramco Distribution Hub",
    service: "3PL Full Service",
    location: "Dammam",
    scope_of_work: "Complete warehousing and distribution management",
    requirements: "24/7 operations, advanced WMS, 50,000 sqm facility",
    status: "Running business",
    est_monthly_revenue: 850000,
    est_gp_percent: 0.35
  },
  {
    project: "SABIC Chemical Logistics",
    service: "3PL Specialized",
    location: "Jubail",
    scope_of_work: "Hazmat storage and transportation",
    requirements: "HAZMAT certified staff, specialized equipment",
    status: "Running business",
    est_monthly_revenue: 720000,
    est_gp_percent: 0.38
  },
  {
    project: "Almarai Cold Chain",
    service: "3PL Temperature Controlled",
    location: "Riyadh",
    scope_of_work: "Cold storage and refrigerated transport",
    requirements: "Temperature monitoring, GDP compliance",
    status: "Contract review",
    est_monthly_revenue: 680000,
    est_gp_percent: 0.32
  },
  
  // Volume Plays (High Revenue, Lower GP%)
  {
    project: "Extra Stores Distribution",
    service: "2PL Basic",
    location: "Jeddah",
    scope_of_work: "Consumer electronics distribution",
    requirements: "High volume handling, last-mile delivery",
    status: "Running business",
    est_monthly_revenue: 920000,
    est_gp_percent: 0.18
  },
  {
    project: "Panda Retail Network",
    service: "2PL Cross-dock",
    location: "Multiple",
    scope_of_work: "FMCG distribution across KSA",
    requirements: "Multi-location coordination, real-time tracking",
    status: "Contract Signing",
    est_monthly_revenue: 780000,
    est_gp_percent: 0.20
  },
  {
    project: "Amazon Saudi Operations",
    service: "2PL E-commerce",
    location: "Riyadh",
    scope_of_work: "E-commerce fulfillment services",
    requirements: "Same-day delivery capability, returns management",
    status: "Running business",
    est_monthly_revenue: 650000,
    est_gp_percent: 0.15
  },
  
  // Quick Wins (Lower Revenue, High GP%)
  {
    project: "Pharmaceutical Co. Storage",
    service: "3PL Pharma",
    location: "Riyadh",
    scope_of_work: "Pharmaceutical warehousing",
    requirements: "GDP certified, temperature controlled",
    status: "Running business",
    est_monthly_revenue: 320000,
    est_gp_percent: 0.42
  },
  {
    project: "Luxury Goods Handling",
    service: "3PL Premium",
    location: "Jeddah",
    scope_of_work: "High-value goods storage and handling",
    requirements: "Security protocols, white-glove service",
    status: "Running business",
    est_monthly_revenue: 280000,
    est_gp_percent: 0.45
  },
  {
    project: "Medical Devices Distribution",
    service: "3PL Healthcare",
    location: "Dammam",
    scope_of_work: "Medical device storage and distribution",
    requirements: "Clean room environment, tracking system",
    status: "Contract review",
    est_monthly_revenue: 340000,
    est_gp_percent: 0.40
  },
  {
    project: "Tech Startup Fulfillment",
    service: "2PL Flexible",
    location: "Riyadh",
    scope_of_work: "Small parcel fulfillment",
    requirements: "Scalable solution, API integration",
    status: "Running business",
    est_monthly_revenue: 180000,
    est_gp_percent: 0.38
  },
  
  // Review & Optimize (Lower Revenue, Lower GP%)
  {
    project: "Local Retailer Network",
    service: "2PL Basic",
    location: "Makkah",
    scope_of_work: "Regional distribution",
    requirements: "Basic warehousing and delivery",
    status: "Running business",
    est_monthly_revenue: 150000,
    est_gp_percent: 0.12
  },
  {
    project: "Small Parts Storage",
    service: "2PL Storage",
    location: "Riyadh",
    scope_of_work: "Storage only service",
    requirements: "Inventory management",
    status: "Running business",
    est_monthly_revenue: 95000,
    est_gp_percent: 0.15
  },
  {
    project: "Seasonal Goods Handling",
    service: "2PL Seasonal",
    location: "Jeddah",
    scope_of_work: "Seasonal inventory management",
    requirements: "Flexible space allocation",
    status: "No Status",
    est_monthly_revenue: 120000,
    est_gp_percent: 0.18
  },
  {
    project: "Document Storage Services",
    service: "2PL Archive",
    location: "Riyadh",
    scope_of_work: "Document archiving and retrieval",
    requirements: "Security and indexing system",
    status: "Running business",
    est_monthly_revenue: 85000,
    est_gp_percent: 0.20
  },
  
  // Additional opportunities for variety
  {
    project: "NEOM Logistics Hub",
    service: "3PL Innovation",
    location: "NEOM",
    scope_of_work: "Smart logistics for NEOM city",
    requirements: "IoT integration, sustainable operations",
    status: "Contract Signing",
    est_monthly_revenue: 450000,
    est_gp_percent: 0.28
  },
  {
    project: "Red Sea Project Supply",
    service: "3PL Construction",
    location: "Red Sea",
    scope_of_work: "Construction materials logistics",
    requirements: "Project management, just-in-time delivery",
    status: "Contract review",
    est_monthly_revenue: 520000,
    est_gp_percent: 0.25
  },
  {
    project: "Automotive Parts Network",
    service: "2PL Automotive",
    location: "Dammam",
    scope_of_work: "Auto parts distribution",
    requirements: "Parts tracking, dealer network integration",
    status: "Running business",
    est_monthly_revenue: 380000,
    est_gp_percent: 0.22
  },
  {
    project: "Fashion Retailer DC",
    service: "3PL Fashion",
    location: "Jeddah",
    scope_of_work: "Fashion logistics and returns",
    requirements: "Seasonal handling, quality control",
    status: "Running business",
    est_monthly_revenue: 290000,
    est_gp_percent: 0.30
  },
  {
    project: "Agricultural Export Hub",
    service: "3PL Agri",
    location: "Tabuk",
    scope_of_work: "Agricultural products export logistics",
    requirements: "Export documentation, quality certification",
    status: "No Status",
    est_monthly_revenue: 410000,
    est_gp_percent: 0.24
  },
  {
    project: "Hajj Supplies Distribution",
    service: "2PL Seasonal",
    location: "Makkah",
    scope_of_work: "Hajj season logistics support",
    requirements: "Peak season capacity, multilingual support",
    status: "Contract Signing",
    est_monthly_revenue: 550000,
    est_gp_percent: 0.35
  }
];

// Function to seed opportunities data
async function seedOpportunities() {
  try {
    console.log('Starting opportunities data seeding...');
    
    // Check if table is empty
    const count = db.get('SELECT COUNT(*) as count FROM opportunities_data');
    
    if (count.count > 0) {
      console.log(`Opportunities table already has ${count.count} records. Skipping seed.`);
      return;
    }
    
    // Insert sample data
    const insertStmt = db.prepare(`
      INSERT INTO opportunities_data (
        project, service, location, scope_of_work, requirements, 
        status, est_monthly_revenue, est_gp_percent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((opportunities) => {
      for (const opp of opportunities) {
        insertStmt.run(
          opp.project,
          opp.service,
          opp.location,
          opp.scope_of_work,
          opp.requirements,
          opp.status,
          opp.est_monthly_revenue,
          opp.est_gp_percent
        );
      }
    });
    
    insertMany(sampleOpportunities);
    
    console.log(`Successfully seeded ${sampleOpportunities.length} opportunities`);
    
    // Verify the data
    const verification = db.all(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(est_monthly_revenue) as avg_revenue,
        AVG(est_gp_percent) as avg_gp
      FROM opportunities_data
      GROUP BY status
    `);
    
    console.log('\nOpportunities by status:');
    verification.forEach(row => {
      console.log(`- ${row.status || 'No Status'}: ${row.count} opportunities, Avg Revenue: ${Math.round(row.avg_revenue).toLocaleString()}, Avg GP: ${(row.avg_gp * 100).toFixed(1)}%`);
    });
    
  } catch (error) {
    console.error('Error seeding opportunities:', error);
    process.exit(1);
  }
}

// Run the seed function
if (require.main === module) {
  seedOpportunities()
    .then(() => {
      console.log('\nOpportunities seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedOpportunities;