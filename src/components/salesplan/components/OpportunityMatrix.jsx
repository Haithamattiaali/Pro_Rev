import React, { useState, useMemo } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend } from 'recharts'
import { TrendingUp, Target, Package, AlertCircle, DollarSign, Percent, BarChart3 } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'

const OpportunityMatrix = ({ matrixData }) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState(null)
  const [hoveredPoint, setHoveredPoint] = useState(null)
  
  // Quadrant definitions with business-focused insights
  const quadrants = [
    {
      key: 'highValueHighGP',
      name: 'Strategic Wins',
      description: 'High revenue & high margin opportunities',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      icon: TrendingUp,
      actions: [
        'Prioritize executive engagement',
        'Allocate best resources',
        'Develop strategic partnerships',
        'Explore expansion opportunities'
      ]
    },
    {
      key: 'highValueLowGP',
      name: 'Volume Plays',
      description: 'High revenue but needs margin improvement',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: Package,
      actions: [
        'Optimize operational costs',
        'Renegotiate supplier contracts',
        'Implement automation',
        'Review pricing strategy'
      ]
    },
    {
      key: 'lowValueHighGP',
      name: 'Quick Wins',
      description: 'Lower revenue but excellent margins',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      icon: Target,
      actions: [
        'Fast-track implementation',
        'Use as proof of concept',
        'Scale through similar clients',
        'Bundle for higher value'
      ]
    },
    {
      key: 'lowValueLowGP',
      name: 'Review & Optimize',
      description: 'Opportunities needing strategic review',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      icon: AlertCircle,
      actions: [
        'Evaluate strategic fit',
        'Consider phase-out plan',
        'Restructure service model',
        'Assess resource allocation'
      ]
    }
  ]
  
  // Process scatter data with proper calculations
  const scatterData = useMemo(() => {
    if (!matrixData?.opportunities) return []
    
    return matrixData.opportunities.map((opp, idx) => ({
      id: idx,
      x: (opp.gp_percent || 0) * 100, // Convert to percentage
      y: opp.revenue || 0,
      z: Math.max(30, Math.min(100, (opp.annual_revenue / 5000000) * 100)), // Scale bubble size
      project: opp.project,
      service: opp.service,
      location: opp.location,
      status: opp.status,
      revenue: opp.revenue,
      gp_percent: opp.gp_percent,
      annual_revenue: opp.annual_revenue,
      monthly_gp_amount: opp.monthly_gp_amount || (opp.revenue * opp.gp_percent),
      annual_gp_amount: opp.annual_gp_amount || (opp.annual_revenue * opp.gp_percent)
    }))
  }, [matrixData])
  
  // Get quadrant for a data point
  const getPointQuadrant = (point) => {
    if (!matrixData?.thresholds) return 3 // Default to review quadrant
    
    const { revenue, gp } = matrixData.thresholds
    
    if (point.y >= revenue && point.x >= gp) {
      return 0 // Strategic Wins
    } else if (point.y >= revenue && point.x < gp) {
      return 1 // Volume Plays
    } else if (point.y < revenue && point.x >= gp) {
      return 2 // Quick Wins
    } else {
      return 3 // Review
    }
  }
  
  // Custom tooltip with detailed information
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      const quadrantIndex = getPointQuadrant(data)
      const quadrant = quadrants[quadrantIndex]
      
      return (
        <div className="bg-white p-5 rounded-xl shadow-2xl border border-gray-200 min-w-[320px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-900 text-lg flex-1 pr-2">{data.project}</h4>
            <span 
              className="px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: quadrant.color }}
            >
              {quadrant.name}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium text-gray-900">{data.service}</span>
            </div>
            {data.location && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium text-gray-900">{data.location}</span>
              </div>
            )}
            {data.status && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {data.status}
                </span>
              </div>
            )}
            
            <div className="border-t pt-3 mt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Monthly Revenue:
                </span>
                <span className="font-bold text-gray-900">{formatCurrency(data.revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Annual Revenue:</span>
                <span className="font-bold text-primary">{formatCurrency(data.annual_revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Gross Profit:
                </span>
                <span className="font-bold" style={{ color: quadrant.color }}>
                  {data.x.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monthly GP Amount:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(data.monthly_gp_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }
  
  // Empty state
  if (!matrixData || !matrixData.opportunities || matrixData.opportunities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex flex-col items-center justify-center h-96">
          <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Opportunities Data</h3>
          <p className="text-gray-500 text-center max-w-md">
            No opportunities data is available. Upload opportunities data to see the value matrix analysis.
          </p>
        </div>
      </div>
    )
  }
  
  const { thresholds, statistics } = matrixData
  
  return (
    <div className="space-y-6">
      {/* Header with Overall Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Opportunity Value Matrix</h3>
            <p className="text-sm text-gray-600 mt-1">
              Strategic analysis of {statistics?.totalOpportunities || 0} opportunities
            </p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-sm text-gray-500">Total Monthly</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(statistics?.totalMonthlyRevenue || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Annual</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(statistics?.totalAnnualRevenue || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg GP%</p>
              <p className="text-xl font-bold text-green-600">
                {((statistics?.averageGP || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        {/* Scatter Chart */}
        <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-4">
          {/* Quadrant backgrounds */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none rounded-xl overflow-hidden">
            <div className="bg-blue-50 opacity-20"></div>
            <div className="bg-green-50 opacity-20"></div>
            <div className="bg-red-50 opacity-20"></div>
            <div className="bg-yellow-50 opacity-20"></div>
          </div>
          
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 70, left: 90 }}>
              <defs>
                {/* Gradient definitions for bubbles */}
                {quadrants.map((q, idx) => (
                  <radialGradient key={`gradient-${idx}`} id={`bubble-gradient-${q.key}`}>
                    <stop offset="0%" stopColor={q.color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={q.color} stopOpacity={0.4} />
                  </radialGradient>
                ))}
                {/* Drop shadow filter */}
                <filter id="bubble-shadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15"/>
                </filter>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb"
                strokeOpacity={0.5}
              />
              
              <XAxis 
                type="number" 
                dataKey="x" 
                domain={[0, Math.max(50, Math.ceil((thresholds?.gp || 25) * 2))]}
                tickFormatter={(value) => `${value}%`}
                label={{ 
                  value: 'Gross Profit Margin (%)', 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { 
                    fontSize: 14, 
                    fontWeight: 600, 
                    fill: '#4b5563',
                    textAnchor: 'middle'
                  }
                }}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              
              <YAxis 
                type="number" 
                dataKey="y" 
                domain={[0, dataMax => Math.ceil(dataMax * 1.1)]}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                label={{ 
                  value: 'Monthly Revenue (SAR)', 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: 20,
                  style: { 
                    fontSize: 14, 
                    fontWeight: 600, 
                    fill: '#4b5563',
                    textAnchor: 'middle'
                  }
                }}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ strokeDasharray: '3 3' }}
              />
              
              {/* Threshold reference lines */}
              <ReferenceLine 
                x={thresholds?.gp || 25} 
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{
                  value: `GP: ${(thresholds?.gp || 25).toFixed(0)}%`,
                  position: 'top',
                  fill: '#6b7280',
                  fontSize: 11,
                  fontWeight: 600
                }}
              />
              <ReferenceLine 
                y={thresholds?.revenue || 250000} 
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{
                  value: `Revenue: ${((thresholds?.revenue || 250000) / 1000).toFixed(0)}K`,
                  position: 'right',
                  fill: '#6b7280',
                  fontSize: 11,
                  fontWeight: 600
                }}
              />
              
              {/* Scatter plot */}
              <Scatter 
                name="Opportunities" 
                data={scatterData}
                fill="#8884d8"
              >
                {scatterData.map((entry, index) => {
                  const quadrantIndex = getPointQuadrant(entry)
                  const quadrant = quadrants[quadrantIndex]
                  const isHovered = hoveredPoint === index
                  
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#bubble-gradient-${quadrant.key})`}
                      stroke={quadrant.color}
                      strokeWidth={isHovered ? 3 : 2}
                      style={{
                        filter: 'url(#bubble-shadow)',
                        cursor: 'pointer',
                        opacity: isHovered ? 1 : 0.8,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={() => setHoveredPoint(index)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  )
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          
          {/* Quadrant labels */}
          <div className="absolute top-8 left-24 px-3 py-1.5 bg-blue-600/10 backdrop-blur-sm rounded-lg border border-blue-600/20">
            <p className="text-sm font-semibold text-blue-700">{quadrants[2].name}</p>
          </div>
          <div className="absolute top-8 right-12 px-3 py-1.5 bg-green-600/10 backdrop-blur-sm rounded-lg border border-green-600/20">
            <p className="text-sm font-semibold text-green-700">{quadrants[0].name}</p>
          </div>
          <div className="absolute bottom-28 left-24 px-3 py-1.5 bg-red-600/10 backdrop-blur-sm rounded-lg border border-red-600/20">
            <p className="text-sm font-semibold text-red-700">{quadrants[3].name}</p>
          </div>
          <div className="absolute bottom-28 right-12 px-3 py-1.5 bg-yellow-600/10 backdrop-blur-sm rounded-lg border border-yellow-600/20">
            <p className="text-sm font-semibold text-yellow-700">{quadrants[1].name}</p>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary"></div>
            <span className="text-gray-600">Bubble size represents annual revenue potential</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0 border-t-2 border-dashed border-gray-400"></div>
            <span className="text-gray-600">Threshold lines</span>
          </div>
        </div>
      </div>
      
      {/* Quadrant Analysis Cards */}
      <div className="grid grid-cols-2 gap-4">
        {quadrants.map((quadrant, idx) => {
          const Icon = quadrant.icon
          const quadrantData = matrixData.matrix?.[quadrant.key] || []
          const stats = statistics?.quadrants?.[quadrant.key] || {}
          
          return (
            <button
              key={quadrant.key}
              onClick={() => setSelectedQuadrant(selectedQuadrant === quadrant.key ? null : quadrant.key)}
              className={`
                bg-white rounded-lg shadow-sm p-6 text-left transition-all
                border-2 hover:shadow-lg
                ${selectedQuadrant === quadrant.key 
                  ? 'border-primary shadow-lg' 
                  : 'border-transparent hover:border-gray-200'
                }
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900">{quadrant.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{quadrant.description}</p>
                </div>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center ml-4"
                  style={{ backgroundColor: quadrant.bgColor }}
                >
                  <Icon className="w-6 h-6" style={{ color: quadrant.color }} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Opportunities</p>
                  <p className="text-2xl font-bold text-gray-900">{quadrantData.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.percentOfTotal?.toFixed(0) || 0}% of total
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg GP%</p>
                  <p className="text-2xl font-bold" style={{ color: quadrant.color }}>
                    {((stats.averageGP || 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">Monthly Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.monthlyRevenue || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(stats.annualRevenue || 0)} annually
                </p>
              </div>
              
              {selectedQuadrant === quadrant.key && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <h5 className="text-sm font-semibold text-gray-700">Strategic Actions:</h5>
                  {quadrant.actions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-xs mt-0.5" style={{ color: quadrant.color }}>•</span>
                      <span className="text-sm text-gray-600">{action}</span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Detailed Table for Selected Quadrant */}
      {selectedQuadrant && matrixData.matrix?.[selectedQuadrant]?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h4 className="text-lg font-bold text-gray-900">
              {quadrants.find(q => q.key === selectedQuadrant)?.name} - Detailed Opportunities
            </h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Monthly Revenue
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    GP%
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Annual Potential
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {matrixData.matrix[selectedQuadrant].map((opp, idx) => {
                  const quadrant = quadrants.find(q => q.key === selectedQuadrant)
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: quadrant?.color }}
                          ></div>
                          <span className="font-medium text-gray-900">{opp.project}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">{opp.service}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{opp.location || '-'}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {opp.status || 'No Status'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(opp.revenue)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span 
                          className="inline-flex px-3 py-1 text-sm font-bold rounded-full"
                          style={{ 
                            backgroundColor: quadrant?.bgColor,
                            color: quadrant?.color
                          }}
                        >
                          {(opp.gp_percent * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right font-bold text-primary">
                        {formatCurrency(opp.annual_revenue)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default OpportunityMatrix