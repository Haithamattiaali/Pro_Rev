# Console Bug Fix Tasks

## Immediate Actions
1. Fix import statement in lastCompliantMonthService.js
   - Change line 1 from `import { api } from './api.service.js';`
   - To: `import api from './api.service';`
   - Test that the service loads correctly

2. Verify all api method calls work
   - Check `api.getAnalysisValidation(year)` calls
   - Ensure no TypeErrors on api methods
   - Confirm data flows correctly

3. Check for similar import issues
   - Search for other `import { api }` patterns
   - Verify test files use correct imports
   - Update any found inconsistencies

## Validation
1. Start development server - no console errors
2. Test YTD/QTD/MTD functionality
3. Verify last compliant month detection works
4. Check data availability indicator displays
5. Run any unit tests for the service

## Follow-up Improvements
1. Add ESLint rule for import/export validation
2. Document import conventions in README
3. Consider adding TypeScript declarations
4. Update developer onboarding docs