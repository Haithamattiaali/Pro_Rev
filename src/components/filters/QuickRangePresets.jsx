import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CalendarClock } from 'lucide-react';

const QuickRangePresets = ({ 
  value, 
  onChange, 
  presets, 
  className = '',
  disabledPresets = [],
  disabledMessage = 'This preset is not available'
}) => {
  const [hoveredPreset, setHoveredPreset] = useState(null);

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
        const isDisabled = disabledPresets.includes(preset.value);
        const showTooltip = hoveredPreset === preset.value && isDisabled;
        
        return (
          <div key={preset.value} className="relative">
            <motion.button
              onClick={() => !isDisabled && onChange(preset.value)}
              onMouseEnter={() => setHoveredPreset(preset.value)}
              onMouseLeave={() => setHoveredPreset(null)}
              disabled={isDisabled}
              className={`
                px-2 py-1 rounded-md text-xs font-medium transition-all
                flex items-center gap-1
                ${isActive
                  ? 'bg-primary text-white shadow-sm'
                  : isDisabled
                    ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-neutral-light text-neutral-dark hover:border-primary/30 hover:text-primary'
                }
              `}
            >
              <Icon className="w-3 h-3" />
              {preset.label}
            </motion.button>
            
            {/* Tooltip for disabled presets */}
            {showTooltip && (
              <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                {typeof disabledMessage === 'function' ? disabledMessage(preset.value) : disabledMessage}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(QuickRangePresets);