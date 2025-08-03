import React from 'react';
import { Calendar, TrendingUp, BarChart3 } from 'lucide-react';

const ActiveFiltersDisplay = ({ selections, compact = false }) => {
  const { years, months, quarters } = selections;
  
  // Month names for display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Get display text
  const getDisplayText = () => {
    if (years.length === 0) {
      return { primary: 'No data selected', secondary: 'Select a year to view data' };
    }
    
    const yearText = years.join(', ');
    
    // Months selected
    if (months.length > 0) {
      const monthLabels = months.map(m => monthNames[m - 1]).join(', ');
      return {
        primary: `${monthLabels} ${yearText}`,
        secondary: `${months.length} month${months.length > 1 ? 's' : ''} selected`
      };
    }
    
    // Quarters selected
    if (quarters.length > 0) {
      const quarterLabels = quarters.map(q => `Q${q}`).join(', ');
      return {
        primary: `${quarterLabels} ${yearText}`,
        secondary: `${quarters.length} quarter${quarters.length > 1 ? 's' : ''} selected`
      };
    }
    
    // Just year(s) selected
    return {
      primary: `${yearText} Full Year`,
      secondary: 'All months'
    };
  };
  
  const { primary, secondary } = getDisplayText();
  
  if (compact) {
    return (
      <div className="text-[10px]">
        <div className="font-medium text-neutral-dark truncate">{primary}</div>
        <div className="text-[9px] text-neutral-mid truncate">{secondary}</div>
      </div>
    );
  }
  
  // Full display with icon and styling
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 transition-all duration-200 ease-out">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm transition-all duration-200">
          {months.length > 0 ? (
            <Calendar className="w-5 h-5 text-primary transition-all duration-150" />
          ) : quarters.length > 0 ? (
            <BarChart3 className="w-5 h-5 text-primary transition-all duration-150" />
          ) : (
            <TrendingUp className="w-5 h-5 text-primary transition-all duration-150" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-neutral-dark transition-colors duration-200">Currently Showing</h3>
          <p className="text-lg font-bold text-primary mt-1 transition-all duration-200">{primary}</p>
          <p className="text-sm text-neutral-mid mt-1 transition-all duration-200">{secondary}</p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ActiveFiltersDisplay, (prevProps, nextProps) => {
  // Only re-render if selections actually change
  return (
    JSON.stringify(prevProps.selections) === JSON.stringify(nextProps.selections) &&
    prevProps.compact === nextProps.compact
  );
});