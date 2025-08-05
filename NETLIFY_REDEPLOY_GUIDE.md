# How to Redeploy on Netlify

## Method 1: Via Netlify Dashboard (Easiest)

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com
   - Log in with your account

2. **Select Your Site**
   - Click on `proceed-revenue-dashboard-1750804938`

3. **Trigger Redeploy**
   - Go to the **"Deploys"** tab
   - Click **"Trigger deploy"** button (top right)
   - Select **"Deploy site"**

## Method 2: Clear Cache and Deploy

If you want to ensure a completely fresh build:

1. In Netlify Dashboard → **Deploys** tab
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. This rebuilds everything from scratch

## Method 3: Via Git Push (Automatic)

Any push to your connected branch triggers a deploy:

```bash
# Make any small change
echo " " >> README.md
git add README.md
git commit -m "chore: trigger redeploy"
git push origin master
```

## Method 4: Via Netlify CLI

If you have Netlify CLI installed:

```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Deploy
netlify deploy --prod
```

## Method 5: Rollback to Previous Deploy

If the latest deploy has issues:

1. Go to **Deploys** tab
2. Find a previous successful deploy
3. Click on it
4. Click **"Publish deploy"**

## Checking Deploy Status

1. **In Dashboard**: 
   - Go to **Deploys** tab
   - See real-time build logs
   - Green checkmark = successful
   - Red X = failed

2. **Build Logs**:
   - Click on any deploy
   - View detailed logs
   - Check for errors

## Common Deploy Issues

### Environment Variables Not Working
- Go to **Site configuration** → **Environment variables**
- Add `VITE_API_URL`: `https://proceed-revenue-backend.onrender.com/api`
- Redeploy after adding

### Build Failing
- Check build command: `npm run build`
- Check publish directory: `dist`
- Review build logs for errors

### Cache Issues
- Use "Clear cache and deploy site" option
- Or add `--no-cache` to build command

## Deploy Webhooks

You can also trigger deploys via webhook:
1. Go to **Site configuration** → **Build & deploy** → **Build hooks**
2. Create a build hook
3. Use the URL to trigger deploys programmatically

Example:
```bash
curl -X POST https://api.netlify.com/build_hooks/YOUR_HOOK_ID
```

## Quick Redeploy Checklist

- [ ] Check current deploy status
- [ ] Verify environment variables are set
- [ ] Clear browser cache after deploy
- [ ] Check browser console for errors
- [ ] Verify API calls use correct backend URL