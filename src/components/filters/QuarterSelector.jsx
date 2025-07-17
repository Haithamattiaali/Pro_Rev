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
      <div className="flex items-center justify-center p-8 text-neutral-mid">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span>Please select a year first</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-dark">Select Quarters</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs px-2 py-1 rounded text-primary hover:bg-primary/10 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={handleClearAll}
            className="text-xs px-2 py-1 rounded text-neutral-mid hover:bg-neutral-light transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {quarters.map((quarter, index) => {
          const isSelected = selections.includes(quarter.value);
          const isCurrent = quarter.value === currentQuarter;
          
          return (
            <motion.button
              key={quarter.value}
              onClick={() => handleToggle(quarter.value)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative p-4 rounded-xl border-2 transition-all
                ${isSelected
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-white border-neutral-light hover:border-neutral-mid'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">{quarter.label}</div>
                  <div className="text-xs text-neutral-mid mt-1">{quarter.months}</div>
                </div>
                <div className={`
                  w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
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
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </div>
              </div>
              {isCurrent && (
                <span className="absolute top-1 right-2 text-[10px] text-primary/60">Current</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default QuarterSelector;