import React, { useMemo } from 'react'
import { TrendingUp, Package, Truck } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'
import TableExportButton from '../../buttons/TableExportButton'

const BusinessUnitTable = ({ data }) => {
  // Process data with percentage calculations
  const tableData = useMemo(() => {
    if (!data?.data || data.data.length === 0) return []
    
    const grandTotal = data.data.reduce((sum, item) => sum + (item.total || 0), 0)
    
    return data.data.map(item => ({
      ...item,
      percentOfTotal: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
      baselinePercent: item.total > 0 ? ((item.baseline_forecast / item.total) * 100).toFixed(1) : '0.0',
      opportunitiesPercent: item.total > 0 ? ((item.opportunity_value / item.total) * 100).toFixed(1) : '0.0',
      opportunityRatio: item.baseline_forecast > 0 
        ? (item.opportunity_value / item.baseline_forecast) * 100 
        : 0
    }))
  }, [data])
  
  // Calculate totals
  const totals = useMemo(() => {
    if (!tableData || tableData.length === 0) return null
    
    const baseline = tableData.reduce((sum, row) => sum + (row.baseline_forecast || 0), 0)
    const opportunities = tableData.reduce((sum, row) => sum + (row.opportunity_value || 0), 0)
    const total = baseline + opportunities
    
    return {
      baseline,
      opportunities,
      total,
      baselinePercent: total > 0 ? ((baseline / total) * 100).toFixed(1) : '0.0',
      opportunitiesPercent: total > 0 ? ((opportunities / total) * 100).toFixed(1) : '0.0',
      glCount: tableData.reduce((sum, row) => sum + (row.gl_count || 0), 0)
    }
  }, [tableData])
  
  // Get icon for business unit
  const getIcon = (unit) => {
    if (unit === 'Transportation') return <Truck className="w-5 h-5" />
    if (unit === 'Warehousing') return <Package className="w-5 h-5" />
    return <TrendingUp className="w-5 h-5" />
  }
  
  // Get color for business unit
  const getColor = (unit) => {
    if (unit === 'Transportation') return '#005b8c'
    if (unit === 'Warehousing') return '#e05e3d'
    return '#9e1f63'
  }
  
  if (!tableData || tableData.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No business unit data available for the selected period</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Business Unit Performance</h4>
        <TableExportButton
          data={tableData}
          headers={['Business Unit', 'GL Accounts', 'Baseline Forecast', 'Baseline %', 'Opportunities', 'Opportunities %', 'Total', '% of Total']}
          filename="sales-plan-by-business-unit-breakdown"
          title="Sales Plan by Business Unit with Breakdown"
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {/* First row - Main category headers */}
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left" rowSpan="2">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Business Unit
                </span>
              </th>
              <th className="px-6 py-3 text-center" rowSpan="2">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  GL Accounts
                </span>
              </th>
              <th className="px-6 py-2 text-center border-l border-gray-100" colSpan="2">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Baseline Forecast
                </span>
              </th>
              <th className="px-6 py-2 text-center border-l border-gray-100" colSpan="2">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Opportunities
                </span>
              </th>
              <th className="px-6 py-3 text-right border-l border-gray-100" rowSpan="2">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total Forecast
                </span>
              </th>
              <th className="px-6 py-3 text-right border-l border-gray-100" rowSpan="2">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  % of Total
                </span>
              </th>
            </tr>
            {/* Second row - Sub headers */}
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-2 text-right border-l border-gray-100">
                <span className="text-xs font-medium text-gray-600">Amount</span>
              </th>
              <th className="px-6 py-2 text-right">
                <span className="text-xs font-medium text-gray-600">%</span>
              </th>
              <th className="px-6 py-2 text-right border-l border-gray-100">
                <span className="text-xs font-medium text-gray-600">Amount</span>
              </th>
              <th className="px-6 py-2 text-right">
                <span className="text-xs font-medium text-gray-600">%</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg text-white"
                      style={{ backgroundColor: getColor(row.business_unit) }}
                    >
                      {getIcon(row.business_unit)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{row.business_unit}</p>
                      <p className="text-xs text-gray-500">
                        {row.opportunityRatio > 0 && `+${row.opportunityRatio.toFixed(1)}% opportunity growth`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                    {row.gl_count}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(row.baseline_forecast)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                  {row.baselinePercent}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(row.opportunity_value)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                  {row.opportunitiesPercent}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                  {formatCurrency(row.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${row.percentOfTotal}%`,
                          backgroundColor: getColor(row.business_unit)
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {row.percentOfTotal.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary text-white">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Total</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">
                    {totals.glCount}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                  {formatCurrency(totals.baseline)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-500">
                  {totals.baselinePercent}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                  {formatCurrency(totals.opportunities)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-500">
                  {totals.opportunitiesPercent}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-primary">
                  {formatCurrency(totals.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-bold text-gray-700">100.0%</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

export default BusinessUnitTable