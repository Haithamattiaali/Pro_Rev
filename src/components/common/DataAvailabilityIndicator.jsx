import React, { useState } from 'react';
import { Calendar, Info } from 'lucide-react';

/**
 * DataAvailabilityIndicator - Shows the last available data month
 * Prominently displays what month is being used as "current" for YTD/QTD/MTD
 */
const DataAvailabilityIndicator = ({ 
  lastMonth, 
  year, 
  hasData = true,
  isPartialQuarter = false,
  className = '' 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!hasData) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg ${className}`}>
        <Info className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-800">
          No data available for {year}
        </span>
      </div>
    );
  }

  const tooltipContent = isPartialQuarter
    ? `The current quarter has partial data. Only data through ${lastMonth} is available.`
    : `All calculations are based on last upload period: ${lastMonth}.`;

  return (
    <div 
      className={`relative inline-flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg cursor-help ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Calendar className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium text-primary-dark">
        Last upload period: {lastMonth}
      </span>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap">
          <div className="relative">
            {tooltipContent}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAvailabilityIndicator;