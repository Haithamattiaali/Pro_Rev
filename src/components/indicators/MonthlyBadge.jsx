import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

const MonthlyBadge = ({ size = 'default', showIcon = true, className = '' }) => {
  if (size === 'mini') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full ${className}`}>
        {showIcon && <Calendar className="w-3 h-3" />}
        <span className="text-xs font-medium">Monthly</span>
      </span>
    );
  }

  if (size === 'small') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-primary/10 to-primary-light/20 rounded-lg border border-primary/20 ${className}`}>
        {showIcon && <Calendar className="w-3.5 h-3.5 text-primary" />}
        <span className="text-xs font-semibold text-primary">Monthly Basis</span>
      </div>
    );
  }

  // Default size with executive styling
  return (
    <div className={`relative group ${className}`}>
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Main badge */}
      <div className="relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary via-primary-dark to-primary rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Monthly Revenue</span>
            <span className="text-xs text-white/70">Annualized × 12</span>
          </div>
        </div>
        
        {/* Animated dot */}
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyBadge;