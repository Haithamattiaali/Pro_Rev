import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const PeriodChips = ({ 
  selections, 
  modeConfig, 
  onRemove, 
  maxDisplay = 3,
  showEmpty = true,
  interactive = true 
}) => {
  const { months = [], quarters = [], years = [] } = selections;
  
  // Combine all selections with their mode info
  const allChips = [
    ...months.map(m => ({
      value: m,
      label: modeConfig.M.items.find(item => item.value === m)?.shortLabel || `Month ${m}`,
      mode: 'M',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      hoverColor: 'hover:bg-blue-100'
    })),
    ...quarters.map(q => ({
      value: q,
      label: modeConfig.Q.items.find(item => item.value === q)?.shortLabel || `Q${q}`,
      mode: 'Q',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      hoverColor: 'hover:bg-emerald-100'
    })),
    ...years.map(y => ({
      value: y,
      label: y.toString(),
      mode: 'Y',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      hoverColor: 'hover:bg-purple-100'
    }))
  ];

  const visibleChips = allChips.slice(0, maxDisplay);
  const hiddenCount = allChips.length - maxDisplay;

  if (allChips.length === 0 && showEmpty) {
    return (
      <span className="text-neutral-mid text-sm">
        Select period
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <AnimatePresence mode="popLayout">
        {visibleChips.map((chip) => (
          <motion.div
            key={`${chip.mode}-${chip.value}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              duration: 0.2 
            }}
            layout
          >
            <div
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                text-xs font-medium border transition-all
                ${chip.color} ${chip.hoverColor}
              `}
            >
              <span>{chip.label}</span>
              {onRemove && interactive && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(chip.value, chip.mode);
                  }}
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onRemove(chip.value, chip.mode);
                    }
                  }}
                >
                  <X className="w-2.5 h-2.5" strokeWidth={3} />
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {hiddenCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="inline-flex items-center px-2.5 py-1 rounded-full bg-neutral-light text-neutral-dark text-xs font-medium"
        >
          +{hiddenCount} more
        </motion.div>
      )}
    </div>
  );
};

export default PeriodChips;