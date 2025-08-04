# Quick Start: Automated Parallel Deployment

## Immediate Implementation Steps

### Step 1: Create the Deployment Workflow

Create `.github/workflows/deploy-parallel.yml`:

```yaml
name: Deploy Frontend & Backend in Parallel

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  # Check what changed
  check-changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
    steps:
      - uses: actions/checkout@v3
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            frontend:
              - 'src/**'
              - 'public/**'
              - 'index.html'
              - 'vite.config.js'
              - 'tailwind.config.js'
              - 'package.json'
              - 'package-lock.json'
            backend:
              - 'backend/**'

  # Deploy Frontend (Netlify already auto-deploys, just verify)
  deploy-frontend:
    needs: [check-changes]
    if: needs.check-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Wait for Netlify auto-deploy
        run: |
          echo "Netlify is auto-deploying frontend..."
          sleep 60  # Give Netlify time to start
      
      - name: Verify frontend deployment
        run: |
          # Check if site is up
          for i in {1..10}; do
            if curl -s -o /dev/null -w "%{http_code}" https://proceed-revenue-dashboard-1750804938.netlify.app | grep -q "200"; then
              echo "✅ Frontend deployed successfully!"
              exit 0
            fi
            echo "Waiting for frontend... attempt $i/10"
            sleep 30
          done
          echo "❌ Frontend deployment verification failed"
          exit 1

  # Deploy Backend to Render
  deploy-backend:
    needs: [check-changes]
    if: needs.check-changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render via API
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
        run: |
          # Trigger deployment
          RESPONSE=$(curl -s -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            -H "Content-Type: application/json" \
            -d '{"clearCache": "do_not_clear"}' \
            "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys")
          
          DEPLOY_ID=$(echo $RESPONSE | jq -r '.id')
          echo "Deployment started with ID: $DEPLOY_ID"
          
          # Wait for deployment to complete
          for i in {1..20}; do
            STATUS=$(curl -s \
              -H "Authorization: Bearer $RENDER_API_KEY" \
              "https://api.render.com/v1/deploys/$DEPLOY_ID" | jq -r '.status')
            
            echo "Deployment status: $STATUS"
            
            if [ "$STATUS" = "live" ]; then
              echo "✅ Backend deployed successfully!"
              exit 0
            elif [ "$STATUS" = "failed" ] || [ "$STATUS" = "canceled" ]; then
              echo "❌ Deployment failed with status: $STATUS"
              exit 1
            fi
            
            sleep 30
          done
          
          echo "❌ Deployment timed out"
          exit 1
      
      - name: Verify backend health
        run: |
          # Wait a bit for service to be ready
          sleep 30
          
          # Check health endpoint
          BACKEND_URL="${{ secrets.BACKEND_URL }}"
          if [ -z "$BACKEND_URL" ]; then
            BACKEND_URL="https://proceed-revenue-backend.onrender.com"
          fi
          
          for i in {1..5}; do
            if curl -s "$BACKEND_URL/api/health" | grep -q "status"; then
              echo "✅ Backend health check passed!"
              exit 0
            fi
            echo "Waiting for backend health... attempt $i/5"
            sleep 20
          done
          
          echo "❌ Backend health check failed"
          exit 1

  # Notify on completion
  notify-deployment:
    needs: [deploy-frontend, deploy-backend]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Determine status
        id: status
        run: |
          if [ "${{ needs.deploy-frontend.result }}" = "success" ] && [ "${{ needs.deploy-backend.result }}" = "success" ]; then
            echo "status=success" >> $GITHUB_OUTPUT
            echo "color=good" >> $GITHUB_OUTPUT
            echo "message=✅ Both frontend and backend deployed successfully!" >> $GITHUB_OUTPUT
          else
            echo "status=failure" >> $GITHUB_OUTPUT
            echo "color=danger" >> $GITHUB_OUTPUT
            echo "message=❌ Deployment failed! Frontend: ${{ needs.deploy-frontend.result }}, Backend: ${{ needs.deploy-backend.result }}" >> $GITHUB_OUTPUT
          fi
      
      - name: Send Slack notification
        if: vars.SLACK_WEBHOOK_URL != ''
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: |
          curl -X POST $SLACK_WEBHOOK_URL \
            -H 'Content-type: application/json' \
            -d '{
              "text": "Deployment Status",
              "attachments": [{
                "color": "${{ steps.status.outputs.color }}",
                "title": "Proceed Dashboard Deployment",
                "text": "${{ steps.status.outputs.message }}",
                "fields": [
                  {
                    "title": "Commit",
                    "value": "${{ github.event.head_commit.message }}",
                    "short": false
                  },
                  {
                    "title": "Author",
                    "value": "${{ github.event.head_commit.author.name }}",
                    "short": true
                  },
                  {
                    "title": "Branch",
                    "value": "${{ github.ref_name }}",
                    "short": true
                  }
                ],
                "footer": "GitHub Actions",
                "footer_icon": "https://github.githubassets.com/favicon.ico",
                "ts": ${{ github.event.head_commit.timestamp }}
              }]
            }'
```

