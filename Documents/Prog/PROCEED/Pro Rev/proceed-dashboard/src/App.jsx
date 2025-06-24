import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import Overview from './pages/Overview'
import BusinessUnits from './pages/BusinessUnits'
import Customers from './pages/Customers'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="business-units" element={<BusinessUnits />} />
        <Route path="customers" element={<Customers />} />
      </Route>
    </Routes>
  )
}

export default App