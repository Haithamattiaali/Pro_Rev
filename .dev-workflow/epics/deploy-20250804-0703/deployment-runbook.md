# Deployment Runbook - Production

## Quick Deployment Commands

### Option 1: Direct Push to Main (if you have permissions)
```bash
# From feature branch
git checkout main
git merge feature/smooth-filter-transitions
git push origin main
```

### Option 2: Create Pull Request (recommended)
```bash
# Push feature branch
git push origin feature/smooth-filter-transitions

# Then on GitHub:
# 1. Create Pull Request from feature/smooth-filter-transitions to main
# 2. Review changes
# 3. Merge PR
```

## Deployment Verification Script

```bash
#!/bin/bash
# verify-deployment.sh

echo "🚀 Verifying Production Deployment..."

# Check Frontend
FRONTEND_URL="https://proceed-revenue-dashboard-1750804938.netlify.app"
echo "Checking frontend at $FRONTEND_URL..."
curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL

# Check Backend Health
BACKEND_URL="https://your-backend.onrender.com/api/health"
echo "Checking backend health..."
curl -s $BACKEND_URL | jq .

echo "✅ Deployment verification complete"
```

## Manual Deployment Steps

### 1. Prepare for Deployment
```bash
# Ensure clean working directory
git status

# Run any final tests locally
npm test

# Build locally to verify
npm run build
```

### 2. Deploy Frontend Only (Netlify CLI)
```bash
# If you have Netlify CLI installed
netlify deploy --prod --dir=dist
```

### 3. Deploy via GitHub

Since both Netlify and Render are connected to your GitHub repository, the easiest deployment method is:

```bash
# 1. Commit all changes
git add .
git commit -m "feat(filters): deploy data-aware filters with auto-refresh"

# 2. Push to main branch
git push origin main
```

## Post-Deployment Checklist

- [ ] Frontend loads: https://proceed-revenue-dashboard-1750804938.netlify.app
- [ ] "Last upload period" indicator visible
- [ ] YTD/QTD/MTD buttons work correctly
- [ ] Q3 is clickable with August data
- [ ] Upload an Excel file - verify auto-refresh
- [ ] Check browser console for errors
- [ ] Test on mobile device
- [ ] Verify backend API responses

## Troubleshooting

### Frontend Issues
- **White screen**: Check browser console, might be API URL issue
- **Filters not working**: Clear browser cache, check console errors
- **Upload fails**: Verify backend URL in environment variables

### Backend Issues
- **502 errors**: Backend might be starting up, wait 1-2 minutes
- **Database errors**: Check Render logs, might need to restart
- **CORS errors**: Verify frontend URL in backend CORS config

### Quick Fixes
```bash
# Force cache clear on Netlify
# Add _redirects file or use query parameter

# Restart Render backend
# Use Render dashboard or CLI

# Check logs
# Netlify: Functions tab in dashboard
# Render: Logs tab in dashboard
```

## Communication Template

### Pre-Deployment
```
Team,

Deploying dashboard updates to production:
- Data-aware YTD/QTD/MTD filters
- Auto-refresh after Excel upload
- Partial quarter support

Deployment window: [time]
Expected downtime: None
```

### Post-Deployment
```
Team,

Dashboard updates deployed successfully:
✅ YTD/QTD/MTD now use uploaded data dates
✅ Auto-refresh works - no manual refresh needed
✅ Q3 selectable with partial data

Please test and report any issues.
```