import React, { useEffect, useRef, useCallback } from 'react';
import { useHierarchicalFilter } from '../../contexts/HierarchicalFilterContext';
import { useFilter } from '../../contexts/FilterContext';
import HierarchicalFilter from './HierarchicalFilter';
import { debounce } from 'lodash';

/**
 * Wrapper component that bridges the new hierarchical filter system
 * with the existing FilterContext for backward compatibility
 */
const FilterSystemWrapper = ({ useNewSystem = true, disableValidation = false, ...props }) => {
  const hierarchicalFilter = useNewSystem ? useHierarchicalFilter() : null;
  const { handlePeriodChange } = useFilter();
  const lastUpdateRef = useRef(null);

  // Create a debounced update function to prevent rapid sync updates
  const debouncedSync = useCallback(
    debounce((params) => {
      // console.log('🔄 FilterSystemWrapper: debouncedSync called with:', params);
      handlePeriodChange(params);
    }, 300), // 300ms debounce to prevent flashing and reduce rapid updates
    [handlePeriodChange]
  );

  // Sync hierarchical filter changes to legacy filter context
  useEffect(() => {
    if (!useNewSystem || !hierarchicalFilter) return;

    const params = hierarchicalFilter.getApiParameters();
    const { filterState } = hierarchicalFilter;
    
    // Create a more comprehensive key including all relevant state
    const updateKey = JSON.stringify({
      year: params.year,
      period: params.period,
      month: params.month,
      quarter: params.quarter,
      multiSelectMode: filterState.multiSelectMode,
      selectedYears: filterState.selectedYears,
      selectedPeriods: filterState.selectedPeriods,
      viewMode: filterState.viewMode,
      quickPreset: filterState.quickPreset
    });
    
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
    
    // console.log('🔄 FilterSystemWrapper: Syncing with params:', syncParams);
    
    // Use debounced sync to prevent rapid updates
    debouncedSync(syncParams);
  }, [
    useNewSystem,
    hierarchicalFilter,
    debouncedSync
  ]);

  if (!useNewSystem) {
    // Fall back to existing filter
    return null; // The existing StickyPeriodFilter will be used
  }

  return <HierarchicalFilter {...props} disableValidation={disableValidation} />;
};

export default FilterSystemWrapper;