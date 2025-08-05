# January Data - Complete Calculation Example

## Given Data (Original Values from Database)
- **Month**: January 2025
- **Target**: $80,000
- **Revenue**: $100,000  
- **Original Cost**: $60,000

## Step-by-Step Calculations

### 1. Achievement Percentage
```
Achievement = (Revenue / Target) × 100
Achievement = ($100,000 / $80,000) × 100
Achievement = 1.25 × 100
Achievement = 125%
```

### 2. Performance-Based Cost (NEW)
```
Performance Cost = (Revenue / Target) × Original Cost
Performance Cost = ($100,000 / $80,000) × $60,000
Performance Cost = 1.25 × $60,000
Performance Cost = $75,000
```
*Note: Cost shown in UI is now $75,000 instead of $60,000*

### 3. Gross Profit (Using NEW Formula)
```
Gross Profit = Revenue - (Revenue/Target) × Original Cost
Gross Profit = $100,000 - (1.25 × $60,000)
Gross Profit = $100,000 - $75,000
Gross Profit = $25,000
```

### 4. Gross Profit Margin
```
GP Margin = (Gross Profit / Revenue) × 100
GP Margin = ($25,000 / $100,000) × 100
GP Margin = 25%
```

## Summary Table for January

| Metric | Value | Calculation |
|--------|-------|-------------|
| **Target** | $80,000 | From database |
| **Revenue** | $100,000 | From database |
| **Cost (Displayed)** | $75,000 | (100k/80k) × 60k = Performance cost |
| **Achievement** | 125% | (100k/80k) × 100 |
| **Gross Profit** | $25,000 | 100k - 75k |
| **GP Margin** | 25% | (25k/100k) × 100 |

## What Changed with Our Updates:

### Before (Old System):
- Cost shown: $60,000 (original cost)
- Gross Profit: $80,000 - $60,000 = $20,000
- GP Margin: $20,000 / $100,000 = 20%

### After (New System):
- Cost shown: $75,000 (performance-adjusted)
- Gross Profit: $100,000 - $75,000 = $25,000
- GP Margin: $25,000 / $100,000 = 25%

## Key Points:
1. **Cost** in the UI now shows performance-adjusted cost ($75,000)
2. **Gross Profit** uses the original cost ($60,000) in its calculation but the result is the same as Revenue - Performance Cost
3. **Achievement** drives both the cost display and gross profit calculation
4. All values are interconnected through the achievement ratio (1.25)

## Verification:
- Revenue ($100,000) - Performance Cost ($75,000) = Gross Profit ($25,000) ✓
- Gross Profit ($25,000) / Revenue ($100,000) = GP Margin (25%) ✓
- Performance Cost ($75,000) = Original Cost ($60,000) × Achievement Ratio (1.25) ✓