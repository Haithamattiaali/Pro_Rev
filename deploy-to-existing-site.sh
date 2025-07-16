#!/bin/bash

# Deploy to existing Netlify site
# Site: https://proceed-revenue-dashboard-1750804938.netlify.app

echo "🚀 Deploying to existing Netlify site..."
echo "Site: https://proceed-revenue-dashboard-1750804938.netlify.app"
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist folder not found. Building project first..."
    npm run build
fi

echo ""
echo "📦 Creating deployment package..."
cd dist
zip -r ../deploy-site.zip .
cd ..

echo ""
echo "✅ Deployment package ready!"
echo ""
echo "To deploy to your existing site:"
echo ""
echo "Option 1 - Using Netlify Web Interface:"
echo "1. Go to https://app.netlify.com"
echo "2. Find your site: proceed-revenue-dashboard-1750804938"
echo "3. Go to 'Deploys' tab"
echo "4. Drag and drop the 'dist' folder onto the deployment area"
echo ""
echo "Option 2 - Using Netlify CLI (if installed):"
echo "1. Install Netlify CLI: npm install -g netlify-cli"
echo "2. Login: netlify login"
echo "3. Link to site: netlify link --id [your-site-id]"
echo "4. Deploy: netlify deploy --prod --dir=dist"
echo ""
echo "Option 3 - Manual Upload:"
echo "1. Go to https://app.netlify.com/sites/proceed-revenue-dashboard-1750804938/deploys"
echo "2. Drag the 'dist' folder to the deployment area"
echo ""
echo "The 'dist' folder is ready at: $(pwd)/dist"