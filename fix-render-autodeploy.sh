#!/bin/bash

# Script to fix Render auto-deployment by converting to proper monorepo

echo "🔧 Fixing Render Auto-Deploy Setup"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Backup current backend state
echo -e "${YELLOW}Step 1: Creating backup of backend...${NC}"
cp -r backend backend_backup_$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✓ Backup created${NC}"

# Step 2: Remove backend from git tracking in main repo
echo -e "${YELLOW}Step 2: Removing backend from git index...${NC}"
git rm --cached backend
git commit -m "Remove backend submodule reference"

# Step 3: Remove .git from backend directory
echo -e "${YELLOW}Step 3: Removing nested git repository...${NC}"
rm -rf backend/.git
echo -e "${GREEN}✓ Removed backend/.git${NC}"

# Step 4: Add backend as regular directory
echo -e "${YELLOW}Step 4: Adding backend to main repository...${NC}"
git add backend/
git commit -m "Add backend as part of monorepo for Render deployment

- Converted backend from submodule to regular directory
- Enables Render auto-deployment from monorepo
- Includes multi-select API endpoints"

# Step 5: Push to trigger auto-deploy
echo -e "${YELLOW}Step 5: Pushing to GitHub...${NC}"
git push origin master

echo -e "${GREEN}✅ Fixed! Render should now auto-deploy.${NC}"
echo ""
echo "Next steps:"
echo "1. Check Render dashboard - deployment should start in 1-2 minutes"
echo "2. Monitor the build logs for any errors"
echo "3. Verify your backend URL works after deployment"
echo ""
echo "Render Dashboard: https://dashboard.render.com"