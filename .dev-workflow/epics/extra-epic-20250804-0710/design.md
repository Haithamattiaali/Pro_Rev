# Design: Automated Parallel Deployment System

## Architecture Overview

```
┌─────────────────┐
│   GitHub Push   │
│   (main branch) │
└────────┬────────┘
         │
         v
┌─────────────────────────────────────┐
│       GitHub Actions Workflow        │
│  ┌─────────────┐  ┌───────────────┐ │
│  │  Run Tests  │  │ Check Changes │ │
│  └──────┬──────┘  └───────┬───────┘ │
│         │                  │         │
│         v                  v         │
│  ┌─────────────────────────────────┐│
│  │        Parallel Jobs            ││
│  │ ┌─────────────┐ ┌─────────────┐ ││
│  │ │   Frontend  │ │   Backend   │ ││
│  │ │   Deploy    │ │   Deploy    │ ││
│  │ └──────┬──────┘ └──────┬──────┘ ││
│  └────────┼────────────────┼────────┘│
└───────────┼────────────────┼─────────┘
            │                │
            v                v
    ┌───────────────┐ ┌───────────────┐
    │    Netlify    │ │    Render     │
    │  (Auto-deploy)│ │  (API Deploy) │
    └───────────────┘ └───────────────┘
```

## Workflow Design

### Main Deployment Workflow (.github/workflows/deploy-all.yml)

```yaml
name: Deploy Frontend & Backend
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  # Check what changed
  changes:
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
              - 'package.json'
              - 'vite.config.js'
            backend:
              - 'backend/**'
              - 'package.json'

  # Run tests
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run all tests
        run: |
          npm install
          npm test
          cd backend && npm test

  # Deploy Frontend (only if changed)
  deploy-frontend:
    needs: [changes, test]
    if: needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Netlify Deploy
        run: echo "Netlify auto-deploys on push"
      
      - name: Wait for Netlify
        run: |
          # Check Netlify deployment status
          sleep 30
      
      - name: Verify Frontend
        run: |
          curl -f https://proceed-revenue-dashboard.netlify.app || exit 1

  # Deploy Backend (only if changed)
  deploy-backend:
    needs: [changes, test]
    if: needs.changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
        run: |
          # Use Render API to trigger deployment
          curl -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            -H "Content-Type: application/json" \
            -d '{"clearCache": "do_not_clear"}' \
            "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys"
      
      - name: Wait for deployment
        run: |
          # Poll deployment status
          sleep 60
      
      - name: Run migrations
        run: |
          # Execute database migrations
          cd backend
          npm run migrate:prod
      
      - name: Health check
        run: |
          curl -f https://your-backend.onrender.com/api/health || exit 1

  # Notify results
  notify:
    needs: [deploy-frontend, deploy-backend]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Send notification
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: |
          # Send deployment status to Slack
```

## Render Configuration Updates

### Option 1: Render Blueprint (render.yaml)
```yaml
services:
  - type: web
    name: proceed-revenue-backend
    runtime: node
    buildCommand: npm install
    startCommand: node server.js
    autoDeploy: true  # Enable auto-deploy
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: DATABASE_URL
        value: /var/data/proceed_revenue.db
    disk:
      name: sqlite-data
      mountPath: /var/data
      sizeGB: 1
    healthCheckPath: /api/health
    # New settings for zero-downtime
    numInstances: 1
    plan: starter
```

### Option 2: Render Dashboard Configuration
1. Enable "Auto-Deploy" on Render dashboard
2. Connect to GitHub repository
3. Set branch to "main"
4. Configure deploy hooks

## Database Migration Strategy

### Migration Script (backend/scripts/migrate.js)
```javascript
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const db = new Database(process.env.DATABASE_URL);
  
  // Create migrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      filename TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Run pending migrations
  const migrations = fs.readdirSync('./migrations');
  for (const file of migrations) {
    const executed = db.prepare('SELECT 1 FROM migrations WHERE filename = ?').get(file);
    if (!executed) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join('./migrations', file), 'utf8');
      db.exec(sql);
      db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file);
    }
  }
  
  db.close();
}
```

## Monitoring & Alerting

### Health Check Endpoint (backend/server.js)
```javascript
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const db = getDatabase();
    const result = db.prepare('SELECT 1').get();
    
    // Check disk space
    const stats = fs.statfsSync('/var/data');
    const freeSpace = stats.bsize * stats.bavail;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      diskSpace: `${Math.round(freeSpace / 1024 / 1024)}MB free`,
      version: process.env.COMMIT_SHA || 'unknown'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Deployment Notifications

#### Slack Notification Format
```json
{
  "text": "Deployment Status",
  "attachments": [{
    "color": "good|danger",
    "fields": [
      {
        "title": "Frontend",
        "value": "✅ Deployed to Netlify",
        "short": true
      },
      {
        "title": "Backend",
        "value": "✅ Deployed to Render",
        "short": true
      },
      {
        "title": "Commit",
        "value": "feat: implement auto-refresh",
        "short": false
      }
    ],
    "timestamp": 1234567890
  }]
}
```

## Rollback Strategy

### Automated Rollback Trigger
```yaml
# In deployment workflow
- name: Check deployment health
  id: health
  run: |
    for i in {1..5}; do
      if curl -f https://backend.onrender.com/api/health; then
        echo "healthy=true" >> $GITHUB_OUTPUT
        exit 0
      fi
      sleep 10
    done
    echo "healthy=false" >> $GITHUB_OUTPUT

- name: Rollback if unhealthy
  if: steps.health.outputs.healthy == 'false'
  run: |
    # Trigger rollback via Render API
    curl -X POST \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      "https://api.render.com/v1/services/$RENDER_SERVICE_ID/rollback"
```

## Security Implementation

### Secrets Management
- All sensitive data in GitHub Secrets
- Minimal permission API keys
- Separate keys for each service
- Regular key rotation schedule

### Log Sanitization
```javascript
// Sanitize logs
function sanitizeLogs(message) {
  const patterns = [
    /Bearer\s+[\w-]+/gi,
    /api[_-]?key["\s:=]+[\w-]+/gi,
    /password["\s:=]+[^"\s]+/gi
  ];
  
  let sanitized = message;
  patterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  return sanitized;
}
```

## Performance Optimization

### Parallel Deployment Benefits
- Frontend: 2-3 minutes (Netlify)
- Backend: 3-5 minutes (Render)
- Total time: 3-5 minutes (parallel) vs 5-8 minutes (sequential)

### Caching Strategy
- Node modules cached in GitHub Actions
- Docker layers cached on Render
- Static assets cached on CDN

## Future Enhancements

1. **Blue-Green Deployments**: Zero-downtime with traffic switching
2. **Canary Releases**: Gradual rollout to percentage of users
3. **Database Branching**: Test migrations on copy before production
4. **Performance Testing**: Automated load tests post-deployment
5. **Multi-Region**: Deploy to multiple regions for redundancy