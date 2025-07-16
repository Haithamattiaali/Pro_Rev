import React, { useState, useEffect } from 'react'
import { Truck, Package, Loader2, Users, TrendingUp, FileText, DollarSign, Calendar, BarChart3, Percent, Activity, Target } from 'lucide-react'
import { formatCurrency, formatPercentage, getAchievementStatus, getGrossProfitStatus } from '../utils/formatters'
import BusinessUnitBarChart from '../components/charts/BusinessUnitBarChart'
import StickyPeriodFilter from '../components/filters/StickyPeriodFilter'
import { ExportButton } from '../components/export'
import TableExportButton from '../components/buttons/TableExportButton'
import BaseTable from '../components/common/BaseTable'
import BaseCard from '../components/cards/BaseCard'
import { useFilter } from '../contexts/FilterContext'
import { useDataRefresh } from '../contexts/DataRefreshContext'
import dataService from '../services/dataService'
import exportService from '../services/exportService'

const BusinessUnits = () => {
  const [selectedUnit, setSelectedUnit] = useState('Transportation')
  const { periodFilter } = useFilter()
  const { refreshTrigger, triggerRefresh } = useDataRefresh()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [businessUnits, setBusinessUnits] = useState([])
  const [monthlyTrends, setMonthlyTrends] = useState([])

  const handleRetry = async () => {
    await triggerRefresh({
      showNotification: false,
      message: 'Retrying data fetch...'
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const [unitsData, trendsData] = await Promise.all([
          dataService.getBusinessUnitData(
            periodFilter.year, 
            periodFilter.period,
            periodFilter.month,
            periodFilter.quarter
          ),
          dataService.getMonthlyTrends(periodFilter.year, selectedUnit)
        ])
        
        setBusinessUnits(unitsData)
        setMonthlyTrends(trendsData)
      } catch (err) {
        console.error('Error fetching business unit data:', err)
        setError('Failed to load business unit data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [periodFilter, selectedUnit, refreshTrigger])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={handleRetry} 
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Retry
        </button>
      </div>
    )
  }

  const selectedUnitData = businessUnits.find(unit => unit.businessUnit === selectedUnit)
  
  // Filter monthly data based on period selection
  const periodMonths = dataService.getPeriodMonths(
    periodFilter.year, 
    periodFilter.period, 
    periodFilter.month, 
    periodFilter.quarter
  )
  
  const unitMonthlyData = monthlyTrends
    .filter(month => periodMonths.includes(month.month))
    .map(month => ({
      ...month,
      achievement: month.target > 0 ? (month.revenue / month.target) * 100 : 0,
      grossProfit: month.target - month.cost,
      grossProfitMargin: month.target > 0 ? ((month.target - month.cost) / month.target) * 100 : 0
    }))

  // Check if no year is selected
  if (!periodFilter.year || periodFilter.period === 'NONE') {
    return (
      <div className="space-y-6">
        <StickyPeriodFilter />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data to Display</h3>
            <p className="text-gray-500">Please select a year to view business unit data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <StickyPeriodFilter />
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark tracking-tight">Business Units Performance</h1>
          <p className="text-neutral-mid mt-2">Deep dive into service-specific metrics and trends</p>
        </div>
        <ExportButton 
          dashboardRef={null}
          variant="secondary"
          size="medium"
        />
      </div>

      {/* Business Unit Selector */}
      <div className="flex space-x-4">
        {businessUnits.map((unit) => (
          <button
            key={unit.businessUnit}
            onClick={() => setSelectedUnit(unit.businessUnit)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              selectedUnit === unit.businessUnit
                ? 'bg-primary text-white'
                : 'bg-white text-neutral-dark hover:bg-secondary-pale'
            }`}
          >
            {unit.businessUnit === 'Transportation' ? <Truck className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            <span>{unit.businessUnit}</span>
          </button>
        ))}
      </div>

      {/* Unit Overview */}
      {selectedUnitData && (
        <div className="dashboard-card">
          <h2 className="section-title">{dataService.getPeriodLabel(periodFilter.period)} Performance Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-secondary-pale rounded-lg">
              <p className="metric-label">Target</p>
              <p className="text-xl font-bold text-primary-dark mt-1">{formatCurrency(selectedUnitData.target)}</p>
            </div>
            <div className="text-center p-4 bg-secondary-pale rounded-lg">
              <p className="metric-label">Revenue</p>
              <p className="text-xl font-bold text-primary mt-1">{formatCurrency(selectedUnitData.revenue)}</p>
            </div>
            <div className="text-center p-4 bg-secondary-pale rounded-lg">
              <p className="metric-label">Cost</p>
              <p className="text-xl font-bold text-accent-coral mt-1">{formatCurrency(selectedUnitData.cost)}</p>
            </div>
            <div className="text-center p-4 bg-secondary-pale rounded-lg">
              <p className="metric-label">Achievement</p>
              <p className={`text-xl font-bold mt-1 ${
                getAchievementStatus(selectedUnitData.achievement) === 'high' ? 'text-green-600' :
                getAchievementStatus(selectedUnitData.achievement) === 'medium' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {formatPercentage(selectedUnitData.achievement)}
              </p>
            </div>
            <div className="text-center p-4 bg-secondary-pale rounded-lg">
              <p className="metric-label">Gross Profit</p>
              <p className="text-xl font-bold text-accent-blue mt-1">{formatCurrency(selectedUnitData.profit)}</p>
            </div>
            <div className="text-center p-4 bg-secondary-pale rounded-lg">
              <p className="metric-label">GP Margin</p>
              <p className={`text-xl font-bold mt-1 ${
                getGrossProfitStatus(selectedUnitData.profitMargin) === 'high' ? 'text-green-600' :
                getGrossProfitStatus(selectedUnitData.profitMargin) === 'medium' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {formatPercentage(selectedUnitData.profitMargin)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Performance Bar Chart */}
      <div className="dashboard-card">
        <h2 className="section-title">Monthly Performance - {selectedUnit}</h2>
        <BusinessUnitBarChart 
          data={unitMonthlyData} 
          title={`${dataService.getPeriodLabel(periodFilter.period)} Performance Analysis`}
        />
      </div>

      {/* Detailed Period Breakdown */}
      <div className="dashboard-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title mb-0">Monthly Breakdown</h2>
          <TableExportButton
            data={unitMonthlyData.map(month => ({
              Month: month.month,
              Target: month.target,
              Revenue: month.revenue,
              Cost: month.cost,
              'Achievement %': month.achievement,
              'Gross Profit': month.grossProfit,
              'GP Margin': month.grossProfitMargin
            }))}
            filename={`${selectedUnit}_monthly_breakdown_${periodFilter.year}`}
            variant="inline"
            size="small"
          />
        </div>
        <BaseTable variant="default" striped hoverable>
          <BaseTable.Header>
            <BaseTable.Row>
              <BaseTable.Head>Month</BaseTable.Head>
              <BaseTable.Head align="right">Target</BaseTable.Head>
              <BaseTable.Head align="right">Revenue</BaseTable.Head>
              <BaseTable.Head align="right">Cost</BaseTable.Head>
              <BaseTable.Head align="center">Achievement %</BaseTable.Head>
              <BaseTable.Head align="right">Gross Profit</BaseTable.Head>
              <BaseTable.Head align="center">GP Margin</BaseTable.Head>
            </BaseTable.Row>
          </BaseTable.Header>
          <BaseTable.Body striped hoverable>
            {unitMonthlyData.map((month) => (
              <BaseTable.Row key={month.month}>
                <BaseTable.Cell className="font-semibold text-neutral-dark">{month.month}</BaseTable.Cell>
                <BaseTable.Cell align="right" numeric>{formatCurrency(month.target)}</BaseTable.Cell>
                <BaseTable.Cell align="right" numeric>{formatCurrency(month.revenue)}</BaseTable.Cell>
                <BaseTable.Cell align="right" numeric>{formatCurrency(month.cost)}</BaseTable.Cell>
                <BaseTable.Cell align="center">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    getAchievementStatus(month.achievement) === 'high' ? 'bg-green-100 text-green-800' :
                    getAchievementStatus(month.achievement) === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {formatPercentage(month.achievement)}
                  </span>
                </BaseTable.Cell>
                <BaseTable.Cell align="right" numeric>{formatCurrency(month.grossProfit)}</BaseTable.Cell>
                <BaseTable.Cell align="center">
                  <span className={`font-semibold ${
                    getGrossProfitStatus(month.grossProfitMargin) === 'high' ? 'text-green-600' :
                    getGrossProfitStatus(month.grossProfitMargin) === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {formatPercentage(month.grossProfitMargin)}
                  </span>
                </BaseTable.Cell>
              </BaseTable.Row>
            ))}
          </BaseTable.Body>
          {unitMonthlyData.length > 0 && (
            <BaseTable.Footer>
              <BaseTable.Row>
                <BaseTable.Cell className="font-bold">Total</BaseTable.Cell>
                <BaseTable.Cell align="right" numeric className="font-bold">
                  {formatCurrency(unitMonthlyData.reduce((sum, month) => sum + month.target, 0))}
                </BaseTable.Cell>
                <BaseTable.Cell align="right" numeric className="font-bold">
                  {formatCurrency(unitMonthlyData.reduce((sum, month) => sum + month.revenue, 0))}
                </BaseTable.Cell>
                <BaseTable.Cell align="right" numeric className="font-bold">
                  {formatCurrency(unitMonthlyData.reduce((sum, month) => sum + month.cost, 0))}
                </BaseTable.Cell>
                <BaseTable.Cell align="center">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    getAchievementStatus(selectedUnitData?.achievement || 0) === 'high' ? 'bg-green-100 text-green-800' :
                    getAchievementStatus(selectedUnitData?.achievement || 0) === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {formatPercentage(selectedUnitData?.achievement || 0)}
                  </span>
                </BaseTable.Cell>
                <BaseTable.Cell align="right" numeric className="font-bold">
                  {formatCurrency(unitMonthlyData.reduce((sum, month) => sum + month.grossProfit, 0))}
                </BaseTable.Cell>
                <BaseTable.Cell align="center">
                  <span className={`font-semibold ${
                    getGrossProfitStatus(selectedUnitData?.grossProfitMargin || 0) === 'high' ? 'text-green-600' :
                    getGrossProfitStatus(selectedUnitData?.grossProfitMargin || 0) === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {formatPercentage(selectedUnitData?.grossProfitMargin || 0)}
                  </span>
                </BaseTable.Cell>
              </BaseTable.Row>
            </BaseTable.Footer>
          )}
        </BaseTable>
      </div>

      {/* Key Metrics Enhanced */}
      {selectedUnitData && (
        <div className="dashboard-card">
          <h2 className="section-title">Key Metrics - {selectedUnit}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Customer Count */}
            <BaseCard variant="elevated" className="group hover:scale-[1.02] transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center shadow-md">
                    <Users className="w-6 h-6 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wide">Customer Count</p>
                    <p className="text-xs text-neutral-mid">Active Accounts</p>
                  </div>
                </div>
                <div className="text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded-full">
                  {selectedUnit}
                </div>
              </div>
              <p className="text-3xl font-bold text-neutral-dark mb-4">{selectedUnitData.customerCount || 0}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Revenue Contribution
                  </span>
                  <span className="font-semibold text-neutral-dark">
                    {formatPercentage((selectedUnitData.revenue / businessUnits.reduce((sum, unit) => sum + unit.revenue, 0)) * 100)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Avg Order Value
                  </span>
                  <span className="font-semibold text-neutral-dark">
                    {formatCurrency(selectedUnitData.revenue / (selectedUnitData.customerCount || 1) / 12)}
                  </span>
                </div>
              </div>
            </BaseCard>

            {/* Avg Revenue per Customer */}
            <BaseCard variant="elevated" className="group hover:scale-[1.02] transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-blue/20 to-accent-blue/10 rounded-xl flex items-center justify-center shadow-md">
                    <DollarSign className="w-6 h-6 text-accent-blue" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wide">Avg Revenue</p>
                    <p className="text-xs text-neutral-mid">Per Customer</p>
                  </div>
                </div>
                <div className="text-xs bg-accent-blue/10 text-accent-blue font-medium px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Performance
                </div>
              </div>
              <p className="text-3xl font-bold text-neutral-dark mb-4">
                {formatCurrency(selectedUnitData.customerCount > 0 ? selectedUnitData.revenue / selectedUnitData.customerCount : 0)}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Target per Customer
                  </span>
                  <span className="font-semibold text-neutral-dark">
                    {formatCurrency(selectedUnitData.target / (selectedUnitData.customerCount || 1))}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 bg-gradient-to-r from-accent-blue to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((selectedUnitData.revenue / selectedUnitData.target) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    Customer Efficiency
                  </span>
                  <span className={`font-semibold ${
                    selectedUnitData.achievement >= 100 ? 'text-green-600' : 'text-neutral-dark'
                  }`}>
                    {formatPercentage(selectedUnitData.achievement)}
                  </span>
                </div>
              </div>
            </BaseCard>

            {/* Receivables */}
            <BaseCard variant="elevated" className="group hover:scale-[1.02] transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-coral/20 to-accent-coral/10 rounded-xl flex items-center justify-center shadow-md">
                    <FileText className="w-6 h-6 text-accent-coral" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wide">Receivables</p>
                    <p className="text-xs text-neutral-mid">Outstanding</p>
                  </div>
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                  (selectedUnitData.receivables / selectedUnitData.revenue) > 0.3 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {(selectedUnitData.receivables / selectedUnitData.revenue) > 0.3 ? 'High' : 'Healthy'}
                </div>
              </div>
              <p className="text-3xl font-bold text-neutral-dark mb-4">
                {formatCurrency(selectedUnitData.receivables)}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Days Sales Outstanding
                  </span>
                  <span className="font-semibold text-neutral-dark">
                    {Math.round((selectedUnitData.receivables / selectedUnitData.revenue) * 365)} days
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    % of Revenue
                  </span>
                  <span className={`font-semibold ${
                    (selectedUnitData.receivables / selectedUnitData.revenue) > 0.3 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {formatPercentage((selectedUnitData.receivables / selectedUnitData.revenue) * 100)}
                  </span>
                </div>
              </div>
            </BaseCard>
          </div>
        </div>
      )}
    </div>
  )
}

export default BusinessUnits