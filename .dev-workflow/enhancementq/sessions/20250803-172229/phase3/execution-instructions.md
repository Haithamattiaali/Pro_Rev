# Execution Instructions for Smooth Filter Transitions
Session: 20250803-172229
Date: Sun Aug 3 17:22:29 2025

## Quick Start
```bash
# Option 1: Direct execution
/dev-agent --enhancement-plan=".dev-workflow/enhancementq/sessions/20250803-172229/phase3/enhancement-blueprint.md"

# Option 2: Step by step implementation
# Just follow the tasks in devagent-tasks.md
```

## Manual Implementation Steps

### 1. Create Feature Branch
```bash
git checkout -b feature/smooth-filter-transitions
```

### 2. Create TransitionWrapper Component
Create file: `src/components/common/TransitionWrapper.jsx`

```jsx
import React, { useState, useRef, useEffect } from 'react';

const TransitionWrapper = ({ 
  show, 
  children, 
  duration = 300,
  easing = 'ease-out',
  className = '' 
}) => {
  const [height, setHeight] = useState(0);
  const contentRef = useRef(null);
  
  useEffect(() => {
    if (!contentRef.current) return;
    
    if (show) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight);
    } else {
      setHeight(0);
    }
  }, [show]);
  
  return (
    <div 
      className={`overflow-hidden transition-all ${className}`}
      style={{ 
        height: show ? height : 0,
        opacity: show ? 1 : 0,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: easing
      }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default TransitionWrapper;
```

### 3. Update PeriodFilter Component

Update `src/components/filters/PeriodFilter.jsx`:

1. Add import at top:
```jsx
import TransitionWrapper from '../common/TransitionWrapper';
```

2. Update button classes (add scale animation):
```jsx
className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium 
  transition-all duration-150 transform active:scale-95 
  ${selectedPeriod === 'MTD'
    ? 'bg-primary text-white shadow-sm'
    : 'bg-secondary-pale text-neutral-dark hover:bg-secondary-light hover:shadow-sm'
  }`}
```

3. Wrap month selector (replace lines 118-133):
```jsx
<TransitionWrapper show={selectedPeriod === 'MTD'} className="ml-2">
  <div className="relative">
    <select
      value={selectedMonth}
      onChange={(e) => handleMonthChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
      className="appearance-none bg-neutral-light border border-secondary-pale text-neutral-dark text-xs sm:text-sm py-2 px-3 sm:px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
    >
      {months.map((month) => (
        <option key={month.value} value={month.value}>
          {month.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-mid pointer-events-none" />
  </div>
</TransitionWrapper>
```

4. Wrap quarter selector (replace lines 136-151):
```jsx
<TransitionWrapper show={selectedPeriod === 'QTD'} className="ml-2">
  <div className="relative">
    <select
      value={selectedQuarter}
      onChange={(e) => handleQuarterChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
      className="appearance-none bg-neutral-light border border-secondary-pale text-neutral-dark text-xs sm:text-sm py-2 px-3 sm:px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
    >
      {quarters.map((quarter) => (
        <option key={quarter.value} value={quarter.value}>
          {quarter.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-mid pointer-events-none" />
  </div>
</TransitionWrapper>
```

### 4. Test the Implementation

1. Start the dev server:
```bash
npm run dev
```

2. Test all transitions:
   - Click MTD - month selector should smoothly fade in
   - Click QTD - month fades out, quarter fades in
   - Click YTD - quarter fades out smoothly
   - Click buttons rapidly - no janky behavior

3. Check performance:
   - Open Chrome DevTools > Performance
   - Record while clicking filters
   - Verify 60fps animations

### 5. Commit Changes

```bash
git add -A
git commit -m "feat(ui): add smooth transitions to period filter selectors with fade and height animations"
```

## Troubleshooting

### If animations are janky:
- Check for console errors
- Verify height calculation in useEffect
- Try increasing duration slightly

### If layout still jumps:
- Ensure TransitionWrapper is properly wrapping selectors
- Check that overflow-hidden is applied
- Verify margin/padding on wrapper

### If animations don't work:
- Check that Tailwind CSS is properly configured
- Verify transition classes are applied
- Check browser console for errors

## Important Notes
- Session Data: `.dev-workflow/enhancementq/sessions/20250803-172229`
- The enhancement focuses on smooth transitions without breaking functionality
- All existing filter logic remains unchanged
- Animations are CSS-based for best performance