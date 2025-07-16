import React, { createContext, useContext, useState, useCallback } from 'react'
import dataService from '../services/dataService'

const DataRefreshContext = createContext()

export const useDataRefresh = () => {
  const context = useContext(DataRefreshContext)
  if (!context) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider')
  }
  return context
}

export const DataRefreshProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now())

  // Trigger a global data refresh
  const triggerRefresh = useCallback(async (options = {}) => {
    const { 
      showNotification = true, 
      message = 'Data updated successfully',
      duration = 3000 
    } = options

    console.log('🔄 Triggering data refresh...')
    setRefreshing(true)
    
    // Clear the data service cache to force fresh API calls
    dataService.clearCache()
    
    // Update both trigger and timestamp
    const refreshTime = Date.now()
    setLastRefreshTime(refreshTime)
    setRefreshTrigger(prev => prev + 1)
    
    // Show notification if requested
    if (showNotification) {
      console.log('📢', message)
    }
    
    // Small delay to ensure all components have time to start their refresh
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
    
  }, [])

  // Clear any refresh state
  const clearRefresh = useCallback(() => {
    setRefreshing(false)
  }, [])

  // Get current refresh state
  const getRefreshState = useCallback(() => ({
    refreshTrigger,
    refreshing,
    lastRefreshTime,
    lastRefresh: new Date(lastRefreshTime).toISOString()
  }), [refreshTrigger, refreshing, lastRefreshTime])

  const value = {
    refreshTrigger,
    refreshing,
    lastRefreshTime,
    triggerRefresh,
    clearRefresh,
    getRefreshState
  }

  return (
    <DataRefreshContext.Provider value={value}>
      {children}
    </DataRefreshContext.Provider>
  )
}

export default DataRefreshContext