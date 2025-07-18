# Render CLI Setup Guide

## Quick Start

### 1. Login to Render CLI
```bash
render login
```

### 2. Deploy Backend Manually
```bash
# Interactive mode - select service from list
render deploys create

# Or with service ID (faster)
render deploys create srv-YOUR-SERVICE-ID --wait
```

### 3. View Logs
```bash
render logs
```

## Automated Deployment Options

### Option 1: Use the CLI Script (Recommended)
```bash
./scripts/deploy-with-cli.sh
```

This script:
- Commits and pushes changes
- Deploys via Render CLI
- Shows deployment status
- Offers additional options (logs, SSH, etc.)

### Option 2: GitHub Actions (Automatic)
The workflow at `.github/workflows/render-deploy.yml` will:
- Auto-deploy when you push backend changes
- Use Render CLI for reliable deployments
- Wait for completion and report status

To enable GitHub Actions:
1. Go to your GitHub repo settings
2. Add these secrets:
   - `RENDER_API_KEY`: Your Render API key
   - `RENDER_SERVICE_ID`: Your service ID (e.g., srv-xxx)

### Option 3: Direct CLI Commands
```bash
# Quick deploy
render deploys create --wait

# Deploy specific commit
render deploys create --commit abc123 --wait

# Force rebuild
render deploys create --clear-cache --wait
```

## Getting Your Service ID

### Method 1: Via Dashboard
1. Go to https://dashboard.render.com
2. Click on your service
3. The URL contains the ID: `dashboard.render.com/web/srv-YOUR-ID-HERE`

### Method 2: Via CLI
```bash
render services
```
Look for your backend service and note its ID.

## Useful CLI Commands

```bash
# List all services
render services

# View recent deploys
render deploys list

# SSH into service
render ssh

# View live logs
render logs --tail

# Restart service
render services restart

# Run one-off job
render jobs create --command "npm run migrate"
```

## Setting Up API Key (for automation)

1. Go to https://dashboard.render.com/account/api-keys
2. Click "Create API Key"
3. Name it (e.g., "CLI Deployment")
4. Copy the key

For GitHub Actions:
- Add as repository secret `RENDER_API_KEY`

For local automation:
```bash
export RENDER_API_KEY=rnd_YOUR_KEY_HERE
```

## Troubleshooting

### "Authentication required"
Run `render login` or set `RENDER_API_KEY`

### "Service not found"
Check service ID with `render services`

### "Deploy failed"
Check logs: `render logs --deploy DEPLOY_ID`

### "Command not found"
Install CLI: `brew install render`