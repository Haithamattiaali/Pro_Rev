# Calendar Validation Tests

This directory contains comprehensive tests for validating the calendar days calculation used in the Proceed Revenue Dashboard for pro-rating monthly targets and costs.

## Overview

The pro-rating feature is critical for accurate revenue tracking when data is uploaded mid-month. The system needs to correctly calculate the number of days in each month, including proper handling of leap years.

## Test Files

### calendar-validation.test.js
A comprehensive test suite that validates:
- All 12 months in regular years
- All 12 months in leap years
- Edge cases for leap year calculation:
  - Year 2000 (divisible by 400 - leap year)
  - Year 1900 (divisible by 100 but not 400 - not leap year)
  - Year 2100 (divisible by 100 but not 400 - not leap year)
  - Year 2400 (divisible by 400 - leap year)
- Comparison between JavaScript Date object and SQL CASE statement calculations
- Pro-rating calculation accuracy

### validate-calendar-calculations.js (in scripts/)
A validation script that checks the actual database for:
- Current calendar calculations in the revenue_data table
- Pro-rated values accuracy
- February data handling for leap years
- Consistency between stored and calculated values

## Running the Tests

### Unit Tests
```bash
# Run the comprehensive calendar validation test
npm run test:calendar

# Or run directly
node tests/calendar-validation.test.js
```

### Database Validation
```bash
# Validate calculations in the current database
npm run validate:calendar

# Or run directly
node scripts/validate-calendar-calculations.js
```

## Calendar Logic

The system uses the following logic for determining days in a month:

```sql
CASE 
  WHEN month IN (1, 3, 5, 7, 8, 10, 12) THEN 31
  WHEN month IN (4, 6, 9, 11) THEN 30
  WHEN month = 2 AND (year % 4 = 0 AND (year % 100 != 0 OR year % 400 = 0)) THEN 29
  ELSE 28
END
```

### Leap Year Rules
1. Divisible by 4: Leap year
2. Divisible by 100: Not a leap year (exception to rule 1)
3. Divisible by 400: Leap year (exception to rule 2)

Examples:
- 2024: Divisible by 4, not by 100 → Leap year (29 days in February)
- 1900: Divisible by 100, not by 400 → Not a leap year (28 days in February)
- 2000: Divisible by 400 → Leap year (29 days in February)

## Pro-Rating Formula

For data uploaded mid-month, values are pro-rated using:

```
Pro-rated Value = Original Value × (Current Day / Days in Month)
```

Example:
- Original Target: $1,000
- Upload Date: July 17, 2025
- Days in July: 31
- Pro-rated Target: $1,000 × (17 / 31) = $548.39

## Test Results

All 38 test cases pass, confirming:
- ✅ Correct days calculation for all months
- ✅ Proper leap year handling
- ✅ Accurate pro-rating calculations
- ✅ SQL and JavaScript implementations match

## Integration with CI/CD

These tests can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Calendar Tests
  run: |
    cd backend
    npm install
    npm run test:calendar
```

## Troubleshooting

If tests fail:
1. Check the SQL CASE statement in your queries matches the expected logic
2. Verify the analysis_date column is properly formatted
3. Ensure the database has the required columns (original_target, original_cost, etc.)
4. Run the validation script to check actual database values

## Future Enhancements

Consider adding tests for:
- Different time zones
- Historical calendar changes
- Performance with large datasets
- Edge cases around midnight uploads