import React from 'react';
import { motion } from 'framer-motion';
import { useHierarchicalFilter } from '../../contexts/HierarchicalFilterContext';
import YearDropdown from './YearDropdown';
import ViewModeToggle from './ViewModeToggle';
import PeriodSelector from './PeriodSelector';
import QuickRangePresets from './QuickRangePresets';
import FilterSummary from './FilterSummary';
import ComparisonMode from './ComparisonMode';
import companyLogo from '../../assets/logo.png';

const HierarchicalFilter = ({ showComparison = false, showQuickPresets = true }) => {
  const {
    filterState,
    availableYears,
    availablePeriods,
    displayLabel,
    isPartialPeriod,
    dateRange,
    viewModes,
    quickPresets,
    handleYearChange,
    handleViewModeChange,
    handlePeriodChange,
    handleQuickPresetChange,
    handleComparisonModeChange
  } = useHierarchicalFilter();

  return (
    <div className="space-y-3">
      {/* Main Filter Bar */}
      <div className="bg-white/95 backdrop-blur-xl p-2 rounded-xl shadow-sm border border-neutral-light/50">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Left side - Primary filters */}
          <div className="flex items-center gap-2 flex-1">
            <YearDropdown
              value={filterState.selectedYear}
              onChange={handleYearChange}
              availableYears={availableYears}
            />
            
            <ViewModeToggle
              value={filterState.viewMode}
              onChange={handleViewModeChange}
            />
            
            <PeriodSelector
              viewMode={filterState.viewMode}
              value={filterState.selectedPeriod}
              onChange={handlePeriodChange}
              availablePeriods={availablePeriods}
              className="flex-1"
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
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
      <FilterSummary
        displayLabel={displayLabel}
        isPartialPeriod={isPartialPeriod}
        dateRange={dateRange}
      />
      
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

export default HierarchicalFilter;