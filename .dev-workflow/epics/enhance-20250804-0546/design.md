# Enhancement Design: YTD/QTD/MTD Data-Aware Period Filters

## Architecture Changes

### Current Architecture
```
System Date → Current Month/Quarter → YTD/QTD/MTD Calculations → Display
```

### New Architecture  
```
Excel Upload → Validation Data → Last Compliant Month → YTD/QTD/MTD Calculations → Display
                                         ↑
                                    (Cached 5 min)
```

## Component Updates

### 1. LastCompliantMonthService (New)
**Purpose**: Centralize last compliant month detection
```javascript
// src/services/lastCompliantMonthService.js
- getLastCompliantMonth(year) - Core detection logic
- getCachedLastCompliantMonth(year) - With 5-minute cache
- clearCache() - For data refresh
- getDataAvailabilityInfo(year) - Full availability details
```

### 2. HierarchicalFilterContext
**Update**: Replace system date logic with data-based logic
- Remove `new Date()` usage for current month/quarter
- Add `lastCompliantMonth` state
- Update quick preset calculations
- Add data availability checks

### 3. QuickRangePresets Component
**Update**: Add disabled state for past years
- Accept `disabled` prop
- Show disabled styling
- Display tooltip with reason

### 4. FilterSummary Component  
**Update**: Remove animations (already done)
- Ensure no vibration effects
- Keep only subtle transitions

### 5. DataAvailabilityIndicator (New)
**Purpose**: Show data availability prominently
```javascript
// src/components/common/DataAvailabilityIndicator.jsx
- Display "Data through [Month] [Year]"
- Calendar icon with visual indicator
- Tooltip with details
```

## Data Flow Changes

### Before:
1. User clicks YTD
2. System gets current date
3. Calculate Jan to current month
4. Fetch and display data

### After:
1. User clicks YTD
2. Get cached last compliant month
3. Calculate Jan to last compliant month
4. Fetch and display data
5. Show data availability indicator

## API Integration

### Existing APIs Used:
- `getAnalysisPeriodValidation(year)` - Get compliance data
- Returns: `{ compliantMonths: ['Jan', 'Feb', ...] }`

### Cache Strategy:
- 5-minute TTL for last compliant month
- Clear on data refresh (upload)
- Per-year caching

## UI/UX Improvements

### Visual Hierarchy:
1. **Primary**: Data availability indicator (always visible)
2. **Secondary**: YTD/QTD/MTD buttons (enabled/disabled based on data)
3. **Tertiary**: Period details in "Currently Showing"

### Animation Updates:
- ❌ Remove: Bounce, vibration, scale effects
- ✅ Keep: Opacity transitions (200ms), color changes
- ✅ Keep: Number morphing (from previous enhancement)

### Disabled States:
```css
.quick-preset-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  /* No hover effects */
}
```

## State Management Updates

### FilterContext State:
```javascript
{
  // Existing
  selectedYear: 2025,
  viewMode: 'yearly',
  
  // New
  lastCompliantMonth: 7, // July
  dataAvailability: {
    hasData: true,
    lastMonth: 7,
    lastMonthName: 'July',
    isCurrentYear: true,
    quickPresetsEnabled: true
  }
}
```

### Update Triggers:
- Year selection change → Refetch last compliant month
- Data upload → Clear cache and refetch
- Page load → Initial fetch

## Implementation Details

### Month Detection Logic:
```javascript
const getLastCompliantMonth = async (year) => {
  const validation = await dataService.getAnalysisPeriodValidation(year);
  const compliantMonths = validation.compliantMonths || [];
  
  if (compliantMonths.length === 0) {
    return null;
  }
  
  // Convert month names to numbers
  const monthMap = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
    'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
    'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };
  
  const monthNumbers = compliantMonths
    .map(name => monthMap[name])
    .filter(num => num);
    
  return Math.max(...monthNumbers);
};
```

### Quick Preset Logic:
```javascript
// YTD Example
case 'YTD':
  const lastMonth = dataAvailability.lastMonth;
  if (!lastMonth) {
    return { disabled: true };
  }
  
  startDate = new Date(year, 0, 1); // Jan 1
  endDate = new Date(year, lastMonth - 1, 
    new Date(year, lastMonth, 0).getDate()); // Last day of last month
  
  displayLabel = `${year} (Jan-${dataAvailability.lastMonthName})`;
  periodType = 'YTD';
  break;
```

## Error Handling

1. **No Data**: Disable buttons, show message
2. **API Failure**: Use last cached value, show warning
3. **Invalid Data**: Default to safe state (disabled)
4. **Cache Miss**: Fetch fresh, show loading briefly

## Performance Optimizations

1. **Caching**: 5-minute TTL reduces API calls
2. **Memoization**: Quick preset calculations
3. **Lazy Loading**: Data availability on demand
4. **Batch Updates**: Single state update for all changes