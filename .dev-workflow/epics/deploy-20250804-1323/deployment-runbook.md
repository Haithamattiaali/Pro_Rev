# Deployment Runbook - Netlify CLI Production Deployment

## Pre-Deployment Checklist

- [x] Netlify CLI installed and authenticated
- [x] Site linked to proceed-revenue-dashboard-1750804938
- [ ] Backend production URL confirmed
- [ ] All tests passing
- [ ] Git changes committed
- [ ] Team notified (if applicable)

## Deployment Steps

### Step 1: Update Production Environment Variables

```bash
# Create production .env file
cp .env .env.production.local

# Edit .env.production.local and update:
# VITE_API_URL=https://your-production-backend.onrender.com/api
```

**Important**: Replace with your actual production backend URL

### Step 2: Build for Production

```bash
# Clean previous builds
rm -rf dist

# Build with production optimizations
npm run build

# Verify build output
ls -la dist/
```

### Step 3: Deploy to Netlify (Direct CLI)

```bash
# Deploy directly to production (bypasses Git)
netlify deploy --prod --dir=dist

# Alternative: If you want to preview first
# netlify deploy --dir=dist
# Then if satisfied:
# netlify deploy --prod --dir=dist
```

### Step 4: Verify Deployment

1. **Check deployment URL**: https://proceed-revenue-dashboard-1750804938.netlify.app
2. **Test critical features**:
   - Dashboard loads correctly
   - Filter changes work instantly (new caching)
   - Data displays properly
   - No console errors

3. **Verify caching improvements**:
   - Open Network tab in DevTools
   - Switch between MTD/QTD/YTD
   - Should see minimal API calls
   - Loading states should be minimal

4. **Check deployment in Netlify UI**:
   - Go to: https://app.netlify.com/projects/proceed-revenue-dashboard-1750804938
   - Verify deployment appears in deployment history

### Step 5: Post-Deployment

- Clear browser cache if testing
- Monitor for any error reports
- Document deployment in logs

## Rollback Procedure

If issues are discovered:

```bash
# Option 1: Rollback through Netlify UI
# Go to Deploys tab and click "Publish deploy" on previous version

# Option 2: Redeploy previous commit
git checkout <previous-commit-hash>
npm run build
netlify deploy --prod --dir=dist
```

## Troubleshooting Guide

### Build Failures
- Check Node version: `node --version` (should be 18.x)
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run lint`

### Deployment Failures
- Verify Netlify authentication: `netlify status`
- Check site linking: `netlify link`
- Ensure dist folder exists and has content

### Runtime Issues
- Check browser console for errors
- Verify API URL is correct in Network tab
- Check CORS settings on backend

## Command Summary

```bash
# Complete deployment sequence
cp .env .env.production.local
# Edit .env.production.local with production API URL
npm run build
netlify deploy --prod --dir=dist
```

## Notes

- This deployment maintains the same URL: https://proceed-revenue-dashboard-1750804938.netlify.app
- No new site is created
- Git repository remains unchanged
- Auto-deploy from Git remains configured but bypassed for this deployment