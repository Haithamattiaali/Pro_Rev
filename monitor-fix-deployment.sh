#!/bin/bash

echo "Monitoring deployment and database migration fix..."
echo "Expected result: Gross profit should show SAR 1,197,662"
echo "Current issue: Shows SAR 1,288,208"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check every 30 seconds for up to 15 minutes
for i in {1..30}; do
    echo -e "${YELLOW}Check $i/30 at $(date '+%H:%M:%S')${NC}"
    
    # Check if API returns originalCost field (indicator of new code)
    RESPONSE=$(curl -s "https://proceed-revenue-backend.onrender.com/api/overview?year=2025&period=MTD&month=1")
    
    # Check if response contains originalCost
    if echo "$RESPONSE" | grep -q "originalCost"; then
        echo -e "${GREEN}✅ New backend code detected! Migration likely complete.${NC}"
        echo ""
        echo "API Response analysis:"
        
        # Extract key values
        COST=$(echo "$RESPONSE" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['overview']['cost'])" 2>/dev/null || echo "ERROR")
        ORIGINAL_COST=$(echo "$RESPONSE" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['overview'].get('originalCost', 'NOT FOUND'))" 2>/dev/null || echo "ERROR")
        PROFIT=$(echo "$RESPONSE" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['overview']['profit'])" 2>/dev/null || echo "ERROR")
        
        echo "- Original Cost: SAR $(printf "%'.0f" $ORIGINAL_COST 2>/dev/null || echo $ORIGINAL_COST)"
        echo "- Performance Cost: SAR $(printf "%'.0f" $COST 2>/dev/null || echo $COST)"
        echo "- Gross Profit: SAR $(printf "%'.0f" $PROFIT 2>/dev/null || echo $PROFIT)"
        echo ""
        
        # Check if profit is correct
        if [ $(echo "$PROFIT" | cut -d. -f1) -eq 1197661 ] || [ $(echo "$PROFIT" | cut -d. -f1) -eq 1197662 ]; then
            echo -e "${GREEN}✅ SUCCESS! Gross profit calculation is FIXED!${NC}"
            echo -e "${GREEN}Production now shows the correct value.${NC}"
        else
            echo -e "${RED}❌ Profit still incorrect. Expected ~1,197,662${NC}"
            echo "Migration may need to be run manually on production database."
        fi
        
        exit 0
    else
        echo "  originalCost field not found - old code still running"
        
        # Quick check of current profit value
        CURRENT_PROFIT=$(echo "$RESPONSE" | python3 -c "import json,sys; data=json.load(sys.stdin); print(int(data['overview']['profit']))" 2>/dev/null || echo "0")
        echo "  Current profit: SAR $(printf "%'.0f" $CURRENT_PROFIT 2>/dev/null || echo "ERROR")"
    fi
    
    if [ $i -lt 30 ]; then
        echo "  Waiting 30 seconds..."
        sleep 30
    fi
done

echo ""
echo -e "${RED}❌ Deployment timeout after 15 minutes.${NC}"
echo ""
echo "Manual intervention may be required:"
echo "1. Check Render dashboard for deployment status"
echo "2. SSH to production server and run: node scripts/run-migrations.js"
echo "3. Verify database has original_cost column"
echo ""
echo "To manually check production database:"
echo "  sqlite3 /path/to/database.db 'PRAGMA table_info(revenue_data);'"