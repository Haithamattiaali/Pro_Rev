import React, { useMemo } from 'react'
import { TrendingUp, Package, Truck } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'
import TableExportButton from '../../buttons/TableExportButton'
import BaseCard from '../../common/BaseCard'
import BaseTable from '../../common/BaseTable'

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
      <BaseCard variant="filled" className="text-center">
        <p className="text-gray-500">No business unit data available for the selected period</p>
      </BaseCard>
    )
  }
  
  // Mobile card view for smaller screens
  const MobileView = () => (
    <div className="space-y-3">
      {tableData.map((row, index) => (
        <BaseCard key={index} variant="outlined" padding="small">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div 
                className="p-2 rounded-lg text-white shadow-sm"
                style={{ backgroundColor: getColor(row.business_unit) }}
              >
                {getIcon(row.business_unit)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{row.business_unit}</p>
                <p className="text-xs text-gray-500">{row.gl_count} GL Accounts</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{formatCurrency(row.total)}</p>
                <p className="text-xs text-gray-500">{row.percentOfTotal.toFixed(1)}% of total</p>
              </div>
            </div>
            
            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Baseline</p>
                <p className="font-semibold">{formatCurrency(row.baseline_forecast)}</p>
                <p className="text-xs text-gray-500">{row.baselinePercent}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Opportunities</p>
                <p className="font-semibold">{formatCurrency(row.opportunity_value)}</p>
                <p className="text-xs text-gray-500">{row.opportunitiesPercent}%</p>
              </div>
            </div>
          </div>
        </BaseCard>
      ))}
      
      {/* Total Card */}
      {totals && (
        <BaseCard variant="filled" padding="small" className="bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-white shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Total</p>
                <p className="text-xs text-gray-500">{totals.glCount} GL Accounts</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">{formatCurrency(totals.total)}</p>
              <div className="flex gap-4 text-xs text-gray-500 mt-1">
                <span>Baseline: {totals.baselinePercent}%</span>
                <span>Opp: {totals.opportunitiesPercent}%</span>
              </div>
            </div>
          </div>
        </BaseCard>
      )}
    </div>
  )

  return (
    <BaseCard padding="none" shadow="md">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Business Unit Performance</h4>
        <TableExportButton
          data={tableData}
          headers={['Business Unit', 'GL Accounts', 'Baseline Forecast', 'Baseline %', 'Opportunities', 'Opportunities %', 'Total', '% of Total']}
          filename="sales-plan-by-business-unit-breakdown"
          title="Sales Plan by Business Unit with Breakdown"
        />
      </div>
      
      {/* Show mobile view on small screens */}
      <div className="block md:hidden p-4">
        <MobileView />
      </div>
      
      {/* Show table on larger screens */}
      <div className="hidden md:block overflow-x-auto">
        <div className="w-full">
          <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden table-fixed">
            <thead className="bg-gray-50 border-b border-gray-200">
              {/* First row - Main category headers */}
              <tr className="border-b border-gray-100">
                <th rowSpan="2" className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Business Unit
                </th>
                <th rowSpan="2" className="w-[10%] px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  GL Accounts
                </th>
                <th colSpan="2" className="w-[20%] px-6 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-l border-gray-100">
                  Baseline Forecast
                </th>
                <th colSpan="2" className="w-[20%] px-6 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-l border-gray-100">
                  Opportunities
                </th>
                <th rowSpan="2" className="w-[15%] px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-l border-gray-100">
                  Total Forecast
                </th>
                <th rowSpan="2" className="w-[15%] px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-l border-gray-100">
                  % of Total
                </th>
              </tr>
              {/* Second row - Sub headers */}
              <tr className="border-b border-gray-200">
                <th className="w-[15%] px-6 py-2 text-right text-xs font-medium text-gray-600 border-l border-gray-100">
                  Amount
                </th>
                <th className="w-[5%] px-6 py-2 text-right text-xs font-medium text-gray-600">
                  %
                </th>
                <th className="w-[15%] px-6 py-2 text-right text-xs font-medium text-gray-600 border-l border-gray-100">
                  Amount
                </th>
                <th className="w-[5%] px-6 py-2 text-right text-xs font-medium text-gray-600">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg text-white shadow-sm flex-shrink-0"
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
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                      {row.gl_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {formatCurrency(row.baseline_forecast)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-500">
                    {row.baselinePercent}%
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {formatCurrency(row.opportunity_value)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-500">
                    {row.opportunitiesPercent}%
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(row.total)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2 flex-shrink-0">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(row.percentOfTotal, 100)}%`,
                            backgroundColor: getColor(row.business_unit)
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12 text-right flex-shrink-0">
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary text-white shadow-sm">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">Total</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">
                      {totals.glCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                    {formatCurrency(totals.baseline)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-gray-500">
                    {totals.baselinePercent}%
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                    {formatCurrency(totals.opportunities)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-gray-500">
                    {totals.opportunitiesPercent}%
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-primary">
                    {formatCurrency(totals.total)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-gray-700">100.0%</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </BaseCard>
  )
}

export default BusinessUnitTable