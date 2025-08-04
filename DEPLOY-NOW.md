# 🚀 Deploy to Production NOW

## Quick Deploy (One Command)

```bash
./deploy-netlify.sh
```

## Manual Deploy Steps

If the script doesn't work, follow these steps:

### 1. Build the project
```bash
npm run build
```

### 2. Deploy to Netlify
```bash
netlify deploy --prod --dir=dist --site=proceed-revenue-dashboard-1750804938
```

## Important URLs

- **Production URL**: https://proceed-revenue-dashboard-1750804938.netlify.app
- **Netlify Dashboard**: https://app.netlify.com/sites/proceed-revenue-dashboard-1750804938

## Verify Deployment

After deployment, verify:
1. Visit https://proceed-revenue-dashboard-1750804938.netlify.app
2. Check that latest changes are visible
3. Test filter functionality (Q3 should be clickable)

## Rollback if Needed

```bash
# List recent deployments
netlify deploys:list --site=proceed-revenue-dashboard-1750804938

# Rollback to previous deploy
netlify deploys:restore DEPLOY_ID --site=proceed-revenue-dashboard-1750804938
```

## Already Logged In?

The Netlify CLI should already be authenticated. If not:
```bash
netlify login
```

---
Ready to deploy! Just run: `./deploy-netlify.sh`