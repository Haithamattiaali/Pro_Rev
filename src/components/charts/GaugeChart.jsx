import React, { useState, useEffect, memo, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { formatPercentage, formatCurrency } from '../../utils/formatters'

// Custom hook for responsive behavior
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

const GaugeChart = memo(({ value, title, targetAmount = 0, currentAmount = 0 }) => {
  const isMobile = useIsMobile()
  
  // Memoize data array to prevent recreation on every render
  const data = useMemo(() => [
    { value: Math.min(value, 100) },
    { value: Math.max(0, 100 - value) }
  ], [value])

  // Memoize color calculation
  const chartColor = useMemo(() => {
    if (value >= 100) return '#10b981' // green
    if (value >= 80) return '#f59e0b' // yellow
    return '#ef4444' // red
  }, [value])

  return (
    <div className="text-center">
      <ResponsiveContainer width="100%" height={isMobile ? 150 : 200}>
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
            <Cell fill={chartColor} />
            <Cell fill="#e2e1e6" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2">
        <p className="text-2xl md:text-3xl font-bold text-primary">{formatPercentage(value)}</p>
        <p className="text-xs md:text-sm text-neutral-mid mt-0">{title}</p>
        {value < 100 && targetAmount > 0 && (
          <p className="text-xs text-amber-600 mt-0 font-semibold">
            {formatPercentage(100 - value)} to go • {formatCurrency(targetAmount - currentAmount)}
          </p>
        )}
        {value >= 100 && value <= 100 && (
          <p className="text-xs text-green-600 mt-0 font-semibold">
            Target Achieved!
          </p>
        )}
        {value > 100 && (
          <p className="text-xs text-green-600 mt-0 font-semibold">
            Target Exceeded by {formatPercentage(value - 100)} • +{formatCurrency(currentAmount - targetAmount)}
          </p>
        )}
      </div>
    </div>
  )
})

GaugeChart.displayName = 'GaugeChart'

export default GaugeChart