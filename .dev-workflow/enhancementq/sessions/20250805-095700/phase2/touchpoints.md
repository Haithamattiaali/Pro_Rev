# Implementation Touchpoints
Date: Mon Aug 5 2025

## File Modifications Required

### New Files to Create
1. `src/utils/profitCalculations.js` - Centralized calculation functions
2. `src/utils/__tests__/profitCalculations.test.js` - Unit tests
3. `backend/utils/profitCalculations.js` - Backend calculation utilities

### Existing Files to Modify

#### Frontend Files
1. **src/pages/BusinessUnits.jsx**
   - Line 150: Update `grossProfit` calculation
   - Line 238: Update inline calculation
   - Lines 243-247: Update gross profit margin calculations

2. **src/utils/dataTransformers.js**
   - Update any gross profit transformations

3. **src/pages/Overview.test.jsx**
   - Update test data to reflect new calculations

4. **proceed-forecast-with-real-data.tsx** (if applicable)
   - Lines 421, 458: Update gross profit calculations

#### Backend Files
1. **backend/services/data.service.js**
   - Lines 318-320: Overview profit calculation
   - Lines 427-429: Multi-select overview
   - Lines 477-478: Business unit profit
   - Lines 521-522: Customer profit
   - Lines 569-570: Business unit aggregation
   - Lines 617-618: Customer aggregation
   - Lines 854-856: Monthly trends profit

2. **backend/services/excel-export.service.js**
   - Lines 60-61: Overview export
   - Line 409: Business unit export
   - Lines 624-625: Monthly export

3. **backend/services/forecast.service.js**
   - Line 84: Forecast gross profit calculation

4. **backend/scripts/review-calculations.js**
   - Lines 90-91: Review script calculations

5. **backend/scripts/test-gross-profit.js**
   - Update all test calculations

### Configuration Updates
- No configuration changes required

## Component Map
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│ Calculation      │◀────│    Backend      │
│  Components     │     │   Utilities      │     │   Services      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        ▼                        ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ BusinessUnits   │     │ profitCalc.js    │     │ data.service.js │
│ Overview        │     │ - calcGrossProfit│     │ excel-export.js │
│ Customers       │     │ - calcMargin     │     │ forecast.js     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Integration Points
1. **Calculation Logic**: Centralized in utility functions
2. **Data Flow**: Backend → API → Frontend components
3. **Export Services**: Excel export must use same calculations
4. **Test Coverage**: All calculation paths must be tested