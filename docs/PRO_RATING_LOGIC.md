# Pro-Rating Logic Documentation

## Overview

The Proceed Revenue Dashboard implements pro-rating for **costs** and **targets** in the current month to provide accurate month-to-date (MTD) metrics and realistic achievement calculations.

## Why Pro-Rating?

When viewing MTD data mid-month, comparing actual revenue against full-month targets would show artificially low achievement rates. Pro-rating adjusts targets and costs based on the elapsed portion of the month.

## Implementation Details

### 1. Database Schema

The database stores both original and pro-rated values:
- `original_target` - Full month target
- `target` - Pro-rated target (for current month only)
- `original_cost` - Full month cost
- `cost` - Pro-rated cost (for current month only)

### 2. Pro-Rating Calculation

```javascript
// Calculate days elapsed in current month
const currentDate = new Date();
const daysInMonth = new Date(year, month, 0).getDate();
const daysElapsed = currentDate.getDate();
const proRatingFactor = daysElapsed / daysInMonth;

// Apply pro-rating
const proratedTarget = originalTarget * proRatingFactor;
const proratedCost = originalCost * proRatingFactor;
```

### 3. When Pro-Rating is Applied

Pro-rating is applied during data import (ETL process) **only for the current month**:

```javascript
// In ETL service
if (year === currentYear && month === currentMonth) {
  // Apply pro-rating
  target = originalTarget * proRatingFactor;
  cost = originalCost * proRatingFactor;
} else {
  // Historical months use full values
  target = originalTarget;
  cost = originalCost;
}
```

### 4. Impact on Metrics

#### Achievement Rate
- Uses pro-rated target for current month: `Achievement = (Revenue / Pro-rated Target) × 100`
- Historical months use full targets

#### Gross Profit
- Uses pro-rated costs for current month: `GP = Revenue - Pro-rated Cost`
- Historical months use full costs

#### Gross Profit Margin
- Remains consistent: `GP% = (GP / Revenue) × 100`

### 5. User Experience

- **MTD View**: Shows realistic achievement against pro-rated targets
- **QTD/YTD Views**: Aggregates include pro-rated values for current month
- **Upload Page**: Displays current pro-rating status (e.g., "Day 19 of 31")

### Example

For July 2025 on July 19th:
- Days in month: 31
- Days elapsed: 19
- Pro-rating factor: 19/31 = 0.613

If original values are:
- Target: SAR 1,000,000
- Cost: SAR 700,000

Pro-rated values become:
- Target: SAR 613,000
- Cost: SAR 429,000

This ensures achievement calculations reflect performance relative to the elapsed portion of the month.

## Technical Notes

1. Pro-rating is recalculated on each data import
2. The `analysis_date` field tracks when pro-rating was applied
3. Original values are always preserved for reporting
4. Pro-rating only affects the current calendar month