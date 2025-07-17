import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const YearSelector = ({ selections = [], onChange }) => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  
  const handleToggle = (year) => {
    const isSelected = selections.includes(year);
    console.log('📅 YearSelector: Toggle', { year, isSelected, willBeSelected: !isSelected });
    
    if (isSelected) {
      onChange(selections.filter(y => y !== year));
    } else {
      onChange([...selections, year]);
    }
  };
  
  const handleSelectAll = () => {
    onChange(years);
  };
  
  const handleClearAll = () => {
    onChange([]);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-dark">Select Years</h3>
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
      
      <div className="grid grid-cols-3 gap-1.5">
        {years.map((year, index) => {
          const isSelected = selections.includes(year);
          
          return (
            <motion.button
              key={year}
              onClick={() => handleToggle(year)}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`
                relative p-2 rounded-lg border transition-all
                ${isSelected
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-white border-neutral-light hover:border-neutral-mid'
                }
              `}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-center gap-2">
                <div className={`
                  w-4 h-4 rounded border flex items-center justify-center transition-all
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
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </div>
                <span className="text-sm font-medium">{year}</span>
              </div>
              {year === currentYear && (
                <span className="absolute top-1 right-2 text-[10px] text-primary/60">Current</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default YearSelector;