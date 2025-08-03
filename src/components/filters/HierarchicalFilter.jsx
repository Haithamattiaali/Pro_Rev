import React from 'react';
import { motion } from 'framer-motion';
import { useHierarchicalFilter } from '../../contexts/HierarchicalFilterContext';
import YearDropdown from './YearDropdown';
import ViewModeToggle from './ViewModeToggle';
import PeriodSelector from './PeriodSelector';
import QuickRangePresets from './QuickRangePresets';
import FilterSummary from './FilterSummary';
import ComparisonMode from './ComparisonMode';
import MultiSelectToggle from './MultiSelectToggle';
import companyLogo from '../../assets/logo.png';

const HierarchicalFilter = ({ showComparison = false, showQuickPresets = true, disableValidation = false }) => {
  const {
    filterState,
    availableYears,
    availablePeriods,
    validationData,
    displayLabel,
    isPartialPeriod,
    dateRange,
    selectedPeriods,
    viewMode,
    viewModes,
    quickPresets,
    handleYearChange,
    handleViewModeChange,
    handlePeriodChange,
    handleQuickPresetChange,
    handleComparisonModeChange,
    toggleMultiSelectMode
  } = useHierarchicalFilter();

  // Override available periods when validation is disabled
  const effectiveAvailablePeriods = React.useMemo(() => {
    if (disableValidation) {
      if (filterState.viewMode === 'quarterly') {
        return ['Q1', 'Q2', 'Q3', 'Q4'];
      } else if (filterState.viewMode === 'monthly') {
        return Array.from({ length: 12 }, (_, i) => String(i + 1));
      }
    }
    return availablePeriods;
  }, [disableValidation, filterState.viewMode, availablePeriods]);

  return (
    <div className="space-y-2">
      {/* Main Filter Bar */}
      <div className="bg-white/95 backdrop-blur-xl p-2 rounded-xl shadow-sm border border-neutral-light/50" style={{ contain: 'layout' }}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Left side - Primary filters */}
          <div className="flex items-center gap-2 flex-1">
            <YearDropdown
              value={filterState.selectedYear}
              onChange={handleYearChange}
              availableYears={availableYears}
              multiSelect={filterState.multiSelectMode}
              selectedYears={filterState.selectedYears}
            />
            
            <ViewModeToggle
              value={filterState.viewMode}
              onChange={handleViewModeChange}
            />
            
            <PeriodSelector
              viewMode={filterState.viewMode}
              value={filterState.selectedPeriod}
              onChange={handlePeriodChange}
              availablePeriods={effectiveAvailablePeriods}
              multiSelect={filterState.multiSelectMode}
              selectedPeriods={filterState.selectedPeriods}
              selectedYear={filterState.selectedYear}
              validationData={validationData}
              disableValidation={disableValidation}
              className="flex-1"
            />
            
            <MultiSelectToggle
              enabled={filterState.multiSelectMode}
              onChange={toggleMultiSelectMode}
            />
          </div>
          
          {/* Right side - Logo */}
          <img 
            src={companyLogo} 
            alt="Company Logo" 
            className="h-6 w-auto object-contain"
          />
        </div>
        
        {/* Quick Presets Row */}
        {showQuickPresets && (
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="mt-2 pt-2 border-t border-neutral-light/50"
          >
            <QuickRangePresets
              value={filterState.quickPreset}
              onChange={handleQuickPresetChange}
              presets={quickPresets}
            />
          </motion.div>
        )}
      </div>
      
      {/* Filter Summary */}
      <div style={{ contain: 'layout style', minHeight: '60px' }}>
        <FilterSummary
          displayLabel={displayLabel}
          isPartialPeriod={isPartialPeriod}
          dateRange={dateRange}
          selectedPeriods={selectedPeriods}
          viewMode={viewMode}
        />
      </div>
      
      {/* Comparison Mode (Optional) */}
      {showComparison && (
        <ComparisonMode
          value={filterState.comparisonMode}
          period={filterState.comparisonPeriod}
          onChange={handleComparisonModeChange}
        />
      )}
    </div>
  );
};

export default React.memo(HierarchicalFilter);