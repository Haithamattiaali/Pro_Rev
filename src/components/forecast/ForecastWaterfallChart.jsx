import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

const ForecastWaterfallChart = ({ data }) => {
  // Process data for waterfall visualization
  const waterfallData = useMemo(() => {
    if (!data || !data.forecast) return []
    
    const processed = []
    let runningTotal = 0
    
    // Get last historical value as starting point
    const lastHistorical = data.historical?.[data.historical.length - 1]?.revenue || 0
    runningTotal = lastHistorical
    
    // Add starting point
    processed.push({
      name: 'Current Revenue',
      value: lastHistorical,
      fill: '#9e1f63', // Brand primary
      isTotal: true,
      displayValue: lastHistorical
    })
    
    // Add each forecast period as incremental change
    data.forecast.forEach((item, index) => {
      const periodValue = item.total || (item.base + item.opportunities)
      const change = index === 0 
        ? periodValue - lastHistorical 
        : periodValue - (data.forecast[index - 1]?.total || 0)
      
      processed.push({
        name: item.month,
        value: Math.abs(change),
        start: runningTotal,
        fill: change >= 0 ? '#10b981' : '#ef4444', // Green for positive, red for negative
        isPositive: change >= 0,
        displayValue: change
      })
      
      runningTotal += change
    })
    
    // Add final total
    processed.push({
      name: 'Forecast Total',
      value: runningTotal,
      fill: '#14b8a6', // Teal
      isTotal: true,
      displayValue: runningTotal
    })
    
    return processed
  }, [data])

  // Custom label formatter
  const renderCustomLabel = (props) => {
    const { x, y, width, height, value, displayValue, isTotal, isPositive } = props
    
    if (isTotal) {
      return (
        <text 
          x={x + width / 2} 
          y={y - 5} 
          fill="#1f2937" 
          textAnchor="middle" 
          fontSize="12" 
          fontWeight="600"
        >
          {formatCurrency(displayValue)}
        </text>
      )
    }
    
    const sign = isPositive ? '+' : '-'
    return (
      <text 
        x={x + width / 2} 
        y={y + height / 2} 
        fill="white" 
        textAnchor="middle" 
        fontSize="11" 
        fontWeight="500"
      >
        {sign}{formatCurrency(Math.abs(displayValue)).replace(/[^0-9.KM]/g, '')}
      </text>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 text-sm">{data.name}</p>
          {data.isTotal ? (
            <p className="text-sm mt-1">
              <span className="font-medium">Total:</span>{' '}
              <span className="font-semibold">{formatCurrency(data.displayValue)}</span>
            </p>
          ) : (
            <div className="text-sm mt-1">
              <p>
                <span className="font-medium">Change:</span>{' '}
                <span className={`font-semibold ${data.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {data.isPositive ? '+' : '-'}{formatCurrency(Math.abs(data.displayValue))}
                </span>
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Running total: {formatCurrency(data.start + (data.isPositive ? data.value : -data.value))}
              </p>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Custom shape for waterfall bars
  const WaterfallBar = (props) => {
    const { x, y, width, height, payload } = props
    
    if (payload.isTotal) {
      // Regular bar for totals
      return <rect x={x} y={y} width={width} height={height} fill={payload.fill} rx={4} />
    }
    
    // Floating bar for changes
    const barY = payload.isPositive ? y : y + height
    const barHeight = height
    
    return (
      <g>
        {/* Connection line */}
        <line
          x1={x - 2}
          y1={payload.start}
          x2={x + 2}
          y2={payload.start}
          stroke="#9ca3af"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
        {/* Bar */}
        <rect 
          x={x} 
          y={barY} 
          width={width} 
          height={barHeight} 
          fill={payload.fill} 
          fillOpacity={0.8}
          rx={2}
        />
      </g>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Revenue Waterfall Analysis</h3>
        <p className="text-sm text-gray-500 mt-1">
          Period-over-period revenue changes from current to forecast
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={waterfallData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6b7280', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          
          <Bar dataKey="value" shape={<WaterfallBar />}>
            <LabelList content={renderCustomLabel} position="top" />
            {waterfallData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Starting Point</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatCurrency(waterfallData[0]?.value || 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Change</p>
          <p className={`text-lg font-semibold mt-1 ${
            waterfallData.length > 2 ? 
              waterfallData[waterfallData.length - 1].value > waterfallData[0].value ? 'text-green-600' : 'text-red-600'
              : 'text-gray-900'
          }`}>
            {waterfallData.length > 2 ? (
              <>
                {waterfallData[waterfallData.length - 1].value > waterfallData[0].value ? '+' : '-'}
                {formatCurrency(Math.abs(waterfallData[waterfallData.length - 1].value - waterfallData[0].value))}
              </>
            ) : '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">End Point</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatCurrency(waterfallData[waterfallData.length - 1]?.value || 0)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForecastWaterfallChart