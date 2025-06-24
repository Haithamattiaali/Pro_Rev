import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatPercentage } from '../../utils/formatters'

const CustomerPerformanceChart = ({ data, period = 'YTD' }) => {
  const chartData = data.map(customer => ({
    name: customer.Customer,
    target: period === 'YTD' ? customer['YTD Target'] : customer['QTD Target'],
    revenue: period === 'YTD' ? customer['YTD Revenue'] : customer['QTD Revenue'],
    achievement: period === 'YTD' ? customer['YTD Achievement %'] : customer['QTD Achievement %']
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const achievement = payload[0].payload.achievement
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-secondary-pale">
          <p className="font-semibold text-primary-dark mb-2">{label}</p>
          <p className="text-sm">Target: {formatCurrency(payload[0].payload.target)}</p>
          <p className="text-sm">Revenue: {formatCurrency(payload[0].payload.revenue)}</p>
          <p className={`text-sm font-semibold ${
            achievement >= 100 ? 'text-green-600' : 
            achievement >= 80 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            Achievement: {formatPercentage(achievement)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart 
        data={chartData} 
        layout="horizontal"
        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e1e6" />
        <XAxis 
          type="number"
          tick={{ fill: '#717171', fontSize: 12 }}
          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
        />
        <YAxis 
          type="category"
          dataKey="name"
          tick={{ fill: '#717171', fontSize: 12 }}
          width={90}
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

export default CustomerPerformanceChart