#!/bin/bash

# Render CLI Deployment Script
# Streamlined deployment using Render CLI

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🚀 Render CLI Deployment${NC}"
echo "========================"

# Check if Render CLI is installed
if ! command -v render &> /dev/null; then
    echo -e "${RED}✗ Render CLI not found${NC}"
    echo "Install with: brew install render"
    exit 1
fi

# Check if logged in
echo -e "${YELLOW}Checking Render CLI authentication...${NC}"
if ! render login --output json 2>/dev/null; then
    echo -e "${YELLOW}Please authenticate with Render${NC}"
    render login
fi

# Function to deploy service
deploy_service() {
    local service_name=$1
    local service_id=$2
    
    echo -e "\n${YELLOW}Deploying $service_name...${NC}"
    
    if [ -z "$service_id" ]; then
        # Interactive mode - let user select service
        echo "Select the service to deploy:"
        render deploys create
    else
        # Non-interactive mode with service ID
        render deploys create $service_id --output json --confirm --wait
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ $service_name deployed successfully${NC}"
        else
            echo -e "${RED}✗ $service_name deployment failed${NC}"
            return 1
        fi
    fi
}

# Git operations
echo -e "\n${YELLOW}Preparing changes...${NC}"
cd "$REPO_ROOT"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}Found uncommitted changes:${NC}"
    git status -s
    
    read -p "Commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
    fi
fi

# Push to GitHub
echo -e "\n${YELLOW}Pushing to GitHub...${NC}"
git push origin master
echo -e "${GREEN}✓ Pushed to GitHub${NC}"

# Deploy options
echo -e "\n${BLUE}Deployment Options:${NC}"
echo "1. Deploy Backend (via Render CLI)"
echo "2. View Service Logs"
echo "3. List Recent Deploys"
echo "4. SSH into Service"
echo "5. Check Service Status"
echo "6. Exit"

read -p "Select option (1-6): " option

case $option in
    1)
        # Deploy backend
        echo -e "\n${YELLOW}Starting backend deployment...${NC}"
        
        # Get service ID if available
        if [ -f "$REPO_ROOT/.render-service-id" ]; then
            SERVICE_ID=$(cat "$REPO_ROOT/.render-service-id")
            deploy_service "Backend" $SERVICE_ID
        else
            echo "No service ID found. Please select from list:"
            render deploys create
            
            # Save service ID for future use
            read -p "Save service ID for future deployments? Enter ID (or press Enter to skip): " service_id
            if [ ! -z "$service_id" ]; then
                echo $service_id > "$REPO_ROOT/.render-service-id"
                echo -e "${GREEN}✓ Service ID saved${NC}"
            fi
        fi
        ;;
    2)
        # View logs
        echo -e "\n${YELLOW}Viewing service logs...${NC}"
        render logs
        ;;
    3)
        # List deploys
        echo -e "\n${YELLOW}Recent deployments:${NC}"
        render deploys list
        ;;
    4)
        # SSH into service
        echo -e "\n${YELLOW}Opening SSH session...${NC}"
        render ssh
        ;;
    5)
        # Check status
        echo -e "\n${YELLOW}Service status:${NC}"
        render services
        ;;
    6)
        echo -e "${BLUE}Exiting...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✅ Operation complete!${NC}"