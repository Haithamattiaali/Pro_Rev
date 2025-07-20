# Filter Fix Test Results

## Issue
The dashboard was opening with quarterly data (QTD) instead of yearly data (YTD) by default.

## Root Cause
The `HierarchicalFilterContext` was initializing with:
- `viewMode: 'quarterly'`
- `selectedPeriods: [Q${currentQuarter}]` (e.g., ['Q1'])

This was overriding the `FilterContext` which correctly had `period: 'YTD'`.

## Fix Applied
Changed the initial state in `HierarchicalFilterContext.jsx`:
```javascript
// Before:
viewMode: 'quarterly',
selectedPeriods: [`Q${currentQuarter}`],
selectedPeriod: `Q${currentQuarter}`,

// After:
viewMode: 'yearly',
selectedPeriods: [],
selectedPeriod: null,
```

## Expected Behavior
- Dashboard should now open with YTD (Year-to-Date) data showing the full year
- The YTD button should be highlighted as active
- No quarter selector should be visible initially

## Testing
1. Clear browser cache and reload the page
2. Check that YTD is selected by default
3. Verify that the data shows full year totals
4. Confirm that switching to QTD and then back to YTD works correctly