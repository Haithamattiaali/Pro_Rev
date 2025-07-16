import React, { useState } from 'react'
import { MapPin, TrendingUp, Users, Target, ChevronRight } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'

const OpportunitiesByLocation = ({ locationData }) => {
  const [hoveredLocation, setHoveredLocation] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  
  if (!locationData?.locations || locationData.locations.length === 0) {
    return <div className="text-center text-gray-500 py-4">Loading location data...</div>
  }
  
  // Calculate max revenue for scaling
  const maxRevenue = Math.max(...locationData.locations.map(loc => loc.total_revenue))
  
  // Get color intensity based on revenue
  const getColorIntensity = (revenue) => {
    if (revenue === 0) return 'from-gray-100 to-gray-200 border-gray-300'
    const intensity = (revenue / maxRevenue) * 100
    if (intensity > 66) return 'from-primary/20 to-primary/10 border-primary/30'
    if (intensity > 33) return 'from-accent-blue/20 to-accent-blue/10 border-accent-blue/30'
    return 'from-accent-coral/20 to-accent-coral/10 border-accent-coral/30'
  }
  
  // Get pin color based on revenue
  const getPinColor = (revenue) => {
    if (revenue === 0) return 'bg-gray-400'
    const intensity = (revenue / maxRevenue) * 100
    if (intensity > 66) return 'bg-primary'
    if (intensity > 33) return 'bg-accent-blue'
    return 'bg-accent-coral'
  }
  
  // Get GP color
  const getGPColor = (gp) => {
    if (gp >= 0.30) return 'text-green-600 bg-green-50 border-green-200'
    if (gp >= 0.20) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }
  
  return (
    <div className="space-y-6">
      {/* Header Section with Map Visual */}
      <div className="bg-gradient-to-br from-primary/5 via-white to-accent-blue/5 rounded-2xl p-8 border border-gray-200 relative overflow-hidden">
        {/* Abstract Map Background */}
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 800 400" className="w-full h-full">
            {/* Simplified KSA outline */}
            <path d="M100,100 L700,100 L650,300 L150,300 Z" 
                  fill="currentColor" 
                  className="text-primary" />
          </svg>
        </div>
        
        {/* Header Content */}
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Geographic Opportunity Distribution</h3>
          <p className="text-gray-600">Revenue concentration across Saudi Arabia</p>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Active Locations</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {locationData.locations.filter(l => l.total_revenue > 0).length}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-sm">Total Opportunities</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {locationData.locations.reduce((sum, loc) => sum + loc.count, 0)}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Total Pipeline</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(locationData.locations.reduce((sum, loc) => sum + loc.total_revenue, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Location Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locationData.locations.map((location, index) => {
          const isHovered = hoveredLocation === index
          const isSelected = selectedLocation === index
          const colorClass = getColorIntensity(location.total_revenue)
          const pinColor = getPinColor(location.total_revenue)
          
          return (
            <div
              key={index}
              className={`relative group cursor-pointer transition-all duration-300 ${
                isHovered ? 'scale-105' : ''
              }`}
              onMouseEnter={() => setHoveredLocation(index)}
              onMouseLeave={() => setHoveredLocation(null)}
              onClick={() => setSelectedLocation(isSelected ? null : index)}
            >
              {/* Card Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} rounded-2xl border-2 ${
                isHovered ? 'shadow-2xl' : 'shadow-lg'
              }`}></div>
              
              {/* Card Content */}
              <div className="relative z-10 p-6">
                {/* Location Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`relative ${isHovered ? 'animate-pulse' : ''}`}>
                      <div className={`w-12 h-12 rounded-full ${pinColor} flex items-center justify-center shadow-lg`}>
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      {location.total_revenue > 0 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{location.location}</h4>
                      <p className="text-sm text-gray-600">{location.count} opportunities</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                    isSelected ? 'rotate-90' : ''
                  }`} />
                </div>
                
                {/* Revenue Display */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(location.total_revenue)}
                  </p>
                  {location.total_revenue > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(location.total_revenue * 12)}/year
                    </p>
                  )}
                </div>
                
                {/* Metrics Row */}
                <div className="flex items-center gap-3">
                  {/* GP% Badge */}
                  <div className={`px-3 py-1.5 rounded-lg border ${getGPColor(location.avg_gp_percent)} flex items-center gap-1`}>
                    <span className="text-sm font-semibold">
                      {(location.avg_gp_percent * 100).toFixed(1)}% GP
                    </span>
                  </div>
                  
                  {/* Max Revenue Indicator */}
                  {location.max_revenue > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>Max: {formatCurrency(location.max_revenue)}</span>
                    </div>
                  )}
                </div>
                
                {/* Top Opportunity (Expandable) */}
                {isSelected && location.topOpportunity && (
                  <div className="mt-4 p-4 bg-white/60 backdrop-blur rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">Top Opportunity</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900">{location.topOpportunity.project}</p>
                        <p className="text-sm font-medium text-gray-700">
                          {formatCurrency(location.topOpportunity.est_monthly_revenue)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600">Gross Profit</p>
                        <p className={`text-sm font-semibold ${
                          location.topOpportunity.est_gp_percent >= 0.30 ? 'text-green-600' :
                          location.topOpportunity.est_gp_percent >= 0.20 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {(location.topOpportunity.est_gp_percent * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Visual Revenue Indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-2xl overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    location.total_revenue === 0 ? 'bg-gray-400' :
                    location.total_revenue === maxRevenue ? 'bg-primary' :
                    'bg-accent-blue'
                  }`}
                  style={{ width: `${(location.total_revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-3">Revenue Intensity Scale</p>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded"></div>
            <span className="text-gray-600">High Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-accent-blue rounded"></div>
            <span className="text-gray-600">Medium Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-accent-coral rounded"></div>
            <span className="text-gray-600">Low Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-gray-600">No Revenue</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpportunitiesByLocation