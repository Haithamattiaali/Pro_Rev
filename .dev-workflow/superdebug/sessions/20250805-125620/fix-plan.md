# Fix Plan
Date: 2025-08-05T13:08:00+03:00
Bug: Production shows SAR 1,288,208 but dev shows SAR 1,197,662 for gross profit
Session: 20250805-125620

## Executive Summary
Root cause identified as outdated JavaScript bundle in production with old gross profit calculation formula. Fix involves rebuilding and redeploying with proper cache invalidation.

## Detailed Fix Plan

### Step 1: Immediate Fix
**Task**: Rebuild and deploy latest code to production
**Location**: Production deployment pipeline
**Changes**:
1. Run `npm run build` to create fresh production bundle
2. Deploy new build to Netlify/production
3. Clear CDN cache in Netlify dashboard
4. Verify deployment with new timestamp

### Step 2: Prevent Recurrence
**Task**: Add cache-busting and version tracking
**Actions**:
1. Add build timestamp to bundle filenames
2. Implement version.json with build info
3. Add production deployment checklist
4. Configure automatic cache invalidation

### Step 3: Testing Requirements
**Task**: Verify fix effectiveness
**Tests to implement**:
1. Manual verification of gross profit values
2. Compare production vs development calculations
3. Test in multiple browsers (clear cache first)
4. Automated smoke test for calculation accuracy

### Step 4: Code Review Points
**Focus areas for review**:
1. No code changes needed - deployment issue only
2. Review deployment process documentation
3. Verify build configuration

### Step 5: Deployment Considerations
**Pre-deployment**:
- [ ] Run full test suite locally
- [ ] Verify build completes successfully
- [ ] Check bundle size is reasonable

**Post-deployment**:
- [ ] Clear all caches (CDN, browser)
- [ ] Verify correct gross profit value (SAR 1,197,662)
- [ ] Monitor for 24 hours
- [ ] Notify stakeholders of fix

## Task Breakdown

### Immediate Actions (Today)
1. Build production bundle
2. Deploy to Netlify
3. Clear CDN cache
4. Verify fix in production

### Follow-up Actions (This Week)
1. Implement cache-busting strategy
2. Add version tracking
3. Document deployment process
4. Set up automated deployment

## Commands to Execute

```bash
# 1. Build fresh production bundle
npm run build

# 2. Deploy to production (using Netlify CLI)
netlify deploy --prod

# 3. Verify build info
ls -la dist/assets/

# 4. Test production values
# Navigate to production URL and check gross profit
```

## Success Criteria
- Production shows SAR 1,197,662 for gross profit (not 1,288,208)
- All calculations match development environment
- No cache issues reported by users
- Version tracking implemented