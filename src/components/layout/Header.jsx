import React from 'react'
import { format } from 'date-fns'
import { Calendar, RefreshCw } from 'lucide-react'
import { useDataRefresh } from '../../contexts/DataRefreshContext'

const Header = () => {
  const currentDate = format(new Date(), 'MMMM dd, yyyy')
  const { refreshing, lastRefreshTime, triggerRefresh } = useDataRefresh()
  
  return (
    <header className="bg-white shadow-sm border-b border-secondary-pale">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark tracking-tight">Revenue Performance Dashboard</h2>
          <p className="text-sm text-neutral-mid mt-1">Insights for strategic decision making</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-neutral-mid">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">{currentDate}</span>
          </div>
          
          {/* Refresh Status Indicator */}
          <div className="flex items-center space-x-2">
            {refreshing && (
              <div className="flex items-center space-x-2 text-primary">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Refreshing...</span>
              </div>
            )}
            {!refreshing && lastRefreshTime && (
              <div className="text-xs text-neutral-mid">
                Last updated: {new Date(lastRefreshTime).toLocaleTimeString()}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </header>
  )
}

export default Header