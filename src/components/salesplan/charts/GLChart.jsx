import React, { useMemo } from 'react'
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
  LabelList,
  Legend
} from 'recharts'
import { formatCurrency } from '../../../utils/formatters'

const GLChart = ({ data }) => {
  // Process and sort data
  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) return []
    
    return [...data.data]
      .sort((a, b) => b.total - a.total)
      .map(item => ({
        name: item.gl,
        baseline: item.baseline_forecast || 0,
        opportunities: item.opportunity_value || 0,
        total: item.total || 0,
        service: item.service_type
      }))
  }, [data])
  
  // Custom label renderer for totals
  const renderTotalLabel = (props) => {
    const { x, y, width, value } = props
    if (!value) return null
    
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
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      const baselinePercent = ((data.baseline / data.total) * 100).toFixed(1)
      const opportunitiesPercent = ((data.opportunities / data.total) * 100).toFixed(1)
      
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20">
          <p className="font-semibold text-gray-900 text-sm mb-3">{data.name}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-gray-600">Service Type:</span>
              <span className="font-medium">{data.service}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ 
                    backgroundColor: data.service === 'Transportation' ? '#005b8c' : '#e05e3d',
                    opacity: 1
                  }}></div>
                  <span className="text-gray-600">Baseline:</span>
                </div>
                <span className="font-medium">{formatCurrency(data.baseline)} ({baselinePercent}%)</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs mt-1">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ 
                    backgroundColor: data.service === 'Transportation' ? '#005b8c' : '#e05e3d',
                    opacity: 0.5
                  }}></div>
                  <span className="text-gray-600">Opportunities:</span>
                </div>
                <span className="font-medium">{formatCurrency(data.opportunities)} ({opportunitiesPercent}%)</span>
              </div>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="flex justify-between gap-4 text-sm">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-primary">{formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }
  
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
        <p className="text-gray-500 text-lg">No GL data available for the selected period</p>
      </div>
    )
  }
  
  return (
    <div className="w-full">
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Chart Container - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-gray-50/50 to-white rounded-xl p-4 shadow-sm h-full">
            <ResponsiveContainer width="100%" height={Math.max(500, chartData.length * 100)}>
              <BarChart 
                data={chartData}
                margin={{ top: 40, right: 30, left: 20, bottom: 80 }}
                barGap={15}
                barCategoryGap="20%"
              >
                {/* Pattern definitions for opportunities */}
                <defs>
                  <pattern id="diagonalHatch-transport" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M0,4 l4,-4 M-1,1 l2,-2 M3,5 l2,-2" stroke="#005b8c" strokeWidth="0.5" opacity="0.3"/>
                  </pattern>
                  <pattern id="diagonalHatch-warehouse" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M0,4 l4,-4 M-1,1 l2,-2 M3,5 l2,-2" stroke="#e05e3d" strokeWidth="0.5" opacity="0.3"/>
                  </pattern>
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
                
                {/* Grid with subtle styling */}
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e5e7eb" 
                  strokeOpacity={0.5}
                  vertical={false}
                />
                
                {/* X-axis (GL names) */}
                <XAxis 
                  dataKey="name"
                  tick={{ fill: '#374151', fontSize: 12 }}
                  angle={-30}
                  textAnchor="end"
                  height={70}
                  interval={0}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                
                {/* Y-axis (values) */}
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                
                {/* Tooltip */}
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(158, 31, 99, 0.03)' }}
                  animationDuration={200}
                />
                
                {/* Baseline Bar (bottom) */}
                <Bar 
                  dataKey="baseline"
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={80}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`baseline-${index}`} 
                      fill={entry.service === 'Transportation' ? 'url(#transportGradient)' : 'url(#warehouseGradient)'} 
                    />
                  ))}
                </Bar>
                
                {/* Opportunities Bar (top) */}
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
                  <LabelList dataKey="total" position="top" content={renderTotalLabel} />
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`opportunities-${index}`} 
                      fill={entry.service === 'Transportation' ? 'url(#transportGradientLight)' : 'url(#warehouseGradientLight)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Legend below chart */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#005b8c' }}></div>
                  <span className="text-xs font-medium text-gray-700">Transportation - Baseline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#005b8c', opacity: 0.5 }}></div>
                  <span className="text-xs font-medium text-gray-700">Transportation - Opportunities</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
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
          </div>
        </div>
        
        {/* Summary Cards - Takes 1 column on large screens */}
        <div className="lg:col-span-1 mt-6 lg:mt-0">
          <SummaryCards data={chartData} />
        </div>
      </div>
    </div>
  )
}

