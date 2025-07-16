import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Users, TrendingUp, Upload, FileSpreadsheet } from 'lucide-react'
import { useFilter } from '../../contexts/FilterContext'

const navItems = [
  { path: '/overview', label: 'Executive Overview', icon: LayoutDashboard },
  { path: '/business-units', label: 'Business Units Performance', icon: Building2 },
  { path: '/customers', label: 'Customer Performance', icon: Users },
  { path: '/forecast', label: 'Revenue Forecast', icon: TrendingUp },
  { path: '/sales-plan', label: 'Sales Plan', icon: FileSpreadsheet },
]

const utilityItems = [
  { path: '/upload', label: 'Data Upload', icon: Upload },
]

const Sidebar = () => {
  const { periodFilter } = useFilter()
  
  // Create dynamic period prefix
  const getPeriodPrefix = () => {
    const { period, month, quarter, year } = periodFilter
    
    switch (period) {
      case 'MTD':
        if (month && month !== 'all') {
          return `${month} ${year}`
        } else if (month === 'all') {
          return `Full Year ${year}`
        } else {
          return `MTD ${year}`
        }
      case 'QTD':
        if (quarter && quarter !== 'all') {
          return `Q${quarter} ${year}`
        } else if (quarter === 'all') {
          return `Full Year ${year}`
        } else {
          return `QTD ${year}`
        }
      case 'YTD':
      default:
        return `YTD ${year}`
    }
  }
  
  const periodPrefix = getPeriodPrefix()
  return (
    <aside className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary tracking-tighter">PROCEED</h1>
            <p className="text-xs text-neutral-mid">Revenue Dashboard</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 pb-6">
        <div className="mb-4 px-4">
          <p className="text-xs font-semibold text-neutral-mid uppercase tracking-wider">{periodPrefix}</p>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-neutral-dark hover:bg-secondary-pale'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          )
        })}
        
        {/* Divider and Utility Section */}
        <div className="my-6 px-4">
          <div className="border-t border-neutral-light"></div>
        </div>
        <div className="mb-4 px-4">
          <p className="text-xs font-semibold text-neutral-mid uppercase tracking-wider">Management</p>
        </div>
        {utilityItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
                  isActive
                    ? 'bg-accent-blue text-white'
                    : 'text-neutral-dark hover:bg-secondary-pale'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar