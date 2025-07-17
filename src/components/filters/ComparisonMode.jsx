import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ChevronDown, X } from 'lucide-react';

const ComparisonMode = ({ value, period, onChange, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(value !== null);

  const comparisonOptions = [
    { value: 'previous', label: 'Previous Period' },
    { value: 'yearOverYear', label: 'Same Period Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleToggle = () => {
    if (value) {
      onChange(null, null);
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  };

  const handleModeSelect = (mode) => {
    onChange(mode, null);
  };

  return (
    <motion.div
      className={`bg-white rounded-xl border border-neutral-light shadow-sm ${className}`}
      animate={{ height: isExpanded ? 'auto' : 'auto' }}
    >
      <div className="p-3">
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 text-sm font-medium text-neutral-dark hover:text-primary transition-colors"
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
            value ? 'bg-primary border-primary' : 'border-neutral-mid'
          }`}>
            {value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-white rounded-sm"
              />
            )}
          </div>
          <TrendingUp className="w-4 h-4" />
          <span>Compare with</span>
          {value && (
            <span className="text-primary ml-1">
              {comparisonOptions.find(opt => opt.value === value)?.label}
            </span>
          )}
        </button>

        <AnimatePresence>
          {isExpanded && !value && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              {comparisonOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleModeSelect(option.value)}
                  className="w-full px-3 py-2 text-left text-sm rounded-lg border border-neutral-light hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {value && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 p-2 bg-primary/5 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-mid">
                Comparing current period with{' '}
                <span className="font-medium text-primary">
                  {value === 'previous' && 'previous period'}
                  {value === 'yearOverYear' && 'same period last year'}
                  {value === 'custom' && period}
                </span>
              </p>
              <button
                onClick={() => onChange(null, null)}
                className="p-1 hover:bg-white rounded transition-colors"
              >
                <X className="w-3 h-3 text-neutral-mid" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ComparisonMode;