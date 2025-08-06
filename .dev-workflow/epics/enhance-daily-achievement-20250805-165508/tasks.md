# Task List - Daily Achievement Backend Implementation

## Epic: enhance-daily-achievement-20250805-165508
Generated: Mon Aug 5 17:15:00 2025

## Implementation Tasks (Backend Only)

### 1. ✅ Analyze Existing Code Structure
- Review data.service.js implementation
- Identify calendar days functions (getCalendarDaysInMonth, getCalendarDaysSQL)
- Confirm "days" column exists in database
- Understand current calculation flow

### 2. 🔄 Update SQL Queries in getOverviewData
**File**: backend/services/data.service.js
**Function**: getOverviewData()

Add daily calculations to main SQL query:
- Calculate daily_target using calendar days
- Calculate period_target using days worked
- Calculate daily_achievement percentage
- Handle edge cases (zero targets, null days)

### 3. 🔄 Update SQL Queries in getOverviewDataMultiSelect
**File**: backend/services/data.service.js
**Function**: getOverviewDataMultiSelect()

Apply same daily calculations for multi-select filtering:
- Aggregate daily metrics across selected periods
- Handle multiple months/quarters correctly
- Maintain calculation consistency

### 4. 🔄 Add Daily Calculations to Service Breakdown
**File**: backend/services/data.service.js
**Functions**: Service breakdown queries in both methods

Add per-service daily metrics:
- Daily target per service
- Period target per service
- Daily achievement per service

### 5. 🔄 Update Business Unit Data Methods
**File**: backend/services/data.service.js
**Function**: getBusinessUnitData()

Add daily calculations to business unit queries:
- Daily metrics per business unit
- Aggregate correctly across customers

### 6. 🔄 Update Customer Data Methods
**File**: backend/services/data.service.js
**Function**: getCustomerData()

Add daily calculations to customer queries:
- Daily metrics per customer
- Service-level daily breakdowns

### 7. 🔄 Create Daily Calculation Helper Function
**File**: backend/services/data.service.js

Create reusable SQL fragments:
```javascript
getDailyCalculationSQL() {
  return `
    SUM(target) / ${this.getCalendarDaysSQL()} as daily_target,
    (SUM(target) / ${this.getCalendarDaysSQL()}) * SUM(COALESCE(days, 30)) as period_target,
    CASE 
      WHEN ((SUM(target) / ${this.getCalendarDaysSQL()}) * SUM(COALESCE(days, 30))) > 0 
      THEN (SUM(revenue) / ((SUM(target) / ${this.getCalendarDaysSQL()}) * SUM(COALESCE(days, 30)))) * 100
      ELSE 0
    END as daily_achievement
  `;
}
```

### 8. 🔄 Handle Edge Cases
- Zero or null targets
- Missing or null days (default to 30)
- Days exceeding calendar days
- Division by zero protection
- Negative values

### 9. 🔄 Update API Response Objects
Ensure all response objects include new fields:
- dailyTarget
- periodTarget
- dailyAchievement
- daysWorked (from days column)
- calendarDays (for reference)

### 10. 🔄 Test SQL Queries
**File**: Create test script or use existing test framework

Test scenarios:
- Normal case (20 days worked in 31-day month)
- Full month (31 days in January)
- Partial month (5 days worked)
- Zero target
- Null days column
- February with leap year

### 11. 🔄 Verify Performance Impact
- Measure query execution time before changes
- Measure after adding daily calculations
- Ensure <100ms additional overhead
- Optimize if necessary

### 12. 🔄 Update Excel Export Service
**File**: backend/services/excel-export.service.js

Add daily metrics to Excel exports:
- Include in overview export
- Add to business unit export
- Add to customer export
- Maintain column order

## Task Dependencies

```
1. Analyze Code ──┐
                  ├──> 7. Create Helper Function ──┐
                  │                                 │
2-6. Update SQL ──┴─────────────────────────────>─┴──> 8. Edge Cases ──> 9. Update Response
                                                                               │
                                                                               ↓
12. Excel Export <──── 11. Performance Testing <──── 10. Test Queries <───────┘
```

## Acceptance Criteria

- [ ] All SQL queries include daily calculations
- [ ] Daily metrics available in all API responses
- [ ] Zero performance degradation
- [ ] All edge cases handled gracefully
- [ ] No breaking changes to API contract
- [ ] Excel exports include daily data

## Out of Scope
- Frontend UI changes
- Database schema modifications
- ETL process changes
- Historical data backfill
- New API endpoints