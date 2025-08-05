# Netlify Environment Variable Setup

To ensure the production build uses the correct API URL, follow these steps:

## Option 1: Set Environment Variable in Netlify Dashboard (Recommended)

1. Go to https://app.netlify.com
2. Select your site: `proceed-revenue-dashboard-1750804938`
3. Go to **Site configuration** → **Environment variables**
4. Click **Add a variable**
5. Add the following:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://proceed-revenue-backend.onrender.com/api`
   - **Scopes**: Select both "Production" and "Preview"
6. Click **Save**
7. Trigger a redeploy from the **Deploys** tab

## Option 2: Use .env.production (Current Setup)

The `.env.production` file is already configured with:
```
VITE_API_URL=https://proceed-revenue-backend.onrender.com/api
```

This should be picked up during the build process.

## Verifying the Setup

After deployment, check:
1. Open browser console on production site
2. Network tab should show API calls going to `https://proceed-revenue-backend.onrender.com/api/*`
3. No more 404 errors for API endpoints

## Troubleshooting

If issues persist:
1. Clear browser cache
2. Check Netlify build logs for any errors
3. Verify the backend is running on Render
4. Test API directly: `curl https://proceed-revenue-backend.onrender.com/api/health`