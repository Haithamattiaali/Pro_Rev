#!/bin/bash

# Deploy to Netlify using drag and drop via command line

echo "Building project..."
npm run build

echo "Creating deployment package..."
cd dist
zip -r ../deploy.zip .
cd ..

echo "Deployment package created: deploy.zip"
echo ""
echo "To deploy:"
echo "1. Go to https://app.netlify.com/drop"
echo "2. Drag and drop the 'dist' folder"
echo ""
echo "Or use Netlify's web interface:"
echo "1. Log in to https://app.netlify.com"
echo "2. Click 'Add new site' -> 'Deploy manually'"
echo "3. Upload the dist folder"
echo ""
echo "Your site will be live immediately with a URL like:"
echo "https://amazing-name-123456.netlify.app"