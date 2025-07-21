# SPIMACO Achievement Analysis

## Year-to-Date (YTD) 2025 Performance

### Summary
- **Total Revenue**: SAR 9,392,529.54
- **Total Target**: SAR 19,170,322.58
- **Overall Achievement**: 49.0%

### By Service Type

#### Transportation
- **Revenue**: SAR 4,515,451.54
- **Target**: SAR 9,816,129.03
- **Achievement**: 46.0%
- **Original Annual Target**: SAR 10,200,000

#### Warehouses
- **Revenue**: SAR 4,877,078.00
- **Target**: SAR 9,354,193.55
- **Achievement**: 52.14%
- **Original Annual Target**: SAR 9,720,000

## Monthly Performance Analysis

### Key Observations:

1. **Warehouses Revenue Pattern**:
   - Jan-May: Exactly SAR 810,000 each month (100% of target)
   - June: SAR 827,078 (102.11% of target)
   - Jul-Dec: SAR 0 (no revenue)
   - This pattern suggests potential data quality issues

2. **Transportation Revenue Pattern**:
   - Highly variable: from SAR 428 (Feb) to SAR 1,420,844 (Mar)
   - Strong performance in Q1: Jan (118.99%), Mar (177.61%)
   - Declining in Q2: Apr (93.37%), May (73.35%), Jun (90.81%)
   - No revenue from July onwards

3. **Pro-rating Impact**:
   - July targets were pro-rated: 
     - Transportation: SAR 466,129 (vs original SAR 850,000)
     - Warehouses: SAR 444,193 (vs original SAR 810,000)
   - This suggests mid-year adjustments or partial month calculations

## Data Quality Concerns

1. **Suspicious Patterns**:
   - Warehouses showing exactly SAR 810,000 for 5 consecutive months
   - Complete revenue stop from July onwards for both services
   - February Transportation revenue of only SAR 428

2. **Calculations Verification**:
   - Transportation: 4,515,451.54 ÷ 9,816,129.03 = 46.00% ✓
   - Warehouses: 4,877,078.00 ÷ 9,354,193.55 = 52.14% ✓
   - Total: 9,392,529.54 ÷ 19,170,322.58 = 49.00% ✓

## Conclusion

The achievement calculations in the dashboard are **mathematically correct**. The values shown:
- Transportation: 46.0%
- Warehouses: 52.1%
- Total: 49.0%

Are accurate based on the data in the database. However, the underlying data quality appears questionable due to:
1. Repeated exact values for Warehouses revenue
2. Sudden cessation of all revenue from July onwards
3. Unusually low February Transportation revenue

**Recommendation**: Review the source data file to ensure accurate revenue figures were uploaded, particularly for Warehouses service type and the second half of the year.