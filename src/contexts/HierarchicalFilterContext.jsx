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
    // Primary selections
    selectedYear: currentYear,
    viewMode: 'quarterly', // 'yearly' | 'quarterly' | 'monthly'
    selectedPeriod: `Q${currentQuarter}`, // 'Q1-Q4' for quarterly, '1-12' for monthly
    
    // Advanced features
    comparisonMode: null, // null | 'previous' | 'yearOverYear' | 'custom'
    comparisonPeriod: null,
    quickPreset: null, // 'YTD' | 'QTD' | 'L4Q' | 'L12M' | null
    
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
    const { selectedYear, viewMode, selectedPeriod } = filterState;
    
    // Calculate date range based on selections
    let startDate, endDate, displayLabel, periodType;
    
    if (viewMode === 'yearly') {
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31);
      displayLabel = `Full Year ${selectedYear}`;
      periodType = 'YTD';
    } else if (viewMode === 'quarterly') {
      const quarter = parseInt(selectedPeriod.replace('Q', ''));
      const startMonth = (quarter - 1) * 3;
      const endMonth = quarter * 3 - 1;
      startDate = new Date(selectedYear, startMonth, 1);
      endDate = new Date(selectedYear, endMonth + 1, 0);
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const rangeLabel = `${monthNames[startMonth]}-${monthNames[endMonth]}`;
      displayLabel = `${selectedPeriod} ${selectedYear} (${rangeLabel})`;
      periodType = 'QTD';
    } else if (viewMode === 'monthly') {
      const month = parseInt(selectedPeriod);
      startDate = new Date(selectedYear, month - 1, 1);
      endDate = new Date(selectedYear, month, 0);
      
      const monthName = startDate.toLocaleString('en-US', { month: 'long' });
      displayLabel = `${monthName} ${selectedYear}`;
      periodType = 'MTD';
    }
    
    // Check if this is a partial period (current period not yet complete)
    const isPartialPeriod = selectedYear === currentYear && 
      ((viewMode === 'quarterly' && selectedPeriod === `Q${currentQuarter}`) ||
       (viewMode === 'monthly' && parseInt(selectedPeriod) === currentMonth));
    
    // Handle quick presets
    if (filterState.quickPreset) {
      switch (filterState.quickPreset) {
        case 'YTD':
          startDate = new Date(currentYear, 0, 1);
          endDate = new Date();
          displayLabel = `Year to Date ${currentYear}`;
          break;
        case 'QTD':
          startDate = new Date(currentYear, (currentQuarter - 1) * 3, 1);
          endDate = new Date();
          displayLabel = `Quarter to Date (Q${currentQuarter} ${currentYear})`;
          break;
        case 'L4Q':
          endDate = new Date(currentYear, currentMonth - 1, 0);
          startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth() + 1, 1);
          displayLabel = 'Last 4 Quarters';
          break;
        case 'L12M':
          endDate = new Date();
          startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
          displayLabel = 'Last 12 Months';
          break;
      }
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

  // Handle year change
  const handleYearChange = useCallback((year) => {
    setFilterState(prev => {
      const isCurrentYear = year === currentYear;
      let newPeriod = prev.selectedPeriod;
      
      // Smart default: if switching to current year, default to current period
      if (isCurrentYear) {
        if (prev.viewMode === 'quarterly') {
          newPeriod = `Q${currentQuarter}`;
        } else if (prev.viewMode === 'monthly') {
          newPeriod = String(currentMonth);
        }
      } else {
        // For past years, default to Q1 or January
        if (prev.viewMode === 'quarterly') {
          newPeriod = 'Q1';
        } else if (prev.viewMode === 'monthly') {
          newPeriod = '1';
        }
      }
      
      return {
        ...prev,
        selectedYear: year,
        selectedPeriod: newPeriod,
        quickPreset: null // Clear any quick preset
      };
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

  // Handle period change
  const handlePeriodChange = useCallback((period) => {
    setFilterState(prev => ({
      ...prev,
      selectedPeriod: period,
      quickPreset: null // Clear any quick preset
    }));
    
    // Cache clearing is handled by FilterContext to prevent multiple clears
  }, []);

  // Handle quick preset selection
  const handleQuickPresetChange = useCallback((preset) => {
    setFilterState(prev => ({
      ...prev,
      quickPreset: preset,
      // Reset to current year when using presets
      selectedYear: currentYear,
      viewMode: preset === 'YTD' ? 'yearly' : prev.viewMode
    }));
    
    // Cache clearing is handled by FilterContext to prevent multiple clears
  }, [currentYear]);

  // Handle comparison mode
  const handleComparisonModeChange = useCallback((mode, period = null) => {
    setFilterState(prev => ({
      ...prev,
      comparisonMode: mode,
      comparisonPeriod: period
    }));
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