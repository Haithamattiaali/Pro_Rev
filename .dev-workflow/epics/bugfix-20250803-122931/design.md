# Bug Fix Design: Multiple filter state management approaches causing conflicts

## Fix Strategy

### Core Principle: Period-Driven Selection Model

The period type (MTD/QTD/YTD) becomes the primary state that drives what selections are available and valid.

### Implementation Details

1. **Remove Conflicting useEffect**
   - Delete the automatic period derivation logic
   - Stop trying to "guess" period from selections

2. **Update State Structure**
   ```javascript
   const [periodFilter, setPeriodFilter] = useState({
     period: 'YTD',        // Primary driver
     year: currentYear,    
     month: null,          // Only valid when period === 'MTD'
     quarter: null,        // Only valid when period === 'QTD'
     selectedMonths: [],   // Cleared when period !== 'MTD'
     selectedQuarters: [], // Cleared when period !== 'QTD'
     selectedYears: [currentYear]
   });
   ```

3. **Add Period Change Handler**
   ```javascript
   const handlePeriodChange = (newPeriod) => {
     setPeriodFilter(prev => {
       const updated = { ...prev, period: newPeriod };
       
       // Clear invalid selections
       if (newPeriod === 'YTD') {
         updated.selectedMonths = [];
         updated.selectedQuarters = [];
         updated.month = null;
         updated.quarter = null;
       } else if (newPeriod === 'MTD') {
         updated.selectedQuarters = [];
         updated.quarter = null;
         // Set default month if none selected
         if (updated.selectedMonths.length === 0) {
           updated.selectedMonths = [currentMonth];
           updated.month = currentMonth;
         }
       } else if (newPeriod === 'QTD') {
         updated.selectedMonths = [];
         updated.month = null;
         // Set default quarter if none selected
         if (updated.selectedQuarters.length === 0) {
           updated.selectedQuarters = [currentQuarter];
           updated.quarter = currentQuarter;
         }
       }
       
       return updated;
     });
   };
   ```

## Code Changes Required
- **File**: src/contexts/FilterContext.jsx
  - Remove useEffect at lines 53-89
  - Add new handlePeriodChange function
  - Update setPeriodFilter to validate state
  
- **File**: src/components/filters/PeriodFilter.jsx
  - Update to use new period change handler
  - Remove any local period derivation logic

- **File**: src/services/dataService.js
  - No changes needed - already handles parameters correctly

## Testing Strategy
- Unit tests for FilterContext state transitions
- Integration tests for filter + data flow
- Manual testing of all period/selection combinations
- Regression tests for saved filter scenarios

## Risk Mitigation
- Potential side effects: Saved filters might have invalid states
- Rollback plan: Feature flag for new behavior
- Monitoring: Add analytics for filter state changes
- Confidence score: 90%

## Auto-Mode Decisions Log
See .dev-workflow/epics/bugfix-20250803-122931/auto-decisions.log for all autonomous decisions