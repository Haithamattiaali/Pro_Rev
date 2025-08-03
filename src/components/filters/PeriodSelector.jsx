import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const PeriodSelector = ({ viewMode, value, onChange, availablePeriods, multiSelect = false, selectedPeriods = [], selectedYear, validationData, disableValidation = false, className = '' }) => {
  // Don't render if in yearly mode
  if (viewMode === 'yearly') return null;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  const getMonthName = (monthNum) => {
    const date = new Date(2024, monthNum - 1);
    return date.toLocaleString('en-US', { month: 'short' });
  };

  // Check if a month is compliant based on validation data
  const isMonthCompliant = (monthNum) => {
    if (disableValidation) return true;
    if (!validationData || !validationData[selectedYear]) return true;
    const monthName = getMonthName(parseInt(monthNum));
    return validationData[selectedYear].compliantMonths?.includes(monthName) ?? true;
  };

  // Check if a quarter is compliant (all months in quarter must be compliant)
  const isQuarterCompliant = (quarter) => {
    if (disableValidation) return true;
    if (!validationData || !validationData[selectedYear]) return true;
    const quarterNum = parseInt(quarter.replace('Q', ''));
    const startMonth = (quarterNum - 1) * 3 + 1;
    const endMonth = quarterNum * 3;
    
    for (let month = startMonth; month <= endMonth; month++) {
      if (!isMonthCompliant(String(month))) {
        return false;
      }
    }
    return true;
  };

  const handlePeriodClick = (period) => {
    // Check if period is compliant before allowing selection
    const isCompliant = viewMode === 'quarterly' 
      ? isQuarterCompliant(period)
      : isMonthCompliant(period);
    
    if (!isCompliant) {
      // Don't allow selection of non-compliant periods
      return;
    }
    
    if (multiSelect) {
      // In multi-select mode, toggle the period in the array
      const newSelection = selectedPeriods.includes(period)
        ? selectedPeriods.filter(p => p !== period)
        : [...selectedPeriods, period].sort();
      
      // Don't allow empty selection
      if (newSelection.length > 0) {
        onChange(newSelection);
      }
    } else {
      // Single select mode
      onChange(period);
    }
  };

  const renderQuarterButton = (quarter) => {
    const isSelected = multiSelect 
      ? selectedPeriods.includes(quarter)
      : value === quarter;
    const isCurrent = quarter === `Q${currentQuarter}`;
    const isCompliant = isQuarterCompliant(quarter);
    const quarterNum = parseInt(quarter.replace('Q', ''));
    const startMonth = (quarterNum - 1) * 3 + 1;
    const endMonth = quarterNum * 3;
    const monthRange = `${getMonthName(startMonth)}-${getMonthName(endMonth)}`;

    return (
      <motion.button
        key={quarter}
        onClick={() => handlePeriodClick(quarter)}
        disabled={!isCompliant}
        className={`
          relative px-3 py-2 rounded-lg border transition-all flex-1
          ${!isCompliant
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
            : isSelected
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-white border-neutral-light hover:border-neutral-mid text-neutral-dark'
          }
        `}
        title={!isCompliant ? 'This period has incomplete data' : ''}
      >
        <div className="flex items-center gap-1">
          <div className="text-sm font-semibold">{quarter}</div>
          {!isCompliant && <AlertCircle className="w-3 h-3 text-amber-500" />}
        </div>
        <div className="text-[10px] text-neutral-mid mt-0.5">{monthRange}</div>
        {isCurrent && isCompliant && (
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary/60 rounded-full" />
        )}
      </motion.button>
    );
  };

  const renderMonthButton = (monthNum) => {
    const isSelected = multiSelect 
      ? selectedPeriods.includes(monthNum)
      : value === monthNum;
    const isCurrent = parseInt(monthNum) === currentMonth;
    const isCompliant = isMonthCompliant(monthNum);
    const monthName = getMonthName(parseInt(monthNum));

    return (
      <motion.button
        key={monthNum}
        onClick={() => handlePeriodClick(monthNum)}
        disabled={!isCompliant}
        className={`
          relative px-2 py-1.5 rounded-md border transition-all
          ${!isCompliant
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
            : isSelected
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-white border-neutral-light hover:border-neutral-mid text-neutral-dark'
          }
        `}
        title={!isCompliant ? 'This period has incomplete data' : ''}
      >
        <div className="flex items-center gap-1">
          <div className="text-xs font-medium">{monthName}</div>
          {!isCompliant && <AlertCircle className="w-2.5 h-2.5 text-amber-500" />}
        </div>
        {isCurrent && isCompliant && (
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-primary/60 rounded-full" />
        )}
      </motion.button>
    );
  };

  return (
    <div className={className}>
      {viewMode === 'quarterly' ? (
        <div className="flex gap-2">
          {availablePeriods.map(quarter => renderQuarterButton(quarter))}
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-1.5">
          {availablePeriods.map(month => renderMonthButton(month))}
        </div>
      )}
    </div>
  );
};

export default React.memo(PeriodSelector);