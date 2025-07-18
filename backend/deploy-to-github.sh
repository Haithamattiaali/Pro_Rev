#!/bin/bash

# Add remote origin
git remote add origin git@github.com:Haithamattiaali/proceed-revenue-backend.git

# Push to GitHub
git branch -M main
git push -u origin main

echo "✅ Backend pushed to GitHub!"
echo "Now go to Render.com to complete deployment"