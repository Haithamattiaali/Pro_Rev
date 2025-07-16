import React, { useMemo } from 'react'
import { 
  AreaChart, 
  Area,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { formatCurrency } from '../../utils/formatters'

const ParallelPeriodChart = ({ data, showConfidenceBands = true }) => {
  // Process data to align historical and forecast periods
  const chartData = useMemo(() => {
    if (!data) return []
    
    const processed = []
    const historicalData = data.historical || []
    const forecastData = data.forecast || []
    
    // Get max length to ensure both series are aligned
    const maxLength = Math.max(historicalData.length, forecastData.length)
    
    for (let i = 0; i < maxLength; i++) {
      const point = {
        index: i + 1,
        month: `Month ${i + 1}`
      }
      
      // Add historical data if available
      if (i < historicalData.length) {
        point.historical = historicalData[i].revenue
        point.historicalMonth = historicalData[i].month
      }
      
      // Add forecast data if available
      if (i < forecastData.length) {
        const forecast = forecastData[i]
        point.forecast = forecast.total || (forecast.base + forecast.opportunities)
        point.baseline = forecast.base
        point.opportunities = forecast.opportunities
        point.forecastMonth = forecast.month
        
        // Add confidence bands
        if (showConfidenceBands) {
          const margin = point.forecast * 0.1 // 10% margin for 90% confidence
          point.lowerBound = Math.max(0, point.forecast - margin)
          point.upperBound = point.forecast + margin
        }
      }
      
      processed.push(point)
    }
    
    return processed
  }, [data, showConfidenceBands])

  // Calculate statistics
  const stats = useMemo(() => {
    const historicalAvg = chartData
      .filter(d => d.historical)
      .reduce((sum, d) => sum + d.historical, 0) / Math.max(1, chartData.filter(d => d.historical).length)
    
    const forecastAvg = chartData
      .filter(d => d.forecast)
      .reduce((sum, d) => sum + d.forecast, 0) / Math.max(1, chartData.filter(d => d.forecast).length)
    
    const growth = historicalAvg > 0 ? ((forecastAvg - historicalAvg) / historicalAvg) * 100 : 0
    
    return { historicalAvg, forecastAvg, growth }
  }, [chartData])

  // Color scheme
  const COLORS = {
    historical: '#9e1f63', // Brand primary
    forecast: '#14b8a6', // Teal
    baseline: '#86efac', // Light green
    opportunities: '#fbbf24', // Amber
    confidence: '#14b8a6', // Teal with opacity
    grid: '#e5e7eb'
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          
          {data.historical && (
            <div className="mb-2">
              <p className="text-xs text-gray-500">Historical ({data.historicalMonth})</p>
              <p className="text-sm font-semibold" style={{ color: COLORS.historical }}>
                {formatCurrency(data.historical)}
              </p>
            </div>
          )}
          
          {data.forecast && (
            <div>
              <p className="text-xs text-gray-500">Forecast ({data.forecastMonth})</p>
              <p className="text-sm font-semibold" style={{ color: COLORS.forecast }}>
                {formatCurrency(data.forecast)}
              </p>
              <div className="text-xs text-gray-600 mt-1">
                <p>Baseline: {formatCurrency(data.baseline)}</p>
                <p>Opportunities: {formatCurrency(data.opportunities)}</p>
              </div>
              {showConfidenceBands && data.lowerBound && (
                <p className="text-xs text-gray-500 mt-1">
                  Range: {formatCurrency(data.lowerBound)} - {formatCurrency(data.upperBound)}
                </p>
              )}
            </div>
          )}
          
          {data.historical && data.forecast && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Difference: {data.forecast > data.historical ? '+' : ''}
                {formatCurrency(data.forecast - data.historical)} 
                ({data.forecast > data.historical ? '+' : ''}
                {((data.forecast - data.historical) / data.historical * 100).toFixed(1)}%)
              </p>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Parallel Period Comparison</h2>
        <p className="text-sm text-gray-500 mt-1">
          Historical vs Forecast revenue trends aligned by period
        </p>
      </div>

      <ResponsiveContainer width="100%" height={450}>
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            {/* Gradient for historical area */}
            <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.historical} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={COLORS.historical} stopOpacity={0.1}/>
            </linearGradient>
            
            {/* Gradient for forecast area */}
            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.forecast} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={COLORS.forecast} stopOpacity={0.1}/>
            </linearGradient>
            
            {/* Gradient for confidence bands */}
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.confidence} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={COLORS.confidence} stopOpacity={0.05}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          
          <Tooltip content={<CustomTooltip />} />

          {/* Confidence band area (background) */}
          {showConfidenceBands && (
            <>
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="url(#confidenceGradient)"
                fillOpacity={1}
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
              />
            </>
          )}

          {/* Historical revenue area */}
          <Area
            type="monotone"
            dataKey="historical"
            stroke={COLORS.historical}
            strokeWidth={3}
            fill="url(#historicalGradient)"
            fillOpacity={1}
            dot={{ fill: COLORS.historical, r: 4 }}
            activeDot={{ r: 6 }}
          />

          {/* Forecast revenue area */}
          <Area
            type="monotone"
            dataKey="forecast"
            stroke={COLORS.forecast}
            strokeWidth={3}
            fill="url(#forecastGradient)"
            fillOpacity={1}
            dot={{ fill: COLORS.forecast, r: 4 }}
            activeDot={{ r: 6 }}
          />

          {/* Average reference lines */}
          <ReferenceLine 
            y={stats.historicalAvg} 
            stroke={COLORS.historical}
            strokeDasharray="5 5"
            strokeWidth={1}
            strokeOpacity={0.7}
            label={{
              value: `Historical Avg: ${formatCurrency(stats.historicalAvg)}`,
              position: "left",
              fill: COLORS.historical,
              fontSize: 11
            }}
          />
          
          <ReferenceLine 
            y={stats.forecastAvg} 
            stroke={COLORS.forecast}
            strokeDasharray="5 5"
            strokeWidth={1}
            strokeOpacity={0.7}
            label={{
              value: `Forecast Avg: ${formatCurrency(stats.forecastAvg)}`,
              position: "right",
              fill: COLORS.forecast,
              fontSize: 11
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2 rounded" style={{ backgroundColor: COLORS.historical }}></div>
          <span>Historical Revenue</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2 rounded" style={{ backgroundColor: COLORS.forecast }}></div>
          <span>Forecast Revenue</span>
        </div>
        {showConfidenceBands && (
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 rounded opacity-30" style={{ backgroundColor: COLORS.confidence }}></div>
            <span>90% Confidence Band</span>
          </div>
        )}
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Historical Average</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatCurrency(stats.historicalAvg)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Forecast Average</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatCurrency(stats.forecastAvg)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Average Growth</p>
          <p className={`text-lg font-semibold mt-1 ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Growth Value</p>
          <p className={`text-lg font-semibold mt-1 ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.growth >= 0 ? '+' : ''}{formatCurrency(stats.forecastAvg - stats.historicalAvg)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ParallelPeriodChart