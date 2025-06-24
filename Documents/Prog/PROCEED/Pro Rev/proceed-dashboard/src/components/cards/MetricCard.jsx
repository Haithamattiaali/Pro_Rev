import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatPercentage } from '../../utils/formatters'

const MetricCard = ({ title, value, format = 'currency', trend, trendValue, icon: Icon }) => {
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
          <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricCard