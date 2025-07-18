import React from 'react';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFilter } from '../../contexts/FilterContext';

const SalesPlanFilterSummary = () => {
  const { periodFilter } = useFilter();
  
  // For Sales Plan YTD, show full year forecast
  if (periodFilter.period === 'YTD') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-primary/5 border border-primary/20 rounded-xl p-3"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-medium text-neutral-mid uppercase tracking-wide">Currently Showing</h3>
            <p className="text-base font-semibold text-primary mt-0.5">Full Year {periodFilter.year} Forecast</p>
            <p className="text-xs text-neutral-mid mt-1">
              Jan 1, {periodFilter.year} - Dec 31, {periodFilter.year}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // For other periods, don't show anything (let the default filter summary show)
  return null;
};

export default SalesPlanFilterSummary;