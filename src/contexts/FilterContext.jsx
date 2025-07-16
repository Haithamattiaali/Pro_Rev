import React, { createContext, useContext, useState, useEffect } from 'react';

const FilterContext = createContext();

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  // Applied filter state (what's currently active)
  const [periodFilter, setPeriodFilter] = useState({
    // Multi-select arrays (new)
    selectedMonths: [],
    selectedQuarters: [],
    selectedYears: [currentYear], // Keep current year as default
    activeMode: 'Y', // Start with year mode
    
    // Legacy single values (for backward compatibility)
    period: 'YTD',
    year: currentYear,
    month: null,
    quarter: null
  });

  // Pending filter state (user's selections before applying)
  const [pendingFilter, setPendingFilter] = useState({
    selectedMonths: [],
    selectedQuarters: [],
    selectedYears: [currentYear],
    activeMode: 'Y'
  });

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Update legacy values when multi-select changes
  useEffect(() => {
    const { selectedMonths, selectedQuarters, selectedYears } = periodFilter;
    
    // Determine period type based on selections
    let period;
    
    // If no year selected at all, no data should be shown
    if (selectedYears.length === 0) {
      period = 'NONE';
    }
    // If only year selected (no months/quarters), show full year
    else if (selectedMonths.length === 0 && selectedQuarters.length === 0) {
      period = 'YTD';
    }
    // If months are selected
    else if (selectedMonths.length > 0 && selectedQuarters.length === 0) {
      period = 'MTD';
    }
    // If quarters are selected
    else if (selectedQuarters.length > 0 && selectedMonths.length === 0) {
      period = 'QTD';
    }

    // Update legacy values for backward compatibility
    const updates = {
      ...periodFilter,
      period,
      year: selectedYears[0] || null, // Don't default to current year
      month: selectedMonths[0] || null,
      quarter: selectedQuarters[0] || null
    };

    // Only update if something changed to avoid infinite loop
    if (JSON.stringify(updates) !== JSON.stringify(periodFilter)) {
      setPeriodFilter(updates);
    }
  }, [periodFilter.selectedMonths, periodFilter.selectedQuarters, periodFilter.selectedYears]);

  // Check if pending changes differ from applied filters
  useEffect(() => {
    const hasChanges = 
      JSON.stringify(pendingFilter.selectedMonths) !== JSON.stringify(periodFilter.selectedMonths) ||
      JSON.stringify(pendingFilter.selectedQuarters) !== JSON.stringify(periodFilter.selectedQuarters) ||
      JSON.stringify(pendingFilter.selectedYears) !== JSON.stringify(periodFilter.selectedYears);
    
    setHasChanges(hasChanges);
  }, [pendingFilter, periodFilter]);

  // Handle pending changes (before applying)
  const handlePendingChange = (filterConfig) => {
    setPendingFilter(prev => {
      const newFilter = {
        ...prev,
        ...filterConfig
      };
      
      // Enforce mutual exclusivity between months and quarters
      if ('selectedMonths' in filterConfig && filterConfig.selectedMonths.length > 0) {
        // Clear quarters if months are being selected
        newFilter.selectedQuarters = [];
      } else if ('selectedQuarters' in filterConfig && filterConfig.selectedQuarters.length > 0) {
        // Clear months if quarters are being selected
        newFilter.selectedMonths = [];
      }
      
      return newFilter;
    });
  };

  // Apply pending changes to active filters
  const applyFilters = () => {
    setPeriodFilter(prev => ({
      ...prev,
      selectedMonths: pendingFilter.selectedMonths,
      selectedQuarters: pendingFilter.selectedQuarters,
      selectedYears: pendingFilter.selectedYears,
      activeMode: pendingFilter.activeMode
    }));
    setHasChanges(false);
  };

  // Reset pending changes to current applied filters
  const resetFilters = () => {
    setPendingFilter({
      selectedMonths: periodFilter.selectedMonths,
      selectedQuarters: periodFilter.selectedQuarters,
      selectedYears: periodFilter.selectedYears,
      activeMode: periodFilter.activeMode
    });
    setHasChanges(false);
  };

  // Legacy handlePeriodChange for backward compatibility
  const handlePeriodChange = (filterConfig) => {
    // Handle both new multi-select format and legacy format
    if ('selectedMonths' in filterConfig || 'selectedQuarters' in filterConfig || 'selectedYears' in filterConfig) {
      // New format - apply immediately for legacy components
      setPeriodFilter(prev => ({
        ...prev,
        ...filterConfig
      }));
      // Also update pending to keep in sync
      setPendingFilter(prev => ({
        ...prev,
        ...filterConfig
      }));
    } else {
      // Legacy format - convert to multi-select
      const { period, year, month, quarter } = filterConfig;
      const updates = {
        ...periodFilter,
        period,
        year,
        month,
        quarter
      };

      // Update multi-select arrays based on legacy values
      if (period === 'MTD' && month) {
        updates.selectedMonths = month === 'all' ? [] : [month];
        updates.selectedQuarters = [];
      } else if (period === 'QTD' && quarter) {
        updates.selectedQuarters = quarter === 'all' ? [] : [quarter];
        updates.selectedMonths = [];
      } else if (period === 'YTD') {
        updates.selectedMonths = [];
        updates.selectedQuarters = [];
      }
      
      if (year) {
        updates.selectedYears = [year];
      }

      setPeriodFilter(updates);
      // Update pending to match
      setPendingFilter({
        selectedMonths: updates.selectedMonths,
        selectedQuarters: updates.selectedQuarters,
        selectedYears: updates.selectedYears,
        activeMode: updates.activeMode || 'M'
      });
    }
  };

  // Helper function to get formatted filter for API calls
  const getApiFilter = () => {
    const { selectedMonths, selectedQuarters, selectedYears } = periodFilter;
    
    return {
      months: selectedMonths.length > 0 ? selectedMonths : null,
      quarters: selectedQuarters.length > 0 ? selectedQuarters : null,
      years: selectedYears.length > 0 ? selectedYears : null, // Don't default to current year
      // Legacy format for backward compatibility
      period: periodFilter.period,
      year: periodFilter.year,
      month: periodFilter.month,
      quarter: periodFilter.quarter
    };
  };

  return (
    <FilterContext.Provider value={{ 
      periodFilter,
      pendingFilter,
      hasChanges,
      handlePeriodChange,
      handlePendingChange,
      applyFilters,
      resetFilters,
      getApiFilter 
    }}>
      {children}
    </FilterContext.Provider>
  );
};