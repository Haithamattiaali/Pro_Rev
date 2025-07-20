import React, { useMemo } from 'react'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'
import TableExportButton from '../../buttons/TableExportButton'

const MonthlyTable = ({ data }) => {
  // Process data with additional metrics
  const tableData = useMemo(() => {
    if (!data?.chart || data.chart.length === 0) return []
    
    return data.chart.map((item, index) => {
      const baseline = item.baseline || 0
      const opportunities = item.opportunities || 0
      const total = item.total || 0
      
      // Calculate month-over-month changes
      let momChange = 0
      let momPercent = 0
      if (index > 0) {
        const prevTotal = data.chart[index - 1].total || 0
        momChange = total - prevTotal
        momPercent = prevTotal > 0 ? (momChange / prevTotal) * 100 : 0
      }
      
      // Calculate percentages
      const baselinePercent = total > 0 ? ((baseline / total) * 100).toFixed(1) : '0.0'
      const opportunityPercent = total > 0 ? ((opportunities / total) * 100).toFixed(1) : '0.0'
      
      return {
        month: item.month,
        baseline,
        opportunities,
        total,
        baselinePercent,
        opportunityPercent,
        momChange,
        momPercent,
        isGrowing: momChange > 0
      }
    })
  }, [data])
  
  // Calculate totals and averages
  const summary = useMemo(() => {
    if (!tableData || tableData.length === 0) return null
    
    const totals = {
      baseline: tableData.reduce((sum, row) => sum + row.baseline, 0),
      opportunities: tableData.reduce((sum, row) => sum + row.opportunities, 0),
      total: tableData.reduce((sum, row) => sum + row.total, 0)
    }
    
    const totalsWithPercent = {
      ...totals,
      baselinePercent: totals.total > 0 ? ((totals.baseline / totals.total) * 100).toFixed(1) : '0.0',
      opportunityPercent: totals.total > 0 ? ((totals.opportunities / totals.total) * 100).toFixed(1) : '0.0'
    }
    
    const averages = {
      baseline: totals.baseline / tableData.length,
      opportunities: totals.opportunities / tableData.length,
      total: totals.total / tableData.length
    }
    
    return { totals: totalsWithPercent, averages }
  }, [tableData])
  
  // Get month color based on index using brand colors
  const getMonthColor = (index) => {
    const colors = ['#9e1f63', '#005b8c', '#424046'] // Primary, Accent Blue, Secondary
    return colors[index % colors.length]
  }
  
  if (!tableData || tableData.length === 0) {
    return (
      <div className="bg-secondary-pale rounded-lg p-8 text-center">
        <p className="text-neutral-mid">No monthly data available for the selected period</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-secondary-pale flex items-center justify-between">
        <h4 className="font-semibold text-neutral-dark">Monthly Sales Plan Details</h4>
        <TableExportButton
          data={tableData}
          headers={['Month', 'Baseline', 'Baseline %', 'Opportunities', 'Opportunities %', 'Total', 'MoM Change']}
          filename="sales-plan-monthly-breakdown"
          title="Monthly Sales Plan with Breakdown"
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {/* First row - Main category headers */}
            <tr className="bg-secondary-pale/50 border-b border-secondary-pale">
              <th className="px-6 py-3 text-left" rowSpan="2">
                <span className="text-xs font-medium text-secondary uppercase tracking-wider">
                  Month
                </span>
              </th>
              <th className="px-6 py-2 text-center border-l border-secondary-pale" colSpan="2">
                <span className="text-xs font-medium text-secondary uppercase tracking-wider">
                  Baseline Forecast
                </span>
              </th>
              <th className="px-6 py-2 text-center border-l border-secondary-pale" colSpan="2">
                <span className="text-xs font-medium text-secondary uppercase tracking-wider">
                  Opportunities
                </span>
              </th>
              <th className="px-6 py-3 text-right border-l border-secondary-pale" rowSpan="2">
                <span className="text-xs font-medium text-secondary uppercase tracking-wider">
                  Total Forecast
                </span>
              </th>
              <th className="px-6 py-3 text-right border-l border-secondary-pale" rowSpan="2">
                <span className="text-xs font-medium text-secondary uppercase tracking-wider">
                  MoM Change
                </span>
              </th>
            </tr>
            {/* Second row - Sub headers */}
            <tr className="bg-secondary-pale/50 border-b border-secondary-pale">
              <th className="px-6 py-2 text-right border-l border-secondary-pale">
                <span className="text-xs font-medium text-neutral-mid">Amount</span>
              </th>
              <th className="px-6 py-2 text-right">
                <span className="text-xs font-medium text-neutral-mid">%</span>
              </th>
              <th className="px-6 py-2 text-right border-l border-gray-100">
                <span className="text-xs font-medium text-gray-600">Amount</span>
              </th>
              <th className="px-6 py-2 text-right">
                <span className="text-xs font-medium text-neutral-mid">%</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-pale">
            {tableData.map((row, index) => (
              <tr key={index} className="hover:bg-secondary-pale/30 transition-colors">
                <td className="px-6 py-4 ">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getMonthColor(index) }}
                    />
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-mid" />
                      <span className="text-sm font-medium text-neutral-dark">{row.month}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4  text-sm text-right text-neutral-dark">
                  {formatCurrency(row.baseline)}
                </td>
                <td className="px-6 py-4  text-sm text-right text-neutral-mid">
                  {row.baselinePercent}%
                </td>
                <td className="px-6 py-4  text-sm text-right text-gray-900">
                  {formatCurrency(row.opportunities)}
                </td>
                <td className="px-6 py-4  text-sm text-right text-gray-500">
                  {row.opportunityPercent}%
                </td>
                <td className="px-6 py-4  text-sm text-right font-semibold text-primary-dark">
                  {formatCurrency(row.total)}
                </td>
                <td className="px-6 py-4  text-right">
                  {index > 0 && (
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-sm font-medium ${
                        row.isGrowing ? 'text-primary' : row.momChange < 0 ? 'text-accent-coral' : 'text-neutral-mid'
                      }`}>
                        {row.momChange > 0 && '+'}{formatCurrency(row.momChange)}
                      </span>
                      <span className={`text-xs flex items-center gap-0.5 ${
                        row.isGrowing ? 'text-primary' : row.momChange < 0 ? 'text-accent-coral' : 'text-neutral-mid'
                      }`}>
                        {row.isGrowing ? <TrendingUp className="w-3 h-3" /> : row.momChange < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                        ({row.momPercent > 0 && '+'}{row.momPercent.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {summary && (
            <>
              <tfoot className="bg-secondary-pale border-t-2 border-secondary">
                <tr>
                  <td className="px-6 py-4 ">
                    <span className="text-sm font-semibold text-neutral-dark">Total</span>
                  </td>
                  <td className="px-6 py-4  text-sm text-right font-bold text-neutral-dark">
                    {formatCurrency(summary.totals.baseline)}
                  </td>
                  <td className="px-6 py-4  text-sm text-right font-bold text-neutral-mid">
                    {summary.totals.baselinePercent}%
                  </td>
                  <td className="px-6 py-4  text-sm text-right font-bold text-gray-900">
                    {formatCurrency(summary.totals.opportunities)}
                  </td>
                  <td className="px-6 py-4  text-sm text-right font-bold text-gray-500">
                    {summary.totals.opportunityPercent}%
                  </td>
                  <td className="px-6 py-4  text-sm text-right font-bold text-primary">
                    {formatCurrency(summary.totals.total)}
                  </td>
                  <td className="px-6 py-4  text-right">
                    <span className="text-xs text-neutral-mid">
                      {tableData.length} months
                    </span>
                  </td>
                </tr>
                <tr className="bg-secondary-pale/50 border-t">
                  <td className="px-6 py-4 ">
                    <span className="text-sm font-semibold text-secondary">Average</span>
                  </td>
                  <td className="px-6 py-4  text-sm text-right text-secondary">
                    {formatCurrency(summary.averages.baseline)}
                  </td>
                  <td className="px-6 py-4  text-sm text-right text-neutral-mid">
                    -
                  </td>
                  <td className="px-6 py-4  text-sm text-right text-gray-700">
                    {formatCurrency(summary.averages.opportunities)}
                  </td>
                  <td className="px-6 py-4  text-sm text-right text-gray-500">
                    -
                  </td>
                  <td className="px-6 py-4  text-sm text-right font-semibold text-secondary">
                    {formatCurrency(summary.averages.total)}
                  </td>
                  <td className="px-6 py-4  text-right">
                    <span className="text-xs text-neutral-mid">
                      Per month
                    </span>
                  </td>
                </tr>
              </tfoot>
            </>
          )}
        </table>
      </div>
    </div>
  )
}

export default MonthlyTable