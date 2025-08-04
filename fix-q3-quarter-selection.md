# Fix: Q3 Quarter Selection Issue

## Problem
When the last upload period is August, Q3 (July-Aug-Sep) was not clickable/selectable in the quarterly filter view.

## Root Cause
The `isQuarterCompliant` function in `PeriodSelector.jsx` was checking if ALL months in a quarter have data before allowing selection. Since August is the last upload month:
- Q3 contains: July ✓, August ✓, September ✗
- The function required all 3 months to be compliant
- This made Q3 non-selectable even though it had partial data

## Solution
Modified the quarter compliance logic to allow selection of quarters with partial data:

1. **Changed validation logic**: Instead of requiring ALL months in a quarter to have data, now allows selection if AT LEAST ONE month has data.

2. **Added visual indicator**: Quarters with partial data now show a yellow warning icon to indicate incomplete data, while still being selectable.

## Code Changes

### `src/components/filters/PeriodSelector.jsx`

1. Updated `isQuarterCompliant` function (lines 27-50):
   - Now tracks both `hasAnyCompliantMonth` and `hasAllCompliantMonths`
   - Returns true if quarter has any compliant month (partial data is allowed)

2. Updated `renderQuarterButton` function (lines 79-135):
   - Added logic to detect partial quarters
   - Shows amber warning icon for partial quarters
   - Updated tooltip to indicate "This quarter has partial data"

## Result
- Q3 is now clickable when August is the last upload month
- Users can select Q3 to view July-August data
- Visual indicator shows it's a partial quarter
- Maintains data integrity while improving usability

## Testing
1. Upload data through August
2. Switch to quarterly view
3. Q3 should now be clickable with a warning icon
4. Selecting Q3 should show data for July-August