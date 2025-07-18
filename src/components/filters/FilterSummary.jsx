import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const FilterSummary = ({ displayLabel, isPartialPeriod, dateRange, className = '' }) => {
  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
            {dateRange && dateRange.start && dateRange.end 
              ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
              : 'Date range not available'
            }
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