import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import Overview from './pages/Overview'
import BusinessUnits from './pages/BusinessUnits'
import Customers from './pages/Customers'
// import Forecast from './pages/Forecast' // Commented out as requested
import Upload from './pages/Upload'
import SalesPlan from './pages/SalesPlan'
import { FilterProvider } from './contexts/FilterContext'
import { DataRefreshProvider } from './contexts/DataRefreshContext'
import { HierarchicalFilterProvider } from './contexts/HierarchicalFilterContext'
import { ExportProvider } from './contexts/ExportContext'
import { CacheProvider } from './contexts/CacheContext'

function App() {
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
              {/* <Route path="forecast" element={<Forecast />} /> */} {/* Commented out as requested */}
              <Route path="sales-plan" element={<SalesPlan />} />
              <Route path="upload" element={<Upload />} />
            </Route>
          </Routes>
            </ExportProvider>
          </HierarchicalFilterProvider>
        </FilterProvider>
      </DataRefreshProvider>
    </CacheProvider>
  )
}

export default App