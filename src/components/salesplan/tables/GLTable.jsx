import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, FileSpreadsheet, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'
import TableExportButton from '../../buttons/TableExportButton'

const GLTable = ({ data }) => {
  const [sortField, setSortField] = useState('total')
  const [sortDirection, setSortDirection] = useState('desc')
  
  // Process and sort data with percentage calculations
  const tableData = useMemo(() => {
    if (!data?.data || data.data.length === 0) return []
    
    const processedData = data.data.map(item => {
      // Handle both 'total' and 'total_forecast' field names
      const total = item.total || item.total_forecast || 0
      return {
        ...item,
        total, // Normalize to 'total' field
        baselinePercent: total > 0 ? ((item.baseline_forecast / total) * 100).toFixed(1) : '0.0',
        opportunitiesPercent: total > 0 ? ((item.opportunity_value / total) * 100).toFixed(1) : '0.0'
      }
    })
    
    const sorted = [...processedData].sort((a, b) => {
      const aValue = a[sortField] || 0
      const bValue = b[sortField] || 0
      
      if (sortDirection === 'asc') {
        return aValue - bValue
      }
      return bValue - aValue
    })
    
    return sorted
  }, [data, sortField, sortDirection])
  
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
      opportunitiesPercent: total > 0 ? ((opportunities / total) * 100).toFixed(1) : '0.0'
    }
  }, [tableData])
  
  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }
  
  // Sort icon component
  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />
  }
  
  // Check if we have service type data (single-select mode)
  const hasServiceType = tableData.some(row => row.service_type !== undefined)
  
  if (!tableData || tableData.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No GL data available for the selected period</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">GL Account Details</h4>
        <TableExportButton
          data={tableData}
          headers={hasServiceType ? 
            ['GL Account', 'Service Type', 'Baseline Forecast', 'Baseline %', 'Opportunities', 'Opportunities %', 'Total'] :
            ['GL Account', 'Baseline Forecast', 'Baseline %', 'Opportunities', 'Opportunities %', 'Total']
          }
          filename="sales-plan-by-gl-breakdown"
          title="Sales Plan by GL with Breakdown"
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {/* First row - Main category headers */}
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left" rowSpan="2">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  GL Account
                </span>
              </th>
              {hasServiceType && (
                <th className="px-6 py-3 text-left" rowSpan="2">
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Service Type
                  </span>
                </th>
              )}
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
                <button
                  onClick={() => handleSort('total')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900 ml-auto"
                >
                  Total Revenue
                  <SortIcon field="total" />
                </button>
              </th>
            </tr>
            {/* Second row - Sub headers */}
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-2 text-right border-l border-gray-100">
                <button
                  onClick={() => handleSort('baseline_forecast')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 ml-auto"
                >
                  Amount
                  <SortIcon field="baseline_forecast" />
                </button>
              </th>
              <th className="px-6 py-2 text-right">
                <span className="text-xs font-medium text-gray-600">%</span>
              </th>
              <th className="px-6 py-2 text-right border-l border-gray-100">
                <button
                  onClick={() => handleSort('opportunity_value')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 ml-auto"
                >
                  Amount
                  <SortIcon field="opportunity_value" />
                </button>
              </th>
              <th className="px-6 py-2 text-right">
                <span className="text-xs font-medium text-gray-600">%</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 ">
                  <div className="flex items-center">
                    {hasServiceType && (
                      <div className="w-2 h-8 rounded mr-3" style={{
                        backgroundColor: row.service_type === 'Transportation' ? '#005b8c' : 
                                       row.service_type === 'Warehousing' ? '#e05e3d' : '#9e1f63'
                      }}></div>
                    )}
                    <span className="text-sm font-medium text-gray-900">{row.gl}</span>
                  </div>
                </td>
                {hasServiceType && (
                  <td className="px-6 py-4  text-sm text-gray-700">
                    {row.service_type}
                  </td>
                )}
                <td className="px-6 py-4  text-sm text-right text-gray-900">
                  {formatCurrency(row.baseline_forecast)}
                </td>
                <td className="px-6 py-4  text-sm text-right text-gray-500">
                  {row.baselinePercent}%
                </td>
                <td className="px-6 py-4  text-sm text-right text-gray-900">
                  {formatCurrency(row.opportunity_value)}
                </td>
                <td className="px-6 py-4  text-sm text-right text-gray-500">
                  {row.opportunitiesPercent}%
                </td>
                <td className="px-6 py-4  text-sm text-right font-semibold text-gray-900">
                  {formatCurrency(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td colSpan={hasServiceType ? "2" : "1"} className="px-6 py-4  text-sm font-semibold text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4  text-sm text-right font-bold text-gray-900">
                  {formatCurrency(totals.baseline)}
                </td>
                <td className="px-6 py-4  text-sm text-right font-bold text-gray-500">
                  {totals.baselinePercent}%
                </td>
                <td className="px-6 py-4  text-sm text-right font-bold text-gray-900">
                  {formatCurrency(totals.opportunities)}
                </td>
                <td className="px-6 py-4  text-sm text-right font-bold text-gray-500">
                  {totals.opportunitiesPercent}%
                </td>
                <td className="px-6 py-4  text-sm text-right font-bold text-primary">
                  {formatCurrency(totals.total)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

export default GLTable