# Deployment Runbook: Proceed Revenue Dashboard

## Pre-Deployment Checklist
- [x] Git status checked - changes found
- [x] Changes committed to git
- [ ] Build tested locally
- [ ] Push to GitHub repository
- [ ] Netlify auto-deploy triggered
- [ ] Deployment verified

## Deployment Steps

### Step 1: Verify Local Build
```bash
npm run build
```

### Step 2: Push to GitHub
```bash
git push origin master
```

### Step 3: Monitor Netlify Deployment
- Check Netlify dashboard for build status
- Wait for deployment to complete
- Verify build logs for any errors

### Step 4: Verify Deployment
- Check application URL: https://proceed-revenue-dashboard-1750804938.netlify.app/
- Test critical paths:
  - Overview page loads
  - Period filters work (MTD/QTD/YTD)
  - Business Units data displays
  - Customer data displays
  - Upload functionality works
- Monitor browser console for errors
- Verify API connectivity

### Step 5: Post-Deployment
- Clear browser cache if needed
- Test export functionality
- Verify all filters work correctly
- Check responsive design

## Rollback Procedure
If issues are found:
1. Go to Netlify dashboard
2. Navigate to Deploys
3. Find previous successful deployment
4. Click "Publish deploy" on previous version

## Troubleshooting Guide
- **Build fails**: Check Node version, dependencies in package.json
- **API connection fails**: Verify VITE_API_URL environment variable
- **Missing features**: Ensure all files are committed and pushed
- **Performance issues**: Check bundle size, enable caching headers
