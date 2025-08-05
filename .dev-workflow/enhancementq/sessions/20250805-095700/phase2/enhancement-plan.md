# Enhancement Implementation Plan
Session: 20250805-095700
Date: Mon Aug 5 2025

## Executive Summary
Enhancement: Update gross profit formula to `revenue - (revenue/target)*cost`
Mode: manual
Status: Planning Complete

## Implementation Strategy

### Phase 1: Setup and Preparation
1. Create feature branch `feature/gross-profit-formula-update`
2. Set up comprehensive test cases
3. Create centralized calculation utility
4. Document the formula change

### Phase 2: Core Implementation
1. **Backend Updates**
   - Update `backend/services/data.service.js` calculations
   - Update `backend/services/excel-export.service.js` 
   - Update `backend/services/forecast.service.js`
   - Update calculation scripts

2. **Frontend Updates**
   - Update `src/pages/BusinessUnits.jsx`
   - Update `src/utils/dataTransformers.js`
   - Update any other components using gross profit

3. **Testing Infrastructure**
   - Create unit tests for new formula
   - Update existing tests
   - Add edge case tests

### Phase 3: Testing and Refinement
1. Run all unit tests
2. Manual testing with various data scenarios
3. Verify Excel exports
4. Performance testing
5. Edge case validation

### Phase 4: Documentation and Deployment
1. Update calculation documentation
2. Create release notes
3. Prepare deployment instructions
4. Monitor after deployment

## Technical Approach

### Centralized Calculation Function
```javascript
// utils/profitCalculations.js
export function calculateGrossProfit(revenue, target, cost) {
  // Handle edge cases
  if (!target || target === 0) {
    return revenue - cost; // Fallback when no target
  }
  
  // New formula: revenue - (revenue/target) * cost
  const achievementRatio = revenue / target;
  const proportionalCost = achievementRatio * cost;
  return revenue - proportionalCost;
}

export function calculateGrossProfitMargin(grossProfit, revenue) {
  if (!revenue || revenue === 0) return 0;
  return (grossProfit / revenue) * 100;
}
```

### Implementation Order
1. Create utility functions
2. Update backend services
3. Update frontend components
4. Update tests
5. Update documentation

## Risk Mitigation
- **Data Consistency**: Update all locations simultaneously
- **Testing**: Comprehensive test coverage before deployment
- **Rollback Plan**: Keep old formula commented for quick revert
- **Communication**: Clear release notes about calculation change

## Timeline Estimate
- Setup & Preparation: 1 hour
- Core Implementation: 3-4 hours
- Testing & Refinement: 2 hours
- Documentation & Deployment: 1 hour
- **Total**: 7-8 hours