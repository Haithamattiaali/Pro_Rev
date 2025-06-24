import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { formatPercentage, formatCurrency } from '../../utils/formatters'

const GaugeChart = ({ value, title, targetAmount = 0, currentAmount = 0 }) => {
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
      <div className="mt-2">
        <p className="text-3xl font-bold text-primary">{formatPercentage(value)}</p>
        <p className="text-sm text-neutral-mid mt-0">{title}</p>
        {value < 100 && targetAmount > 0 && (
          <p className="text-xs text-amber-600 mt-0 font-semibold">
            {formatPercentage(100 - value)} to go • {formatCurrency(targetAmount - currentAmount)}
          </p>
        )}
        {value >= 100 && (
          <p className="text-xs text-green-600 mt-0 font-semibold">
            Target Achieved!
          </p>
        )}
      </div>
    </div>
  )
}

export default GaugeChart