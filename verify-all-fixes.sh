#!/bin/bash

echo "==================================="
echo "COMPREHENSIVE FIX VERIFICATION"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="https://proceed-revenue-backend.onrender.com/api"

echo -e "${BLUE}1. Checking Deployment Version${NC}"
VERSION_RESPONSE=$(curl -s "$API_URL/deployment-test" 2>/dev/null)
if [[ -n "$VERSION_RESPONSE" ]]; then
    VERSION=$(echo "$VERSION_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('version', 'unknown'))" 2>/dev/null || echo "parse-error")
    echo "   Version: $VERSION"
    if [[ "$VERSION" == *"august-5"* ]] || [[ "$VERSION" == "1.0.5"* ]]; then
        echo -e "   ${GREEN}✅ New version detected${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Old version running${NC}"
    fi
else
    echo -e "   ${RED}❌ Deployment endpoint not available${NC}"
fi

echo ""
echo -e "${BLUE}2. Checking Database Schema${NC}"
SCHEMA_RESPONSE=$(curl -s "$API_URL/debug/schema" 2>/dev/null)
if [[ -n "$SCHEMA_RESPONSE" ]]; then
    HAS_ORIGINAL_COST=$(echo "$SCHEMA_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('hasOriginalCost', False))" 2>/dev/null || echo "false")
    echo "   Has original_cost column: $HAS_ORIGINAL_COST"
    if [[ "$HAS_ORIGINAL_COST" == "True" ]]; then
        echo -e "   ${GREEN}✅ Migration completed${NC}"
    else
        echo -e "   ${RED}❌ Migration not completed${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Schema endpoint not available (old version)${NC}"
fi

echo ""
echo -e "${BLUE}3. Checking API Response Structure${NC}"
OVERVIEW_RESPONSE=$(curl -s "$API_URL/overview?year=2025&period=MTD&month=1" 2>/dev/null)

# Check if originalCost field exists
if echo "$OVERVIEW_RESPONSE" | grep -q '"originalCost"'; then
    echo -e "   ${GREEN}✅ API returns originalCost field${NC}"
    ORIGINAL_COST=$(echo "$OVERVIEW_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['overview']['originalCost'])" 2>/dev/null)
    echo "   Original Cost: SAR $(printf "%'.0f" $ORIGINAL_COST 2>/dev/null || echo $ORIGINAL_COST)"
else
    echo -e "   ${RED}❌ API does not return originalCost field${NC}"
    echo "   This indicates old code is still running"
fi

echo ""
echo -e "${BLUE}4. Checking Profit Calculation${NC}"
if [[ -n "$OVERVIEW_RESPONSE" ]]; then
    REVENUE=$(echo "$OVERVIEW_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['overview']['revenue'])" 2>/dev/null)
    TARGET=$(echo "$OVERVIEW_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['overview']['target'])" 2>/dev/null)
    COST=$(echo "$OVERVIEW_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['overview']['cost'])" 2>/dev/null)
    PROFIT=$(echo "$OVERVIEW_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['overview']['profit'])" 2>/dev/null)
    
    echo "   Revenue: SAR $(printf "%'.0f" $REVENUE 2>/dev/null || echo $REVENUE)"
    echo "   Target: SAR $(printf "%'.0f" $TARGET 2>/dev/null || echo $TARGET)"
    echo "   Cost (shown): SAR $(printf "%'.0f" $COST 2>/dev/null || echo $COST)"
    echo "   Profit (shown): SAR $(printf "%'.0f" $PROFIT 2>/dev/null || echo $PROFIT)"
    
    # Check if profit is correct
    PROFIT_INT=$(echo "$PROFIT" | cut -d. -f1)
    if [ "$PROFIT_INT" -ge 1197661 ] && [ "$PROFIT_INT" -le 1197663 ]; then
        echo -e "   ${GREEN}✅ PROFIT CALCULATION IS CORRECT!${NC}"
    else
        echo -e "   ${RED}❌ Profit still incorrect (expected ~1,197,662)${NC}"
    fi
fi

echo ""
echo -e "${BLUE}5. Summary${NC}"
echo "=================================="

# Check all conditions
ALL_GOOD=true
if ! echo "$VERSION" | grep -q "august-5\|1.0.5"; then ALL_GOOD=false; fi
if [[ "$HAS_ORIGINAL_COST" != "True" ]]; then ALL_GOOD=false; fi
if ! echo "$OVERVIEW_RESPONSE" | grep -q '"originalCost"'; then ALL_GOOD=false; fi
if [ "$PROFIT_INT" -lt 1197661 ] || [ "$PROFIT_INT" -gt 1197663 ]; then ALL_GOOD=false; fi

if $ALL_GOOD; then
    echo -e "${GREEN}✅ ALL FIXES DEPLOYED AND WORKING!${NC}"
    echo "Production is now calculating gross profit correctly."
else
    echo -e "${YELLOW}⚠️  DEPLOYMENT IN PROGRESS${NC}"
    echo ""
    echo "Current issues:"
    if ! echo "$VERSION" | grep -q "august-5\|1.0.5"; then
        echo "- Old version still running"
    fi
    if [[ "$HAS_ORIGINAL_COST" != "True" ]]; then
        echo "- Migration not completed"
    fi
    if ! echo "$OVERVIEW_RESPONSE" | grep -q '"originalCost"'; then
        echo "- API not returning originalCost"
    fi
    if [ "$PROFIT_INT" -lt 1197661 ] || [ "$PROFIT_INT" -gt 1197663 ]; then
        echo "- Profit calculation still wrong"
    fi
    echo ""
    echo "Wait for Render to complete deployment or check deployment logs."
fi