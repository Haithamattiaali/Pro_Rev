import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import Overview from './pages/Overview'
import BusinessUnits from './pages/BusinessUnits'
import Customers from './pages/Customers'
import Forecast from './pages/Forecast'
import Upload from './pages/Upload'
import SalesPlan from './pages/SalesPlan'
import FilterDemo from './pages/FilterDemo'
import { FilterProvider } from './contexts/FilterContext'
import { DataRefreshProvider } from './contexts/DataRefreshContext'

function App() {
  return (
    <DataRefreshProvider>
      <FilterProvider>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="business-units" element={<BusinessUnits />} />
            <Route path="customers" element={<Customers />} />
            <Route path="forecast" element={<Forecast />} />
            <Route path="sales-plan" element={<SalesPlan />} />
            <Route path="upload" element={<Upload />} />
            <Route path="filter-demo" element={<FilterDemo />} />
          </Route>
        </Routes>
      </FilterProvider>
    </DataRefreshProvider>
  )
}

export default App