import React from 'react';
import { TrendingUp, Calendar, Zap } from 'lucide-react';

const RevenueTypeIndicator = ({ variant = 'default' }) => {
  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary/5 to-primary-light/10 rounded-full border border-primary/20">
        <Calendar className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary">Monthly Revenue Basis</span>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-1.5 text-neutral-mid">
        <Zap className="w-3 h-3" />
        <span className="text-xs">Monthly × 12</span>
      </div>
    );
  }

  // Default executive variant - MUI + Ant + Apple mix
  return (
    <div className="bg-white rounded-lg border border-secondary-pale/30 p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - icon and text */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <TrendingUp className="w-4 h-4 text-primary" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold text-secondary">Revenue Basis</p>
            <p className="text-xs text-neutral-mid">Monthly recurring</p>
          </div>
        </div>
        
        {/* Right side - formula */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary-pale/20 rounded-md">
          <span className="text-xs font-medium text-neutral-mid">Monthly</span>
          <span className="text-xs text-neutral-mid/60">×</span>
          <span className="text-xs font-semibold text-primary">12</span>
          <span className="text-xs text-neutral-mid/60">=</span>
          <span className="text-xs font-medium text-secondary">Annual</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueTypeIndicator;