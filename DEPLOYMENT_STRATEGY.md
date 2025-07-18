# Deployment Strategy for Proceed Dashboard

## Current Architecture
- **Monorepo**: Single GitHub repository containing both frontend and backend
- **Frontend**: Auto-deploys to Netlify from main repo
- **Backend**: Should auto-deploy to Render from `backend/` subdirectory

## Problem
The backend subdirectory is its own git repository, which conflicts with the monorepo deployment strategy.

## Solution: Convert to True Monorepo

### Step 1: Remove backend git repository
```bash
cd backend
rm -rf .git
```

### Step 2: Add backend changes to main repository
```bash
cd ..
git add backend/
git commit -m "Integrate backend into monorepo with multi-select APIs"
git push origin master
```

### Step 3: Render Auto-Deploy
- Render will automatically detect the push and deploy from the `backend/` directory
- The render.yaml configuration is already set up correctly

## Benefits
1. Single repository to manage
2. Atomic commits across frontend/backend
3. Simplified deployment process
4. Both Netlify and Render will auto-deploy on push

## Deployment URLs
- Frontend: Auto-deployed by Netlify
- Backend: Auto-deployed by Render from backend/ subdirectory