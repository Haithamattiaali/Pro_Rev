import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import dataService from '../services/dataService';
import logger from '../utils/debugLogger';

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
  
  // State validation helper to ensure consistency
  const validateFilterState = (state) => {
    const validated = { ...state };
    
    // Ensure period type matches selections
    switch (validated.period) {
      case 'YTD':
        // Year view should have no month/quarter selections
        if (validated.selectedMonths?.length > 0 || validated.selectedQuarters?.length > 0) {
          logger.warn('FilterContext', 'Invalid state - clearing selections for YTD', {
            selectedMonths: validated.selectedMonths,
            selectedQuarters: validated.selectedQuarters
          });
          console.warn('📊 FilterContext: Invalid state - clearing selections for YTD');
          validated.selectedMonths = [];
          validated.selectedQuarters = [];
          validated.month = null;
          validated.quarter = null;
        }
        break;
        
      case 'QTD':
        // Quarter view should have no month selections
        if (validated.selectedMonths?.length > 0) {
          console.warn('📊 FilterContext: Invalid state - clearing months for QTD');
          validated.selectedMonths = [];
          validated.month = null;
        }
        break;
        
      case 'MTD':
        // Month view should have no quarter selections
        if (validated.selectedQuarters?.length > 0) {
          console.warn('📊 FilterContext: Invalid state - clearing quarters for MTD');
          validated.selectedQuarters = [];
          validated.quarter = null;
        }
        break;
    }
    
    return validated;
  };

  // Applied filter state (what's currently active)
  const [periodFilter, setPeriodFilter] = useState(validateFilterState({
    // Multi-select arrays (new)
    selectedMonths: [],
    selectedQuarters: [],
    selectedYears: [currentYear], // Default to current year
    activeMode: 'Y', // Start with year mode
    
    // Multi-select fields
    multiSelectMode: false,
    selectedPeriods: [], // This will hold the selected periods (Q1, Q2, etc.)
    viewMode: 'yearly',
    
    // Legacy single values (for backward compatibility)
    period: 'YTD',
    year: currentYear,
    month: null,
    quarter: null
  }));

  // Pending filter state (user's selections before applying)
  const [pendingFilter, setPendingFilter] = useState({
    selectedMonths: [],
    selectedQuarters: [],
    selectedYears: [currentYear],
    activeMode: 'Y'
  });

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // This effect is no longer needed as we compute values in applyFilters
  // Commenting out to prevent circular updates
  /*
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
      setPeriodFilter(validateFilterState(updates));
    }
  }, [periodFilter.selectedMonths, periodFilter.selectedQuarters, periodFilter.selectedYears]);
  */

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
    console.log('🔍 FilterContext: handlePendingChange called with:', filterConfig);
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
      
      console.log('🔍 FilterContext: New pending filter state:', newFilter);
      return newFilter;
    });
  };

  // Apply pending changes to active filters
  const applyFilters = () => {
    // NOTE: Cache clearing removed - dataService uses unique cache keys per filter combination
    // so different filters automatically get their own cached data
    
    const newFilter = {
      ...periodFilter,
      selectedMonths: pendingFilter.selectedMonths,
      selectedQuarters: pendingFilter.selectedQuarters,
      selectedYears: pendingFilter.selectedYears,
      activeMode: pendingFilter.activeMode
    };
    
    // Compute period and year values immediately
    if (pendingFilter.selectedYears.length === 0) {
      newFilter.period = 'NONE';
      newFilter.year = null;
      newFilter.month = null;
      newFilter.quarter = null;
    } else if (pendingFilter.selectedMonths.length === 0 && pendingFilter.selectedQuarters.length === 0) {
      // Only year selected, show full year
      newFilter.period = 'YTD';
      newFilter.year = pendingFilter.selectedYears[0];
      newFilter.month = null;
      newFilter.quarter = null;
    } else if (pendingFilter.selectedMonths.length > 0) {
      // Months selected
      newFilter.period = 'MTD';
      newFilter.year = pendingFilter.selectedYears[0];
      newFilter.month = pendingFilter.selectedMonths[0];
      newFilter.quarter = null;
    } else if (pendingFilter.selectedQuarters.length > 0) {
      // Quarters selected
      newFilter.period = 'QTD';
      newFilter.year = pendingFilter.selectedYears[0];
      newFilter.month = null;
      newFilter.quarter = pendingFilter.selectedQuarters[0];
    }
    
    console.log('🔄 Applying filters:', {
      from: { 
        period: periodFilter.period, 
        year: periodFilter.year, 
        month: periodFilter.month,
        selectedMonths: periodFilter.selectedMonths 
      },
      to: { 
        period: newFilter.period, 
        year: newFilter.year, 
        month: newFilter.month,
        selectedMonths: newFilter.selectedMonths,
        pendingMonths: pendingFilter.selectedMonths
      }
    });
    
    setPeriodFilter(validateFilterState(newFilter));
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

  // Track last cache clear to prevent duplicates
  const lastCacheClearRef = useRef(null);
  
  // Enhanced handlePeriodChange with Single Source of Truth pattern
  const handlePeriodChange = (filterConfig) => {
    logger.state('FilterContext', 'filterChange', periodFilter, filterConfig);
    logger.debug('FilterContext', 'handlePeriodChange called', filterConfig);
    
    // Only clear cache when year changes (significant data change)
    // Period changes (MTD/QTD/YTD) don't need cache clearing as dataService
    // uses unique cache keys for each filter combination
    const yearKey = `year-${filterConfig.year || periodFilter.year}`;
    
    if (filterConfig.year && lastCacheClearRef.current !== yearKey) {
      lastCacheClearRef.current = yearKey;
      logger.info('FilterContext', 'Year changed - clearing cache for new year', { 
        oldYear: periodFilter.year, 
        newYear: filterConfig.year 
      });
      dataService.clearCacheForYear(periodFilter.year); // Clear old year's cache
    } else if (import.meta.env.PROD) {
      console.log('[FilterContext] Period change without year change - cache preserved', {
        period: filterConfig.period,
        month: filterConfig.month,
        quarter: filterConfig.quarter,
        cachePreserved: true
      });
    }
    
    // Single Source of Truth: Period type drives selections
    if (filterConfig.period) {
      const newFilter = { ...periodFilter };
      
      // Update period type
      newFilter.period = filterConfig.period;
      
      // Clear invalid selections based on new period type
      switch (filterConfig.period) {
        case 'YTD':
          // Year view - clear month and quarter selections
          newFilter.selectedMonths = [];
          newFilter.selectedQuarters = [];
          newFilter.month = null;
          newFilter.quarter = null;
          newFilter.activeMode = 'Y';
          console.log('📊 FilterContext: Switched to YTD - cleared month/quarter selections');
          break;
          
        case 'QTD':
          // Quarter view - clear month selections, ensure quarter is set
          newFilter.selectedMonths = [];
          newFilter.month = null;
          newFilter.activeMode = 'Q';
          
          // Set default quarter if none selected
          if (!newFilter.selectedQuarters.length && !filterConfig.quarter) {
            newFilter.selectedQuarters = [currentQuarter];
            newFilter.quarter = currentQuarter;
          } else if (filterConfig.quarter) {
            newFilter.selectedQuarters = [filterConfig.quarter];
            newFilter.quarter = filterConfig.quarter;
          }
          console.log('📊 FilterContext: Switched to QTD - cleared month selections');
          break;
          
        case 'MTD':
          // Month view - clear quarter selections, ensure month is set
          newFilter.selectedQuarters = [];
          newFilter.quarter = null;
          newFilter.activeMode = 'M';
          
          // Set default month if none selected
          if (!newFilter.selectedMonths.length && !filterConfig.month) {
            newFilter.selectedMonths = [currentMonth];
            newFilter.month = currentMonth;
          } else if (filterConfig.month) {
            newFilter.selectedMonths = [filterConfig.month];
            newFilter.month = filterConfig.month;
          }
          console.log('📊 FilterContext: Switched to MTD - cleared quarter selections');
          break;
      }
      
      // Apply any other updates from filterConfig
      Object.keys(filterConfig).forEach(key => {
        if (key !== 'period' && filterConfig[key] !== undefined) {
          newFilter[key] = filterConfig[key];
        }
      });
      
      // Update year if provided
      if (filterConfig.year) {
        newFilter.year = filterConfig.year;
        newFilter.selectedYears = [filterConfig.year];
      }
      
      // Check if anything actually changed
      const hasChanged = JSON.stringify(newFilter) !== JSON.stringify(periodFilter);
      
      if (!hasChanged) {
        console.log('📊 FilterContext: No changes detected, skipping update');
        return;
      }
      
      console.log('📊 FilterContext: State updated with validation:', {
        period: newFilter.period,
        year: newFilter.year,
        month: newFilter.month,
        quarter: newFilter.quarter,
        activeMode: newFilter.activeMode,
        selections: {
          months: newFilter.selectedMonths,
          quarters: newFilter.selectedQuarters,
          years: newFilter.selectedYears
        }
      });
      
      setPeriodFilter(validateFilterState(newFilter));
      // Also update pending to keep in sync
      setPendingFilter(prev => ({
        ...prev,
        selectedMonths: newFilter.selectedMonths || [],
        selectedQuarters: newFilter.selectedQuarters || [],
        selectedYears: newFilter.selectedYears || [],
        activeMode: newFilter.activeMode || prev.activeMode
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

      setPeriodFilter(validateFilterState(updates));
      // Update pending to match
      setPendingFilter({
        selectedMonths: updates.selectedMonths,
        selectedQuarters: updates.selectedQuarters,
        selectedYears: updates.selectedYears,
        activeMode: updates.activeMode || 'Y'
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