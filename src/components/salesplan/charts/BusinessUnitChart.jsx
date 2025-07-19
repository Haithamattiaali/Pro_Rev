import React, { useMemo } from 'react'
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts'
import { TrendingUp, Package, Truck } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'

const BusinessUnitChart = ({ data }) => {
  // Process data
  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) return []
    
    return data.data.map(item => ({
      name: item.business_unit,
      baseline: item.baseline_forecast || 0,
      opportunities: item.opportunity_value || 0,
      total: item.total || 0,
      glCount: item.gl_count || 0,
      percentOfTotal: 0 // Will calculate after
    }))
  }, [data])
  
  // Calculate percentages and breakdowns
  const enrichedData = useMemo(() => {
    const grandTotal = chartData.reduce((sum, item) => sum + item.total, 0)
    return chartData.map(item => ({
      ...item,
      percentOfTotal: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
      baselinePercent: item.total > 0 ? (item.baseline / item.total) * 100 : 0,
      opportunitiesPercent: item.total > 0 ? (item.opportunities / item.total) * 100 : 0
    }))
  }, [chartData])
  
  // Custom label renderer for totals
  const renderTotalLabel = (props) => {
    const { x, y, width, value } = props
    if (!value || value <= 0) return null
    
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#374151" 
        textAnchor="middle" 
        fontSize="12"
        fontWeight="600"
      >
        {value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : formatCurrency(value)}
      </text>
    )
  }
  
  
  // Enhanced tooltip with breakdown
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      const baselinePercent = data.baselinePercent?.toFixed(1) || '0.0'
      const opportunitiesPercent = data.opportunitiesPercent?.toFixed(1) || '0.0'
      
      const getIcon = () => {
        if (label === 'Transportation') return <Truck className="w-5 h-5" />
        if (label === 'Warehousing') return <Package className="w-5 h-5" />
        return <TrendingUp className="w-5 h-5" />
      }
      
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20">
          <div className="flex items-center gap-2 mb-3">
            {getIcon()}
            <p className="font-semibold text-gray-900">{label}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-8">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[label] || COLORS.Other }}></div>
                <span className="text-sm text-gray-600">Baseline:</span>
              </div>
              <span className="text-sm font-semibold">{formatCurrency(data.baseline)} ({baselinePercent}%)</span>
            </div>
            <div className="flex justify-between items-center gap-8">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[label] || COLORS.Other, opacity: 0.5 }}></div>
                <span className="text-sm text-gray-600">Opportunities:</span>
              </div>
              <span className="text-sm font-semibold">{formatCurrency(data.opportunities)} ({opportunitiesPercent}%)</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Total:</span>
                <span className="text-sm font-bold text-primary">{formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Share of Total:</span>
              <span className="font-semibold">{data.percentOfTotal.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GL Accounts:</span>
              <span className="font-semibold">{data.glCount}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }
  
  // Colors
  const COLORS = {
    Transportation: '#005b8c',
    Warehousing: '#e05e3d',
    Other: '#9e1f63'
  }
  
  if (!enrichedData || enrichedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No business unit data available for the selected period</p>
      </div>
    )
  }
  
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 300 : 400}>
        <BarChart 
          data={enrichedData}
          margin={{ top: 30, right: 30, left: 20, bottom: 40 }}
          barGap={8}
        >
          <defs>
            {/* Pattern definitions for opportunities */}
            <pattern id="diagonalHatch-transport-bu" patternUnits="userSpaceOnUse" width="4" height="4">
              <path d="M0,4 l4,-4 M-1,1 l2,-2 M3,5 l2,-2" stroke="#005b8c" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
            <pattern id="diagonalHatch-warehouse-bu" patternUnits="userSpaceOnUse" width="4" height="4">
              <path d="M0,4 l4,-4 M-1,1 l2,-2 M3,5 l2,-2" stroke="#e05e3d" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
            {/* Gradient definitions */}
            <linearGradient id="transportGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#005b8c" stopOpacity={1}/>
              <stop offset="100%" stopColor="#005b8c" stopOpacity={0.8}/>
            </linearGradient>
            <linearGradient id="warehouseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e05e3d" stopOpacity={1}/>
              <stop offset="100%" stopColor="#e05e3d" stopOpacity={0.8}/>
            </linearGradient>
            <linearGradient id="transportGradientLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#005b8c" stopOpacity={0.6}/>
              <stop offset="100%" stopColor="#005b8c" stopOpacity={0.4}/>
            </linearGradient>
            <linearGradient id="warehouseGradientLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e05e3d" stopOpacity={0.6}/>
              <stop offset="100%" stopColor="#e05e3d" stopOpacity={0.4}/>
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
            </filter>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e5e7eb" 
            strokeOpacity={0.5}
            vertical={false}
          />
          
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(158, 31, 99, 0.05)' }} />
          
          
          {/* Stacked bars - Baseline */}
          <Bar 
            dataKey="baseline" 
            stackId="a"
            radius={[0, 0, 0, 0]}
            maxBarSize={80}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {enrichedData.map((entry, index) => (
              <Cell key={`baseline-${index}`} fill={entry.name === 'Transportation' ? 'url(#transportGradient)' : 'url(#warehouseGradient)'} />
            ))}
          </Bar>
          
          {/* Stacked bars - Opportunities */}
          <Bar 
            dataKey="opportunities" 
            stackId="a"
            radius={[8, 8, 0, 0]}
            maxBarSize={80}
            filter="url(#shadow)"
            animationBegin={200}
            animationDuration={800}
            animationEasing="ease-out"
          >
            <LabelList 
              dataKey="total" 
              position="top" 
              content={renderTotalLabel}
            />
            {enrichedData.map((entry, index) => (
              <Cell key={`opportunities-${index}`} fill={entry.name === 'Transportation' ? 'url(#transportGradientLight)' : 'url(#warehouseGradientLight)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend below chart */}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#005b8c' }}></div>
            <span className="text-xs font-medium text-gray-700">Transportation - Baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#005b8c', opacity: 0.5 }}></div>
            <span className="text-xs font-medium text-gray-700">Transportation - Opportunities</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#e05e3d' }}></div>
            <span className="text-xs font-medium text-gray-700">Warehousing - Baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#e05e3d', opacity: 0.5 }}></div>
            <span className="text-xs font-medium text-gray-700">Warehousing - Opportunities</span>
          </div>
        </div>
      </div>
      
      {/* Enhanced Summary Stats with Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6">
        {enrichedData.map((item, index) => {
          const getIcon = () => {
            if (item.name === 'Transportation') return <Truck className="w-5 h-5" />
            if (item.name === 'Warehousing') return <Package className="w-5 h-5" />
            return <TrendingUp className="w-5 h-5" />
          }
          
          const baselinePercent = item.baselinePercent.toFixed(1)
          const opportunitiesPercent = item.opportunitiesPercent.toFixed(1)
          
          return (
            <div key={index} className="relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300">
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br opacity-5`} style={{
                background: `linear-gradient(135deg, ${COLORS[item.name]} 0%, ${COLORS[item.name]}99 100%)`
              }}></div>
              
              {/* Content */}
              <div className="relative backdrop-blur-sm bg-white/90 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.percentOfTotal.toFixed(1)}% of total revenue
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg text-white shadow-md" style={{ 
                    background: `linear-gradient(135deg, ${COLORS[item.name]} 0%, ${COLORS[item.name]}99 100%)`
                  }}>
                    {getIcon()}
                  </div>
                </div>
                
                {/* Total Value */}
                <p className="text-2xl font-bold mb-3" style={{ color: COLORS[item.name] }}>
                  {formatCurrency(item.total)}
                </p>
                
                {/* Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Baseline:</span>
                    <span className="font-medium">{formatCurrency(item.baseline)} ({baselinePercent}%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Opportunities:</span>
                    <span className="font-medium">{formatCurrency(item.opportunities)} ({opportunitiesPercent}%)</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="h-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${baselinePercent}%`,
                        backgroundColor: COLORS[item.name]
                      }}
                    ></div>
                    <div 
                      className="h-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${opportunitiesPercent}%`,
                        backgroundColor: COLORS[item.name],
                        opacity: 0.5
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* GL Count */}
                <p className="text-xs text-gray-500 mt-3">
                  {item.glCount} GL Accounts
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BusinessUnitChart