// Enhanced Summary Cards Component with Breakdown
const SummaryCards = ({ data }) => {
  // Calculate totals with breakdown
  const transportationBaseline = data
    .filter(item => item.service === 'Transportation')
    .reduce((sum, item) => sum + item.baseline, 0)
    
  const transportationOpportunities = data
    .filter(item => item.service === 'Transportation')
    .reduce((sum, item) => sum + item.opportunities, 0)
    
  const warehousingBaseline = data
    .filter(item => item.service === 'Warehousing')
    .reduce((sum, item) => sum + item.baseline, 0)
    
  const warehousingOpportunities = data
    .filter(item => item.service === 'Warehousing')
    .reduce((sum, item) => sum + item.opportunities, 0)
    
  const transportationTotal = transportationBaseline + transportationOpportunities
  const warehousingTotal = warehousingBaseline + warehousingOpportunities
  const grandTotal = transportationTotal + warehousingTotal
  const totalBaseline = transportationBaseline + warehousingBaseline
  const totalOpportunities = transportationOpportunities + warehousingOpportunities
  
  const summaryData = [
    {
      title: 'Transportation',
      total: transportationTotal,
      baseline: transportationBaseline,
      opportunities: transportationOpportunities,
      color: '#005b8c',
      gradient: 'from-blue-500 to-blue-700',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      )
    },
    {
      title: 'Warehousing',
      total: warehousingTotal,
      baseline: warehousingBaseline,
      opportunities: warehousingOpportunities,
      color: '#e05e3d',
      gradient: 'from-orange-500 to-red-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: 'Total Revenue',
      total: grandTotal,
      baseline: totalBaseline,
      opportunities: totalOpportunities,
      color: '#9e1f63',
      gradient: 'from-pink-600 to-purple-700',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ]
  
  return (
    <div className="grid grid-cols-1 gap-4 h-full">
      {summaryData.map((item, index) => {
        const baselinePercent = ((item.baseline / item.total) * 100).toFixed(1)
        const opportunitiesPercent = ((item.opportunities / item.total) * 100).toFixed(1)
        
        return (
          <div
            key={index}
            className="relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-5`}></div>
            
            {/* Glass Morphism Effect */}
            <div className="relative backdrop-blur-sm bg-white/90 p-5">
              {/* Icon and Title */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {((item.total / grandTotal) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div 
                  className="p-2.5 rounded-lg text-white shadow-md"
                  style={{ 
                    background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}99 100%)`,
                  }}
                >
                  {item.icon}
                </div>
              </div>
              
              {/* Value Display with Breakdown */}
              <div className="mt-3">
                <p className="text-2xl font-bold" style={{ color: item.color }}>
                  {formatCurrency(item.total)}
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Baseline:</span>
                    <span className="font-medium">{formatCurrency(item.baseline)} ({baselinePercent}%)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Opportunities:</span>
                    <span className="font-medium">{formatCurrency(item.opportunities)} ({opportunitiesPercent}%)</span>
                  </div>
                </div>
              </div>
              
              {/* Stacked Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                  <div 
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${baselinePercent}%`,
                      background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}dd 100%)`,
                    }}
                  ></div>
                  <div 
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${opportunitiesPercent}%`,
                      background: `linear-gradient(90deg, ${item.color}88 0%, ${item.color}55 100%)`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Decorative Corner */}
            <div 
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10"
              style={{ backgroundColor: item.color }}
            ></div>
          </div>
        )
      })}
    </div>
  )
}

export default GLChart