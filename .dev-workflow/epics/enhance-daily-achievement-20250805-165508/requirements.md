# Requirements Document - Daily Achievement Enhancement

## Epic: enhance-daily-achievement-20250805-165508
Generated: Mon Aug 5 17:10:00 2025

## User Stories

### 1. As an executive, I want to see daily targets so that I can track performance at a granular level

**Acceptance Criteria:**

#### SHOULD:
- Display daily target amount (Monthly Target ÷ Calendar Days)
- Show daily achievement percentage ((Revenue ÷ Period Target) × 100)
- Utilize the existing "days" column for worked days tracking
- Handle months with different calendar days correctly (28/29/30/31)
- Display on Overview dashboard page

#### SHOULD NOT:
- Break existing monthly/quarterly/yearly calculations
- Require changes to Excel import format
- Show daily metrics on pages where they're not relevant
- Allow days worked to exceed calendar days in month

#### Given/When/Then:
- **Given** I am viewing the Overview dashboard for January 2025
- **When** the page loads with revenue data
- **Then** I should see daily target = Monthly Target ÷ 31 days
- **And** I should see daily achievement based on days worked

### 2. As a data analyst, I want the days column to be used in calculations so that partial month performance is accurate

**Acceptance Criteria:**

#### SHOULD:
- Calculate period target as: Daily Target × Days Worked
- Use actual days worked from the "days" column in database
- Default to 30 days if days column is null or missing
- Include days information in API responses

#### SHOULD NOT:
- Change the database schema
- Alter existing ETL processes
- Require manual entry of days for historical data

#### Given/When/Then:
- **Given** a record has 20 days worked in a 31-day month
- **When** calculating achievement
- **Then** period target should be (Monthly Target ÷ 31) × 20
- **And** achievement should be Revenue ÷ Period Target

### 3. As a backend developer, I want daily calculations integrated seamlessly so that they don't impact performance

**Acceptance Criteria:**

#### SHOULD:
- Add daily_target, period_target, and daily_achievement to SQL queries
- Use existing calendar days functions (getCalendarDaysInMonth, getCalendarDaysSQL)
- Calculate on-the-fly without storing in database
- Handle edge cases (zero targets, null days)

#### SHOULD NOT:
- Add new database columns
- Significantly increase query execution time
- Create breaking changes in API contracts

#### Given/When/Then:
- **Given** the existing SQL queries in data.service.js
- **When** adding daily calculations
- **Then** queries should include the new daily metrics
- **And** performance should remain within 100ms overhead

### 4. As a frontend developer, I want daily metrics in API responses so that I can display them in the UI

**Acceptance Criteria:**

#### SHOULD:
- Include daily_target, period_target, daily_achievement in overview response
- Add daily metrics to service breakdown
- Format daily values appropriately (currency, percentage)
- Cache daily calculations with existing 5-minute cache

#### SHOULD NOT:
- Require separate API calls for daily data
- Break existing frontend data contracts
- Add complexity to the caching layer

#### Given/When/Then:
- **Given** a call to getOverviewData API
- **When** the response is returned
- **Then** it should include daily achievement metrics
- **And** existing fields should remain unchanged

## Technical Requirements

### Backend Implementation:
1. Modify `getOverviewData` method to include daily calculations
2. Update SQL queries to calculate:
   - `daily_target = target / calendar_days_in_month`
   - `period_target = daily_target * days_worked`
   - `daily_achievement = (revenue / period_target) * 100`
3. Apply same logic to all data retrieval methods

### Frontend Implementation:
1. Update dataService.js to handle new daily fields
2. Add MetricCard components for daily metrics
3. Position daily cards near related monthly metrics
4. Use existing formatting utilities

### Data Validation:
1. Days worked must be positive integer
2. Days worked cannot exceed calendar days
3. Handle null/undefined days column (default 30)
4. Zero target should result in zero daily achievement

## Success Metrics

1. **Accuracy**: Daily calculations match manual verification
2. **Performance**: <100ms additional latency
3. **Compatibility**: All existing features continue working
4. **Adoption**: Daily metrics viewed by >80% of users

## Dependencies

- Existing calendar days calculation functions
- Current "days" column in revenue_data table
- Profit calculation utilities
- Frontend MetricCard component

## Out of Scope

- Historical data migration to populate days column
- Automated days calculation based on business rules
- Weekend/holiday detection
- Daily trends/charts (only point-in-time metrics)
- Modifications to Excel import templates