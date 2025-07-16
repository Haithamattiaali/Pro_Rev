import React, { useMemo } from 'react'
import { 
  ComposedChart, 
  Bar, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine,
  ReferenceArea
} from 'recharts'
import { formatCurrency } from '../../utils/formatters'

const EnhancedForecastChart = ({ data, showConfidenceBands = true, confidenceLevel = 95 }) => {
  // Process data to combine historical and forecast
  const chartData = useMemo(() => {
    if (!data) return []
    
    const processed = []
    
    // Add historical data
    if (data.historical) {
      data.historical.forEach(item => {
        processed.push({
          period: item.month,
          actual: item.revenue,
          type: 'historical'
        })
      })
    }
    
    // Add forecast data with confidence bands
    if (data.forecast) {
      data.forecast.forEach(item => {
        const forecastPoint = {
          period: item.month,
          forecast: item.total || (item.base + item.opportunities),
          baseline: item.base,
          opportunities: item.opportunities,
          type: 'forecast'
        }
        
        // Calculate confidence bands (simplified - in production, this would come from the backend)
        if (showConfidenceBands && item.base) {
          const margin = item.base * ((100 - confidenceLevel) / 100)
          forecastPoint.lowerBound = Math.max(0, item.total - margin)
          forecastPoint.upperBound = item.total + margin
        }
        
        processed.push(forecastPoint)
      })
    }
    
    return processed
  }, [data, showConfidenceBands, confidenceLevel])

  // Find the transition point between historical and forecast
  const transitionIndex = chartData.findIndex(d => d.type === 'forecast')

  // Color scheme aligned with brand
  const COLORS = {
    historical: '#9e1f63', // Brand primary
    forecast: '#14b8a6', // Teal for forecast
    baseline: '#86efac', // Light green for baseline
    opportunities: '#fbbf24', // Amber for opportunities
    confidence: '#e2e1e6', // Light gray for confidence bands
    separator: '#ef4444' // Red for today marker
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      const isHistorical = data?.type === 'historical'
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <p className="text-xs text-gray-500 mb-2">
            {isHistorical ? 'Historical Data' : 'Forecast'}
          </p>
          
          {isHistorical ? (
            <p className="text-sm">
              <span className="font-medium">Actual Revenue:</span>{' '}
              <span className="text-primary font-semibold">
                {formatCurrency(data.actual)}
              </span>
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">Total Forecast:</span>{' '}
                <span className="text-primary font-semibold">
                  {formatCurrency(data.forecast)}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Baseline:</span>{' '}
                {formatCurrency(data.baseline)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Opportunities:</span>{' '}
                {formatCurrency(data.opportunities)}
              </p>
              {showConfidenceBands && data.lowerBound && (
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <p className="text-xs text-gray-500">
                    {confidenceLevel}% Confidence Interval:
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatCurrency(data.lowerBound)} - {formatCurrency(data.upperBound)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Custom legend
  const renderLegend = () => (
    <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
      <div className="flex items-center">
        <div className="w-4 h-4 mr-2" style={{ backgroundColor: COLORS.historical }}></div>
        <span>Historical Revenue</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 mr-2" style={{ backgroundColor: COLORS.baseline }}></div>
        <span>Baseline Forecast</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 mr-2" style={{ backgroundColor: COLORS.opportunities }}></div>
        <span>Opportunities</span>
      </div>
      {showConfidenceBands && (
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2 opacity-40" style={{ backgroundColor: COLORS.forecast }}></div>
          <span>{confidenceLevel}% Confidence Band</span>
        </div>
      )}
    </div>
  )

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Revenue Forecast Analysis</h2>
          <p className="text-sm text-gray-500 mt-1">
            Historical performance and projected revenue with {confidenceLevel}% confidence intervals
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            Actual
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            Projected
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            {/* Gradient for confidence bands */}
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.forecast} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.forecast} stopOpacity={0.1}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          <XAxis 
            dataKey="period" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          
          <Tooltip content={<CustomTooltip />} />

          {/* Confidence bands (area) - render first so it's in the background */}
          {showConfidenceBands && (
            <Area
              type="monotone"
              dataKey="upperBound"
              stackId="confidence"
              stroke="none"
              fill="url(#confidenceGradient)"
              fillOpacity={1}
            />
          )}

          {/* Historical data as bars */}
          <Bar 
            dataKey="actual" 
            fill={COLORS.historical}
            radius={[4, 4, 0, 0]}
          />

          {/* Today separator */}
          {transitionIndex > 0 && (
            <ReferenceLine 
              x={chartData[transitionIndex - 1]?.period}
              stroke={COLORS.separator}
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "Today",
                position: "top",
                fill: COLORS.separator,
                fontSize: 12,
                fontWeight: 600
              }}
            />
          )}

          {/* Forecast components as stacked bars */}
          <Bar 
            dataKey="baseline" 
            stackId="forecast" 
            fill={COLORS.baseline}
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="opportunities" 
            stackId="forecast" 
            fill={COLORS.opportunities}
            radius={[4, 4, 0, 0]}
          />

          {/* Total forecast line */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke={COLORS.forecast}
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ fill: COLORS.forecast, r: 4 }}
            activeDot={{ r: 6 }}
          />

          {/* Lower confidence bound (if showing bands) */}
          {showConfidenceBands && (
            <Line
              type="monotone"
              dataKey="lowerBound"
              stroke={COLORS.forecast}
              strokeWidth={1}
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {renderLegend()}

      {/* Additional insights */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Average Historical</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatCurrency(
              chartData
                .filter(d => d.type === 'historical' && d.actual)
                .reduce((sum, d) => sum + d.actual, 0) / 
              Math.max(1, chartData.filter(d => d.type === 'historical').length)
            )}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Average Forecast</p>
          <p className="text-lg font-semibold text-green-900 mt-1">
            {formatCurrency(
              chartData
                .filter(d => d.type === 'forecast' && d.forecast)
                .reduce((sum, d) => sum + d.forecast, 0) / 
              Math.max(1, chartData.filter(d => d.type === 'forecast').length)
            )}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Growth Potential</p>
          <p className="text-lg font-semibold text-blue-900 mt-1">
            {(() => {
              const avgHistorical = chartData
                .filter(d => d.type === 'historical' && d.actual)
                .reduce((sum, d) => sum + d.actual, 0) / 
                Math.max(1, chartData.filter(d => d.type === 'historical').length)
              const avgForecast = chartData
                .filter(d => d.type === 'forecast' && d.forecast)
                .reduce((sum, d) => sum + d.forecast, 0) / 
                Math.max(1, chartData.filter(d => d.type === 'forecast').length)
              const growth = avgHistorical > 0 ? ((avgForecast - avgHistorical) / avgHistorical) * 100 : 0
              return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`
            })()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default EnhancedForecastChart