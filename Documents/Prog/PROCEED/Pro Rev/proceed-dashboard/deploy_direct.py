#!/usr/bin/env python3
import requests
import sys
import os

# Netlify Drop API endpoint
url = "https://api.netlify.com/api/v1/sites"

# Read the zip file
zip_path = "site.zip"
if not os.path.exists(zip_path):
    print(f"Error: {zip_path} not found. Run: cd dist && zip -r ../site.zip .")
    sys.exit(1)

print("Deploying to Netlify...")

# Deploy using Netlify's anonymous drop API
with open(zip_path, 'rb') as f:
    files = {'zip': ('site.zip', f, 'application/zip')}
    headers = {
        'Content-Type': 'application/zip',
    }
    
    # Direct upload to Netlify Drop (no auth needed)
    response = requests.post(
        "https://api.netlify.com/api/v1/sites", 
        files=files
    )

if response.status_code == 201:
    data = response.json()
    print(f"\n✅ Deployment successful!")
    print(f"🌐 Your site is live at: https://{data['subdomain']}.netlify.app")
    print(f"📊 Admin URL: {data['admin_url']}")
    print(f"🔑 Site ID: {data['id']}")
else:
    print(f"❌ Deployment failed: {response.status_code}")
    print(response.text)