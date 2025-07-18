import React, { useEffect, useRef, useCallback } from 'react';
import { useHierarchicalFilter } from '../../contexts/HierarchicalFilterContext';
import { useFilter } from '../../contexts/FilterContext';
import HierarchicalFilter from './HierarchicalFilter';
import { debounce } from 'lodash';

/**
 * Wrapper component that bridges the new hierarchical filter system
 * with the existing FilterContext for backward compatibility
 */
const FilterSystemWrapper = ({ useNewSystem = true, ...props }) => {
  const hierarchicalFilter = useNewSystem ? useHierarchicalFilter() : null;
  const { handlePeriodChange } = useFilter();
  const lastUpdateRef = useRef(null);

  // Create a debounced update function to prevent rapid sync updates
  const debouncedSync = useCallback(
    debounce((params) => {
      handlePeriodChange({
        period: params.period,
        year: params.year,
        month: params.month,
        quarter: params.quarter,
        // Also pass the new multi-select format for components that support it
        selectedYears: params.year ? [params.year] : [],
        selectedMonths: params.month ? [params.month] : [],
        selectedQuarters: params.quarter ? [params.quarter] : []
      });
    }, 100), // 100ms debounce to prevent flashing
    [handlePeriodChange]
  );

  // Sync hierarchical filter changes to legacy filter context
  useEffect(() => {
    if (!useNewSystem || !hierarchicalFilter) return;

    const params = hierarchicalFilter.getApiParameters();
    const { filterState } = hierarchicalFilter;
    
    // Create a stable key for comparison to prevent infinite loops
    const updateKey = filterState.multiSelectMode 
      ? `${filterState.selectedYears.join(',')}-${filterState.selectedPeriods.join(',')}-${filterState.viewMode}`
      : `${params.year}-${params.period}-${params.month}-${params.quarter}`;
    
    // Only update if the key has changed
    if (lastUpdateRef.current === updateKey) {
      return;
    }
    
    lastUpdateRef.current = updateKey;
    
    // Use debounced sync to prevent rapid updates
    debouncedSync({
      ...params,
      // Pass multi-select arrays when in multi-select mode
      selectedYears: filterState.multiSelectMode ? filterState.selectedYears : [params.year],
      selectedPeriods: filterState.multiSelectMode ? filterState.selectedPeriods : [],
      multiSelectMode: filterState.multiSelectMode,
      viewMode: filterState.viewMode
    });
  }, [
    useNewSystem,
    hierarchicalFilter?.filterState.selectedYear,
    hierarchicalFilter?.filterState.selectedYears,
    hierarchicalFilter?.filterState.viewMode,
    hierarchicalFilter?.filterState.selectedPeriod,
    hierarchicalFilter?.filterState.selectedPeriods,
    hierarchicalFilter?.filterState.quickPreset,
    hierarchicalFilter?.filterState.multiSelectMode,
    debouncedSync
  ]);

  if (!useNewSystem) {
    // Fall back to existing filter
    return null; // The existing StickyPeriodFilter will be used
  }

  return <HierarchicalFilter {...props} />;
};

export default FilterSystemWrapper;