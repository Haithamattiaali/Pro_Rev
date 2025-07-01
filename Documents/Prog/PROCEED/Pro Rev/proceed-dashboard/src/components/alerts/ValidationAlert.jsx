import React from 'react'
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react'

const ValidationAlert = ({ validation, className = '' }) => {
  if (!validation || !validation.validationMessage) return null

  const { type, message } = validation.validationMessage
  
  const alertStyles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: AlertCircle,
      iconColor: 'text-amber-600'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-600'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600'
    }
  }

  const style = alertStyles[type] || alertStyles.info
  const Icon = style.icon

  // Show analysis period details for warning messages
  const showPeriodDetails = type === 'warning' && validation.analysisPeriod

  return (
    <div className={`rounded-lg border p-4 ${style.bg} ${className}`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${style.text}`}>
            {message}
          </p>
          
          {showPeriodDetails && (
            <div className="mt-2 text-sm">
              <p className={`${style.text} opacity-90`}>
                Analysis Period: <span className="font-semibold">
                  {validation.analysisPeriod.start} - {validation.analysisPeriod.end}
                </span>
                {' '}({validation.analysisPeriod.monthCount} months)
              </p>
            </div>
          )}
          
          {validation.nonCompliantMonths && validation.nonCompliantMonths.length > 0 && (
            <div className="mt-2">
              <details className="cursor-pointer">
                <summary className={`text-xs font-medium ${style.text} opacity-80 hover:opacity-100`}>
                  View missing data details
                </summary>
                <div className="mt-2 p-2 bg-white bg-opacity-50 rounded">
                  {Object.entries(validation.missingDataDetails).map(([month, missing]) => (
                    <div key={month} className="text-xs py-1">
                      <span className="font-medium">{month}:</span> Missing {missing.join(', ')}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ValidationAlert