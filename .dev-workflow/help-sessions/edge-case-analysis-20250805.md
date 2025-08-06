# Edge Case Analysis: February Calculations with January Work Days = 1

## Problem Description
When January has work days set to 1 and we're calculating daily achievements in February (or across both months), the aggregation logic may produce unexpected results.

## Current Daily Calculation Logic

```sql
-- Daily Target = SUM(target) / SUM(calendar_days)
-- Period Target = Daily Target × SUM(days_worked)
-- Daily Achievement = (SUM(revenue) / Period Target) × 100
```

## Edge Case Scenario

### Example Data:
- **January 2025**:
  - Target: $1,000,000
  - Revenue: $50,000
  - Calendar Days: 31
  - Days Worked: 1 (THE EDGE CASE)
  
- **February 2025**:
  - Target: $900,000
  - Revenue: $800,000
  - Calendar Days: 28
  - Days Worked: 20

## Problem Analysis

### When Aggregating Both Months:

1. **Total Target**: $1,000,000 + $900,000 = $1,900,000
2. **Total Calendar Days**: 31 + 28 = 59
3. **Daily Target**: $1,900,000 ÷ 59 = $32,203.39
4. **Total Days Worked**: 1 + 20 = 21
5. **Period Target**: $32,203.39 × 21 = $676,271.19
6. **Total Revenue**: $50,000 + $800,000 = $850,000
7. **Daily Achievement**: ($850,000 ÷ $676,271.19) × 100 = **125.7%**

### Issues with This Calculation:

1. **Skewed Daily Target**: The daily target is averaged across both months, but January only had 1 working day
2. **Misleading Achievement**: The 125.7% achievement doesn't reflect that January severely underperformed
3. **Period Target Mismatch**: The period target assumes uniform daily performance across both months

### Real Performance by Month:

**January**:
- Daily Target: $1,000,000 ÷ 31 = $32,258.06
- Period Target (1 day): $32,258.06
- Actual Revenue: $50,000
- Daily Achievement: 155.0% (looks good but only 1 day worked!)
- Monthly Achievement: $50,000 ÷ $1,000,000 = 5.0% (the real story)

**February**:
- Daily Target: $900,000 ÷ 28 = $32,142.86
- Period Target (20 days): $642,857.14
- Actual Revenue: $800,000
- Daily Achievement: 124.4%
- Monthly Achievement: $800,000 ÷ $900,000 = 88.9%

## Potential Solutions

### 1. Weighted Average Approach
Instead of simple SUM, weight by days worked:
```sql
-- Weight each month's contribution by its days worked
CASE 
  WHEN SUM(days) > 0 
  THEN SUM(revenue * days) / SUM(target * days / calendar_days)
  ELSE 0
END as weighted_daily_achievement
```

### 2. Separate Month Calculations
Don't aggregate daily achievements across months with vastly different work days:
```sql
-- Calculate daily achievement per month, then average
AVG(
  CASE 
    WHEN (target / calendar_days * days) > 0 
    THEN (revenue / (target / calendar_days * days)) * 100
    ELSE 0
  END
) as avg_daily_achievement
```

### 3. Threshold Protection
Add validation for extreme work day values:
```sql
-- Only include months with reasonable work days (e.g., >= 5)
WHERE days >= 5 OR days IS NULL
```

### 4. Use Monthly Achievement for Edge Cases
When days worked is extremely low, fall back to monthly achievement:
```sql
CASE 
  WHEN days < 5 THEN (revenue / target) * 100  -- Monthly achievement
  ELSE (revenue / (target / calendar_days * days)) * 100  -- Daily achievement
END as achievement
```

## Recommendations

1. **Add Data Validation**: Warn when days worked is unusually low (< 5 days in a month)
2. **Separate Reporting**: Show monthly AND daily achievements separately
3. **Document the Logic**: Make it clear that daily achievements assume consistent work patterns
4. **Consider Business Rules**: What does "1 day worked" really mean for a full month's target?

## Test Cases to Implement

```javascript
// Test edge case: Single day worked in a month
test('daily achievement with 1 work day', () => {
  const january = {
    target: 1000000,
    revenue: 50000,
    calendar_days: 31,
    days: 1
  };
  
  // Daily achievement might be high, but monthly is low
  expect(calculateDailyAchievement(january)).toBe(155.0);
  expect(calculateMonthlyAchievement(january)).toBe(5.0);
});

// Test aggregation across months with different work patterns
test('multi-month aggregation with edge case', () => {
  const data = [
    { month: 1, target: 1000000, revenue: 50000, calendar_days: 31, days: 1 },
    { month: 2, target: 900000, revenue: 800000, calendar_days: 28, days: 20 }
  ];
  
  const result = calculateAggregatedDailyAchievement(data);
  // Should handle the edge case appropriately
});
```

## Business Questions to Answer

1. **What does 1 work day mean?**
   - Is this a data entry error?
   - Was the business closed for most of January?
   - Should the target be pro-rated?

2. **How should achievements be calculated?**
   - Should we use daily achievement when days < 5?
   - Should we show warnings for unusual work patterns?
   - Should monthly achievement take precedence?

3. **Reporting Requirements**
   - Do stakeholders understand daily vs monthly achievements?
   - Should we show both metrics?
   - How to handle partial month data?