# Days Validation Rules Summary

## Updated Validation Logic

### 1. Past Months (Already Completed)
- **Rule**: Days MUST equal calendar days for that month
- **Action**: Auto-correct to calendar days if different
- **Example**: January 2025 with days=1 → Auto-corrected to days=31
- **No user confirmation needed** - automatic correction

### 2. Current Month (In Progress)
- **Rule**: Days MUST match exactly the elapsed business days
- **Action**: If different, user must accept or reject
- **No variance allowed** - must be exact match
- **Example**: If today is Aug 15 and 11 business days elapsed:
  - days=11 → Valid, no confirmation needed
  - days=10 → Requires confirmation "10 work days entered, but 11 business days have elapsed. Accept or reject?"
  - days=12 → Requires confirmation "12 work days entered, but 11 business days have elapsed. Accept or reject?"

### 3. Future Months
- **Rule**: Treated as simulation/forecast
- **Action**: Always requires user confirmation
- **Message**: "Future month X/Y: This is a simulation/forecast with Z projected work days. Proceed with simulation?"
- **Suggested**: Typically 22 business days per month

## Why This Prevents the Edge Case

With these rules, the January days=1 edge case is automatically handled:

1. **If querying past January**: days=1 → Auto-corrected to days=31
2. **If January is current month**: User must explicitly accept days=1 if only 1 business day elapsed
3. **If January is future**: User knows it's a simulation

This ensures:
- Historical data is always consistent (days = calendar days)
- Current data is accurate (days = actual business days elapsed)
- Future data is clearly marked as projections
- No hidden skewing of daily achievement calculations

## Implementation Benefits

1. **Data Integrity**: Past months always have accurate calendar days
2. **Transparency**: Users explicitly approve any variance in current month
3. **Clarity**: Future projections are clearly identified
4. **No Surprises**: The January days=1 scenario can't slip through unnoticed