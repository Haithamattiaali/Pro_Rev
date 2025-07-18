import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import dataService from '../services/dataService';
import { useSalesPlanData } from './SalesPlanContext';

const HierarchicalFilterContext = createContext();

export const useHierarchicalFilter = () => {
  const context = useContext(HierarchicalFilterContext);
  if (!context) {
    throw new Error('useHierarchicalFilter must be used within a HierarchicalFilterProvider');
  }
  return context;
};

export default HierarchicalFilterContext;

export const HierarchicalFilterProvider = ({ children, isForecastData = false }) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);
  
  // Get sales plan data if available
  const { actualDateRange } = useSalesPlanData();

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
  
  // Validation data for each year
  const [validationData, setValidationData] = useState({});
  
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

  // Fetch validation data for selected years
  useEffect(() => {
    const fetchValidation = async () => {
      const yearsToValidate = filterState.multiSelectMode 
        ? filterState.selectedYears 
        : [filterState.selectedYear];
      
      for (const year of yearsToValidate) {
        if (!validationData[year]) {
          try {
            const validation = await dataService.getAnalysisPeriodValidation(year);
            setValidationData(prev => ({
              ...prev,
              [year]: validation
            }));
          } catch (error) {
            console.error(`Failed to fetch validation for year ${year}:`, error);
          }
        }
      }
    };
    
    fetchValidation();
  }, [filterState.selectedYear, filterState.selectedYears, filterState.multiSelectMode, validationData]);

  // Compute derived values
  const derivedValues = useMemo(() => {
    const { selectedYear, selectedYears, viewMode, selectedPeriod, selectedPeriods, multiSelectMode } = filterState;
    
    // Use arrays if in multi-select mode, otherwise use single values
    const years = multiSelectMode ? selectedYears : [selectedYear];
    const periods = multiSelectMode ? selectedPeriods : [selectedPeriod];
    
    // Filter out undefined/null values
    const validYears = years.filter(y => y != null);
    const validPeriods = periods.filter(p => p != null);
    
    // Calculate date range based on selections
    let startDate = new Date(), endDate = new Date(), displayLabel = '', periodType = 'YTD';
    
    // For multi-select, we'll show the range of all selections
    if (multiSelectMode && (validYears.length > 1 || validPeriods.length > 1)) {
      // Find the earliest and latest dates across all selections
      const dates = [];
      
      validYears.forEach(year => {
        if (viewMode === 'yearly') {
          dates.push(new Date(year, 0, 1), new Date(year, 11, 31));
        } else if (viewMode === 'quarterly') {
          validPeriods.forEach(period => {
            const quarter = parseInt(period.replace('Q', ''));
            if (!isNaN(quarter) && quarter >= 1 && quarter <= 4) {
              const startMonth = (quarter - 1) * 3;
              const endMonth = quarter * 3 - 1;
              dates.push(new Date(year, startMonth, 1), new Date(year, endMonth + 1, 0));
            }
          });
        } else if (viewMode === 'monthly') {
          validPeriods.forEach(period => {
            const month = parseInt(period);
            if (!isNaN(month) && month >= 1 && month <= 12) {
              dates.push(new Date(year, month - 1, 1), new Date(year, month, 0));
            }
          });
        }
      });
      
      if (dates.length > 0) {
        startDate = new Date(Math.min(...dates));
        endDate = new Date(Math.max(...dates));
      } else {
        // Fallback to current year if no valid dates
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31);
      }
      
      // Create display label for multi-select
      if (validYears.length > 1) {
        displayLabel = `${validYears.join(', ')} - ${validPeriods.length} ${viewMode === 'quarterly' ? 'quarters' : 'months'} selected`;
      } else if (validYears.length === 1 && validPeriods.length > 0) {
        displayLabel = `${validPeriods.join(', ')} ${validYears[0]}`;
      } else if (validYears.length === 1) {
        displayLabel = `${validYears[0]}`;
      } else {
        displayLabel = 'No period selected';
      }
      periodType = viewMode === 'yearly' ? 'YTD' : viewMode === 'quarterly' ? 'QTD' : 'MTD';
    } else {
      // Single selection logic (existing)
      const year = validYears[0] || currentYear;
      const period = validPeriods[0];
      
      if (viewMode === 'yearly') {
        // For display purposes, show actual data range when available
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Check if we have sales plan actual date range
        if (actualDateRange && actualDateRange.monthCount > 0) {
          // Use actual data range from the backend
          const firstMonthIndex = monthNames.indexOf(actualDateRange.firstMonth);
          const lastMonthIndex = monthNames.indexOf(actualDateRange.lastMonth);
          
          startDate = new Date(year, firstMonthIndex, 1);
          endDate = new Date(year, lastMonthIndex + 1, 0);
          
          if (actualDateRange.monthCount === 12) {
            displayLabel = `Full Year ${year} Forecast`;
          } else {
            displayLabel = `${year} Forecast (${actualDateRange.firstMonth}-${actualDateRange.lastMonth})`;
          }
        } else {
          // Default behavior when no actual date range is available
          startDate = new Date(year, 0, 1);
          
          if (year === currentYear) {
            endDate = new Date(year, currentMonth - 1, new Date(year, currentMonth, 0).getDate());
            if (currentMonth === 12) {
              displayLabel = `Full Year ${year}`;
            } else {
              displayLabel = `${year} (Jan-${monthNames[currentMonth - 1]})`;
            }
          } else {
            // For past years, check if we have full year data
            const yearValidation = validationData[year];
            if (yearValidation && yearValidation.compliantMonths && yearValidation.compliantMonths.length > 0) {
              const monthMap = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3,
                'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7,
                'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
              };
              
              const compliantMonthIndices = yearValidation.compliantMonths
                .map(m => monthMap[m])
                .filter(idx => idx !== undefined)
                .sort((a, b) => a - b);
              
              if (compliantMonthIndices.length === 12) {
                endDate = new Date(year, 11, 31);
                displayLabel = `Full Year ${year}`;
              } else if (compliantMonthIndices.length > 0) {
                // Show actual calendar range, but note if data is partial
                const lastCompliantMonth = compliantMonthIndices[compliantMonthIndices.length - 1];
                endDate = new Date(year, 11, 31);
                const lastMonthName = yearValidation.compliantMonths.find(m => monthMap[m] === lastCompliantMonth);
                displayLabel = `Full Year ${year}`;
                // Data validation warnings will be shown separately
              } else {
                endDate = new Date(year, 11, 31);
                displayLabel = `Full Year ${year}`;
              }
            } else {
              endDate = new Date(year, 11, 31);
              displayLabel = `Full Year ${year}`;
            }
          }
        }
        periodType = 'YTD';
      } else if (viewMode === 'quarterly') {
        const quarter = parseInt(period.replace('Q', ''));
        const startMonth = (quarter - 1) * 3;
        const endMonth = quarter * 3 - 1;
        startDate = new Date(year, startMonth, 1);
        
        // For current year and current quarter, show up to current date
        if (year === currentYear && quarter === currentQuarter) {
          endDate = new Date(year, currentMonth - 1, new Date(year, currentMonth, 0).getDate());
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const actualEndMonth = Math.min(endMonth, currentMonth - 1);
          const rangeLabel = `${monthNames[startMonth]}-${monthNames[actualEndMonth]}`;
          displayLabel = `${period} ${year} (${rangeLabel})`;
        } else {
          endDate = new Date(year, endMonth + 1, 0);
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const rangeLabel = `${monthNames[startMonth]}-${monthNames[endMonth]}`;
          displayLabel = `${period} ${year} (${rangeLabel})`;
        }
        periodType = 'QTD';
      } else if (viewMode === 'monthly') {
        const month = parseInt(period);
        if (!isNaN(month) && month >= 1 && month <= 12) {
          startDate = new Date(year, month - 1, 1);
          endDate = new Date(year, month, 0);
          
          const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });
          displayLabel = `${monthName} ${year}`;
        } else {
          // Fallback to current month if invalid
          const fallbackMonth = year === currentYear ? currentMonth : 1;
          startDate = new Date(year, fallbackMonth - 1, 1);
          endDate = new Date(year, fallbackMonth, 0);
          
          const monthName = new Date(year, fallbackMonth - 1, 1).toLocaleString('en-US', { month: 'long' });
          displayLabel = `${monthName} ${year}`;
        }
        periodType = 'MTD';
      }
    }
    
    // Check if this is a partial period (current period not yet complete)
    let isPartialPeriod = selectedYear === currentYear && 
      ((viewMode === 'quarterly' && selectedPeriod === `Q${currentQuarter}`) ||
       (viewMode === 'monthly' && parseInt(selectedPeriod) === currentMonth));
    
    // Handle quick presets - respect validation data
    if (filterState.quickPreset) {
      const today = new Date();
      const yearValidation = validationData[currentYear];
      
      // Helper to get last compliant month index
      const getLastCompliantMonth = () => {
        if (!yearValidation || !yearValidation.compliantMonths || yearValidation.compliantMonths.length === 0) {
          return currentMonth - 1; // Default to current month
        }
        const monthMap = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3,
          'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7,
          'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const compliantIndices = yearValidation.compliantMonths
          .map(m => monthMap[m])
          .filter(idx => idx !== undefined)
          .sort((a, b) => a - b);
        return compliantIndices[compliantIndices.length - 1];
      };
      
      // Helper to check if a month is compliant
      const isMonthCompliant = (monthIndex) => {
        if (!yearValidation || !yearValidation.compliantMonths) return true;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return yearValidation.compliantMonths.includes(monthNames[monthIndex]);
      };
      
      // Helper to get last fully compliant quarter
      const getLastCompliantQuarter = () => {
        for (let q = 4; q >= 1; q--) {
          const startMonth = (q - 1) * 3;
          const endMonth = q * 3 - 1;
          let allCompliant = true;
          for (let m = startMonth; m <= endMonth; m++) {
            if (!isMonthCompliant(m)) {
              allCompliant = false;
              break;
            }
          }
          if (allCompliant) return q;
        }
        return 0; // No compliant quarter
      };
      
      switch (filterState.quickPreset) {
        case 'YTD':
          const ytdMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          // Check if we have sales plan actual date range
          if (actualDateRange && actualDateRange.monthCount > 0) {
            // Use actual data range from the backend
            const firstMonthIndex = ytdMonthNames.indexOf(actualDateRange.firstMonth);
            const lastMonthIndex = ytdMonthNames.indexOf(actualDateRange.lastMonth);
            
            startDate = new Date(currentYear, firstMonthIndex, 1);
            endDate = new Date(currentYear, lastMonthIndex + 1, 0);
            
            if (actualDateRange.monthCount === 12) {
              displayLabel = `Full Year ${currentYear} Forecast`;
            } else {
              displayLabel = `${currentYear} Forecast (${actualDateRange.firstMonth}-${actualDateRange.lastMonth})`;
            }
            isPartialPeriod = false; // Not partial when showing forecast data
          } else {
            // Default behavior
            startDate = new Date(currentYear, 0, 1);
            endDate = today;
            if (currentMonth === 12) {
              displayLabel = `Full Year ${currentYear}`;
            } else {
              displayLabel = `${currentYear} (Jan-${ytdMonthNames[currentMonth - 1]})`;
            }
            isPartialPeriod = true; // Always partial for current year YTD
          }
          periodType = 'YTD';
          break;
          
        case 'QTD':
          // Always use current quarter for QTD
          startDate = new Date(currentYear, (currentQuarter - 1) * 3, 1);
          endDate = today;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const qStartMonth = (currentQuarter - 1) * 3;
          const qEndMonth = Math.min(currentQuarter * 3 - 1, currentMonth - 1);
          displayLabel = `Q${currentQuarter} ${currentYear} (${monthNames[qStartMonth]}-${monthNames[qEndMonth]})`;
          isPartialPeriod = true;
          periodType = 'QTD';
          break;
          
        case 'MTD':
          // Check if current month is compliant
          if (isMonthCompliant(currentMonth - 1)) {
            startDate = new Date(currentYear, currentMonth - 1, 1);
            endDate = today;
            displayLabel = `Month to Date (${today.toLocaleString('en-US', { month: 'long' })} ${currentYear})`;
            isPartialPeriod = true;
          } else {
            // Fall back to last compliant month
            const lastCompliantMonth = getLastCompliantMonth();
            startDate = new Date(currentYear, lastCompliantMonth, 1);
            endDate = new Date(currentYear, lastCompliantMonth + 1, 0);
            const monthName = new Date(currentYear, lastCompliantMonth, 1).toLocaleString('en-US', { month: 'long' });
            displayLabel = `${monthName} ${currentYear}`;
            isPartialPeriod = false;
          }
          periodType = 'MTD';
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
  }, [filterState, currentYear, currentMonth, currentQuarter, validationData]);

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
        selectedPeriods: newPeriod ? [newPeriod] : [],
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
    validationData, // Add validation data
    
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
      { value: 'MTD', label: 'MTD' }
    ]
  };

  return (
    <HierarchicalFilterContext.Provider value={value}>
      {children}
    </HierarchicalFilterContext.Provider>
  );
};