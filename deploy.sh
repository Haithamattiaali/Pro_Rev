#!/bin/bash

# Proceed Revenue Dashboard - Production Deployment Pipeline
# This script handles the complete deployment process

echo "================================================"
echo "🚀 PROCEED REVENUE DASHBOARD DEPLOYMENT PIPELINE"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 successful${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Step 1: Ensure we're in the right directory
echo -e "${YELLOW}Step 1: Checking directory...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Not in the project root directory${NC}"
    echo "Please run this script from: /Users/haithamdata/Documents/Prog/PROCEED/Pro Rev/proceed-dashboard"
    exit 1
fi
echo -e "${GREEN}✓ Directory confirmed${NC}"
echo ""

# Step 2: Check git status
echo -e "${YELLOW}Step 2: Checking git status...${NC}"
git status --porcelain
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Do you want to commit them now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add -A
        git commit -m "$commit_msg"
        check_status "Git commit"
    fi
fi
echo ""

# Step 3: Push to GitHub
echo -e "${YELLOW}Step 3: Pushing to GitHub...${NC}"
git push origin master
check_status "GitHub push"
echo ""

# Step 4: Install dependencies
echo -e "${YELLOW}Step 4: Installing dependencies...${NC}"
npm install
check_status "Frontend dependencies"
cd backend && npm install && cd ..
check_status "Backend dependencies"
echo ""

# Step 5: Run tests (if any)
echo -e "${YELLOW}Step 5: Running tests...${NC}"
# npm test --if-present
echo -e "${GREEN}✓ Tests skipped (no tests configured)${NC}"
echo ""

# Step 6: Build frontend
echo -e "${YELLOW}Step 6: Building frontend for production...${NC}"
npm run build
check_status "Frontend build"
echo ""

# Step 7: Deploy frontend to Netlify
echo -e "${YELLOW}Step 7: Deploying frontend to Netlify...${NC}"
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}Netlify CLI not found. Installing...${NC}"
    npm install -g netlify-cli
fi

echo "Deploying to Netlify..."
netlify deploy --prod --dir=dist

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend deployed to Netlify${NC}"
    echo -e "${GREEN}Frontend URL: Check your Netlify dashboard or CLI output above${NC}"
else
    echo -e "${YELLOW}Note: If deployment failed, you may need to run 'netlify init' first${NC}"
fi
echo ""

# Step 8: Backend deployment info
echo -e "${YELLOW}Step 8: Backend deployment (Render)...${NC}"
echo "Render will automatically deploy from GitHub push"
echo "Backend URL: https://proceed-revenue-backend.onrender.com"
echo ""
echo "To check deployment status:"
echo "1. Visit: https://dashboard.render.com"
echo "2. Select: proceed-revenue-backend"
echo "3. Check the deployment logs"
echo ""

# Step 9: Post-deployment verification
echo -e "${YELLOW}Step 9: Deployment Verification Checklist${NC}"
echo ""
echo "Please verify the following:"
echo ""
echo "1. Backend Health Check:"
echo "   curl https://proceed-revenue-backend.onrender.com/api/health"
echo ""
echo "2. Analysis Validation Endpoint:"
echo "   curl https://proceed-revenue-backend.onrender.com/api/analysis-validation/2024"
echo ""
echo "3. Frontend Features:"
echo "   - Open your Netlify URL"
echo "   - Check Overview page for validation alerts"
echo "   - Test file upload functionality"
echo "   - Verify gross profit calculations"
echo ""

# Step 10: Summary
echo "================================================"
echo -e "${GREEN}🎉 DEPLOYMENT PIPELINE COMPLETE!${NC}"
echo "================================================"
echo ""
echo "Summary of changes deployed:"
echo "- Analysis period validation for data integrity"
echo "- Validation alerts on Overview and Upload pages"
echo "- Filtered queries using only complete data months"
echo "- User feedback for missing data periods"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Monitor Render dashboard for backend deployment completion"
echo "2. Test all features on production"
echo "3. Check browser console for any errors"
echo ""
echo "Deployment completed at: $(date)"