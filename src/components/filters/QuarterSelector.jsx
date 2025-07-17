import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';

const QuarterSelector = ({ selections = [], onChange, disabled }) => {
  const quarters = [
    { value: 1, label: 'Q1', months: 'Jan - Mar' },
    { value: 2, label: 'Q2', months: 'Apr - Jun' },
    { value: 3, label: 'Q3', months: 'Jul - Sep' },
    { value: 4, label: 'Q4', months: 'Oct - Dec' }
  ];
  
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  
  const handleToggle = (quarterValue) => {
    const isSelected = selections.includes(quarterValue);
    console.log('📅 QuarterSelector: Toggle', { 
      quarter: `Q${quarterValue}`,
      value: quarterValue, 
      isSelected, 
      willBeSelected: !isSelected 
    });
    
    if (isSelected) {
      onChange(selections.filter(q => q !== quarterValue));
    } else {
      onChange([...selections, quarterValue]);
    }
  };
  
  const handleSelectAll = () => {
    onChange(quarters.map(q => q.value));
  };
  
  const handleClearAll = () => {
    onChange([]);
  };
  
  if (disabled) {
    return (
      <div className="flex items-center justify-center p-4 text-neutral-mid">
        <AlertCircle className="w-4 h-4 mr-1.5" />
        <span className="text-xs">Please select a year first</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-dark">Select Quarters</h3>
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
      
      <div className="grid grid-cols-2 gap-1.5">
        {quarters.map((quarter, index) => {
          const isSelected = selections.includes(quarter.value);
          const isCurrent = quarter.value === currentQuarter;
          
          return (
            <motion.button
              key={quarter.value}
              onClick={() => handleToggle(quarter.value)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className={`
                relative p-1.5 rounded-md border transition-all
                ${isSelected
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-white border-neutral-light hover:border-neutral-mid'
                }
              `}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-left">
                  <div className="text-sm font-semibold">{quarter.label}</div>
                  <div className="text-[10px] text-neutral-mid">{quarter.months}</div>
                </div>
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
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
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

export default QuarterSelector;