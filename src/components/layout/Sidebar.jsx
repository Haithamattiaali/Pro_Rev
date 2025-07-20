import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Users, TrendingUp, Upload, FileSpreadsheet } from 'lucide-react'
import { useFilter } from '../../contexts/FilterContext'

const navItems = [
  { path: '/overview', label: 'Executive Overview', icon: LayoutDashboard },
  { path: '/business-units', label: 'Business Units Performance', icon: Building2 },
  { path: '/customers', label: 'Customer Performance', icon: Users },
  // { path: '/forecast', label: 'Revenue Forecast', icon: TrendingUp }, // Commented out as requested
  { path: '/sales-plan', label: 'Sales Plan', icon: FileSpreadsheet },
]

const utilityItems = [
  { path: '/upload', label: 'Data Upload', icon: Upload },
]

const Sidebar = ({ onCloseMobile }) => {
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
    <aside className="w-64 lg:w-64 h-screen flex flex-col sidebar-glass border-r border-secondary-pale/20 shadow-xl relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #9e1f63 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      {/* Header */}
      <div className="p-6 bg-white/80 backdrop-blur-sm border-b border-secondary-pale/20 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-md transform transition-transform hover:scale-105">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent tracking-tighter">PROCEED</h1>
            <p className="text-xs text-neutral-mid">Revenue Dashboard</p>
          </div>
        </div>
      </div>
      
      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 relative z-10">
        {/* Main navigation items */}
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md'
                      : 'text-neutral-dark hover:bg-white/60 hover:shadow-sm hover:translate-x-1'
                  }`
                }
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110`} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
        
        {/* Divider */}
        <div className="my-8 px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-secondary-pale to-transparent"></div>
        </div>
        
        {/* Utility Section */}
        <div className="space-y-2">
          <div className="mb-4 px-4">
            <p className="text-xs font-semibold text-neutral-mid uppercase tracking-wider">Management</p>
          </div>
          {utilityItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-accent-blue to-accent-blue/80 text-white shadow-md'
                      : 'text-neutral-dark hover:bg-white/60 hover:shadow-sm hover:translate-x-1'
                  }`
                }
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110`} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-secondary-pale/20 bg-white/50 backdrop-blur-sm relative z-10">
        <div className="text-center">
          <p className="text-xs text-neutral-mid">© 2025 Proceed Revenue</p>
          <p className="text-xs text-neutral-mid/70 mt-1">Version 1.0.0</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar