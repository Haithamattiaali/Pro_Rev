#!/bin/bash

echo "Verifying Production Deployment Fix"
echo "==================================="
echo "Expected: Gross profit should be SAR 1,197,662"
echo "Previous: SAR 1,288,208"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="https://proceed-revenue-backend.onrender.com/api"

echo "1. Checking deployment version..."
VERSION=$(curl -s "$API_URL/deployment-test" | python3 -c "import json,sys; print(json.load(sys.stdin).get('version', 'unknown'))" 2>/dev/null)
echo "   Version: $VERSION"

if [[ "$VERSION" == "1.0.5-august-5-fix" ]]; then
    echo -e "   ${GREEN}✅ New version detected!${NC}"
else
    echo -e "   ${YELLOW}⚠️  Old version still running${NC}"
fi

echo ""
echo "2. Checking database schema..."
SCHEMA=$(curl -s "$API_URL/debug/schema")
HAS_ORIGINAL_COST=$(echo "$SCHEMA" | python3 -c "import json,sys; print(json.load(sys.stdin).get('hasOriginalCost', False))" 2>/dev/null)
MIGRATION_STATUS=$(echo "$SCHEMA" | python3 -c "import json,sys; print(json.load(sys.stdin).get('migrationStatus', 'unknown'))" 2>/dev/null)

echo "   Has original_cost column: $HAS_ORIGINAL_COST"
echo "   Migration status: $MIGRATION_STATUS"

if [[ "$MIGRATION_STATUS" == "completed" ]]; then
    echo -e "   ${GREEN}✅ Migration completed!${NC}"
else
    echo -e "   ${RED}❌ Migration not completed${NC}"
fi

echo ""
echo "3. Checking actual profit calculation..."
RESPONSE=$(curl -s "$API_URL/overview?year=2025&period=MTD&month=1")

# Extract values
REVENUE=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['overview']['revenue'])" 2>/dev/null)
COST=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['overview']['cost'])" 2>/dev/null)
ORIGINAL_COST=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['overview'].get('originalCost', 'NOT FOUND'))" 2>/dev/null)
PROFIT=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['overview']['profit'])" 2>/dev/null)

echo "   Revenue: SAR $(printf "%'.0f" $REVENUE 2>/dev/null || echo $REVENUE)"
echo "   Original Cost: SAR $(printf "%'.0f" $ORIGINAL_COST 2>/dev/null || echo $ORIGINAL_COST)"
echo "   Performance Cost: SAR $(printf "%'.0f" $COST 2>/dev/null || echo $COST)"
echo "   Gross Profit: SAR $(printf "%'.0f" $PROFIT 2>/dev/null || echo $PROFIT)"

# Check if profit is correct (allowing for minor rounding differences)
EXPECTED_PROFIT=1197662
PROFIT_INT=$(echo "$PROFIT" | cut -d. -f1)

if [ "$PROFIT_INT" -ge 1197661 ] && [ "$PROFIT_INT" -le 1197663 ]; then
    echo ""
    echo -e "${GREEN}✅ SUCCESS! Gross profit calculation is FIXED!${NC}"
    echo -e "${GREEN}Production now shows the correct value.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ ISSUE PERSISTS: Profit calculation still incorrect${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check Render dashboard deployment status"
    echo "2. Look for deployment logs and errors"
    echo "3. SSH to server and manually run: node scripts/run-migrations.js"
    echo "4. If using disk storage, ensure /var/data is mounted"
    exit 1
fi