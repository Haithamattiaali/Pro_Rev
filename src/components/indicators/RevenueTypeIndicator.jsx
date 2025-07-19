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

  // Default executive variant
  return (
    <div className="relative overflow-hidden">
      {/* Gradient background with subtle animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent-blue/5 animate-gradient-shift"></div>
      
      {/* Glass morphism container */}
      <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-primary/10 shadow-lg p-4">
        {/* Header with icon */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-md">
            <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-secondary uppercase tracking-wider">Revenue Periodicity</h4>
            <p className="text-xs text-neutral-mid mt-0.5">Opportunity valuation framework</p>
          </div>
        </div>

        {/* Visual formula */}
        <div className="bg-gradient-to-r from-secondary-pale to-neutral-light/50 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <p className="text-xs text-neutral-mid font-medium mb-1">Monthly Value</p>
              <p className="text-lg font-bold text-primary">1×</p>
            </div>
            <div className="text-2xl text-primary/40">×</div>
            <div className="text-center">
              <p className="text-xs text-neutral-mid font-medium mb-1">Annual Cycle</p>
              <p className="text-lg font-bold text-accent-blue">12</p>
            </div>
            <div className="text-2xl text-primary/40">=</div>
            <div className="text-center">
              <p className="text-xs text-neutral-mid font-medium mb-1">Annual Revenue</p>
              <p className="text-lg font-bold text-secondary">12×</p>
            </div>
          </div>
        </div>

        {/* Key insight */}
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
          <p className="text-xs font-medium text-primary">
            All pipeline values represent recurring monthly revenue potential
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueTypeIndicator;