#!/bin/bash

echo "Live Deployment Monitor"
echo "======================="
echo "Monitoring for deployment completion..."
echo "Press Ctrl+C to stop"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="https://proceed-revenue-backend.onrender.com/api"
CHECK_INTERVAL=10
COUNTER=0

while true; do
    COUNTER=$((COUNTER + 1))
    echo -e "${BLUE}Check #$COUNTER at $(date '+%H:%M:%S')${NC}"
    
    # Check version
    VERSION=$(curl -s "$API_URL/deployment-test" 2>/dev/null | python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('version', 'error'))" 2>/dev/null || echo "connection-error")
    
    if [[ "$VERSION" == "connection-error" ]]; then
        echo -e "   ${YELLOW}⚠️  API not responding (deployment in progress?)${NC}"
    elif [[ "$VERSION" == "1.0.5-august-5-fix" ]]; then
        echo -e "   ${GREEN}✅ NEW VERSION DEPLOYED!${NC}"
        
        # Check if migration ran
        SCHEMA=$(curl -s "$API_URL/debug/schema" 2>/dev/null)
        if [[ -n "$SCHEMA" ]]; then
            HAS_ORIGINAL_COST=$(echo "$SCHEMA" | python3 -c "import json,sys; print(json.load(sys.stdin).get('hasOriginalCost', False))" 2>/dev/null)
            if [[ "$HAS_ORIGINAL_COST" == "True" ]]; then
                echo -e "   ${GREEN}✅ Migration completed!${NC}"
                
                # Final check - the profit calculation
                RESPONSE=$(curl -s "$API_URL/overview?year=2025&period=MTD&month=1" 2>/dev/null)
                if [[ -n "$RESPONSE" ]]; then
                    PROFIT=$(echo "$RESPONSE" | python3 -c "import json,sys; print(int(json.load(sys.stdin)['overview']['profit']))" 2>/dev/null || echo "0")
                    if [ "$PROFIT" -ge 1197661 ] && [ "$PROFIT" -le 1197663 ]; then
                        echo -e "   ${GREEN}✅ PROFIT CALCULATION FIXED! SAR $(printf "%'.0f" $PROFIT)${NC}"
                        echo ""
                        echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL! Issue resolved.${NC}"
                        exit 0
                    else
                        echo -e "   ${RED}❌ Profit still wrong: SAR $(printf "%'.0f" $PROFIT)${NC}"
                    fi
                fi
            else
                echo -e "   ${RED}❌ Migration didn't run${NC}"
            fi
        fi
    else
        echo "   Version: $VERSION (old version still running)"
    fi
    
    # Quick health check
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null)
    echo "   Health check: $HEALTH"
    
    echo "   Waiting $CHECK_INTERVAL seconds..."
    echo ""
    sleep $CHECK_INTERVAL
done