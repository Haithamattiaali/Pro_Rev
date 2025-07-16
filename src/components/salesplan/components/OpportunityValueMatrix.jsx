import React, { useState, useMemo } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { TrendingUp, DollarSign, Target, AlertCircle, Package } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'

const OpportunityValueMatrix = ({ opportunities }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [selectedQuadrant, setSelectedQuadrant] = useState(null)

  // Process opportunities data for the matrix
  const matrixData = useMemo(() => {
    if (!opportunities?.data) return { points: [], quadrants: {} }

    // Filter out opportunities with invalid data
    const validOpportunities = opportunities.data.filter(opp => 
      opp.est_monthly_revenue > 0 && 
      opp.est_gp_percent >= 0 && 
      opp.est_gp_percent <= 1
    )

    // Calculate thresholds (using medians for better distribution)
    const revenues = validOpportunities.map(o => o.est_monthly_revenue).sort((a, b) => a - b)
    const gpPercents = validOpportunities.map(o => o.est_gp_percent).sort((a, b) => a - b)
    
    const revenueThreshold = revenues[Math.floor(revenues.length / 2)] || 100000
    const gpThreshold = gpPercents[Math.floor(gpPercents.length / 2)] || 0.25

    // Process points for scatter plot
    const points = validOpportunities.map((opp, idx) => ({
      id: idx,
      x: opp.est_gp_percent * 100, // Convert to percentage
      y: opp.est_monthly_revenue,
      project: opp.project,
      service: opp.service,
      location: opp.location || 'N/A',
      status: opp.status || 'No Status',
      annualValue: opp.est_monthly_revenue * 12,
      // Bubble size based on annual value (scaled)
      size: Math.max(20, Math.min(80, (opp.est_monthly_revenue * 12) / 5000000 * 80))
    }))

    // Categorize into quadrants
    const quadrants = {
      strategicWins: [],
      volumePlays: [],
      quickWins: [],
      review: []
    }

    validOpportunities.forEach((opp, idx) => {
      const point = points[idx]
      if (opp.est_monthly_revenue >= revenueThreshold && opp.est_gp_percent >= gpThreshold) {
        quadrants.strategicWins.push({ ...opp, point })
      } else if (opp.est_monthly_revenue >= revenueThreshold && opp.est_gp_percent < gpThreshold) {
        quadrants.volumePlays.push({ ...opp, point })
      } else if (opp.est_monthly_revenue < revenueThreshold && opp.est_gp_percent >= gpThreshold) {
        quadrants.quickWins.push({ ...opp, point })
      } else {
        quadrants.review.push({ ...opp, point })
      }
    })

    return {
      points,
      quadrants,
      thresholds: {
        revenue: revenueThreshold,
        gp: gpThreshold * 100
      }
    }
  }, [opportunities])

  // Quadrant definitions
  const quadrantInfo = [
    {
      key: 'strategicWins',
      name: 'Strategic Wins',
      description: 'High revenue & high margin opportunities',
      color: '#10b981',
      bgColor: '#10b98120',
      icon: TrendingUp,
      recommendations: [
        'Prioritize resources and executive attention',
        'Develop long-term partnerships',
        'Consider service expansion opportunities'
      ]
    },
    {
      key: 'volumePlays',
      name: 'Volume Plays',
      description: 'High revenue but needs margin improvement',
      color: '#f59e0b',
      bgColor: '#f59e0b20',
      icon: Package,
      recommendations: [
        'Optimize operational efficiency',
        'Negotiate better supplier terms',
        'Consider automation opportunities'
      ]
    },
    {
      key: 'quickWins',
      name: 'Quick Wins',
      description: 'Lower revenue but excellent margins',
      color: '#3b82f6',
      bgColor: '#3b82f620',
      icon: Target,
      recommendations: [
        'Fast-track implementation',
        'Use as references for similar clients',
        'Bundle services to increase revenue'
      ]
    },
    {
      key: 'review',
      name: 'Review & Optimize',
      description: 'Opportunities needing strategic review',
      color: '#ef4444',
      bgColor: '#ef444420',
      icon: AlertCircle,
      recommendations: [
        'Evaluate strategic fit',
        'Consider restructuring or repricing',
        'Assess resource allocation'
      ]
    }
  ]

  // Get color for a point based on its quadrant
  const getPointColor = (point) => {
    const { revenue: revThreshold, gp: gpThreshold } = matrixData.thresholds
    
    if (point.y >= revThreshold && point.x >= gpThreshold) {
      return quadrantInfo[0].color // Strategic Wins
    } else if (point.y >= revThreshold && point.x < gpThreshold) {
      return quadrantInfo[1].color // Volume Plays
    } else if (point.y < revThreshold && point.x >= gpThreshold) {
      return quadrantInfo[2].color // Quick Wins
    } else {
      return quadrantInfo[3].color // Review
    }
  }

  // Get service type color/style
  const getServiceStyle = (service) => {
    if (service?.includes('3PL')) return { strokeWidth: 3, strokeDasharray: '5 3' }
    return { strokeWidth: 2 }
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      const color = getPointColor(data)
      
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-gray-200 min-w-[280px]">
          <h4 className="font-bold text-gray-900 mb-2">{data.project}</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">{data.service}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{data.location}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status:</span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                {data.status}
              </span>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monthly Revenue:</span>
                <span className="font-bold">{formatCurrency(data.y)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Annual Potential:</span>
                <span className="font-bold text-primary">{formatCurrency(data.annualValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Gross Profit:</span>
                <span className="font-bold" style={{ color }}>
                  {data.x.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (!opportunities?.data || opportunities.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No opportunities data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Matrix Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Opportunity Value Matrix</h3>
          <p className="text-sm text-gray-600">
            Strategic positioning based on revenue potential and gross profit margins
          </p>
        </div>

        {/* Scatter Plot */}
        <div className="relative">
          {/* Quadrant backgrounds */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
            <div className="bg-blue-50 opacity-30"></div>
            <div className="bg-green-50 opacity-30"></div>
            <div className="bg-red-50 opacity-30"></div>
            <div className="bg-yellow-50 opacity-30"></div>
          </div>

          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 80 }}>
              <defs>
                {/* Gradient definitions */}
                {quadrantInfo.map(q => (
                  <radialGradient key={q.key} id={`gradient-${q.key}`}>
                    <stop offset="0%" stopColor={q.color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={q.color} stopOpacity={0.4} />
                  </radialGradient>
                ))}
                {/* Shadow filter */}
                <filter id="shadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                </filter>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              
              <XAxis 
                type="number" 
                dataKey="x" 
                domain={[0, 50]}
                tickFormatter={(value) => `${value}%`}
                label={{ 
                  value: 'Gross Profit Margin (%)', 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { fontSize: 14, fontWeight: 600, fill: '#6b7280' }
                }}
              />
              
              <YAxis 
                type="number" 
                dataKey="y" 
                domain={[0, 'dataMax + 50000']}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                label={{ 
                  value: 'Monthly Revenue (SAR)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: 14, fontWeight: 600, fill: '#6b7280' }
                }}
              />
              
              <Tooltip content={<CustomTooltip />} cursor={false} />
              
              {/* Reference lines */}
              <ReferenceLine 
                x={matrixData.thresholds.gp} 
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <ReferenceLine 
                y={matrixData.thresholds.revenue} 
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              
              {/* Scatter points */}
              <Scatter 
                data={matrixData.points} 
                fill="#8884d8"
              >
                {matrixData.points.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#gradient-${getPointColor(entry) === '#10b981' ? 'strategicWins' : 
                           getPointColor(entry) === '#f59e0b' ? 'volumePlays' :
                           getPointColor(entry) === '#3b82f6' ? 'quickWins' : 'review'})`}
                    stroke={getPointColor(entry)}
                    {...getServiceStyle(entry.service)}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Quadrant labels */}
          <div className="absolute top-8 left-20 px-3 py-1 bg-blue-500/10 backdrop-blur-sm rounded border border-blue-500/20">
            <p className="text-sm font-semibold text-blue-700">Quick Wins</p>
          </div>
          <div className="absolute top-8 right-8 px-3 py-1 bg-green-500/10 backdrop-blur-sm rounded border border-green-500/20">
            <p className="text-sm font-semibold text-green-700">Strategic Wins</p>
          </div>
          <div className="absolute bottom-24 left-20 px-3 py-1 bg-red-500/10 backdrop-blur-sm rounded border border-red-500/20">
            <p className="text-sm font-semibold text-red-700">Review & Optimize</p>
          </div>
          <div className="absolute bottom-24 right-8 px-3 py-1 bg-yellow-500/10 backdrop-blur-sm rounded border border-yellow-500/20">
            <p className="text-sm font-semibold text-yellow-700">Volume Plays</p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary"></div>
            <span className="text-gray-600">2PL Services</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary border-2 border-dashed border-primary bg-transparent"></div>
            <span className="text-gray-600">3PL Services</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary"></div>
            <span className="text-gray-600">Bubble size = Annual value</span>
          </div>
        </div>
      </div>

      {/* Quadrant Analysis Cards */}
      <div className="grid grid-cols-2 gap-4">
        {quadrantInfo.map((quadrant) => {
          const Icon = quadrant.icon
          const opportunities = matrixData.quadrants[quadrant.key] || []
          const totalRevenue = opportunities.reduce((sum, opp) => sum + opp.est_monthly_revenue, 0)
          const avgGP = opportunities.length > 0 
            ? opportunities.reduce((sum, opp) => sum + opp.est_gp_percent, 0) / opportunities.length * 100
            : 0

          return (
            <div
              key={quadrant.key}
              className={`bg-white rounded-lg shadow-sm p-6 border-2 transition-all ${
                selectedQuadrant === quadrant.key 
                  ? 'border-primary shadow-lg' 
                  : 'border-transparent hover:border-gray-200'
              }`}
              onClick={() => setSelectedQuadrant(selectedQuadrant === quadrant.key ? null : quadrant.key)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{quadrant.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{quadrant.description}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center`} 
                     style={{ backgroundColor: quadrant.bgColor }}>
                  <Icon className="w-6 h-6" style={{ color: quadrant.color }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Count</p>
                  <p className="text-2xl font-bold text-gray-900">{opportunities.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg GP%</p>
                  <p className="text-2xl font-bold" style={{ color: quadrant.color }}>
                    {avgGP.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(totalRevenue).replace('SAR ', '')}
                  </p>
                </div>
              </div>

              {/* Action recommendations */}
              {selectedQuadrant === quadrant.key && (
                <div className="mt-4 pt-4 border-t">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Recommended Actions:</h5>
                  <ul className="space-y-1">
                    {quadrant.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Detailed Table for Selected Quadrant */}
      {selectedQuadrant && matrixData.quadrants[selectedQuadrant]?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">
            {quadrantInfo.find(q => q.key === selectedQuadrant)?.name} - Opportunities Detail
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Project</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Service</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Monthly Rev</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">GP%</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Annual Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {matrixData.quadrants[selectedQuadrant].map((opp, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{opp.project}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{opp.service}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{opp.location || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {opp.status || 'No Status'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium">
                      {formatCurrency(opp.est_monthly_revenue)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-bold" 
                        style={{ color: quadrantInfo.find(q => q.key === selectedQuadrant)?.color }}>
                      {(opp.est_gp_percent * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-bold text-primary">
                      {formatCurrency(opp.est_monthly_revenue * 12)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default OpportunityValueMatrix