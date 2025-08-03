import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';

const MonthSelector = ({ selections = [], onChange, disabled }) => {
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
  
  const currentMonth = new Date().getMonth() + 1;
  
  const handleToggle = (monthValue) => {
    const isSelected = selections.includes(monthValue);
    console.log('📅 MonthSelector: Toggle', { 
      month: months.find(m => m.value === monthValue)?.label,
      value: monthValue, 
      isSelected, 
      willBeSelected: !isSelected 
    });
    
    if (isSelected) {
      onChange(selections.filter(m => m !== monthValue));
    } else {
      onChange([...selections, monthValue]);
    }
  };
  
  const handleSelectAll = () => {
    onChange(months.map(m => m.value));
  };
  
  const handleClearAll = () => {
    onChange([]);
  };
  
  if (disabled) {
    return (
      <div className="flex items-center justify-center p-8 text-neutral-mid">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span>Please select a year first</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-2" style={{ contain: 'layout style' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-dark">Select Months</h3>
        <div className="flex gap-1">
          <button
            onClick={handleSelectAll}
            className="text-[10px] px-1.5 py-0.5 rounded text-primary hover:bg-primary/10 transition-colors"
          >
            All
          </button>
          <button
            onClick={handleClearAll}
            className="text-[10px] px-1.5 py-0.5 rounded text-neutral-mid hover:bg-neutral-light transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-1">
        {months.map((month, index) => {
          const isSelected = selections.includes(month.value);
          const isCurrent = month.value === currentMonth;
          
          return (
            <motion.button
              key={month.value}
              onClick={() => handleToggle(month.value)}
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              className={`
                relative p-1 rounded border transition-all
                ${isSelected
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-white border-neutral-light hover:border-neutral-mid'
                }
              `}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium">{month.short}</span>
                <div className={`
                  w-3 h-3 rounded border flex items-center justify-center transition-all
                  ${isSelected
                    ? 'bg-primary border-primary'
                    : 'bg-white border-neutral-mid'
                  }
                `}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Check className="w-2 h-2 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </div>
              </div>
              {isCurrent && (
                <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-primary/40 rounded-full" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MonthSelector;