import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatPercentage } from '../../utils/formatters'
import BaseCard from '../common/BaseCard'

const MetricCard = ({ title, subtitle, value, format = 'currency', trend, trendValue, icon: Icon, iconColor = 'primary' }) => {
  const formatValue = (val) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return formatPercentage(val)
      default:
        return val
    }
  }

  return (
    <BaseCard variant="elevated" shadow="md" className="relative overflow-hidden">
      {/* Accent line at top */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        iconColor === 'primary' ? 'bg-gradient-to-r from-primary to-primary-light' :
        iconColor === 'blue' ? 'bg-gradient-to-r from-accent-blue to-accent-blue/50' :
        iconColor === 'green' ? 'bg-gradient-to-r from-green-600 to-green-400' :
        iconColor === 'coral' ? 'bg-gradient-to-r from-accent-coral to-accent-coral/50' :
        'bg-gradient-to-r from-primary to-primary-light'
      }`}></div>
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wider mb-1">{title}</p>
          <p className="text-3xl font-bold text-neutral-dark tracking-tight">{formatValue(value)}</p>
          {subtitle && <p className="text-xs text-neutral-mid mt-1">{subtitle}</p>}
          
          {trend && (
            <div className="flex items-center mt-3 space-x-1">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-semibold ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className="relative">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
              iconColor === 'primary' ? 'bg-gradient-to-br from-primary-light to-primary/20 shadow-primary/20' :
              iconColor === 'blue' ? 'bg-gradient-to-br from-accent-blue/20 to-accent-blue/10 shadow-accent-blue/20' :
              iconColor === 'green' ? 'bg-gradient-to-br from-green-100 to-green-50 shadow-green-200' :
              iconColor === 'coral' ? 'bg-gradient-to-br from-accent-coral/20 to-accent-coral/10 shadow-accent-coral/20' :
              'bg-gradient-to-br from-primary-light to-primary/20 shadow-primary/20'
            }`}>
              <Icon className={`w-7 h-7 ${
                iconColor === 'primary' ? 'text-primary' :
                iconColor === 'blue' ? 'text-accent-blue' :
                iconColor === 'green' ? 'text-green-600' :
                iconColor === 'coral' ? 'text-accent-coral' :
                'text-primary'
              }`} strokeWidth={2} />
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  )
}

export default MetricCard