### Step 2: Add Required Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add these secrets:

```
RENDER_API_KEY=your_render_api_key_here
RENDER_SERVICE_ID=your_render_service_id_here
BACKEND_URL=https://your-backend.onrender.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL (optional)
```

### Step 3: Get Render API Credentials

1. **Get Render API Key**:
   - Log in to [Render Dashboard](https://dashboard.render.com)
   - Go to Account Settings → API Keys
   - Create a new API key named "GitHub Actions"
   - Copy the key (you won't see it again!)

2. **Get Render Service ID**:
   - Go to your backend service in Render
   - The URL will be: `https://dashboard.render.com/web/srv-XXXXX`
   - The `srv-XXXXX` part is your service ID

### Step 4: Update Render Configuration

Update your `backend/render.yaml`:

```yaml
services:
  - type: web
    name: proceed-revenue-backend
    runtime: node
    buildCommand: npm install
    startCommand: node server.js
    autoDeploy: false  # We're using GitHub Actions now
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
    disk:
      name: sqlite-data
      mountPath: /var/data
      sizeGB: 1
    healthCheckPath: /api/health
```

### Step 5: Add Health Check Endpoint

Add to `backend/server.js`:

```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    // Check database connection
    const db = require('./database/persistent-db');
    const test = db.prepare('SELECT 1 as test').get();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: test ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV,
      version: process.env.RENDER_GIT_COMMIT || 'unknown'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Step 6: Test the Workflow

1. Make a small change to your code
2. Commit and push to a feature branch:
   ```bash
   git add .
   git commit -m "test: automated deployment"
   git push origin feature/test-deployment
   ```

3. Create a pull request to main
4. Merge the PR
5. Watch the Actions tab in GitHub to see the deployment

### Step 7: Enable for Production

Once tested, this workflow will:
- ✅ Automatically deploy when you push to main
- ✅ Deploy frontend and backend in parallel
- ✅ Only deploy what changed
- ✅ Verify deployments with health checks
- ✅ Send notifications (if Slack is configured)

## Troubleshooting

### If Render deployment fails:
1. Check Render dashboard for logs
2. Verify API key is correct
3. Ensure service ID is correct
4. Check if Render service has enough resources

### If health check fails:
1. Check backend logs in Render
2. Verify database is connected
3. Ensure health endpoint is accessible
4. Check CORS settings

### If you need to rollback:
```bash
# Via Render Dashboard:
# 1. Go to your service
# 2. Click "Events" tab
# 3. Find previous successful deploy
# 4. Click "Rollback to this deploy"

# Via API:
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID/rollback"
```

## Next Steps

1. **Add staging environment**: Create separate workflow for staging
2. **Add database migrations**: Automate schema updates
3. **Add performance tests**: Check response times post-deploy
4. **Add more notifications**: Email, Teams, Discord
5. **Add deployment approvals**: Require manual approval for production

This setup gives you truly parallel deployments with zero manual intervention!