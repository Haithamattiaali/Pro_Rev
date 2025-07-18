import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const YearDropdown = ({ value, onChange, availableYears, multiSelect = false, selectedYears = [], className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const currentYear = new Date().getFullYear();
  
  // In multi-select mode, use selectedYears array; otherwise use single value
  const displayValue = multiSelect 
    ? selectedYears.length === 0 
      ? 'Select Years' 
      : selectedYears.length === 1 
        ? selectedYears[0] 
        : `${selectedYears.length} Years`
    : value;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (year) => {
    if (multiSelect) {
      // In multi-select mode, toggle the year in the array
      const newSelection = selectedYears.includes(year)
        ? selectedYears.filter(y => y !== year)
        : [...selectedYears, year].sort((a, b) => b - a);
      
      // Don't allow empty selection
      if (newSelection.length > 0) {
        onChange(newSelection);
      }
    } else {
      // Single select mode
      onChange(year);
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg
          bg-white border transition-all min-w-[100px]
          ${isOpen 
            ? 'border-primary shadow-sm' 
            : 'border-neutral-light hover:border-neutral-mid hover:shadow-sm'
          }
        `}
      >
        <span className="text-sm font-medium text-neutral-dark">{displayValue}</span>
        {!multiSelect && value === currentYear && (
          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">Current</span>
        )}
        {multiSelect && selectedYears.includes(currentYear) && (
          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">Current</span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="ml-auto"
        >
          <ChevronDown className="w-3.5 h-3.5 text-neutral-mid" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute left-0 top-full mt-1 w-full min-w-[120px] bg-white rounded-lg shadow-xl border border-neutral-light overflow-hidden z-50"
          >
            <div className="max-h-[200px] overflow-y-auto py-1">
              {availableYears.map((year) => {
                const isSelected = multiSelect 
                  ? selectedYears.includes(year)
                  : year === value;
                const isCurrent = year === currentYear;
                
                return (
                  <button
                    key={year}
                    onClick={() => handleSelect(year)}
                    className={`
                      w-full px-3 py-2 text-left text-sm flex items-center justify-between
                      transition-colors
                      ${isSelected 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-neutral-light/50 text-neutral-dark'
                      }
                    `}
                  >
                    <span className="font-medium">{year}</span>
                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <span className="text-[10px] text-primary/60">Current</span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(YearDropdown);