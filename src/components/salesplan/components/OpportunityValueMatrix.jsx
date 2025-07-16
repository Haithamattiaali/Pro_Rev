import React, { useMemo, useState } from 'react'
import { 
  ScatterChart, 
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts'
import { formatCurrency } from '../../../utils/formatters'
import { TrendingUp, TrendingDown, AlertTriangle, Star } from 'lucide-react'

const OpportunityValueMatrix = ({ opportunities }) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState(null)
  const [hoveredOpportunity, setHoveredOpportunity] = useState(null)

  // Process opportunities data for the scatter plot
  const { chartData, quadrantStats, metrics } = useMemo(() => {
    if (!opportunities?.opportunities) return { chartData: [], quadrantStats: {}, metrics: {} }

    // Convert opportunities to chart data points
    const data = opportunities.opportunities
      .filter(opp => opp.est_monthly_revenue > 0 && opp.est_gp_percent > 0)
      .map(opp => {
        // Handle GP percentage - check if it's already a percentage or decimal
        const gpPercent = opp.est_gp_percent > 1 ? opp.est_gp_percent : opp.est_gp_percent * 100;
        
        return {
          x: gpPercent, // Use as percentage
          y: opp.est_monthly_revenue,
          z: opp.est_monthly_revenue * 12, // Annual value for bubble size
          name: opp.project,
          service: opp.service,
          location: opp.location,
          status: opp.status,
          is3PL: opp.service?.includes('3PL')
        }
      })

    // Calculate median values for quadrant lines
    const gpValues = data.map(d => d.x).sort((a, b) => a - b)
    const revenueValues = data.map(d => d.y).sort((a, b) => a - b)
    const medianGP = gpValues[Math.floor(gpValues.length / 2)] || 25
    const medianRevenue = revenueValues[Math.floor(revenueValues.length / 2)] || 100000

    // Categorize into quadrants
    const quadrants = {
      strategic: data.filter(d => d.x >= medianGP && d.y >= medianRevenue),
      volume: data.filter(d => d.x < medianGP && d.y >= medianRevenue),
      quickWins: data.filter(d => d.x >= medianGP && d.y < medianRevenue),
      optimize: data.filter(d => d.x < medianGP && d.y < medianRevenue)
    }

    // Calculate statistics for each quadrant
    const stats = {}
    Object.entries(quadrants).forEach(([key, items]) => {
      stats[key] = {
        count: items.length,
        totalMonthly: items.reduce((sum, item) => sum + item.y, 0),
        totalAnnual: items.reduce((sum, item) => sum + item.z, 0),
        avgGP: items.length > 0 ? items.reduce((sum, item) => sum + item.x, 0) / items.length : 0,
        avgRevenue: items.length > 0 ? items.reduce((sum, item) => sum + item.y, 0) / items.length : 0,
        items: items
      }
    })

    return {
      chartData: data,
      quadrantStats: stats,
      metrics: { medianGP, medianRevenue }
    }
  }, [opportunities])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{data.service}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="text-gray-600">Monthly:</span>{' '}
              <span className="font-semibold">{formatCurrency(data.y)}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Annual:</span>{' '}
              <span className="font-semibold">{formatCurrency(data.z)}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">GP:</span>{' '}
              <span className="font-semibold">{data.x.toFixed(1)}%</span>
            </p>
            {data.location && (
              <p className="text-sm text-gray-500">{data.location}</p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Quadrant info cards
  const quadrantInfo = {
    strategic: {
      title: 'Strategic Wins',
      icon: Star,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'High value, high margin opportunities',
      action: 'Prioritize and fast-track these deals'
    },
    volume: {
      title: 'Volume Plays',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'High revenue but lower margins',
      action: 'Optimize operations to improve margins'
    },
    quickWins: {
      title: 'Quick Wins',
      icon: TrendingDown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Good margins but smaller deals',
      action: 'Bundle or upsell to increase value'
    },
    optimize: {
      title: 'Review/Optimize',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Low value and low margin',
      action: 'Reassess viability or improve terms'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with metrics */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunity Value Matrix</h3>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(quadrantInfo).map(([key, info]) => {
            const stats = quadrantStats[key]
            const Icon = info.icon
            const isSelected = selectedQuadrant === key
            
            return (
              <button
                key={key}
                onClick={() => setSelectedQuadrant(isSelected ? null : key)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? `${info.bgColor} border-current ${info.color}` 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${info.color}`} />
                  <span className="text-2xl font-bold text-gray-900">{stats?.count || 0}</span>
                </div>
                <h4 className={`font-semibold ${isSelected ? info.color : 'text-gray-900'} text-left`}>
                  {info.title}
                </h4>
                <p className="text-sm text-gray-600 text-left mt-1">{info.description}</p>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-left">Annual Value</p>
                  <p className="text-lg font-semibold text-gray-900 text-left">
                    {formatCurrency(stats?.totalAnnual || 0)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Scatter Plot */}
        <div className="bg-gray-50 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="GP%" 
                unit="%" 
                domain={[0, 50]}
                label={{ value: 'Gross Profit %', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Monthly Revenue" 
                domain={[0, 'dataMax + 50000']}
                label={{ value: 'Monthly Revenue (SAR)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Quadrant lines */}
              <ReferenceLine 
                x={metrics.medianGP} 
                stroke="#9e1f63" 
                strokeDasharray="5 5" 
                strokeWidth={2}
              />
              <ReferenceLine 
                y={metrics.medianRevenue} 
                stroke="#9e1f63" 
                strokeDasharray="5 5" 
                strokeWidth={2}
              />
              
              {/* Scatter points */}
              <Scatter
                name="Opportunities"
                data={chartData}
                fill="#8884d8"
                onMouseEnter={(data) => setHoveredOpportunity(data)}
                onMouseLeave={() => setHoveredOpportunity(null)}
              >
                {chartData.map((entry, index) => {
                  // Color based on quadrant selection and service type
                  let fillColor = entry.is3PL ? '#005b8c' : '#e05e3d' // Blue for 3PL, Coral for 2PL
                  
                  if (selectedQuadrant) {
                    const inQuadrant = 
                      (selectedQuadrant === 'strategic' && entry.x >= metrics.medianGP && entry.y >= metrics.medianRevenue) ||
                      (selectedQuadrant === 'volume' && entry.x < metrics.medianGP && entry.y >= metrics.medianRevenue) ||
                      (selectedQuadrant === 'quickWins' && entry.x >= metrics.medianGP && entry.y < metrics.medianRevenue) ||
                      (selectedQuadrant === 'optimize' && entry.x < metrics.medianGP && entry.y < metrics.medianRevenue)
                    
                    if (!inQuadrant) fillColor = '#e5e7eb' // Gray out non-selected
                  }
                  
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={fillColor}
                      fillOpacity={selectedQuadrant && fillColor === '#e5e7eb' ? 0.3 : 0.8}
                      stroke={hoveredOpportunity?.name === entry.name ? '#9e1f63' : 'none'}
                      strokeWidth={hoveredOpportunity?.name === entry.name ? 3 : 0}
                    />
                  )
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#e05e3d]"></div>
              <span className="text-sm text-gray-600">2PL Services</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#005b8c]"></div>
              <span className="text-sm text-gray-600">3PL Services</span>
            </div>
          </div>
        </div>

        {/* Selected Quadrant Details */}
        {selectedQuadrant && quadrantStats[selectedQuadrant]?.items.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">
                {quadrantInfo[selectedQuadrant].title} - Opportunities
              </h4>
              <p className={`text-sm font-medium ${quadrantInfo[selectedQuadrant].color}`}>
                {quadrantInfo[selectedQuadrant].action}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quadrantStats[selectedQuadrant].items.slice(0, 6).map((opp, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="font-medium text-gray-900 truncate">{opp.name}</h5>
                  <p className="text-sm text-gray-600">{opp.service}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm font-semibold">{formatCurrency(opp.y)}/mo</span>
                    <span className={`text-sm font-medium ${
                      opp.x >= 30 ? 'text-green-600' : opp.x >= 20 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {opp.x.toFixed(1)}% GP
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {quadrantStats[selectedQuadrant].items.length > 6 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                +{quadrantStats[selectedQuadrant].items.length - 6} more opportunities
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OpportunityValueMatrix