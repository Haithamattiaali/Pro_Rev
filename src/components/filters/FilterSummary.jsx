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

  // Format date range based on selection type
  const formatDateRange = () => {
    // For non-monthly views or when no periods selected, use standard date range
    if (viewMode !== 'monthly' || !selectedPeriods || selectedPeriods.length === 0) {
      if (dateRange && dateRange.start && dateRange.end && formatDate(dateRange.start) && formatDate(dateRange.end)) {
        return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
      }
      return '';
    }

    // For monthly view with selected periods
    if (selectedPeriods.length === 1 || areMonthsSequential(selectedPeriods)) {
      // Sequential months or single month - show date range
      if (dateRange && dateRange.start && dateRange.end && formatDate(dateRange.start) && formatDate(dateRange.end)) {
        return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
      }
    } else {
      // Non-sequential months - show individual months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const selectedMonthNames = selectedPeriods
        .map(p => parseInt(p))
        .filter(n => !isNaN(n) && n >= 1 && n <= 12)
        .sort((a, b) => a - b)
        .map(m => monthNames[m - 1]);
      
      if (selectedMonthNames.length > 0) {
        // Extract year from dateRange or displayLabel
        const year = dateRange?.start ? dateRange.start.getFullYear() : new Date().getFullYear();
        return `${selectedMonthNames.join(', ')} ${year}`;
      }
    }
    
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-primary/5 border border-primary/20 rounded-xl p-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Calendar className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-medium text-neutral-mid uppercase tracking-wide">Currently Showing</h3>
          <p className="text-base font-semibold text-primary mt-0.5">{displayLabel}</p>
          <p className="text-xs text-neutral-mid mt-1">
            {formatDateRange()}
          </p>
        </div>
        {isPartialPeriod && (
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-md">
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs font-medium">Partial Period</span>
          </div>
        )}
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