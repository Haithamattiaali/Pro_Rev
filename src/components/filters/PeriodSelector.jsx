import React from 'react';
import { motion } from 'framer-motion';

const PeriodSelector = ({ viewMode, value, onChange, availablePeriods, className = '' }) => {
  // Don't render if in yearly mode
  if (viewMode === 'yearly') return null;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  const getMonthName = (monthNum) => {
    const date = new Date(2024, monthNum - 1);
    return date.toLocaleString('en-US', { month: 'short' });
  };

  const renderQuarterButton = (quarter) => {
    const isSelected = value === quarter;
    const isCurrent = quarter === `Q${currentQuarter}`;
    const quarterNum = parseInt(quarter.replace('Q', ''));
    const startMonth = (quarterNum - 1) * 3 + 1;
    const endMonth = quarterNum * 3;
    const monthRange = `${getMonthName(startMonth)}-${getMonthName(endMonth)}`;

    return (
      <motion.button
        key={quarter}
        onClick={() => onChange(quarter)}
        className={`
          relative px-3 py-2 rounded-lg border transition-all flex-1
          ${isSelected
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-white border-neutral-light hover:border-neutral-mid text-neutral-dark'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="text-sm font-semibold">{quarter}</div>
        <div className="text-[10px] text-neutral-mid mt-0.5">{monthRange}</div>
        {isCurrent && (
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary/60 rounded-full" />
        )}
      </motion.button>
    );
  };

  const renderMonthButton = (monthNum) => {
    const isSelected = value === monthNum;
    const isCurrent = parseInt(monthNum) === currentMonth;
    const monthName = getMonthName(parseInt(monthNum));

    return (
      <motion.button
        key={monthNum}
        onClick={() => onChange(monthNum)}
        className={`
          relative px-2 py-1.5 rounded-md border transition-all
          ${isSelected
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-white border-neutral-light hover:border-neutral-mid text-neutral-dark'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="text-xs font-medium">{monthName}</div>
        {isCurrent && (
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

export default PeriodSelector;