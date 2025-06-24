import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatPercentage } from '../../utils/formatters'

const MetricCard = ({ title, value, format = 'currency', trend, trendValue, icon: Icon, iconColor = 'primary' }) => {
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
    <div className="dashboard-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="metric-label">{title}</p>
          <p className="metric-value mt-2">{formatValue(value)}</p>
          
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
    </div>
  )
}

export default MetricCard