# Modular Multi-Select Filter Framework Documentation

## Overview

This document describes a flexible, reusable filtering framework that combines the best design principles from Material UI, Ant Design, and Apple's design language. The framework supports multi-select capabilities across different time dimensions (months, quarters, years) and can be adapted for any filtering needs.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Implementation Guide](#implementation-guide)
4. [Customization Options](#customization-options)
5. [API Reference](#api-reference)
6. [Backend Integration](#backend-integration)
7. [Examples](#examples)
8. [Best Practices](#best-practices)

## Architecture Overview

### Design Philosophy

The framework merges three design systems:

- **Material UI**: Ripple effects, elevation, clear interaction states
- **Ant Design**: Comprehensive selection panels, data-dense layouts, bulk actions
- **Apple Design**: Minimalist aesthetics, smooth animations, premium feel

### Component Structure

```
ModularPeriodFilter (Main Container)
├── SegmentedControl (Mode Selector)
├── SelectionDisplay (Current Selection)
│   └── PeriodChips (Visual Chips)
└── Popover (Selection Panel)
    └── MultiSelectPanel (Checkbox Grid)
```

## Core Components

### 1. ModularPeriodFilter

The main container that orchestrates the entire filtering experience.

**Key Features:**
- Segmented control for switching between filter modes (M/Q/Y)
- Popover trigger showing current selections
- Quick preset buttons
- Company branding integration

**Props:**
```jsx
interface ModularPeriodFilterProps {
  // No props required - uses FilterContext
}
```

### 2. MultiSelectPanel

A reusable selection component with checkbox grid layout.

**Key Features:**
- View density options (compact/comfortable/spacious)
- Search functionality for long lists
- Select All/Clear actions
- Keyboard navigation support

**Props:**
```jsx
interface MultiSelectPanelProps {
  title: string;
  items: Array<{
    value: number | string;
    label: string;
    shortLabel: string;
  }>;
  selected: Array<number | string>;
  onChange: (selection: Array<number | string>) => void;
  viewDensity?: 'compact' | 'comfortable' | 'spacious';
  onViewDensityChange?: (density: string) => void;
  allowSearch?: boolean;
}
```

### 3. PeriodChips

Visual representation of selected items with remove functionality.

**Key Features:**
- Color-coded chips by type
- Smooth enter/exit animations
- Overflow handling with "+N more"
- Interactive/non-interactive modes

**Props:**
```jsx
interface PeriodChipsProps {
  selections: {
    months?: number[];
    quarters?: number[];
    years?: number[];
  };
  modeConfig: object;
  onRemove?: (value: number, mode: string) => void;
  maxDisplay?: number;
  showEmpty?: boolean;
  interactive?: boolean;
}
```

### 4. FilterContext

Global state management for filter selections with backward compatibility.

**Structure:**
```jsx
interface FilterState {
  // Multi-select arrays (new)
  selectedMonths: number[];
  selectedQuarters: number[];
  selectedYears: number[];
  activeMode: 'M' | 'Q' | 'Y';
  
  // Legacy single values (backward compatibility)
  period: 'MTD' | 'QTD' | 'YTD';
  year: number;
  month: number;
  quarter: number;
}
```

## Implementation Guide

### Step 1: Install Dependencies

```bash
npm install @mui/material @emotion/react @emotion/styled @radix-ui/react-checkbox @radix-ui/react-popover framer-motion
```

### Step 2: Create Filter Context

```jsx
// contexts/FilterContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [periodFilter, setPeriodFilter] = useState({
    selectedMonths: [],
    selectedQuarters: [],
    selectedYears: [new Date().getFullYear()],
    activeMode: 'M',
    // Legacy support
    period: 'YTD',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: Math.ceil((new Date().getMonth() + 1) / 3)
  });

  const handlePeriodChange = (filterConfig) => {
    setPeriodFilter(prev => ({ ...prev, ...filterConfig }));
  };

  const getApiFilter = () => {
    const { selectedMonths, selectedQuarters, selectedYears } = periodFilter;
    return {
      months: selectedMonths.length > 0 ? selectedMonths : null,
      quarters: selectedQuarters.length > 0 ? selectedQuarters : null,
      years: selectedYears.length > 0 ? selectedYears : [new Date().getFullYear()]
    };
  };

  return (
    <FilterContext.Provider value={{ periodFilter, handlePeriodChange, getApiFilter }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
```

### Step 3: Implement Components

Place the three main component files in your project:
- `ModularPeriodFilter.jsx`
- `MultiSelectPanel.jsx`
- `PeriodChips.jsx`

### Step 4: Use in Your Application

```jsx
import { FilterProvider } from './contexts/FilterContext';
import ModularPeriodFilter from './components/filters/ModularPeriodFilter';

function App() {
  return (
    <FilterProvider>
      <div className="app">
        <ModularPeriodFilter />
        {/* Your filtered content */}
      </div>
    </FilterProvider>
  );
}
```

## Customization Options

### 1. Custom Filter Modes

Replace the default M/Q/Y modes with your own:

```jsx
const modeConfig = {
  CATEGORY: {
    label: 'Categories',
    icon: FolderIcon,
    items: [
      { value: 'electronics', label: 'Electronics', shortLabel: 'Elec' },
      { value: 'clothing', label: 'Clothing', shortLabel: 'Cloth' },
      // ...
    ],
    selected: selectedCategories,
    key: 'selectedCategories'
  },
  BRAND: {
    label: 'Brands',
    icon: TagIcon,
    items: brandsList,
    selected: selectedBrands,
    key: 'selectedBrands'
  }
};
```

### 2. Custom Chip Colors

```jsx
const chipColorMap = {
  months: 'bg-blue-50 text-blue-700 border-blue-200',
  quarters: 'bg-green-50 text-green-700 border-green-200',
  years: 'bg-purple-50 text-purple-700 border-purple-200',
  // Custom types
  categories: 'bg-orange-50 text-orange-700 border-orange-200',
  brands: 'bg-pink-50 text-pink-700 border-pink-200'
};
```

### 3. Custom Quick Presets

```jsx
const presets = [
  {
    label: 'Last 30 Days',
    action: () => setCustomDateRange(last30Days)
  },
  {
    label: 'This Quarter',
    action: () => setQuarterSelection(currentQuarter)
  },
  {
    label: 'Holiday Season',
    action: () => setMonthSelection([10, 11, 12])
  }
];
```

## Backend Integration

### SQL Query Support

The framework generates multi-select parameters that need IN clause support:

```sql
-- Example SQL with multi-select support
SELECT 
  SUM(revenue) as total_revenue,
  COUNT(DISTINCT customer) as customer_count
FROM sales_data
WHERE 
  year IN (?, ?, ?)
  AND month IN (?, ?, ?, ?)
  AND category IN (?, ?)
```

### Node.js/Express Example

```javascript
// Backend endpoint with multi-select support
app.get('/api/data/overview', async (req, res) => {
  const { 
    years = [new Date().getFullYear()],
    months = [],
    quarters = [],
    categories = []
  } = req.query;

  // Convert query params to arrays
  const yearArray = Array.isArray(years) ? years : [years];
  const monthArray = Array.isArray(months) ? months : months.split(',').filter(Boolean);
  
  // Use the multi-select service
  const data = await dataService.getFilteredData({
    years: yearArray,
    months: monthArray,
    quarters: quarters,
    categories: categories
  });
  
  res.json(data);
});
```

### Data Service Layer

```javascript
class DataService {
  getMultiSelectMonths(filters) {
    const { months = [], quarters = [] } = filters;
    const allMonths = [];

    // Convert quarters to months
    if (quarters.length > 0) {
      quarters.forEach(q => {
        const startMonth = (q - 1) * 3 + 1;
        const endMonth = q * 3;
        for (let m = startMonth; m <= endMonth; m++) {
          allMonths.push(m);
        }
      });
    }

    // Add directly selected months
    months.forEach(m => {
      if (!allMonths.includes(m)) {
        allMonths.push(m);
      }
    });

    return allMonths;
  }

  async getFilteredData(filters) {
    const months = this.getMultiSelectMonths(filters);
    const { years, categories } = filters;
    
    // Build dynamic SQL
    const conditions = [];
    const params = [];
    
    if (years.length > 0) {
      conditions.push(`year IN (${years.map(() => '?').join(',')})`);
      params.push(...years);
    }
    
    if (months.length > 0) {
      conditions.push(`month IN (${months.map(() => '?').join(',')})`);
      params.push(...months);
    }
    
    const sql = `
      SELECT * FROM data_table
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;
    
    return await db.query(sql, params);
  }
}
```

## Examples

### Example 1: Product Filter

```jsx
const ProductFilter = () => {
  const [filters, setFilters] = useState({
    selectedCategories: [],
    selectedBrands: [],
    selectedPriceRanges: [],
    activeMode: 'CATEGORY'
  });

  const modeConfig = {
    CATEGORY: {
      label: 'Categories',
      items: categories,
      selected: filters.selectedCategories,
      key: 'selectedCategories'
    },
    BRAND: {
      label: 'Brands',
      items: brands,
      selected: filters.selectedBrands,
      key: 'selectedBrands'
    },
    PRICE: {
      label: 'Price Range',
      items: priceRanges,
      selected: filters.selectedPriceRanges,
      key: 'selectedPriceRanges'
    }
  };

  return <ModularFilter config={modeConfig} filters={filters} onChange={setFilters} />;
};
```

### Example 2: Geographic Filter

```jsx
const GeographicFilter = () => {
  const [filters, setFilters] = useState({
    selectedCountries: [],
    selectedRegions: [],
    selectedCities: [],
    activeMode: 'COUNTRY'
  });

  // Hierarchical filtering
  useEffect(() => {
    if (filters.selectedCountries.length > 0) {
      // Load regions for selected countries
      loadRegionsForCountries(filters.selectedCountries);
    }
  }, [filters.selectedCountries]);

  return <ModularFilter config={geoConfig} filters={filters} onChange={setFilters} />;
};
```

## Best Practices

### 1. Performance Optimization

- **Virtualization**: For lists with 100+ items, implement virtual scrolling
- **Debouncing**: Debounce search input to reduce re-renders
- **Memoization**: Use React.memo for expensive components

```jsx
const MemoizedMultiSelectPanel = React.memo(MultiSelectPanel, (prevProps, nextProps) => {
  return (
    prevProps.selected === nextProps.selected &&
    prevProps.items === nextProps.items
  );
});
```

### 2. Accessibility

- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
- **ARIA Labels**: Add proper ARIA labels for screen readers
- **Focus Management**: Manage focus when opening/closing popovers

```jsx
<button
  aria-label={`Filter by ${currentMode}. ${selectedCount} items selected`}
  aria-expanded={isOpen}
  aria-controls="filter-panel"
>
  {/* Button content */}
</button>
```

### 3. Responsive Design

```jsx
const ResponsiveFilter = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <ModularFilter
      maxDisplay={isMobile ? 2 : 5}
      viewDensity={isMobile ? 'compact' : 'comfortable'}
    />
  );
};
```

### 4. State Persistence

```jsx
// Save filter state to localStorage
useEffect(() => {
  localStorage.setItem('userFilters', JSON.stringify(periodFilter));
}, [periodFilter]);

// Restore on mount
useEffect(() => {
  const saved = localStorage.getItem('userFilters');
  if (saved) {
    setPeriodFilter(JSON.parse(saved));
  }
}, []);
```

### 5. Analytics Integration

```jsx
const trackFilterChange = (filterType, selections) => {
  analytics.track('Filter Changed', {
    filterType,
    selectionCount: selections.length,
    selections: selections.slice(0, 10) // Limit for privacy
  });
};
```

## Migration Guide

### From Single-Select to Multi-Select

```javascript
// Old API call
const data = await api.getData({ year: 2024, month: 7 });

// New API call with multi-select
const data = await api.getData({ 
  years: [2024], 
  months: [6, 7, 8] 
});

// Backend migration
// Old query
WHERE year = ? AND month = ?

// New query
WHERE year IN (?) AND month IN (?)
```

## Troubleshooting

### Common Issues

1. **Nested Button Warning**
   - Solution: Use `interactive={false}` prop on PeriodChips when inside buttons

2. **Performance Issues with Large Lists**
   - Solution: Implement virtualization or pagination

3. **State Not Updating**
   - Solution: Ensure FilterProvider wraps all components using filters

## License

This framework is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## Support

For questions or issues, please contact the development team or create an issue in the repository.