# Bug Hypotheses
Generated: Tue Aug 5 13:58:30 2025
Bug: may be the etl

## Primary Hypotheses

### Hypothesis 1: Missing Database Column (CONFIRMED)
- Location: Database schema missing original_cost column
- Evidence: Migration commented out in run-migrations.js line 36
- Test: Check production database schema
- Impact: Backend returns raw cost instead of performance-adjusted cost

### Hypothesis 2: Miscommunication About Pro-rating
- Location: Comment says "Pro-rating no longer used"
- Evidence: But new formula still needs original_cost for calculations
- Test: Review commit history for this change
- Impact: Critical functionality disabled by mistake

### Hypothesis 3: ETL Process is Correct
- Location: etl.service.js working as designed
- Evidence: ETL correctly imports raw data from Excel
- Test: ETL doesn't need changes
- Impact: Focus should be on database schema, not ETL

## Secondary Hypotheses

### Hypothesis 4: Production Database Out of Sync
- Location: Production database schema
- Evidence: Local works, production doesn't
- Test: Compare schemas between environments
- Impact: Production missing critical column

### Hypothesis 5: Deployment Process Issue
- Location: Database migrations not running on deploy
- Evidence: Schema changes not reflected in production
- Test: Check if migrations run automatically
- Impact: Manual intervention needed

## Questions to Validate
1. When was the original_cost migration commented out?
2. Who made the decision to remove "pro-rating"?
3. Is there confusion between old and new calculation methods?
4. Does production database need manual migration?
5. Are there other missing migrations?