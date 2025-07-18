# Multi-Select Feature Test Plan

## Test Scenarios

### 1. Single Selection (Default Mode)
- [ ] Click Yearly - Should show SAR 28,600,349
- [ ] Click Q1 - Should show SAR 12,821,069 (94.9%)
- [ ] Click Q2 - Should show SAR 15,779,280 (95.1%)
- [ ] Click Q3 - Should show SAR 0 (0.0%)

### 2. Multi-Select Mode
- [ ] Enable Multi-Select toggle
- [ ] Select only Q1 - Should show SAR 12,821,069
- [ ] Select Q1 + Q2 - Should show SAR 28,600,349 (combined)
- [ ] Select Q1 + Q2 + Q3 - Should show SAR 28,600,349 (same as Q1+Q2)

### 3. Quick Presets
- [ ] Click YTD - Should show year to date
- [ ] Click QTD - Should show current quarter to date
- [ ] Click MTD - Should show current month to date

### 4. Console Checks
When testing multi-select with Q1 + Q2, check browser console for:
- `📊 Overview: Calling API with:` - Should show multiSelectMode: true
- `🌐 API: Using multi-select endpoint` - Confirms multi-select API is called
- `📊 Multi-select overview result:` - Shows aggregated data

## Expected Results

| Selection | Expected Revenue |
|-----------|-----------------|
| Yearly | SAR 28,600,349 |
| Q1 only | SAR 12,821,069 |
| Q2 only | SAR 15,779,280 |
| Q3 only | SAR 0 |
| Q1 + Q2 | SAR 28,600,349 |
| Q1 + Q2 + Q3 | SAR 28,600,349 |

## Troubleshooting

If multi-select isn't working:
1. Check browser console for errors
2. Verify `multiSelectMode` is true in console logs
3. Check if `selectedPeriods` array contains selected quarters
4. Verify backend logs show correct SQL parameters