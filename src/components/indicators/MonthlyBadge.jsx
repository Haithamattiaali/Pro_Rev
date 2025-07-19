import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

const MonthlyBadge = ({ size = 'default', showIcon = true, className = '' }) => {
  if (size === 'mini') {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-secondary-pale/30 text-primary rounded text-[10px] font-medium ${className}`}>
        {showIcon && <Calendar className="w-2.5 h-2.5" />}
        <span>Monthly</span>
      </span>
    );
  }

  if (size === 'small') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-secondary-pale/40 rounded-md ${className}`}>
        {showIcon && <Calendar className="w-3 h-3 text-primary" />}
        <span className="text-xs font-medium text-secondary">Monthly</span>
      </div>
    );
  }

  // Default size - clean and minimal
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/20 rounded-lg hover:border-primary/40 transition-colors ${className}`}>
      <div className="flex items-center gap-2">
        {showIcon && (
          <div className="p-1 bg-primary/10 rounded">
            <TrendingUp className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-secondary">Monthly</span>
          <span className="text-xs text-neutral-mid">×12</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyBadge;