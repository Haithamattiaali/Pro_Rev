# Tasks for Gross Profit Formula Update
Generated: Mon Aug 5 2025

## Pre-Execution Checklist
- [x] Review enhancement requirements
- [x] Identify all affected files
- [x] Plan implementation approach
- [ ] Create feature branch

## Implementation Tasks

### Task Group 1: Setup and Utilities
```bash
# Create feature branch
git checkout -b feature/gross-profit-formula-update
```

1. **Create Calculation Utilities**
   ```javascript
   // src/utils/profitCalculations.js
   export function calculateGrossProfit(revenue, target, cost) {
     if (!target || target === 0) {
       return revenue - cost;
     }
     const achievementRatio = revenue / target;
     const proportionalCost = achievementRatio * cost;
     return revenue - proportionalCost;
   }

   export function calculateGrossProfitMargin(grossProfit, revenue) {
     if (!revenue || revenue === 0) return 0;
     return (grossProfit / revenue) * 100;
   }
   ```

2. **Create Backend Utilities**
   ```javascript
   // backend/utils/profitCalculations.js
   // Same functions as above for backend use
   ```

### Task Group 2: Backend Implementation

1. **Update backend/services/data.service.js**
   - Import calculation utilities
   - Replace all instances of `target - cost` with new calculation
   - Update profit margin calculations

2. **Update backend/services/excel-export.service.js**
   - Import calculation utilities
   - Update export calculations

3. **Update backend/services/forecast.service.js**
   - Update SQL calculation or post-process results

4. **Update Scripts**
   - backend/scripts/review-calculations.js
   - backend/scripts/test-gross-profit.js

### Task Group 3: Frontend Implementation

1. **Update src/pages/BusinessUnits.jsx**
   ```javascript
   // Line 150 - Update calculation
   grossProfit: calculateGrossProfit(month.revenue, month.target, month.cost),
   grossProfitMargin: calculateGrossProfitMargin(grossProfit, month.revenue)
   ```

2. **Update Other Components**
   - Import and use calculation utilities
   - Remove inline calculations

### Task Group 4: Testing

1. **Create Unit Tests**
   ```javascript
   // src/utils/__tests__/profitCalculations.test.js
   describe('calculateGrossProfit', () => {
     it('should calculate correctly when revenue meets target', () => {
       expect(calculateGrossProfit(1000, 1000, 300)).toBe(700);
     });
     
     it('should handle partial achievement', () => {
       expect(calculateGrossProfit(500, 1000, 300)).toBe(350);
     });
     
     it('should handle zero target', () => {
       expect(calculateGrossProfit(1000, 0, 300)).toBe(700);
     });
   });
   ```

2. **Update Existing Tests**
   - Fix any failing tests due to calculation changes

3. **Manual Testing Checklist**
   - [ ] Overview page shows correct values
   - [ ] Business Units page calculations correct
   - [ ] Excel export contains correct values
   - [ ] Edge cases handled properly

### Task Group 5: Documentation

1. **Code Documentation**
   - Add JSDoc comments to utility functions
   - Document the formula change in relevant files

2. **Release Notes**
   ```markdown
   ## Gross Profit Calculation Update
   
   ### What Changed
   - Updated gross profit formula from `target - cost` to `revenue - (revenue/target) * cost`
   - This provides a more accurate profit calculation based on actual performance
   
   ### Impact
   - All gross profit values will change
   - Historical comparisons may show differences
   ```

## Execution Command
```bash
# Run tests
npm test

# Build and verify
npm run build

# Deploy
npm run deploy
```

## Validation Checklist
- [ ] All unit tests pass
- [ ] Manual testing completed
- [ ] Excel exports verified
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Documentation updated