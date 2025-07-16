import React from 'react'
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, ReferenceLine } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

const ForecastChart = ({ data }) => {
  // Calculate where "today" falls in the data
  const todayIndex = data?.historical?.length || 0
  
  // Combine historical and forecast data
  const chartData = [
    ...(data?.historical || []).map(m => ({
      period: m.month,
      actual: m.revenue,
      type: 'historical'
    })),
    ...(data?.forecast || []).map(f => ({
      period: f.month,
      baseline: f.base,
      opportunities: f.opportunities,
      type: 'forecast'
    }))
  ]

  // Color scheme
  const COLORS = {
    historical: '#1e3a8a', // Dark blue
    baseline: '#86efac', // Light green
    opportunities: '#14b8a6', // Teal
    separator: '#ef4444' // Red for today marker
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isHistorical = payload[0]?.payload?.type === 'historical'
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-1">{label}</p>
          <p className="text-xs text-gray-500 mb-2">
            {isHistorical ? 'Historical Data' : 'Forecast'}
          </p>
          {payload.map((entry, index) => {
            if (entry.value !== undefined && entry.value !== null) {
              return (
                <p key={index} className="text-sm text-gray-700">
                  <span style={{ color: entry.color }}>{entry.name}:</span>{' '}
                  {formatCurrency(entry.value)}
                </p>
              )
            }
            return null
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Revenue Forecast</h2>
        <div className="flex items-center space-x-4 text-sm">
          <span className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: COLORS.historical }}></div>
            Historical
          </span>
          <span className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: COLORS.baseline }}></div>
            Baseline Forecast
          </span>
          <span className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: COLORS.opportunities }}></div>
            Opportunities
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="period" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Historical data */}
          <Bar dataKey="actual" fill={COLORS.historical} name="Historical Revenue" />
          
          {/* Today separator line */}
          {todayIndex > 0 && (
            <ReferenceLine 
              x={todayIndex - 0.5}
              stroke={COLORS.separator}
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "Today",
                position: "top",
                fill: COLORS.separator,
                fontSize: 12
              }}
            />
          )}
          
          {/* Forecast data - stacked */}
          <Bar dataKey="baseline" stackId="forecast" fill={COLORS.baseline} name="Baseline Forecast" />
          <Bar dataKey="opportunities" stackId="forecast" fill={COLORS.opportunities} name="Opportunities" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ForecastChart