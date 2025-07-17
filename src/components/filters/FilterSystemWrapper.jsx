import React, { useEffect } from 'react';
import { useHierarchicalFilter } from '../../contexts/HierarchicalFilterContext';
import { useFilter } from '../../contexts/FilterContext';
import HierarchicalFilter from './HierarchicalFilter';

/**
 * Wrapper component that bridges the new hierarchical filter system
 * with the existing FilterContext for backward compatibility
 */
const FilterSystemWrapper = ({ useNewSystem = true, ...props }) => {
  const hierarchicalFilter = useNewSystem ? useHierarchicalFilter() : null;
  const { handlePeriodChange } = useFilter();

  // Sync hierarchical filter changes to legacy filter context
  useEffect(() => {
    if (!useNewSystem || !hierarchicalFilter) return;

    const params = hierarchicalFilter.getApiParameters();
    
    // Update legacy filter context
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
  }, [
    useNewSystem,
    hierarchicalFilter?.filterState.selectedYear,
    hierarchicalFilter?.filterState.viewMode,
    hierarchicalFilter?.filterState.selectedPeriod,
    hierarchicalFilter?.filterState.quickPreset,
    handlePeriodChange
  ]);

  if (!useNewSystem) {
    // Fall back to existing filter
    return null; // The existing StickyPeriodFilter will be used
  }

  return <HierarchicalFilter {...props} />;
};

export default FilterSystemWrapper;