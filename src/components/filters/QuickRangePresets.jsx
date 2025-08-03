import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CalendarClock } from 'lucide-react';

const QuickRangePresets = ({ value, onChange, presets, className = '' }) => {
  const getIcon = (preset) => {
    switch (preset.value) {
      case 'YTD':
        return Calendar;
      case 'QTD':
        return CalendarClock;
      case 'MTD':
        return CalendarClock;
      default:
        return Calendar;
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-xs text-neutral-mid mr-1">Quick:</span>
      {presets.map((preset) => {
        const Icon = getIcon(preset);
        const isActive = value === preset.value;
        
        return (
          <motion.button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={`
              px-2 py-1 rounded-md text-xs font-medium transition-all
              flex items-center gap-1
              ${isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-neutral-light text-neutral-dark hover:border-primary/30 hover:text-primary'
              }
            `}
          >
            <Icon className="w-3 h-3" />
            {preset.label}
          </motion.button>
        );
      })}
    </div>
  );
};

export default React.memo(QuickRangePresets);