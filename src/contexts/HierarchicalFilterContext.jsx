import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import dataService from '../services/dataService';

const HierarchicalFilterContext = createContext();

export const useHierarchicalFilter = () => {
  const context = useContext(HierarchicalFilterContext);
  if (!context) {
    throw new Error('useHierarchicalFilter must be used within a HierarchicalFilterProvider');
  }
  return context;
};

export default HierarchicalFilterContext;

export const HierarchicalFilterProvider = ({ children }) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  // Core filter state
  const [filterState, setFilterState] = useState({
    // Primary selections - now support arrays for multi-select
    selectedYears: [currentYear], // Array of selected years
    viewMode: 'quarterly', // 'yearly' | 'quarterly' | 'monthly'
    selectedPeriods: [`Q${currentQuarter}`], // Array of selected periods
    multiSelectMode: false, // Toggle for multi-select mode
    
    // Legacy single selection (for backward compatibility)
    selectedYear: currentYear,
    selectedPeriod: `Q${currentQuarter}`,
    
    // Advanced features
    comparisonMode: null, // null | 'previous' | 'yearOverYear' | 'custom'
    comparisonPeriod: null,
    quickPreset: null, // 'YTD' | 'QTD' | 'MTD' | 'L4Q' | 'L12M' | null
    
    // UI state
    isFilterOpen: false
  });

  // Get available years from data
  const [availableYears, setAvailableYears] = useState([currentYear, currentYear - 1, currentYear - 2]);
  
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const years = await dataService.getAvailableYears();
        if (years && years.length > 0) {
          setAvailableYears(years.sort((a, b) => b - a)); // Sort descending
        }
      } catch (error) {
        console.error('Failed to fetch available years:', error);
      }
    };
    fetchYears();
  }, []);

  // Compute derived values
  const derivedValues = useMemo(() => {
    const { selectedYear, selectedYears, viewMode, selectedPeriod, selectedPeriods, multiSelectMode } = filterState;
    
    // Use arrays if in multi-select mode, otherwise use single values
    const years = multiSelectMode ? selectedYears : [selectedYear];
    const periods = multiSelectMode ? selectedPeriods : [selectedPeriod];
    
    // Calculate date range based on selections
    let startDate, endDate, displayLabel, periodType;
    
    // For multi-select, we'll show the range of all selections
    if (multiSelectMode && (years.length > 1 || periods.length > 1)) {
      // Find the earliest and latest dates across all selections
      const dates = [];
      
      years.forEach(year => {
        if (viewMode === 'yearly') {
          dates.push(new Date(year, 0, 1), new Date(year, 11, 31));
        } else if (viewMode === 'quarterly') {
          periods.forEach(period => {
            const quarter = parseInt(period.replace('Q', ''));
            const startMonth = (quarter - 1) * 3;
            const endMonth = quarter * 3 - 1;
            dates.push(new Date(year, startMonth, 1), new Date(year, endMonth + 1, 0));
          });
        } else if (viewMode === 'monthly') {
          periods.forEach(period => {
            const month = parseInt(period);
            dates.push(new Date(year, month - 1, 1), new Date(year, month, 0));
          });
        }
      });
      
      startDate = new Date(Math.min(...dates));
      endDate = new Date(Math.max(...dates));
      
      // Create display label for multi-select
      if (years.length > 1) {
        displayLabel = `${years.join(', ')} - ${periods.length} ${viewMode === 'quarterly' ? 'quarters' : 'months'} selected`;
      } else {
        displayLabel = `${periods.join(', ')} ${years[0]}`;
      }
      periodType = viewMode === 'yearly' ? 'YTD' : viewMode === 'quarterly' ? 'QTD' : 'MTD';
    } else {
      // Single selection logic (existing)
      const year = years[0];
      const period = periods[0];
      
      if (viewMode === 'yearly') {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        displayLabel = `Full Year ${year}`;
        periodType = 'YTD';
      } else if (viewMode === 'quarterly') {
        const quarter = parseInt(period.replace('Q', ''));
        const startMonth = (quarter - 1) * 3;
        const endMonth = quarter * 3 - 1;
        startDate = new Date(year, startMonth, 1);
        endDate = new Date(year, endMonth + 1, 0);
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const rangeLabel = `${monthNames[startMonth]}-${monthNames[endMonth]}`;
        displayLabel = `${period} ${year} (${rangeLabel})`;
        periodType = 'QTD';
      } else if (viewMode === 'monthly') {
        const month = parseInt(period);
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
        
        const monthName = startDate.toLocaleString('en-US', { month: 'long' });
        displayLabel = `${monthName} ${year}`;
        periodType = 'MTD';
      }
    }
    
    // Check if this is a partial period (current period not yet complete)
    let isPartialPeriod = selectedYear === currentYear && 
      ((viewMode === 'quarterly' && selectedPeriod === `Q${currentQuarter}`) ||
       (viewMode === 'monthly' && parseInt(selectedPeriod) === currentMonth));
    
    // Handle quick presets - always use current date
    if (filterState.quickPreset) {
      const today = new Date();
      
      switch (filterState.quickPreset) {
        case 'YTD':
          startDate = new Date(currentYear, 0, 1);
          endDate = today;
          displayLabel = `Year to Date ${currentYear}`;
          periodType = 'YTD';
          break;
        case 'QTD':
          startDate = new Date(currentYear, (currentQuarter - 1) * 3, 1);
          endDate = today;
          displayLabel = `Quarter to Date (Q${currentQuarter} ${currentYear})`;
          periodType = 'QTD';
          break;
        case 'MTD':
          startDate = new Date(currentYear, currentMonth - 1, 1);
          endDate = today;
          displayLabel = `Month to Date (${today.toLocaleString('en-US', { month: 'long' })} ${currentYear})`;
          periodType = 'MTD';
          break;
        case 'L4Q':
          endDate = new Date(currentYear, currentMonth - 1, 0);
          startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth() + 1, 1);
          displayLabel = 'Last 4 Quarters';
          periodType = 'YTD';
          break;
        case 'L12M':
          endDate = today;
          startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
          displayLabel = 'Last 12 Months';
          periodType = 'YTD';
          break;
      }
      
      // Quick presets always set to partial period since they go to current date
      isPartialPeriod = true;
    }
    
    return {
      dateRange: { start: startDate, end: endDate },
      displayLabel,
      isPartialPeriod,
      periodType,
      // Legacy values for backward compatibility
      legacyPeriod: periodType,
      legacyYear: selectedYear,
      legacyMonth: viewMode === 'monthly' ? parseInt(selectedPeriod) : null,
      legacyQuarter: viewMode === 'quarterly' ? parseInt(selectedPeriod.replace('Q', '')) : null
    };
  }, [filterState, currentYear, currentMonth, currentQuarter]);

  // Get available periods based on view mode and year
  const getAvailablePeriods = useCallback(() => {
    const { selectedYear, viewMode } = filterState;
    const isCurrentYear = selectedYear === currentYear;
    
    if (viewMode === 'quarterly') {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      if (isCurrentYear) {
        // Only show quarters up to current quarter
        return quarters.slice(0, currentQuarter);
      }
      return quarters;
    } else if (viewMode === 'monthly') {
      const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
      if (isCurrentYear) {
        // Only show months up to current month
        return months.slice(0, currentMonth);
      }
      return months;
    }
    return [];
  }, [filterState.selectedYear, filterState.viewMode, currentYear, currentQuarter, currentMonth]);

  // Handle year change (supports both single and multi-select)
  const handleYearChange = useCallback((yearOrYears) => {
    setFilterState(prev => {
      if (prev.multiSelectMode && Array.isArray(yearOrYears)) {
        // Multi-select mode
        return {
          ...prev,
          selectedYears: yearOrYears,
          selectedYear: yearOrYears[0] || currentYear, // Keep first for legacy
          quickPreset: null
        };
      } else {
        // Single select mode
        const year = Array.isArray(yearOrYears) ? yearOrYears[0] : yearOrYears;
        const isCurrentYear = year === currentYear;
        let newPeriod = prev.selectedPeriod;
        let newPeriods = prev.selectedPeriods;
        
        // Smart default: if switching to current year, default to current period
        if (isCurrentYear) {
          if (prev.viewMode === 'quarterly') {
            newPeriod = `Q${currentQuarter}`;
            newPeriods = [`Q${currentQuarter}`];
          } else if (prev.viewMode === 'monthly') {
            newPeriod = String(currentMonth);
            newPeriods = [String(currentMonth)];
          }
        } else {
          // For past years, default to Q1 or January
          if (prev.viewMode === 'quarterly') {
            newPeriod = 'Q1';
            newPeriods = ['Q1'];
          } else if (prev.viewMode === 'monthly') {
            newPeriod = '1';
            newPeriods = ['1'];
          }
        }
        
        return {
          ...prev,
          selectedYear: year,
          selectedYears: [year],
          selectedPeriod: newPeriod,
          selectedPeriods: newPeriods,
          quickPreset: null
        };
      }
    });
  }, [currentYear, currentQuarter, currentMonth]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode) => {
    setFilterState(prev => {
      let newPeriod;
      
      // Convert period when switching modes
      if (mode === 'yearly') {
        newPeriod = null; // No period selection needed for yearly
      } else if (mode === 'quarterly') {
        // If coming from monthly, determine which quarter
        if (prev.viewMode === 'monthly') {
          const month = parseInt(prev.selectedPeriod);
          const quarter = Math.ceil(month / 3);
          newPeriod = `Q${quarter}`;
        } else {
          newPeriod = prev.selectedYear === currentYear ? `Q${currentQuarter}` : 'Q1';
        }
      } else if (mode === 'monthly') {
        // If coming from quarterly, default to first month of quarter
        if (prev.viewMode === 'quarterly') {
          const quarter = parseInt(prev.selectedPeriod.replace('Q', ''));
          const firstMonth = (quarter - 1) * 3 + 1;
          newPeriod = String(firstMonth);
        } else {
          newPeriod = prev.selectedYear === currentYear ? String(currentMonth) : '1';
        }
      }
      
      return {
        ...prev,
        viewMode: mode,
        selectedPeriod: newPeriod,
        quickPreset: null // Clear any quick preset
      };
    });
  }, [currentYear, currentQuarter, currentMonth]);

  // Handle period change (supports both single and multi-select)
  const handlePeriodChange = useCallback((periodOrPeriods) => {
    // console.log('🎯 HierarchicalFilterContext: handlePeriodChange called with:', periodOrPeriods);
    
    setFilterState(prev => {
      let newState;
      if (prev.multiSelectMode && Array.isArray(periodOrPeriods)) {
        // Multi-select mode
        newState = {
          ...prev,
          selectedPeriods: periodOrPeriods,
          selectedPeriod: periodOrPeriods[0] || prev.selectedPeriod, // Keep first for legacy
          quickPreset: null
        };
      } else {
        // Single select mode
        const period = Array.isArray(periodOrPeriods) ? periodOrPeriods[0] : periodOrPeriods;
        newState = {
          ...prev,
          selectedPeriod: period,
          selectedPeriods: [period],
          quickPreset: null
        };
      }
      
      // console.log('🎯 HierarchicalFilterContext: New filter state:', {
      //   multiSelectMode: newState.multiSelectMode,
      //   selectedPeriods: newState.selectedPeriods,
      //   selectedPeriod: newState.selectedPeriod,
      //   viewMode: newState.viewMode
      // });
      
      return newState;
    });
    
    // Cache clearing is handled by FilterContext to prevent multiple clears
  }, []);

  // Handle quick preset selection
  const handleQuickPresetChange = useCallback((preset) => {
    setFilterState(prev => {
      const updates = {
        ...prev,
        quickPreset: preset,
        // Reset to current year when using presets
        selectedYear: currentYear,
        selectedYears: [currentYear]
      };
      
      switch (preset) {
        case 'YTD':
          updates.viewMode = 'yearly';
          updates.selectedPeriod = null;
          updates.selectedPeriods = [];
          break;
        case 'QTD':
          updates.viewMode = 'quarterly';
          updates.selectedPeriod = `Q${currentQuarter}`;
          updates.selectedPeriods = [`Q${currentQuarter}`];
          break;
        case 'MTD':
          updates.viewMode = 'monthly';
          updates.selectedPeriod = String(currentMonth);
          updates.selectedPeriods = [String(currentMonth)];
          break;
        default:
          // For L4Q and L12M, keep existing viewMode
          break;
      }
      
      return updates;
    });
    
    // Cache clearing is handled by FilterContext to prevent multiple clears
  }, [currentYear, currentQuarter, currentMonth]);

  // Handle comparison mode
  const handleComparisonModeChange = useCallback((mode, period = null) => {
    setFilterState(prev => ({
      ...prev,
      comparisonMode: mode,
      comparisonPeriod: period
    }));
  }, []);

  // Toggle multi-select mode
  const toggleMultiSelectMode = useCallback(() => {
    setFilterState(prev => {
      const newMultiSelectMode = !prev.multiSelectMode;
      
      // When switching modes, ensure arrays are properly set
      if (newMultiSelectMode) {
        // Switching to multi-select: ensure arrays contain current single values
        return {
          ...prev,
          multiSelectMode: true,
          selectedYears: prev.selectedYears.length ? prev.selectedYears : [prev.selectedYear],
          selectedPeriods: prev.selectedPeriods.length ? prev.selectedPeriods : [prev.selectedPeriod]
        };
      } else {
        // Switching to single-select: take first value from arrays
        return {
          ...prev,
          multiSelectMode: false,
          selectedYear: prev.selectedYears[0] || prev.selectedYear,
          selectedPeriod: prev.selectedPeriods[0] || prev.selectedPeriod,
          selectedYears: [prev.selectedYears[0] || prev.selectedYear],
          selectedPeriods: [prev.selectedPeriods[0] || prev.selectedPeriod]
        };
      }
    });
  }, []);

  // Get API-compatible filter parameters
  const getApiParameters = useCallback(() => {
    return {
      year: derivedValues.legacyYear,
      period: derivedValues.legacyPeriod,
      month: derivedValues.legacyMonth,
      quarter: derivedValues.legacyQuarter,
      // Extended parameters for new features
      dateRange: derivedValues.dateRange,
      comparisonMode: filterState.comparisonMode,
      comparisonPeriod: filterState.comparisonPeriod
    };
  }, [derivedValues, filterState.comparisonMode, filterState.comparisonPeriod]);

  const value = {
    // State
    filterState,
    availableYears,
    availablePeriods: getAvailablePeriods(),
    
    // Derived values
    ...derivedValues,
    
    // Actions
    handleYearChange,
    handleViewModeChange,
    handlePeriodChange,
    handleQuickPresetChange,
    handleComparisonModeChange,
    toggleMultiSelectMode,
    setFilterOpen: (isOpen) => setFilterState(prev => ({ ...prev, isFilterOpen: isOpen })),
    
    // API compatibility
    getApiParameters,
    
    // Constants for UI
    viewModes: [
      { value: 'yearly', label: 'Yearly', icon: 'calendar' },
      { value: 'quarterly', label: 'Quarterly', icon: 'calendar-range' },
      { value: 'monthly', label: 'Monthly', icon: 'calendar-days' }
    ],
    quickPresets: [
      { value: 'YTD', label: 'YTD' },
      { value: 'QTD', label: 'QTD' },
      { value: 'MTD', label: 'MTD' },
      { value: 'L4Q', label: 'Last 4Q' },
      { value: 'L12M', label: 'Last 12M' }
    ]
  };

  return (
    <HierarchicalFilterContext.Provider value={value}>
      {children}
    </HierarchicalFilterContext.Provider>
  );
};