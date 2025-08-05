#!/bin/bash

echo "Monitoring Render deployment status..."
echo "Looking for version: 1.0.3-performance-cost-fix"
echo ""

# Check every 30 seconds for up to 10 minutes
for i in {1..20}; do
    echo "Check $i/20 at $(date '+%H:%M:%S')"
    
    # Check health endpoint
    VERSION=$(curl -s "https://proceed-revenue-backend.onrender.com/api/health" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('version', 'NO_VERSION'))" 2>/dev/null || echo "ERROR")
    
    if [ "$VERSION" == "1.0.3-performance-cost-fix" ]; then
        echo "✅ Deployment successful! New version is live."
        echo ""
        echo "Testing calculation fix..."
        
        # Test the overview API
        RESPONSE=$(curl -s "https://proceed-revenue-backend.onrender.com/api/overview?year=2025&period=MTD&month=1")
        echo "API Response:"
        echo "$RESPONSE" | python3 -m json.tool | head -20
        
        # Extract key values
        COST=$(echo "$RESPONSE" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['overview']['cost'])")
        PROFIT=$(echo "$RESPONSE" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['overview']['profit'])")
        
        echo ""
        echo "Results:"
        echo "- Performance Cost: SAR $(printf "%'.0f" $COST)"
        echo "- Gross Profit: SAR $(printf "%'.0f" $PROFIT)"
        echo ""
        
        if [ $(echo "$PROFIT" | cut -d. -f1) -eq 1197661 ]; then
            echo "✅ CALCULATION FIXED! Profit is correct."
        else
            echo "❌ Calculation still wrong. Expected ~1,197,662"
        fi
        
        exit 0
    else
        echo "  Current version: $VERSION"
    fi
    
    if [ $i -lt 20 ]; then
        echo "  Waiting 30 seconds..."
        sleep 30
    fi
done

echo ""
echo "❌ Deployment timeout. Please check Render dashboard."