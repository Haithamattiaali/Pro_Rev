# Production Database Migration Fix

## Current Status
- Backend code pushed with migration fix
- API still showing wrong values:
  - Cost: 2,672,422 (should be 2,484,582)
  - Profit: 1,288,208 (should be 1,197,662)
  - Missing: originalCost field

## Manual Migration Steps (if auto-deploy fails)

### Option 1: Via Render Dashboard
1. Log into Render dashboard
2. Go to your backend service
3. Click "Shell" tab
4. Run these commands:
```bash
cd backend
node scripts/run-migrations.js
```

### Option 2: Direct Database Access (if available)
```sql
-- Check current schema
PRAGMA table_info(revenue_data);

-- If original_cost column is missing, add it:
ALTER TABLE revenue_data ADD COLUMN original_cost REAL DEFAULT 0;

-- Populate with current cost values
UPDATE revenue_data SET original_cost = cost WHERE original_cost = 0;
```

### Option 3: Force Redeploy
1. In Render dashboard, go to Settings
2. Change any environment variable (e.g., add FORCE_DEPLOY=1)
3. This triggers a fresh deployment
4. Remove the variable after deployment

## Verification
After migration runs, the API should return:
```json
{
  "overview": {
    "cost": 2484582.08,         // Performance-adjusted cost
    "originalCost": 2672422.23,  // Raw cost from Excel
    "profit": 1197661.77        // Correct gross profit
  }
}
```

## Test Command
```bash
curl "https://proceed-revenue-backend.onrender.com/api/overview?year=2025&period=MTD&month=1" | jq '.overview | {cost, originalCost, profit}'
```

## Expected Results
- ✅ originalCost field appears in response
- ✅ cost shows 2,484,582 (not 2,672,422)
- ✅ profit shows 1,197,662 (not 1,288,208)