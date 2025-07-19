import React from 'react'
import { TrendingUp, TrendingDown, Calendar, AlertCircle, CheckCircle, Clock, ArrowRight, Info } from 'lucide-react'
import { formatCurrency, formatPercentage } from '../../utils/formatters'
import BaseCard from '../common/BaseCard'

const EnhancedMetricCard = ({ 
  title, 
  value, 
  format = 'currency', 
  trend, 
  trendValue,
  trendLabel = 'vs last period',
  icon: Icon, 
  iconColor = 'primary',
  subtitle,
  progress,
  progressLabel,
  status,
  statusLabel,
  detail,
  detailIcon: DetailIcon,
  comparison,
  comparisonLabel,
  alert,
  alertType = 'info',
  footer,
  footerIcon: FooterIcon,
  onClick,
  mini = false
}) => {
  const formatValue = (val) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return formatPercentage(val)
      case 'number':
        return new Intl.NumberFormat().format(val)
      default:
        return val
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'danger': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getAlertStyles = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 text-green-700 border-green-200'
      case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'danger': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  if (mini) {
    return (
      <BaseCard 
        variant="elevated" 
        shadow="sm" 
        padding="small"
        className="relative overflow-hidden cursor-pointer group"
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-neutral-mid uppercase tracking-wider">{title}</p>
            <p className="text-xl font-bold text-neutral-dark mt-1">{formatValue(value)}</p>
            {trend && (
              <div className="flex items-center mt-1 space-x-1">
                {trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <span className={`text-xs font-medium ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              iconColor === 'primary' ? 'bg-primary/10' :
              iconColor === 'blue' ? 'bg-accent-blue/10' :
              iconColor === 'green' ? 'bg-green-100' :
              iconColor === 'coral' ? 'bg-accent-coral/10' :
              'bg-primary/10'
            }`}>
              <Icon className={`w-5 h-5 ${
                iconColor === 'primary' ? 'text-primary' :
                iconColor === 'blue' ? 'text-accent-blue' :
                iconColor === 'green' ? 'text-green-600' :
                iconColor === 'coral' ? 'text-accent-coral' :
                'text-primary'
              }`} strokeWidth={2} />
            </div>
          )}
        </div>
      </BaseCard>
    )
  }

  return (
    <BaseCard 
      variant="elevated" 
      shadow="md" 
      className="relative overflow-hidden group"
      onClick={onClick}
    >
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
      
      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wider">{title}</p>
              {status && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {status === 'success' ? <CheckCircle className="w-3 h-3" /> : 
                   status === 'warning' ? <AlertCircle className="w-3 h-3" /> :
                   <AlertCircle className="w-3 h-3" />}
                  {statusLabel}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-neutral-mid mb-2">{subtitle}</p>
            )}
            <p className="text-3xl font-bold text-neutral-dark tracking-tight">{formatValue(value)}</p>
          </div>
          
          {Icon && (
            <div className="relative">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${
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

        {/* Trend and Comparison Section */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {trend && (
            <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-3 py-2">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <div>
                <span className={`text-sm font-semibold ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trendValue}
                </span>
                <p className="text-xs text-gray-500">{trendLabel}</p>
              </div>
            </div>
          )}
          
          {comparison && (
            <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-3 py-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-sm font-semibold text-gray-700">{comparison}</span>
                <p className="text-xs text-gray-500">{comparisonLabel}</p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-600">{progressLabel || 'Progress'}</span>
              <span className="text-xs font-semibold text-gray-700">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  progress >= 100 ? 'bg-green-500' :
                  progress >= 75 ? 'bg-blue-500' :
                  progress >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Detail Section */}
        {detail && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            {DetailIcon && <DetailIcon className="w-4 h-4 text-gray-500" />}
            <span className="text-sm text-gray-700">{detail}</span>
          </div>
        )}

        {/* Alert Section */}
        {alert && (
          <div className={`flex items-start gap-2 mb-4 p-3 rounded-lg border ${getAlertStyles(alertType)}`}>
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="text-xs">{alert}</span>
          </div>
        )}

        {/* Footer Section */}
        {footer && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {FooterIcon && <FooterIcon className="w-4 h-4" />}
              <span>{footer}</span>
            </div>
            {onClick && (
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
            )}
          </div>
        )}
      </div>
    </BaseCard>
  )
}

export default EnhancedMetricCard