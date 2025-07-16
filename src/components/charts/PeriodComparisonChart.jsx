import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatPercentage } from '../../utils/formatters'

const PeriodComparisonChart = ({ data, serviceType }) => {
  const chartData = data[serviceType].map(item => ({
    period: item.Period,
    target: item.Target,
    revenue: item.Revenue,
    achievement: item['Achievement %']
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-secondary-pale">
          <p className="font-semibold text-primary-dark mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm">
              <span style={{ color: entry.color }}>{entry.name}:</span>{' '}
              {entry.name === 'achievement' 
                ? formatPercentage(entry.value)
                : formatCurrency(entry.value)
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e1e6" />
        <XAxis 
          dataKey="period" 
          tick={{ fill: '#717171', fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tick={{ fill: '#717171', fontSize: 12 }}
          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="rect"
        />
        <Bar dataKey="target" fill="#721548" name="Target" />
        <Bar dataKey="revenue" fill="#9e1f63" name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default PeriodComparisonChart