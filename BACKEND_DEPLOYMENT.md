# Backend Auto-Deployment Setup Guide

This guide will help you set up automatic deployment of the backend to Render whenever you push changes to GitHub.

## Prerequisites

1. Backend service already deployed on Render
2. GitHub repository access
3. Render account with deploy permissions

## Step-by-Step Setup

### Step 1: Get Render Deploy Hook URL

1. Log into [Render Dashboard](https://dashboard.render.com)
2. Find your backend service (e.g., "proceed-dashboard-backend")
3. Click on the service to open it
4. Go to **Settings** tab
5. Scroll down to **Deploy Hook** section
6. Click **Generate Deploy Hook** if you don't have one
7. Copy the deploy hook URL (looks like: `https://api.render.com/deploy/srv-xxxxx?key=yyyy`)

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository: https://github.com/Haithamattiaali/Pro_Rev
2. Click **Settings** tab (repository settings, not account settings)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button
5. Add the following secrets:

   **Required Secret:**
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: Your Render deploy hook URL from Step 1

   **Optional Secret (for health checks):**
   - Name: `BACKEND_URL`
   - Value: Your backend URL (e.g., `https://proceed-dashboard-backend.onrender.com`)

### Step 3: GitHub Actions Workflow

The workflow file (`.github/workflows/deploy-backend.yml`) is already created and will:

1. Trigger on pushes to `master` or `main` branch
2. Only deploy when files in the `backend/` directory change
3. Call the Render deploy hook to trigger deployment
4. Wait and check if the backend is healthy after deployment

### Step 4: Test the Auto-Deployment

1. Make a small change to any file in the `backend/` directory
2. Commit and push to master:
   ```bash
   git add .
   git commit -m "test: trigger auto-deployment"
   git push origin master
   ```
3. Go to your repository's **Actions** tab on GitHub
4. You should see a workflow running called "Deploy Backend to Render"
5. Click on it to see the progress

### Step 5: Monitor Deployment

1. Check GitHub Actions for the workflow status
2. Check Render dashboard for deployment logs
3. The workflow will show:
   - ✅ If deployment was triggered successfully
   - ✅ If backend health check passes
   - ❌ If there are any issues

## Troubleshooting

### If deployment doesn't trigger:
- Ensure you're pushing to `master` or `main` branch
- Check that you've changed files in the `backend/` directory
- Verify the `RENDER_DEPLOY_HOOK_URL` secret is set correctly

### If health check fails:
- Check Render logs for deployment errors
- Ensure your backend has a `/api/health` endpoint
- Update the `BACKEND_URL` secret or the hardcoded URL in the workflow

### If you see "RENDER_DEPLOY_HOOK_URL secret is not set!":
- Go back to Step 2 and add the GitHub secret
- Make sure the secret name matches exactly: `RENDER_DEPLOY_HOOK_URL`

## Manual Deployment

If you need to manually trigger a deployment:

1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

OR use the deploy hook directly:

```bash
curl -X POST "YOUR_DEPLOY_HOOK_URL"
```

## What Gets Deployed

- The entire `backend/` directory
- Render will run `npm install` and `npm start`
- Environment variables are managed in Render dashboard

## Important Notes

- Never commit the deploy hook URL to your code
- The workflow only runs when backend files change
- Deployment takes 3-5 minutes on Render's free tier
- Make sure your `backend/package.json` has the correct start script