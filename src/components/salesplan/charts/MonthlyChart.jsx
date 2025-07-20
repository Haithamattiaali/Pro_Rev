import React, { useMemo } from 'react'
import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'

const MonthlyChart = ({ data }) => {
  // Process data
  const chartData = useMemo(() => {
    if (!data?.chart || data.chart.length === 0) return []
    
    return data.chart.map((item, index) => {
      const baseline = item.baseline || 0
      const opportunities = item.opportunities || 0
      const total = item.total || 0
      
      // Calculate month-over-month growth
      let momGrowth = 0
      if (index > 0) {
        const prevTotal = data.chart[index - 1].total || 0
        momGrowth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0
      }
      
      return {
        month: item.month,
        baseline,
        opportunities,
        total,
        momGrowth,
        isGrowing: momGrowth > 0
      }
    })
  }, [data])
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) return null
    
    const totalBaseline = chartData.reduce((sum, item) => sum + item.baseline, 0)
    const totalOpportunities = chartData.reduce((sum, item) => sum + item.opportunities, 0)
    const totalForecast = chartData.reduce((sum, item) => sum + item.total, 0)
    
    const avgMonthly = totalForecast / chartData.length
    const maxMonth = chartData.reduce((max, item) => item.total > max.total ? item : max, chartData[0])
    const minMonth = chartData.reduce((min, item) => item.total < min.total ? item : min, chartData[0])
    
    return {
      totalBaseline,
      totalOpportunities,
      totalForecast,
      avgMonthly,
      maxMonth,
      minMonth
    }
  }, [chartData])
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-600" />
            <p className="font-semibold text-gray-900">{label}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-8">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#005b8c' }}></div>
                <span className="text-sm">Baseline:</span>
              </span>
              <span className="text-sm font-semibold">{formatCurrency(data.baseline)}</span>
            </div>
            
            <div className="flex justify-between items-center gap-8">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#e05e3d' }}></div>
                <span className="text-sm">Opportunities:</span>
              </span>
              <span className="text-sm font-semibold">{formatCurrency(data.opportunities)}</span>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Total:</span>
                <span className="text-sm font-bold text-primary">{formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>
          
          {data.momGrowth !== 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Month-over-Month:</span>
                <span className={`text-xs font-semibold flex items-center gap-1 ${
                  data.isGrowing ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.isGrowing ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {data.momGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )
    }
    return null
  }
  
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No monthly data available for the selected period</p>
      </div>
    )
  }
  
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart 
          data={chartData}
          margin={{ top: 20, right: 30, left: 50, bottom: 40 }}
        >
          <defs>
            <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#005b8c" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#005b8c" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="opportunitiesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e05e3d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#e05e3d" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            angle={0}
            textAnchor="middle"
            height={60}
          />
          
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {stats && (
            <ReferenceLine 
              y={stats.avgMonthly} 
              stroke="#9e1f63"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: "Average", position: "right", fill: "#9e1f63", fontSize: 12 }}
            />
          )}
          
          <Area
            type="monotone"
            dataKey="baseline"
            stackId="1"
            stroke="#005b8c"
            strokeWidth={2}
            fill="url(#baselineGradient)"
          />
          
          <Area
            type="monotone"
            dataKey="opportunities"
            stackId="1"
            stroke="#e05e3d"
            strokeWidth={2}
            fill="url(#opportunitiesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-12 h-3 rounded" style={{ background: 'linear-gradient(to right, #005b8c90, #005b8c30)' }}></div>
          <span className="text-sm text-gray-700">Baseline Forecast</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-3 rounded" style={{ background: 'linear-gradient(to right, #e05e3d90, #e05e3d30)' }}></div>
          <span className="text-sm text-gray-700">Growth Opportunities</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-primary"></div>
          <span className="text-sm text-gray-700">Monthly Average</span>
        </div>
      </div>
      
      {/* Enhanced Summary Stats with Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="relative overflow-hidden rounded-xl bg-white shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-blue to-accent-blue/20 opacity-10"></div>
            <div className="relative p-4">
              <p className="text-xs text-accent-blue uppercase tracking-wide font-medium">Total Forecast</p>
              <p className="text-xl font-bold text-neutral-dark mt-1">
                {formatCurrency(stats.totalForecast)}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-mid">Baseline:</span>
                  <span className="font-medium text-secondary">{formatCurrency(stats.totalBaseline)} ({((stats.totalBaseline / stats.totalForecast) * 100).toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-mid">Opportunities:</span>
                  <span className="font-medium text-secondary">{formatCurrency(stats.totalOpportunities)} ({((stats.totalOpportunities / stats.totalForecast) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-xl bg-white shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary to-secondary-light opacity-10"></div>
            <div className="relative p-4">
              <p className="text-xs text-secondary uppercase tracking-wide font-medium">Monthly Average</p>
              <p className="text-xl font-bold text-neutral-dark mt-1">
                {formatCurrency(stats.avgMonthly)}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-mid">Avg Baseline:</span>
                  <span className="font-medium text-secondary">{formatCurrency(stats.totalBaseline / chartData.length)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-mid">Avg Opportunities:</span>
                  <span className="font-medium text-secondary">{formatCurrency(stats.totalOpportunities / chartData.length)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-xl bg-white shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark opacity-5"></div>
            <div className="relative p-4">
              <p className="text-xs text-primary uppercase tracking-wide font-medium">Factored Growth</p>
              <p className="text-xl font-bold text-primary-dark mt-1">
                {((stats.totalOpportunities / stats.totalBaseline) * 100).toFixed(1)}%
              </p>
              <div className="mt-2">
                <p className="text-xs text-neutral-mid">Implemented average growth over baseline</p>
                <div className="mt-2 w-full bg-secondary-pale rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-1000"
                    style={{ width: `${Math.min(((stats.totalOpportunities / stats.totalBaseline) * 100), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MonthlyChart