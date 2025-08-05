# Fix Plan
Date: Tue Aug 5 14:02:00 2025
Bug: may be the etl (actually: missing database column)
Session: 20250805-135532-etl

## Executive Summary
Root cause identified as missing original_cost column in production database. The migration was incorrectly commented out. Fix involves uncommenting migration, running it on production, and ensuring backend calculations work correctly.

## Detailed Fix Plan

### Step 1: Fix Migration Script
**Task**: Uncomment the original_cost migration
**Location**: backend/scripts/run-migrations.js lines 36-39
**Changes**:
1. Remove comment markers from ALTER TABLE statement
2. Remove "REMOVED: Pro-rating no longer used" comments
3. Ensure migration adds original_cost column and populates it

### Step 2: Test Migration Locally
**Task**: Verify migration works correctly
**Actions**:
1. Run migration on test database
2. Verify column is added
3. Confirm existing cost values copied to original_cost
4. Test backend calculations work

### Step 3: Deploy to Production
**Task**: Apply fix to production
**Steps**:
1. Commit migration fix
2. Push to trigger deployment
3. SSH to production (if needed) to run migration manually
4. Verify database schema updated

### Step 4: Verify Fix
**Task**: Confirm calculations are correct
**Tests**:
1. Check API response includes originalCost field
2. Verify cost field shows performance-adjusted value
3. Confirm gross profit shows SAR 1,197,662

### Step 5: Add Safeguards
**Task**: Prevent future issues
**Actions**:
1. Add schema validation on backend startup
2. Create test for original_cost column existence
3. Document the performance calculation requirements

## Task Breakdown

### Immediate Actions (Critical)
1. Uncomment migration in run-migrations.js
2. Test migration locally
3. Deploy and run migration on production

### Follow-up Actions (Important)
1. Add database schema validation
2. Create integration tests for calculations
3. Document the calculation formula clearly

### Long-term Improvements
1. Automate schema migrations in deployment
2. Add pre-deployment schema checks
3. Improve ETL documentation

## Code Changes Required

### 1. backend/scripts/run-migrations.js
```javascript
// Change from:
//     db.db.prepare('ALTER TABLE revenue_data ADD COLUMN original_cost REAL DEFAULT 0').run(); // REMOVED: Pro-rating no longer used

// To:
    db.db.prepare('ALTER TABLE revenue_data ADD COLUMN original_cost REAL DEFAULT 0').run();
    db.db.prepare('UPDATE revenue_data SET original_cost = cost WHERE original_cost = 0').run();
    console.log('✓ Added original_cost column');
```

### 2. Add Schema Validation (new file)
Create backend/utils/schemaValidator.js to check required columns exist

### 3. Update Deployment Process
Ensure migrations run automatically on deployment

## Success Criteria
- [ ] original_cost column exists in production
- [ ] API returns both cost and originalCost fields
- [ ] Gross profit shows SAR 1,197,662
- [ ] All cost calculations use performance formula