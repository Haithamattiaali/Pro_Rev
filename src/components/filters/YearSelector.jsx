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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-dark">Select Years</h3>
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
      
      <div className="grid grid-cols-3 gap-3">
        {years.map((year, index) => {
          const isSelected = selections.includes(year);
          
          return (
            <motion.button
              key={year}
              onClick={() => handleToggle(year)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
              <div className="flex items-center justify-center gap-3">
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
                <span className="text-lg font-semibold">{year}</span>
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