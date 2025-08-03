import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const FilterSummary = ({ displayLabel, isPartialPeriod, dateRange, selectedPeriods, viewMode, className = '' }) => {
  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Check if months are sequential
  const areMonthsSequential = (periods) => {
    if (!periods || periods.length <= 1) return true;
    
    const monthNumbers = periods.map(p => parseInt(p)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (monthNumbers.length <= 1) return true;
    
    for (let i = 1; i < monthNumbers.length; i++) {
      if (monthNumbers[i] !== monthNumbers[i - 1] + 1) {
        return false;
      }
    }
    return true;
  };

  // Check if quarters are sequential
  const areQuartersSequential = (periods) => {
    if (!periods || periods.length <= 1) return true;
    
    const quarterNumbers = periods
      .map(p => parseInt(p.replace('Q', '')))
      .filter(n => !isNaN(n) && n >= 1 && n <= 4)
      .sort((a, b) => a - b);
    
    if (quarterNumbers.length <= 1) return true;
    
    for (let i = 1; i < quarterNumbers.length; i++) {
      if (quarterNumbers[i] !== quarterNumbers[i - 1] + 1) {
        return false;
      }
    }
    return true;
  };

  // Format date range based on selection type
  const formatDateRange = () => {
    // For yearly view or when no periods selected, use standard date range
    if (viewMode === 'yearly' || !selectedPeriods || selectedPeriods.length === 0) {
      if (dateRange && dateRange.start && dateRange.end && formatDate(dateRange.start) && formatDate(dateRange.end)) {
        return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
      }
      return '';
    }

    // For quarterly view with selected periods
    if (viewMode === 'quarterly') {
      if (selectedPeriods.length === 1 || areQuartersSequential(selectedPeriods)) {
        // Sequential quarters or single quarter - show date range
        if (dateRange && dateRange.start && dateRange.end && formatDate(dateRange.start) && formatDate(dateRange.end)) {
          return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
        }
      } else {
        // Non-sequential quarters - show individual quarters
        const sortedQuarters = selectedPeriods
          .filter(p => p && p.startsWith('Q'))
          .sort((a, b) => {
            const qA = parseInt(a.replace('Q', ''));
            const qB = parseInt(b.replace('Q', ''));
            return qA - qB;
          });
        
        if (sortedQuarters.length > 0) {
          const year = dateRange?.start ? dateRange.start.getFullYear() : new Date().getFullYear();
          return `${sortedQuarters.join(', ')} ${year}`;
        }
      }
    }
    
    // For monthly view with selected periods
    if (viewMode === 'monthly') {
      if (selectedPeriods.length === 1 || areMonthsSequential(selectedPeriods)) {
        // Sequential months or single month - show date range
        if (dateRange && dateRange.start && dateRange.end && formatDate(dateRange.start) && formatDate(dateRange.end)) {
          return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
        }
      } else {
        // Non-sequential months - show individual months (already sorted)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const selectedMonthNames = selectedPeriods
          .map(p => parseInt(p))
          .filter(n => !isNaN(n) && n >= 1 && n <= 12)
          .sort((a, b) => a - b)  // This ensures chronological order
          .map(m => monthNames[m - 1]);
        
        if (selectedMonthNames.length > 0) {
          const year = dateRange?.start ? dateRange.start.getFullYear() : new Date().getFullYear();
          return `${selectedMonthNames.join(', ')} ${year}`;
        }
      }
    }
    
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-primary/5 border border-primary/20 rounded-xl p-3 transition-colors duration-200 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm transition-all duration-200">
          <Calendar className="w-4 h-4 text-primary transition-colors duration-150" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-medium text-neutral-mid uppercase tracking-wide transition-colors duration-200">Currently Showing</h3>
          <p className="text-base font-semibold text-primary mt-0.5 transition-all duration-200">{displayLabel}</p>
          <p className="text-xs text-neutral-mid mt-1 transition-all duration-200">
            {formatDateRange()}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(FilterSummary, (prevProps, nextProps) => {
  // Only re-render if actual values change
  return (
    prevProps.displayLabel === nextProps.displayLabel &&
    prevProps.isPartialPeriod === nextProps.isPartialPeriod &&
    prevProps.dateRange?.start?.getTime() === nextProps.dateRange?.start?.getTime() &&
    prevProps.dateRange?.end?.getTime() === nextProps.dateRange?.end?.getTime()
  );
});