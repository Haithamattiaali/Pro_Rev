# Implementation Plan - YTD/QTD/MTD Data-Aware Enhancement

Based on your answers, generated on: Mon Aug 4 06:10:00 2025

## Key Requirements from Your Answers

### Core Principle: Everything is File Upload Based
- **No dependency on system date/time**
- **"Current month" = Last compliant month in uploaded data**
- **All operations driven by Excel upload data**

### Specific Requirements:

1. **Last Available Month**: Use last compliant month per compliance logic
2. **Data Gaps**: Show warning + prevent during upload
3. **Past Years**: Disable YTD/QTD/MTD for non-current years
4. **YTD**: Show only Jan to last compliant month
5. **QTD**: Show partial quarter (e.g., July only if Q3 incomplete)
6. **MTD**: Based on days column in calculations
7. **Compliance**: Only show compliant periods
8. **Warnings**: Only on upload page
9. **Animations**: Remove from "Currently Showing" component only
10. **Visual Feedback**: Show data availability prominently with all options

## Technical Implementation Strategy

### 1. Create Last Compliant Month Service

```javascript
// src/services/lastCompliantMonthService.js
export const getLastCompliantMonth = async (year) => {
  // Query validation data
  const validation = await dataService.getAnalysisPeriodValidation(year);
  
  // Find last compliant month
  const compliantMonths = validation.compliantMonths || [];
  if (compliantMonths.length === 0) return null;
  
  // Convert month names to numbers and find max
  const monthNumbers = compliantMonths.map(monthName => {
    const date = new Date(Date.parse(monthName + " 1, 2000"));
    return date.getMonth() + 1;
  });
  
  return Math.max(...monthNumbers);
};
```

### 2. Update HierarchicalFilterContext Quick Presets

Replace current date logic with data-based logic:

```javascript
// Instead of:
const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;

// Use:
const lastCompliantMonth = await getLastCompliantMonth(currentYear);
const dataCurrentMonth = lastCompliantMonth || 0;
const dataCurrentQuarter = Math.ceil(dataCurrentMonth / 3);
```

### 3. Update Quick Preset Cases

```javascript
case 'YTD':
  if (!dataCurrentMonth) {
    // No compliant data - disable
    return { disabled: true, message: "No compliant data available" };
  }
  startDate = new Date(currentYear, 0, 1);
  endDate = new Date(currentYear, dataCurrentMonth - 1, 
    new Date(currentYear, dataCurrentMonth, 0).getDate());
  displayLabel = `${currentYear} (Jan-${monthNames[dataCurrentMonth - 1]})`;
  break;

case 'QTD':
  if (!dataCurrentMonth) {
    return { disabled: true, message: "No compliant data available" };
  }
  const quarterStart = (dataCurrentQuarter - 1) * 3;
  startDate = new Date(currentYear, quarterStart, 1);
  endDate = new Date(currentYear, dataCurrentMonth - 1,
    new Date(currentYear, dataCurrentMonth, 0).getDate());
  
  // Show partial quarter (e.g., "Jul only" if Q3 incomplete)
  if (dataCurrentMonth === quarterStart + 1) {
    displayLabel = `${monthNames[dataCurrentMonth - 1]} ${currentYear} only`;
  } else {
    displayLabel = `Q${dataCurrentQuarter} ${currentYear} (${monthNames[quarterStart]}-${monthNames[dataCurrentMonth - 1]})`;
  }
  break;

case 'MTD':
  if (!dataCurrentMonth) {
    return { disabled: true, message: "No compliant data available" };
  }
  // Full month based on days column
  startDate = new Date(currentYear, dataCurrentMonth - 1, 1);
  endDate = new Date(currentYear, dataCurrentMonth - 1,
    new Date(currentYear, dataCurrentMonth, 0).getDate());
  displayLabel = `${monthNames[dataCurrentMonth - 1]} ${currentYear}`;
  break;
```

### 4. Disable Quick Presets for Past Years

```javascript
// In HierarchicalFilterContext
const isCurrentYear = selectedYear === new Date().getFullYear();
const quickPresetsEnabled = isCurrentYear && hasCompliantData;

// Pass to QuickRangePresets
<QuickRangePresets
  value={filterState.quickPreset}
  onChange={handleQuickPresetChange}
  presets={quickPresets}
  disabled={!quickPresetsEnabled}
  disabledMessage="Quick presets only available for current year with data"
/>
```

### 5. Remove Animations from Currently Showing

Update the component that appears under "Currently Showing":

```javascript
// Find and update the animating component
// Remove motion effects, keep only subtle transitions
<div className="transition-opacity duration-200">
  {/* Content without bounce/vibration animations */}
</div>
```

### 6. Add Visual Feedback Components

```javascript
// DataAvailabilityIndicator.jsx
const DataAvailabilityIndicator = ({ year, lastCompliantMonth }) => {
  const monthName = lastCompliantMonth 
    ? new Date(year, lastCompliantMonth - 1).toLocaleString('default', { month: 'long' })
    : 'No data';
    
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-dark">
      <Calendar className="w-4 h-4" />
      <span>Data through {monthName} {year}</span>
      <Tooltip content={`Last compliant month with uploaded data`}>
        <Info className="w-3 h-3 text-neutral-mid" />
      </Tooltip>
    </div>
  );
};
```

### 7. Update Data Service for Caching

```javascript
// Best practice caching for last compliant month
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const lastCompliantMonthCache = new Map();

export const getCachedLastCompliantMonth = async (year) => {
  const cacheKey = `lcm-${year}`;
  const cached = lastCompliantMonthCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.value;
  }
  
  const value = await getLastCompliantMonth(year);
  lastCompliantMonthCache.set(cacheKey, {
    value,
    timestamp: Date.now()
  });
  
  return value;
};
```

## Implementation Phases

### Phase 1: Core Logic (Priority 1)
1. Create `lastCompliantMonthService.js`
2. Update `HierarchicalFilterContext` to use data-based dates
3. Modify quick preset calculations
4. Add caching mechanism

### Phase 2: UI Updates (Priority 2)
1. Remove animations from "Currently Showing" area
2. Add `DataAvailabilityIndicator` component
3. Update `QuickRangePresets` with disabled state
4. Add tooltips for YTD/QTD/MTD buttons

### Phase 3: Validation & Edge Cases (Priority 3)
1. Handle no data scenarios
2. Prevent future month selection
3. Add upload page warnings
4. Test with various data gaps

### Phase 4: Testing & Polish (Priority 4)
1. Test all date calculation scenarios
2. Verify compliance integration
3. Ensure no regressions
4. Performance optimization

## Success Criteria

1. **YTD/QTD/MTD use uploaded data dates** - Not system dates
2. **Only compliant periods shown** - Respecting validation
3. **Clear visual feedback** - Users know data availability
4. **No jarring animations** - Professional appearance
5. **Handles edge cases** - Gaps, no data, past years
6. **Maintains accuracy** - No calculation errors

## Risk Mitigation

- **Thorough testing** with various data scenarios
- **Gradual rollout** - Test on staging first
- **Clear logging** of date calculations
- **Fallback handling** for edge cases

This implementation ensures YTD/QTD/MTD work correctly based on uploaded data, not system time, while maintaining a professional UI experience.