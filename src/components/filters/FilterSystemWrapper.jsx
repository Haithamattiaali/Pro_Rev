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
      console.log('🔄 FilterSystemWrapper: debouncedSync called with:', params);
      handlePeriodChange(params);
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
    
    // Build proper sync params based on multi-select mode
    const syncParams = {
      ...params,
      selectedYears: filterState.multiSelectMode ? filterState.selectedYears : [params.year],
      multiSelectMode: filterState.multiSelectMode,
      viewMode: filterState.viewMode
    };
    
    // Properly handle selectedPeriods for multi-select
    if (filterState.multiSelectMode) {
      syncParams.selectedPeriods = filterState.selectedPeriods;
      
      // Convert periods to months/quarters based on viewMode
      if (filterState.viewMode === 'monthly') {
        syncParams.selectedMonths = filterState.selectedPeriods.map(p => parseInt(p));
        syncParams.selectedQuarters = [];
      } else if (filterState.viewMode === 'quarterly') {
        syncParams.selectedMonths = [];
        syncParams.selectedQuarters = filterState.selectedPeriods.map(p => parseInt(p.replace('Q', '')));
      }
    } else {
      syncParams.selectedPeriods = [];
      syncParams.selectedMonths = params.month ? [params.month] : [];
      syncParams.selectedQuarters = params.quarter ? [params.quarter] : [];
    }
    
    console.log('🔄 FilterSystemWrapper: Syncing with params:', syncParams);
    
    // Use debounced sync to prevent rapid updates
    debouncedSync(syncParams);
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