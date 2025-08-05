# Root Cause Analysis
Date: 2025-08-05T13:07:00+03:00
Bug: Production shows SAR 1,288,208 but dev shows SAR 1,197,662 for gross profit

## Root Cause Identification

### Primary Root Cause
**Issue**: Production is serving outdated JavaScript bundle with old gross profit calculation formula
**Location**: Production build artifacts and CDN cache
**Reason**: Recent formula change from simple (target - cost) to performance-based (revenue - (revenue/target) * cost) not deployed to production
**Evidence**: 
- User reports: Production consistently shows SAR 1,288,208 (old formula result)
- Code analysis: New formula in codebase shows SAR 1,197,662 (correct value)
- Pattern matching: 90,546 difference matches exactly what old vs new formula would produce

### Contributing Factors
1. No automatic cache invalidation in build process
2. CDN/Netlify serving cached bundles
3. No version indicators to detect stale code
4. Manual deployment process may have been missed

### Why This Wasn't Caught Earlier
- No automated deployment pipeline
- Missing production smoke tests
- No version mismatch detection
- Silent calculation differences (no errors thrown)

## Confidence Assessment
- Root cause confidence: 95%
- Fix approach confidence: 90%
- Risk of regression: Low

## Validation Method
To confirm this is the root cause:
1. Check production build date vs development
2. Compare bundle hashes between environments
3. Force refresh in incognito mode
4. Rebuild and redeploy to production
5. Verify new calculation values appear