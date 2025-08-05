#!/bin/bash

echo "Force Migration Script"
echo "====================="
echo ""
echo "This script provides commands to manually run the migration on Render."
echo ""

cat << 'EOF'
Option 1: SSH to Render Service
-------------------------------
1. Go to Render dashboard
2. Click on your backend service (proceed-backend)
3. Click "Shell" tab
4. Run these commands:

   cd backend
   node scripts/run-migrations.js
   
   # Verify the migration worked:
   sqlite3 database/proceed-dashboard.db "PRAGMA table_info(revenue_data);"
   
   # Check if original_cost has data:
   sqlite3 database/proceed-dashboard.db "SELECT COUNT(*) FROM revenue_data WHERE original_cost > 0;"

Option 2: Force Deployment with Environment Variable
---------------------------------------------------
1. Go to Render dashboard
2. Click on your backend service
3. Go to "Environment" tab
4. Add a new environment variable:
   - Key: FORCE_MIGRATION
   - Value: true
5. Click "Save Changes" (this triggers redeployment)
6. After deployment completes, remove the variable

Option 3: Manual Database Update (if you have direct access)
-----------------------------------------------------------
If you have direct database access, run this SQL:

-- Check current schema
PRAGMA table_info(revenue_data);

-- Add column if missing
ALTER TABLE revenue_data ADD COLUMN original_cost REAL DEFAULT 0;

-- Copy current cost to original_cost
UPDATE revenue_data SET original_cost = cost WHERE original_cost = 0;

-- Verify the update
SELECT year, month, cost, original_cost 
FROM revenue_data 
WHERE year = 2025 AND month = 1 
LIMIT 5;

Option 4: Create a One-Time Migration Endpoint
---------------------------------------------
Add this temporary endpoint to server.js:

app.get('/api/run-migration-once', async (req, res) => {
  const key = req.query.key;
  if (key !== 'your-secret-key') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    const { execSync } = require('child_process');
    const output = execSync('node scripts/run-migrations.js', { 
      encoding: 'utf8',
      cwd: __dirname 
    });
    res.json({ success: true, output });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

Then visit: https://proceed-revenue-backend.onrender.com/api/run-migration-once?key=your-secret-key

IMPORTANT: Remove this endpoint after use!

Testing the Fix
---------------
After running any of these options, test with:

curl "https://proceed-revenue-backend.onrender.com/api/overview?year=2025&period=MTD&month=1" | jq '.overview | {revenue, cost, originalCost, profit}'

Expected output:
{
  "revenue": 3682243.85,
  "cost": 2484582.08,     # Performance-adjusted cost
  "originalCost": 2672422.23,  # Original cost from Excel
  "profit": 1197661.77    # Correct profit
}
EOF

echo ""
echo "Choose the option that works best for your setup."
echo "The postinstall script should run automatically, but these are fallbacks."