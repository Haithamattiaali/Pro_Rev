# Best Practice Deployment Setup for Monorepo

## 🏗️ Recommended Architecture

### Option 1: True Monorepo (RECOMMENDED)
Single repository with both frontend and backend, deployed to separate services.

```
proceed-dashboard/
├── src/              # Frontend React code
├── backend/          # Backend Node.js code
├── package.json      # Frontend dependencies
├── netlify.toml      # Frontend deploy config
├── render.yaml       # Backend deploy config
└── .github/
    └── workflows/
        ├── frontend-deploy.yml
        └── backend-deploy.yml
```

### Option 2: Polyrepo
Separate repositories for frontend and backend.

```
proceed-dashboard-frontend/
└── (React app files)

proceed-dashboard-backend/
└── (Node.js API files)
```

## 🚀 Best Practice Implementation (Monorepo)

### 1. Clean Up Current Setup
```bash
# Remove nested git repository
cd backend
rm -rf .git
cd ..

# Add backend to main repo
git add backend/
git commit -m "Integrate backend into monorepo"
git push origin master
```

### 2. Configure Auto-Deployments

#### Render Configuration (render.yaml)
```yaml
services:
  - type: web
    name: proceed-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install
    startCommand: node server.js
    autoDeploy: true  # Auto-deploy on push
    envVars:
      - key: NODE_ENV
        value: production
```

#### Netlify Configuration (netlify.toml)
```toml
[build]
  base = "/"
  command = "npm run build"
  publish = "dist"
  ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF backend/"

[build.environment]
  NODE_VERSION = "18"
```

### 3. GitHub Actions for Better Control
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [master]

jobs:
  detect-changes:
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
              - 'package.json'
              - 'index.html'
            backend:
              - 'backend/**'

  deploy-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './dist'
          production-branch: master
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  deploy-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Run tests locally
- [ ] Check environment variables
- [ ] Verify build passes
- [ ] Review changes

### Deployment Process
1. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: describe changes"
   git push origin master
   ```

2. **Automatic Deployments**
   - Frontend: Netlify auto-builds and deploys
   - Backend: Render auto-builds and deploys

3. **Verify Deployments**
   - Check Netlify dashboard for frontend status
   - Check Render dashboard for backend status
   - Test production URLs

## 🔧 Environment Management

### Development
```bash
# Frontend (.env.development)
VITE_API_URL=http://localhost:3001/api

# Backend (.env.development)
NODE_ENV=development
PORT=3001
```

### Production
```bash
# Frontend (Netlify env vars)
VITE_API_URL=https://your-backend.onrender.com/api

# Backend (Render env vars)
NODE_ENV=production
PORT=3001
```

## 🛡️ Security Best Practices

1. **Never commit secrets**
   ```bash
   # .gitignore
   .env*
   !.env.example
   ```

2. **Use environment variables**
   - Store in Netlify/Render dashboards
   - Never hardcode API keys

3. **Enable CORS properly**
   ```javascript
   // Only allow your frontend domain
   cors({
     origin: process.env.FRONTEND_URL
   })
   ```

## 📊 Monitoring

1. **Setup Error Tracking**
   - Frontend: Sentry for React
   - Backend: Sentry for Node.js

2. **Performance Monitoring**
   - Frontend: Netlify Analytics
   - Backend: Render Metrics

3. **Uptime Monitoring**
   - Use services like UptimeRobot
   - Setup alerts for downtime

## 🔄 Rollback Strategy

### Netlify
- Use Netlify's instant rollback feature
- Keep last 3 successful builds

### Render
- Use Render's rollback feature
- Keep database backups

## 📝 Documentation

Maintain these files:
- `README.md` - Project overview
- `DEPLOYMENT.md` - Deployment instructions
- `CHANGELOG.md` - Version history
- `.env.example` - Environment variables template