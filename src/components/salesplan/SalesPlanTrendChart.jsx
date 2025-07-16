import React from 'react'
import { 
  LineChart, 
  Line, 
  Area,
  AreaChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Bar
} from 'recharts'
import { formatCurrency } from '../../utils/formatters'

const SalesPlanTrendChart = ({ data }) => {
  // Color scheme matching brand colors
  const COLORS = {
    baseline: '#10b981', // Green
    opportunities: '#f59e0b', // Amber
    total: '#9e1f63', // Brand primary
    totalArea: '#9e1f63', // Brand primary with opacity
    grid: '#e5e7eb'
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <p key={index} className="text-sm flex justify-between items-center gap-4">
                <span className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-semibold">{formatCurrency(entry.value)}</span>
              </p>
            ))}
          </div>
          {payload.find(p => p.dataKey === 'total') && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Opportunities: {((payload.find(p => p.dataKey === 'opportunities')?.value / 
                  payload.find(p => p.dataKey === 'total')?.value) * 100).toFixed(1)}% of total
              </p>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    if (!data || data.length === 0) return null
    
    const totalBaseline = data.reduce((sum, item) => sum + (item.baseline || 0), 0)
    const totalOpportunities = data.reduce((sum, item) => sum + (item.opportunities || 0), 0)
    const totalForecast = data.reduce((sum, item) => sum + (item.total || 0), 0)
    
    const avgBaseline = totalBaseline / data.length
    const avgOpportunities = totalOpportunities / data.length
    const avgTotal = totalForecast / data.length
    
    const opportunityRatio = (totalOpportunities / totalForecast) * 100
    
    return {
      totalBaseline,
      totalOpportunities,
      totalForecast,
      avgBaseline,
      avgOpportunities,
      avgTotal,
      opportunityRatio
    }
  }, [data])

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-1 bg-green-500 mr-2"></div>
          <span className="text-gray-700">Baseline Forecast</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1 bg-amber-500 mr-2"></div>
          <span className="text-gray-700">Opportunities</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-2 mr-2" style={{ backgroundColor: COLORS.total }}></div>
          <span className="text-gray-700 font-semibold">Total Forecast</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart 
          data={data} 
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.total} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.total} stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.baseline} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={COLORS.baseline} stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: COLORS.grid }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            axisLine={{ stroke: COLORS.grid }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          {/* Total area fill */}
          <Area
            type="monotone"
            dataKey="total"
            stroke="none"
            fill="url(#totalGradient)"
            fillOpacity={1}
          />
          
          {/* Baseline line */}
          <Line
            type="monotone"
            dataKey="baseline"
            stroke={COLORS.baseline}
            strokeWidth={2}
            dot={{ fill: COLORS.baseline, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Baseline Forecast"
          />
          
          {/* Opportunities line */}
          <Line
            type="monotone"
            dataKey="opportunities"
            stroke={COLORS.opportunities}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: COLORS.opportunities, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Opportunities"
          />
          
          {/* Total line */}
          <Line
            type="monotone"
            dataKey="total"
            stroke={COLORS.total}
            strokeWidth={3}
            dot={{ fill: COLORS.total, strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
            name="Total Forecast"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary Statistics */}
      {stats && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Baseline</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(stats.totalBaseline)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Avg: {formatCurrency(stats.avgBaseline)}/mo
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-sm text-amber-700 mb-1">Total Opportunities</p>
            <p className="text-lg font-semibold text-amber-900">
              {formatCurrency(stats.totalOpportunities)}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              {stats.opportunityRatio.toFixed(1)}% of total
            </p>
          </div>
          <div className="bg-primary-light rounded-lg p-4">
            <p className="text-sm text-primary-dark mb-1">Total Forecast</p>
            <p className="text-lg font-semibold text-primary">
              {formatCurrency(stats.totalForecast)}
            </p>
            <p className="text-xs text-primary-dark mt-1">
              Avg: {formatCurrency(stats.avgTotal)}/mo
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700 mb-1">Growth Potential</p>
            <p className="text-lg font-semibold text-green-900">
              {((stats.totalForecast - stats.totalBaseline) / stats.totalBaseline * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-green-600 mt-1">
              From baseline
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesPlanTrendChart