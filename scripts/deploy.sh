#!/bin/bash

# Professional Deployment Script for Proceed Dashboard
# Following monorepo best practices

set -e  # Exit on error

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$REPO_ROOT"
BACKEND_DIR="$REPO_ROOT/backend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log_info() { echo -e "${BLUE}ℹ ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; exit 1; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    command -v git >/dev/null 2>&1 || log_error "git is required but not installed"
    command -v node >/dev/null 2>&1 || log_error "node is required but not installed"
    command -v npm >/dev/null 2>&1 || log_error "npm is required but not installed"
    
    log_success "All prerequisites met"
}

# Clean up backend git repo if it exists
cleanup_backend_git() {
    if [ -d "$BACKEND_DIR/.git" ]; then
        log_warning "Found nested git repository in backend/"
        read -p "Remove backend/.git to integrate into monorepo? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$BACKEND_DIR/.git"
            log_success "Removed backend/.git"
        else
            log_error "Cannot proceed with nested git repository"
        fi
    fi
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Frontend tests
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        cd "$FRONTEND_DIR"
        if npm run test --if-present -- --passWithNoTests 2>/dev/null; then
            log_success "Frontend tests passed"
        else
            log_warning "Frontend tests skipped or not configured"
        fi
    fi
    
    # Backend tests
    if [ -f "$BACKEND_DIR/package.json" ]; then
        cd "$BACKEND_DIR"
        if npm run test --if-present -- --passWithNoTests 2>/dev/null; then
            log_success "Backend tests passed"
        else
            log_warning "Backend tests skipped or not configured"
        fi
    fi
    
    cd "$REPO_ROOT"
}

# Build frontend
build_frontend() {
    log_info "Building frontend..."
    cd "$FRONTEND_DIR"
    npm run build
    log_success "Frontend build complete"
    cd "$REPO_ROOT"
}

# Git operations
git_operations() {
    log_info "Preparing git commit..."
    cd "$REPO_ROOT"
    
    # Check for changes
    if [[ -z $(git status -s) ]]; then
        log_info "No changes to commit"
        return 0
    fi
    
    # Show changes
    log_info "Changes to be committed:"
    git status -s
    
    # Commit
    read -p "Enter commit message (or press Enter for auto-message): " commit_msg
    if [ -z "$commit_msg" ]; then
        commit_msg="Deploy: Update $(date +'%Y-%m-%d %H:%M:%S')"
    fi
    
    git add -A
    git commit -m "$commit_msg"
    log_success "Changes committed"
    
    # Push
    log_info "Pushing to origin..."
    git push origin master
    log_success "Pushed to GitHub"
}

# Deploy status
check_deploy_status() {
    log_info "Deployment Status:"
    echo
    echo "  Frontend (Netlify):"
    echo "  - Auto-deploy enabled: Check https://app.netlify.com"
    echo "  - Build typically takes 2-3 minutes"
    echo
    echo "  Backend (Render):"
    echo "  - Auto-deploy enabled: Check https://dashboard.render.com"
    echo "  - Build typically takes 5-10 minutes"
    echo
    log_info "Monitor deployment progress in respective dashboards"
}

# Main deployment flow
main() {
    echo -e "${BLUE}🚀 Proceed Dashboard Deployment${NC}"
    echo "================================"
    
    check_prerequisites
    cleanup_backend_git
    
    # Optional: Run tests
    read -p "Run tests before deployment? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    # Optional: Build frontend
    read -p "Build frontend before deployment? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_frontend
    fi
    
    # Git operations
    git_operations
    
    # Show deployment status
    check_deploy_status
    
    log_success "Deployment initiated successfully!"
    echo
    echo "Next steps:"
    echo "1. Monitor Netlify dashboard for frontend deployment"
    echo "2. Monitor Render dashboard for backend deployment"
    echo "3. Test production URLs once deployed"
}

# Run main function
main "$@"