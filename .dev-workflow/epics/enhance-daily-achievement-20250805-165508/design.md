# Design Document - Daily Achievement Enhancement

## Epic: enhance-daily-achievement-20250805-165508
Generated: Mon Aug 5 17:12:00 2025

## Visual Design Specifications

### 1. Daily Metrics Display Layout

#### Overview Page Enhancement
```
┌─────────────────────────────────────────────────────────────┐
│                    Overview Dashboard                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Revenue   │ │   Target    │ │Achievement %│           │
│  │ $1,234,567  │ │ $1,500,000  │ │   82.3%     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ NEW!      │
│  │Daily Target │ │Days Worked  │ │Daily Achv % │           │
│  │  $48,387    │ │    20/31    │ │   127.2%    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 2. Component Hierarchy

```
Overview.jsx
├── MetricCard (Revenue)
├── MetricCard (Target)
├── MetricCard (Achievement %)
├── MetricCard (Daily Target) - NEW
├── MetricCard (Days Worked) - NEW
└── MetricCard (Daily Achievement %) - NEW
```

### 3. Color Scheme & Styling

#### Daily Metric Cards
- **Background**: Same as existing metric cards (#ffffff)
- **Border**: 1px solid #e2e8f0
- **Shadow**: 0 1px 3px rgba(0,0,0,0.1)
- **Daily Indicator**: Small "DAILY" badge in top-right corner
  - Color: #9e1f63 (brand primary)
  - Font size: 10px
  - Font weight: 600

#### Value Styling
- **Daily Target**: 
  - Format: Currency ($XX,XXX)
  - Color: #1a202c (same as revenue)
- **Days Worked**:
  - Format: "X/Y days"
  - Color: #718096 (secondary text)
- **Daily Achievement**:
  - Format: Percentage (XXX.X%)
  - Color: Dynamic based on value
    - ≥100%: #48bb78 (green)
    - 80-99%: #ed8936 (orange)
    - <80%: #e53e3e (red)

### 4. Responsive Design

#### Desktop (≥1024px)
- 6 cards in 2 rows of 3
- Card width: 30% with gaps

#### Tablet (768-1023px)
- 3 cards per row
- Daily metrics form second row

#### Mobile (<768px)
- Single column layout
- Daily metrics after monthly metrics

### 5. Animation & Transitions

- **Card Entry**: Fade in with 0.3s ease-out
- **Value Updates**: Smooth number transition (0.5s)
- **Hover State**: Slight shadow increase
- **Loading State**: Pulse animation on skeleton

## Component Specifications

### MetricCard Enhancement

```jsx
// New props for daily metrics
interface MetricCardProps {
  title: string;
  value: number | string;
  format: 'currency' | 'percentage' | 'custom';
  subtitle?: string;
  badge?: string; // For "DAILY" indicator
  trend?: number;
  comparison?: string;
  loading?: boolean;
  error?: string;
  customFormatter?: (value: any) => string;
}
```

### Daily-Specific Formatters

```javascript
// Days formatter
formatDaysWorked(worked, total) {
  return `${worked}/${total} days`;
}

// Daily achievement with higher precision
formatDailyAchievement(value) {
  return `${value.toFixed(1)}%`;
}
```

## API Response Structure

### Enhanced Overview Response
```json
{
  "overview": {
    "revenue": 1234567,
    "target": 1500000,
    "achievement": 82.3,
    "cost": 800000,
    "profit": 434567,
    "profitMargin": 35.2,
    
    // NEW daily fields
    "dailyTarget": 48387.10,
    "daysWorked": 20,
    "calendarDays": 31,
    "periodTarget": 967742,
    "dailyAchievement": 127.2
  }
}
```

### Service Breakdown Enhancement
```json
{
  "serviceBreakdown": [
    {
      "service_type": "Service A",
      "revenue": 500000,
      "target": 600000,
      "achievement": 83.3,
      
      // NEW daily fields per service
      "dailyTarget": 19354.84,
      "periodTarget": 387096.77,
      "dailyAchievement": 129.2
    }
  ]
}
```

## User Experience Flows

### 1. Initial Load
1. User navigates to Overview
2. Monthly metrics load first (existing)
3. Daily metrics fade in below (0.3s delay)
4. "DAILY" badges help distinguish metric types

### 2. Period Change
1. User changes filter (MTD/QTD/YTD)
2. All metrics update simultaneously
3. Daily calculations reflect new period
4. Smooth transitions between values

### 3. Hover Interactions
1. Hover on daily metric card
2. Tooltip shows calculation formula
3. Example: "Monthly Target ÷ Calendar Days"

## Accessibility

- **ARIA Labels**: "Daily target amount for current period"
- **Screen Reader**: Announces "DAILY" prefix for daily metrics
- **Keyboard Navigation**: Tab order places daily metrics after monthly
- **Color Contrast**: All text meets WCAG AA standards

## Performance Considerations

1. **Calculation Timing**: Backend calculates all daily metrics
2. **Caching**: Daily metrics cached with 5-minute TTL
3. **Lazy Loading**: Daily cards can be deferred if needed
4. **Bundle Size**: No new dependencies required

## Error States

1. **Missing Days Data**: Show "30 days (default)" with info icon
2. **Zero Target**: Display "N/A" for daily achievement
3. **Calculation Error**: Fallback to "--" with error tooltip

## Future Enhancements (Out of Scope)

- Daily trend charts
- Historical daily comparisons
- Daily target editing UI
- Automated days calculation
- Weekend/holiday adjustments