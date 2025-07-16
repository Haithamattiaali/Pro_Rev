import React, { useMemo } from 'react'
import { TrendingUp, Package, Truck } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'
import TableExportButton from '../../buttons/TableExportButton'
import BaseCard from '../../cards/BaseCard'
import BaseTable from '../../tables/BaseTable'

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
      
      <BaseTable variant="modern">
          <BaseTable.Head>
            {/* First row - Main category headers */}
            <BaseTable.Row>
              <BaseTable.Cell variant="header" rowSpan="2">
                Business Unit
              </BaseTable.Cell>
              <BaseTable.Cell variant="header" align="center" rowSpan="2">
                GL Accounts
              </BaseTable.Cell>
              <BaseTable.Cell variant="header" align="center" className="border-l border-gray-100" colSpan="2">
                Baseline Forecast
              </BaseTable.Cell>
              <BaseTable.Cell variant="header" align="center" className="border-l border-gray-100" colSpan="2">
                Opportunities
              </BaseTable.Cell>
              <BaseTable.Cell variant="header" align="right" className="border-l border-gray-100" rowSpan="2">
                Total Forecast
              </BaseTable.Cell>
              <BaseTable.Cell variant="header" align="right" className="border-l border-gray-100" rowSpan="2">
                % of Total
              </BaseTable.Cell>
            </BaseTable.Row>
            {/* Second row - Sub headers */}
            <BaseTable.Row>
              <BaseTable.Cell variant="header" align="right" className="border-l border-gray-100 text-gray-600">
                Amount
              </BaseTable.Cell>
              <BaseTable.Cell variant="header" align="right" className="text-gray-600">
                %
              </BaseTable.Cell>
              <BaseTable.Cell variant="header" align="right" className="border-l border-gray-100 text-gray-600">
                Amount
              </BaseTable.Cell>
              <BaseTable.Cell variant="header" align="right" className="text-gray-600">
                %
              </BaseTable.Cell>
            </BaseTable.Row>
          </BaseTable.Head>
          <BaseTable.Body>
            {tableData.map((row, index) => (
              <BaseTable.Row key={index}>
                <BaseTable.Cell>
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg text-white shadow-sm"
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
                </BaseTable.Cell>
                <BaseTable.Cell align="center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                    {row.gl_count}
                  </span>
                </BaseTable.Cell>
                <BaseTable.Cell align="right">
                  {formatCurrency(row.baseline_forecast)}
                </BaseTable.Cell>
                <BaseTable.Cell align="right" className="text-gray-500">
                  {row.baselinePercent}%
                </BaseTable.Cell>
                <BaseTable.Cell align="right">
                  {formatCurrency(row.opportunity_value)}
                </BaseTable.Cell>
                <BaseTable.Cell align="right" className="text-gray-500">
                  {row.opportunitiesPercent}%
                </BaseTable.Cell>
                <BaseTable.Cell align="right" className="font-semibold">
                  {formatCurrency(row.total)}
                </BaseTable.Cell>
                <BaseTable.Cell align="right">
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
                </BaseTable.Cell>
              </BaseTable.Row>
            ))}
          </BaseTable.Body>
          {totals && (
            <BaseTable.Footer>
              <BaseTable.Row>
                <BaseTable.Cell variant="footer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary text-white shadow-sm">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Total</p>
                  </div>
                </BaseTable.Cell>
                <BaseTable.Cell variant="footer" align="center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">
                    {totals.glCount}
                  </span>
                </BaseTable.Cell>
                <BaseTable.Cell variant="footer" align="right" className="font-bold">
                  {formatCurrency(totals.baseline)}
                </BaseTable.Cell>
                <BaseTable.Cell variant="footer" align="right" className="font-bold text-gray-500">
                  {totals.baselinePercent}%
                </BaseTable.Cell>
                <BaseTable.Cell variant="footer" align="right" className="font-bold">
                  {formatCurrency(totals.opportunities)}
                </BaseTable.Cell>
                <BaseTable.Cell variant="footer" align="right" className="font-bold text-gray-500">
                  {totals.opportunitiesPercent}%
                </BaseTable.Cell>
                <BaseTable.Cell variant="footer" align="right" className="font-bold text-primary">
                  {formatCurrency(totals.total)}
                </BaseTable.Cell>
                <BaseTable.Cell variant="footer" align="right">
                  <span className="text-sm font-bold text-gray-700">100.0%</span>
                </BaseTable.Cell>
              </BaseTable.Row>
            </BaseTable.Footer>
          )}
        </BaseTable>
      
    </BaseCard>
  )
}

export default BusinessUnitTable