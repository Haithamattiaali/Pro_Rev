import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Popover from '@radix-ui/react-popover';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
  Clock,
  Maximize2,
  Minimize2,
  X,
  CheckCircle
} from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';

const DateSelectorDropdown = ({ onClose }) => {
  const { 
    pendingFilter, 
    handlePendingChange,
    applyFilters,
    resetFilters,
    hasChanges
  } = useFilter();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [viewMode, setViewMode] = useState('month'); // month, quarter, year
  const [displayYear, setDisplayYear] = useState(currentYear);
  const [isExpanded, setIsExpanded] = useState(false);

  const months = [
    { value: 1, label: 'January', short: 'Jan' },
    { value: 2, label: 'February', short: 'Feb' },
    { value: 3, label: 'March', short: 'Mar' },
    { value: 4, label: 'April', short: 'Apr' },
    { value: 5, label: 'May', short: 'May' },
    { value: 6, label: 'June', short: 'Jun' },
    { value: 7, label: 'July', short: 'Jul' },
    { value: 8, label: 'August', short: 'Aug' },
    { value: 9, label: 'September', short: 'Sep' },
    { value: 10, label: 'October', short: 'Oct' },
    { value: 11, label: 'November', short: 'Nov' },
    { value: 12, label: 'December', short: 'Dec' }
  ];

  const quarters = [
    { value: 1, label: 'Q1', months: [1, 2, 3] },
    { value: 2, label: 'Q2', months: [4, 5, 6] },
    { value: 3, label: 'Q3', months: [7, 8, 9] },
    { value: 4, label: 'Q4', months: [10, 11, 12] }
  ];

  // Ultra-compact header button styles - concentrated design
  const headerButtonClass = `
    inline-flex items-center justify-center
    px-1.5 py-0.5 text-[10px] font-semibold
    rounded transition-all duration-150
    hover:scale-102 active:scale-98
    focus:outline-none focus:ring-1 focus:ring-primary/30
  `;

  const primaryButtonClass = `
    ${headerButtonClass}
    bg-primary text-white hover:bg-primary-dark
    shadow-sm hover:shadow-md
  `;

  const secondaryButtonClass = `
    ${headerButtonClass}
    bg-white text-neutral-dark border border-neutral-mid
    hover:border-primary hover:text-primary hover:bg-primary/5
  `;

  const ghostButtonClass = `
    ${headerButtonClass}
    text-neutral-mid hover:text-primary
    hover:bg-primary/5
  `;

  // Navigation functions
  const navigateYear = (direction) => {
    setDisplayYear(prev => prev + direction);
  };

  const handleMonthSelect = (month) => {
    const currentSelection = pendingFilter.selectedMonths || [];
    const newSelection = currentSelection.includes(month)
      ? currentSelection.filter(m => m !== month)
      : [...currentSelection, month];
    
    handlePendingChange({
      selectedMonths: newSelection,
      selectedQuarters: [],
      activeMode: 'M'
    });
  };

  const handleQuarterSelect = (quarter) => {
    const currentSelection = pendingFilter.selectedQuarters || [];
    const newSelection = currentSelection.includes(quarter)
      ? currentSelection.filter(q => q !== quarter)
      : [...currentSelection, quarter];
    
    handlePendingChange({
      selectedQuarters: newSelection,
      selectedMonths: [],
      activeMode: 'Q'
    });
  };

  const handleYearToggle = () => {
    const currentSelection = pendingFilter.selectedYears || [];
    const newSelection = currentSelection.includes(displayYear)
      ? currentSelection.filter(y => y !== displayYear)
      : [...currentSelection, displayYear];
    
    handlePendingChange({
      selectedYears: newSelection
    });
  };

  const isMonthSelected = (month) => {
    return (pendingFilter.selectedMonths || []).includes(month);
  };

  const isQuarterSelected = (quarter) => {
    return (pendingFilter.selectedQuarters || []).includes(quarter);
  };

  const isYearSelected = () => {
    return (pendingFilter.selectedYears || []).includes(displayYear);
  };

  const handleReset = () => {
    // Clear selections based on current view mode
    if (viewMode === 'month') {
      handlePendingChange({ selectedMonths: [] });
    } else if (viewMode === 'quarter') {
      handlePendingChange({ selectedQuarters: [] });
    } else if (viewMode === 'year') {
      handlePendingChange({ selectedYears: [] });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        bg-white/98 backdrop-blur-2xl rounded-xl shadow-2xl 
        border border-primary/10 overflow-hidden
        ${isExpanded ? 'w-[480px]' : 'w-[320px]'}
        transition-all duration-200
      `}
    >
      {/* Ultra-compact header */}
      <div className="bg-gradient-to-r from-primary/8 to-primary/12 p-2 border-b border-primary/20">
        <div className="flex items-center justify-between gap-1">
          {/* Left side - View mode toggles */}
          <div className="flex items-center">
            <div className="inline-flex bg-white/90 rounded-md p-0.5 shadow-sm border border-primary/10">
              <button
                onClick={() => setViewMode('month')}
                className={`
                  ${ghostButtonClass}
                  ${viewMode === 'month' ? 'bg-primary text-white shadow-sm' : ''}
                `}
              >
                <CalendarDays className="w-2.5 h-2.5 mr-0.5" />
                <span className="hidden sm:inline">Month</span>
                <span className="sm:hidden">M</span>
              </button>
              <button
                onClick={() => setViewMode('quarter')}
                className={`
                  ${ghostButtonClass}
                  ${viewMode === 'quarter' ? 'bg-primary text-white shadow-sm' : ''}
                `}
              >
                <Calendar className="w-2.5 h-2.5 mr-0.5" />
                <span className="hidden sm:inline">Quarter</span>
                <span className="sm:hidden">Q</span>
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`
                  ${ghostButtonClass}
                  ${viewMode === 'year' ? 'bg-primary text-white shadow-sm' : ''}
                `}
              >
                <Clock className="w-2.5 h-2.5 mr-0.5" />
                <span className="hidden sm:inline">Year</span>
                <span className="sm:hidden">Y</span>
              </button>
            </div>
          </div>

          {/* Center - Year navigation */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => navigateYear(-10)}
              className={ghostButtonClass}
              title="Previous decade"
            >
              <ChevronsLeft className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => navigateYear(-1)}
              className={ghostButtonClass}
              title="Previous year"
            >
              <ChevronLeft className="w-2.5 h-2.5" />
            </button>
            
            <button
              onClick={handleYearToggle}
              className={`
                ${secondaryButtonClass}
                min-w-[45px] font-bold
                ${isYearSelected() ? 'bg-primary text-white border-primary shadow-sm' : ''}
              `}
            >
              {displayYear}
            </button>
            
            <button
              onClick={() => navigateYear(1)}
              className={ghostButtonClass}
              title="Next year"
            >
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => navigateYear(10)}
              className={ghostButtonClass}
              title="Next decade"
            >
              <ChevronsRight className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Right side - Quick actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                const today = new Date();
                handlePendingChange({
                  selectedMonths: [today.getMonth() + 1],
                  selectedQuarters: [],
                  selectedYears: [today.getFullYear()],
                  activeMode: 'M'
                });
                setDisplayYear(today.getFullYear());
              }}
              className={`${primaryButtonClass} font-bold`}
              title="Select current month"
            >
              Now
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={ghostButtonClass}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <Minimize2 className="w-2.5 h-2.5" />
              ) : (
                <Maximize2 className="w-2.5 h-2.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content - Concentrated Layout */}
      <div className="p-3">
        {viewMode === 'month' && (
          <div className={`grid ${isExpanded ? 'grid-cols-6' : 'grid-cols-4'} gap-1.5`}>
            {months.map((month) => {
              const isSelected = isMonthSelected(month.value);
              const isCurrent = month.value === currentMonth && displayYear === currentYear;
              
              return (
                <motion.button
                  key={month.value}
                  onClick={() => handleMonthSelect(month.value)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    relative p-2 rounded-lg text-xs font-semibold
                    transition-all duration-150
                    ${isSelected
                      ? 'bg-primary text-white shadow-lg ring-2 ring-primary/20'
                      : 'bg-gray-50 border border-gray-200 hover:border-primary hover:bg-primary/5'
                    }
                    ${isCurrent && !isSelected ? 'ring-1 ring-primary/30 border-primary/50' : ''}
                  `}
                >
                  <div className="font-bold">{month.short}</div>
                  {isExpanded && (
                    <div className="text-[10px] opacity-80 mt-0.5">{month.label.slice(0, 3)}</div>
                  )}
                  {isCurrent && (
                    <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-current rounded-full animate-pulse" />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {viewMode === 'quarter' && (
          <div className="grid grid-cols-2 gap-2">
            {quarters.map((quarter) => {
              const isSelected = isQuarterSelected(quarter.value);
              const currentQuarter = Math.ceil(currentMonth / 3);
              const isCurrent = quarter.value === currentQuarter && displayYear === currentYear;
              
              return (
                <motion.button
                  key={quarter.value}
                  onClick={() => handleQuarterSelect(quarter.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative p-3 rounded-lg
                    transition-all duration-150
                    ${isSelected
                      ? 'bg-primary text-white shadow-lg ring-2 ring-primary/20'
                      : 'bg-gray-50 border border-gray-200 hover:border-primary hover:bg-primary/5'
                    }
                    ${isCurrent && !isSelected ? 'ring-1 ring-primary/30 border-primary/50' : ''}
                  `}
                >
                  <div className="font-bold text-base">{quarter.label}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    {months[quarter.months[0] - 1].short} - {months[quarter.months[2] - 1].short}
                  </div>
                  {isCurrent && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {viewMode === 'year' && (
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 10 }, (_, i) => displayYear - 4 + i).map((year) => {
              const isSelected = (pendingFilter.selectedYears || []).includes(year);
              const isCurrent = year === currentYear;
              
              return (
                <motion.button
                  key={year}
                  onClick={() => {
                    const currentSelection = pendingFilter.selectedYears || [];
                    const newSelection = currentSelection.includes(year)
                      ? currentSelection.filter(y => y !== year)
                      : [...currentSelection, year];
                    
                    handlePendingChange({
                      selectedYears: newSelection
                    });
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    relative p-1.5 rounded-md text-xs font-bold
                    transition-all duration-150
                    ${isSelected
                      ? 'bg-primary text-white shadow-lg ring-2 ring-primary/20'
                      : 'bg-gray-50 border border-gray-200 hover:border-primary hover:bg-primary/5'
                    }
                    ${isCurrent && !isSelected ? 'ring-1 ring-primary/30 border-primary/50' : ''}
                  `}
                >
                  {year}
                  {isCurrent && (
                    <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-current rounded-full" />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Compact Selected Summary */}
        <div className="mt-3 p-2 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-semibold text-primary uppercase">Active:</span>
              {(pendingFilter.selectedMonths || []).map(month => (
                <span key={`m-${month}`} className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[10px] font-bold shadow-sm">
                  {months[month - 1].short}
                </span>
              ))}
              {(pendingFilter.selectedQuarters || []).map(quarter => (
                <span key={`q-${quarter}`} className="px-1.5 py-0.5 bg-green-500 text-white rounded text-[10px] font-bold shadow-sm">
                  Q{quarter}
                </span>
              ))}
              {(pendingFilter.selectedYears || []).map(year => (
                <span key={`y-${year}`} className="px-1.5 py-0.5 bg-purple-500 text-white rounded text-[10px] font-bold shadow-sm">
                  {year}
                </span>
              ))}
              {((pendingFilter.selectedMonths || []).length === 0 && 
                (pendingFilter.selectedQuarters || []).length === 0 && 
                (pendingFilter.selectedYears || []).length === 0) && (
                <span className="text-[10px] text-neutral-mid italic">None selected</span>
              )}
            </div>
            <div className="text-[10px] font-bold text-primary">
              {(pendingFilter.selectedMonths || []).length + 
               (pendingFilter.selectedQuarters || []).length + 
               (pendingFilter.selectedYears || []).length} items
            </div>
          </div>
        </div>
      </div>

      {/* Ultra-compact Footer */}
      <div className="p-2 border-t border-primary/10 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onClose?.();
            }}
            className={`${ghostButtonClass} text-red-600 hover:text-red-700 hover:bg-red-50`}
          >
            <X className="w-2.5 h-2.5 mr-0.5" />
            Cancel
          </button>
          
          <div className="flex items-center gap-1">
            {hasChanges && (
              <span className="text-[10px] text-orange-600 font-semibold animate-pulse">
                • Unsaved
              </span>
            )}
            
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className={`
                ${ghostButtonClass}
                ${!hasChanges ? 'opacity-30 cursor-not-allowed' : 'hover:bg-orange-50'}
              `}
            >
              Reset
            </button>
            
            <button
              onClick={() => {
                applyFilters();
                onClose?.();
              }}
              disabled={!hasChanges}
              className={`
                ${primaryButtonClass}
                ${!hasChanges 
                  ? 'opacity-50 cursor-not-allowed bg-gray-300 border-gray-300' 
                  : 'bg-green-600 hover:bg-green-700 border-green-600 animate-pulse'
                }
              `}
            >
              <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
              Apply
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DateSelectorDropdown;