import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { formatPercentage } from '../../utils/formatters'

const GaugeChart = ({ value, title }) => {
  const data = [
    { value: value },
    { value: 100 - value }
  ]

  const getColor = () => {
    if (value >= 100) return '#10b981' // green
    if (value >= 80) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  return (
    <div className="text-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
          >
            <Cell fill={getColor()} />
            <Cell fill="#e2e1e6" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4">
        <p className="text-3xl font-bold text-primary">{formatPercentage(value)}</p>
        <p className="text-sm text-neutral-mid mt-1">{title}</p>
      </div>
    </div>
  )
}

export default GaugeChart