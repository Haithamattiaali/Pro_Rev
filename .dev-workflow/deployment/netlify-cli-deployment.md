# Netlify CLI Direct Deployment Guide

## Prerequisites

### 1. Install Netlify CLI

```bash
# Install globally via npm
npm install -g netlify-cli

# Or using Homebrew on macOS
brew install netlify-cli

# Verify installation
netlify --version
```

### 2. Authentication

```bash
# Login to Netlify (opens browser)
netlify login

# Or use access token (for CI/CD)
export NETLIFY_AUTH_TOKEN=your-personal-access-token
```

## Deployment Commands

### Direct Production Deployment

```bash
# Build the project first
npm run build

# Deploy directly to production (existing site)
netlify deploy --prod --dir=dist --site=688b4ff0-c89f-4bc0-b3f7-1750804938f2

# Alternative: Using site name
netlify deploy --prod --dir=dist --site=proceed-revenue-dashboard-1750804938
```

### Step-by-Step Process

1. **Build the project**
   ```bash
   cd /Users/haithamdata/Documents/Prog/PROCEED/Pro\ Rev/proceed-dashboard
   npm run build
   ```

2. **Deploy to production**
   ```bash
   netlify deploy --prod \
     --dir=dist \
     --site=proceed-revenue-dashboard-1750804938 \
     --message="Direct CLI deployment $(date +%Y-%m-%d)"
   ```

3. **Verify deployment**
   ```bash
   # Check deployment status
   netlify status --site=proceed-revenue-dashboard-1750804938

   # Open site in browser
   netlify open --site
   ```

## Environment Variables

### Set environment variables via CLI
```bash
# Set VITE_API_URL for production
netlify env:set VITE_API_URL "https://proceed-revenue-backend.onrender.com/api" \
  --site=proceed-revenue-dashboard-1750804938

# List all environment variables
netlify env:list --site=proceed-revenue-dashboard-1750804938
```

## One-Command Deployment Script

Create a deployment script `deploy-netlify.sh`:

```bash
#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Netlify CLI deployment..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --prod \
    --dir=dist \
    --site=proceed-revenue-dashboard-1750804938 \
    --message="Production deployment $(date +%Y-%m-%d\ %H:%M)"

# Get deployment URL
echo "✅ Deployment complete!"
echo "🔗 Site URL: https://proceed-revenue-dashboard-1750804938.netlify.app"

# Optional: Open site in browser
read -p "Open site in browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    netlify open --site
fi
```

Make it executable:
```bash
chmod +x deploy-netlify.sh
```

## Advanced Options

### Deploy with specific functions
```bash
netlify deploy --prod \
    --dir=dist \
    --functions=netlify/functions \
    --site=proceed-revenue-dashboard-1750804938
```

### Deploy preview (not production)
```bash
# Creates a preview URL without affecting production
netlify deploy --dir=dist --site=proceed-revenue-dashboard-1750804938
```

### Deploy with build command
```bash
# Build and deploy in one command
netlify deploy --prod \
    --build \
    --site=proceed-revenue-dashboard-1750804938
```

## Troubleshooting

### Common Issues

1. **Authentication Error**
   ```bash
   # Re-authenticate
   netlify logout
   netlify login
   ```

2. **Site Not Found**
   ```bash
   # List all sites
   netlify sites:list
   
   # Link to existing site
   netlify link --id proceed-revenue-dashboard-1750804938
   ```

3. **Build Errors**
   ```bash
   # Check local build first
   npm run build
   
   # Check Netlify build settings
   netlify sites:list --json | jq '.[] | select(.name=="proceed-revenue-dashboard-1750804938")'
   ```

## Deployment History

### View deployment history
```bash
# List recent deploys
netlify deploys:list --site=proceed-revenue-dashboard-1750804938

# Get info about specific deploy
netlify deploys:info DEPLOY_ID --site=proceed-revenue-dashboard-1750804938
```

### Rollback to previous deployment
```bash
# List deploys to find the one to rollback to
netlify deploys:list --site=proceed-revenue-dashboard-1750804938

# Restore a previous deploy
netlify deploys:restore DEPLOY_ID --site=proceed-revenue-dashboard-1750804938
```

## Quick Reference

### Essential Commands
```bash
# Build and deploy
npm run build && netlify deploy --prod --dir=dist

# Deploy with message
netlify deploy --prod --dir=dist --message="Fix: Q3 filter issue"

# Check status
netlify status

# View site info
netlify sites:show proceed-revenue-dashboard-1750804938
```

### Site IDs
- Site Name: `proceed-revenue-dashboard-1750804938`
- Site ID: `688b4ff0-c89f-4bc0-b3f7-1750804938f2`
- URL: `https://proceed-revenue-dashboard-1750804938.netlify.app`

## Integration with npm scripts

Add to `package.json`:
```json
{
  "scripts": {
    "deploy:netlify": "npm run build && netlify deploy --prod --dir=dist --site=proceed-revenue-dashboard-1750804938",
    "deploy:preview": "npm run build && netlify deploy --dir=dist --site=proceed-revenue-dashboard-1750804938"
  }
}
```

Then deploy with:
```bash
npm run deploy:netlify
```

---

Generated: Mon Aug 5 2025