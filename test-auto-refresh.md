# Auto-Refresh Fix Summary

## Issue
After uploading an Excel file, the dashboard required manual browser refresh to show updated data, especially for the "Last upload period" indicator and YTD/QTD/MTD filter calculations.

## Root Cause
The HierarchicalFilterContext was caching data availability and validation information but wasn't subscribing to the DataRefreshContext's refreshTrigger. This meant that when data was uploaded and caches were cleared, the filter context didn't know to re-fetch the updated information.

## Solution
1. Added `useDataRefresh` hook to HierarchicalFilterContext
2. Added `refreshTrigger` dependency to useEffects that fetch:
   - Validation data for years
   - Last compliant month data
3. Clear validation data cache when refreshTrigger changes to force re-fetch

## Files Modified
- `src/contexts/HierarchicalFilterContext.jsx`
  - Import useDataRefresh from DataRefreshContext
  - Use refreshTrigger in the component
  - Add refreshTrigger to useEffect dependencies
  - Clear validation cache on refresh

## Testing Steps
1. Open the dashboard and note the current "Last upload period" (e.g., "Jul")
2. Upload a new Excel file with data for August
3. After upload completes, the dashboard should automatically:
   - Update "Last upload period" to show "Aug"
   - Update YTD/QTD/MTD calculations to use August as the current month
   - Refresh all data displays without manual browser refresh

## Expected Behavior
- Upload triggers DataRefreshContext.triggerRefresh()
- This increments refreshTrigger
- HierarchicalFilterContext detects the change and re-fetches:
  - Last compliant month data
  - Validation data
- All components re-render with fresh data