import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CalendarRange, CalendarDays } from 'lucide-react';

const ViewModeToggle = ({ value, onChange, className = '' }) => {
  const modes = [
    { value: 'yearly', label: 'Yearly', icon: Calendar },
    { value: 'quarterly', label: 'Quarterly', icon: CalendarRange },
    { value: 'monthly', label: 'Monthly', icon: CalendarDays }
  ];

  return (
    <div className={`inline-flex bg-neutral-light/50 rounded-lg p-0.5 ${className}`}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = value === mode.value;
        
        return (
          <motion.button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={`
              relative px-3 py-1 rounded-md text-xs font-medium transition-all
              flex items-center gap-1.5
              ${isActive
                ? 'text-white'
                : 'text-neutral-dark hover:text-primary'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isActive && (
              <motion.div
                layoutId="activeViewMode"
                className="absolute inset-0 bg-primary rounded-md shadow-sm"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
              />
            )}
            <Icon className="w-3 h-3 relative z-10" />
            <span className="relative z-10">{mode.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default ViewModeToggle;