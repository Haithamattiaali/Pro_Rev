import React, { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import Overview from './pages/Overview'
import BusinessUnits from './pages/BusinessUnits'
import Customers from './pages/Customers'
// import Forecast from './pages/Forecast' // Commented out as requested
import Upload from './pages/Upload'
import SalesPlan from './pages/SalesPlan'
import Forecast from './pages/Forecast'
import { FilterProvider } from './contexts/FilterContext'
import { DataRefreshProvider } from './contexts/DataRefreshContext'
import { HierarchicalFilterProvider } from './contexts/HierarchicalFilterContext'
import { ExportProvider } from './contexts/ExportContext'
import { CacheProvider } from './contexts/CacheContext'
import logger from './utils/debugLogger'

// Lazy load CacheMonitor only in development
const CacheMonitor = import.meta.env.DEV ? lazy(() => import('./components/debug/CacheMonitor')) : null

function App() {
  useEffect(() => {
    logger.info('App', 'Application initialized', {
      environment: import.meta.env.MODE,
      baseURL: import.meta.env.BASE_URL,
      apiURL: import.meta.env.VITE_API_URL,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    
    // Log help message in production
    if (import.meta.env.PROD) {
      console.log('%c🔍 Debug Mode Available', 'color: #9e1f63; font-weight: bold; font-size: 14px');
      console.log('To enable debug logging, type: __debugHelp()');
    }
  }, []);

  return (
    <CacheProvider>
      <DataRefreshProvider>
        <FilterProvider>
          <HierarchicalFilterProvider>
            <ExportProvider>
              <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="business-units" element={<BusinessUnits />} />
              <Route path="customers" element={<Customers />} />
              <Route path="forecast" element={<Forecast />} />
              <Route path="sales-plan" element={<SalesPlan />} />
              <Route path="upload" element={<Upload />} />
            </Route>
          </Routes>
              {/* Cache Monitor - Only in development */}
              {import.meta.env.DEV && CacheMonitor && (
                <Suspense fallback={null}>
                  <CacheMonitor />
                </Suspense>
              )}
            </ExportProvider>
          </HierarchicalFilterProvider>
        </FilterProvider>
      </DataRefreshProvider>
    </CacheProvider>
  )
}

export default App