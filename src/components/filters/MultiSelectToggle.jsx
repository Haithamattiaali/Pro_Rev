import React from 'react';
import { motion } from 'framer-motion';
import { SquareCheck, Square } from 'lucide-react';

const MultiSelectToggle = ({ enabled, onChange, className = '' }) => {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        transition-all ${className}
        ${enabled 
          ? 'bg-primary/10 text-primary border border-primary/30' 
          : 'bg-white text-neutral-dark border border-neutral-light hover:border-primary/30'
        }
      `}
    >
      <motion.div
        animate={{ scale: enabled ? 1 : 0.9 }}
        transition={{ duration: 0.15 }}
      >
        {enabled ? (
          <SquareCheck className="w-3.5 h-3.5" />
        ) : (
          <Square className="w-3.5 h-3.5" />
        )}
      </motion.div>
      <span className="text-xs font-medium">Multi-Select</span>
    </button>
  );
};

export default React.memo(MultiSelectToggle);