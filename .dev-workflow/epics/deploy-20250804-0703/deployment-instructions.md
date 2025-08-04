# 🚀 Production Deployment Instructions

## Immediate Action Required

### 1. Update Environment Variables in Netlify

**CRITICAL**: The frontend is currently configured to use localhost. You need to update this in Netlify:

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site: `proceed-revenue-dashboard-1750804938`
3. Go to **Site Configuration** → **Environment variables**
4. Add/Update:
   ```
   VITE_API_URL = https://your-render-backend.onrender.com/api
   ```
   (Replace with your actual Render backend URL)

### 2. Deploy to Production

Since you're currently on `feature/smooth-filter-transitions` branch:

```bash
# Option A: Merge to main branch
git checkout main
git pull origin main
git merge feature/smooth-filter-transitions
git push origin main

# Option B: Push directly if this is your deployment branch
git push origin feature/smooth-filter-transitions:main
```

### 3. What Happens Next

**Frontend (Netlify)**:
- Automatically detects push
- Runs `npm run build`
- Deploys in ~2-3 minutes
- Live at: https://proceed-revenue-dashboard-1750804938.netlify.app

**Backend (Render)**:
- Automatically detects push
- Runs `npm install`
- Starts server
- Takes ~5-10 minutes

### 4. Quick Verification

After deployment completes:

1. **Open Dashboard**: https://proceed-revenue-dashboard-1750804938.netlify.app
2. **Check New Features**:
   - Look for "Last upload period: Jul" indicator
   - Click quarterly view and verify Q3 is clickable
   - Upload a test Excel file
   - Verify dashboard refreshes automatically (no manual F5 needed)

### 5. If Something Goes Wrong

**Frontend Rollback**:
- Netlify Dashboard → Deploys → Click previous deploy → "Publish deploy"

**Backend Rollback**:
- Render Dashboard → Events → Find previous deploy → "Rollback"

## Summary of Changes Being Deployed

✅ **Data-Aware Filters**: YTD/QTD/MTD use uploaded data, not system date
✅ **Auto-Refresh**: Dashboard updates automatically after Excel upload  
✅ **Q3 Quarter Fix**: Partial quarters (like Aug without Sep) are now selectable
✅ **UI Improvements**: Brand-colored "Last upload period" indicator

## Need Help?

- Check Netlify logs: Dashboard → Functions
- Check Render logs: Dashboard → Logs
- Frontend URL: https://proceed-revenue-dashboard-1750804938.netlify.app
- Make sure `VITE_API_URL` is set correctly in Netlify!