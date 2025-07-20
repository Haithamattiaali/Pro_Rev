import React, { useState, useEffect } from 'react'
import { Truck, Package, Loader2, Users, TrendingUp, TrendingDown, Trophy, FileText, DollarSign, Calendar, BarChart3, Percent, Activity, Target, Banknote } from 'lucide-react'
import { formatCurrency, formatPercentage, getAchievementStatus, getGrossProfitStatus } from '../utils/formatters'
import BusinessUnitBarChart from '../components/charts/BusinessUnitBarChart'
import StickyPeriodFilter from '../components/filters/StickyPeriodFilter'
import { ExportButton } from '../components/export'
import TableExportButton from '../components/buttons/TableExportButton'
import ToolbarSection from '../components/layout/ToolbarSection'
import BaseTable from '../components/common/BaseTable'
import BaseCard from '../components/common/BaseCard'
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
        // Prepare multi-select parameters if in multi-select mode
        let multiSelectParams = null;
        
        // Check if we have quarters or months selected (even single selection in multi-select mode)
        const hasQuarters = periodFilter.selectedQuarters && periodFilter.selectedQuarters.length > 0;
        const hasMonths = periodFilter.selectedMonths && periodFilter.selectedMonths.length > 0;
        const hasMultipleSelections = (periodFilter.selectedQuarters && periodFilter.selectedQuarters.length > 1) ||
                                     (periodFilter.selectedMonths && periodFilter.selectedMonths.length > 1) ||
                                     (periodFilter.selectedYears && periodFilter.selectedYears.length > 1);
        
        // Only use multi-select for quarterly/monthly modes, not yearly
        if (periodFilter.multiSelectMode && periodFilter.viewMode !== 'yearly' && (hasQuarters || hasMonths || hasMultipleSelections)) {
          // Build periods array from selectedQuarters/selectedMonths
          let periods = [];
          if (periodFilter.selectedQuarters && periodFilter.selectedQuarters.length > 0) {
            periods = periodFilter.selectedQuarters.map(q => `Q${q}`);
          } else if (periodFilter.selectedMonths && periodFilter.selectedMonths.length > 0) {
            periods = periodFilter.selectedMonths.map(m => String(m));
          }
          
          multiSelectParams = {
            years: periodFilter.selectedYears || [periodFilter.year],
            periods: periods,
            viewMode: periodFilter.viewMode || (periodFilter.selectedQuarters?.length > 0 ? 'quarterly' : 'monthly')
          };
        }
        
        const [unitsData, trendsData] = await Promise.all([
          dataService.getBusinessUnitData(
            periodFilter.year, 
            periodFilter.period,
            periodFilter.month,
            periodFilter.quarter,
            multiSelectParams
          ),
          dataService.getMonthlyTrends(periodFilter.year, selectedUnit)
        ])
        
        setBusinessUnits(unitsData)
        setMonthlyTrends(trendsData)
        
        // Preserve selected unit or set first unit if not selected
        if (unitsData.length > 0) {
          if (selectedUnit) {
            // Check if currently selected unit still exists in new data
            const unitStillExists = unitsData.some(u => u.businessUnit === selectedUnit)
            if (!unitStillExists) {
              setSelectedUnit(unitsData[0].businessUnit)
            }
          } else {
            // No unit selected yet, select first one
            setSelectedUnit(unitsData[0].businessUnit)
          }
        }
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
      grossProfit: month.target - month.cost, // GP based on target
      grossProfitMargin: month.target > 0 ? ((month.target - month.cost) / month.target) * 100 : 0 // GP% based on target
    }))

  // Check if no year is selected
  if (!periodFilter.year || periodFilter.period === 'NONE') {
    return (
      <div className="space-y-6">
        <StickyPeriodFilter useHierarchical={true} />
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
      <StickyPeriodFilter useHierarchical={true} />
      
      {/* Toolbar */}
      <ToolbarSection
        title="Business Units Performance"
        subtitle="Deep dive into service-specific metrics and trends"
      >
        <ExportButton 
          dashboardRef={null}
          variant="glass"
          size="medium"
        />
      </ToolbarSection>

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
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${selectedUnitData && selectedUnitData.revenue > 0 ? 'lg:grid-cols-6' : 'lg:grid-cols-4'} gap-3 md:gap-4`}>
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
            {selectedUnitData && selectedUnitData.revenue > 0 && (
              <>
                <div className="text-center p-4 bg-secondary-pale rounded-lg">
                  <p className="metric-label">Gross Profit</p>
                  <p className="text-xl font-bold text-accent-blue mt-1">{formatCurrency(selectedUnitData.target - selectedUnitData.cost)}</p>
                </div>
                <div className="text-center p-4 bg-secondary-pale rounded-lg">
                  <p className="metric-label">GP Margin</p>
                  <p className={`text-xl font-bold mt-1 ${
                    getGrossProfitStatus(((selectedUnitData.target - selectedUnitData.cost) / selectedUnitData.target) * 100) === 'high' ? 'text-green-600' :
                    getGrossProfitStatus(((selectedUnitData.target - selectedUnitData.cost) / selectedUnitData.target) * 100) === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {formatPercentage(((selectedUnitData.target - selectedUnitData.cost) / selectedUnitData.target) * 100)}
                  </p>
                </div>
              </>
            )}
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

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-pale/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-secondary-pale/20 bg-gradient-to-r from-white to-secondary-pale/5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-primary-dark">Monthly Breakdown</h2>
            <TableExportButton
              data={unitMonthlyData.map(month => ({
                Month: month.month,
                Target: month.target,
                Revenue: month.revenue,
                'Achievement %': month.achievement,
                'GP %': month.grossProfitMargin
              }))}
              filename={`${selectedUnit}_monthly_breakdown_${periodFilter.year}`}
              variant="inline"
              size="small"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary-pale/10 border-b border-secondary-pale/20">
                <th className="text-left py-2 px-4 font-medium text-xs uppercase tracking-wider text-neutral-mid">Month</th>
                <th className="text-right py-2 px-4 font-medium text-xs uppercase tracking-wider text-neutral-mid">Target</th>
                <th className="text-right py-2 px-4 font-medium text-xs uppercase tracking-wider text-neutral-mid">Revenue</th>
                <th className="text-right py-2 px-4 font-medium text-xs uppercase tracking-wider text-neutral-mid">Achievement</th>
                <th className="text-right py-2 px-4 font-medium text-xs uppercase tracking-wider text-neutral-mid">GP%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-pale/10">
              {unitMonthlyData.map((month) => (
                <tr key={month.month} className="hover:bg-secondary-pale/5 transition-colors">
                  <td className="py-3 px-4 font-medium text-neutral-dark">{month.month}</td>
                  <td className="py-3 px-4 text-right text-neutral-dark font-mono text-sm">{formatCurrency(month.target)}</td>
                  <td className="py-3 px-4 text-right text-neutral-dark font-mono text-sm">{formatCurrency(month.revenue)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-neutral-dark">
                      {formatPercentage(month.achievement)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-neutral-dark">
                      {formatPercentage(month.grossProfitMargin)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {unitMonthlyData.length > 0 && (
              <tfoot>
                <tr className="bg-gradient-to-r from-secondary-pale/20 to-secondary-pale/10 border-t-2 border-secondary-pale/30">
                  <td className="py-3 px-4 font-bold text-neutral-dark">Total</td>
                  <td className="py-3 px-4 text-right font-bold text-neutral-dark font-mono">
                    {formatCurrency(unitMonthlyData.reduce((sum, month) => sum + month.target, 0))}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-neutral-dark font-mono">
                    {formatCurrency(unitMonthlyData.reduce((sum, month) => sum + month.revenue, 0))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-neutral-dark">
                      {formatPercentage(selectedUnitData?.achievement || 0)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-neutral-dark">
                      {formatPercentage(((selectedUnitData?.target - selectedUnitData?.cost) / selectedUnitData?.target) * 100 || 0)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Achievement Summary */}
      {selectedUnitData && (
        <div className="dashboard-card">
          <h2 className="section-title">Achievement Summary</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Target */}
            <BaseCard 
              variant="elevated" 
              className="relative overflow-hidden group hover:scale-[1.02] transition-transform"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue/10 rounded-full -mr-12 -mt-12"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-accent-blue/5 rounded-full -ml-8 -mb-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-blue/20 to-accent-blue/10 rounded-xl flex items-center justify-center shadow-md">
                      <Target className="w-6 h-6 text-accent-blue" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wide">Target</p>
                      <p className="text-xs text-neutral-mid">{dataService.getPeriodLabel(periodFilter.period, periodFilter.month, periodFilter.quarter)}</p>
                    </div>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-neutral-dark mb-3">
                  {formatCurrency(selectedUnitData.target)}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-mid flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      Monthly Avg
                    </span>
                    <span className="font-semibold text-neutral-dark">
                      {formatCurrency(selectedUnitData.target / dataService.getPeriodMonths(periodFilter.year, periodFilter.period, periodFilter.month, periodFilter.quarter).length)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-mid flex items-center gap-1">
                      {selectedUnit === 'Transportation' ? (
                        <Truck className="w-3 h-3" />
                      ) : (
                        <Package className="w-3 h-3" />
                      )}
                      {selectedUnit} Avg
                    </span>
                    <span className="font-semibold text-neutral-dark">
                      {formatCurrency(selectedUnitData.target / dataService.getPeriodMonths(periodFilter.year, periodFilter.period, periodFilter.month, periodFilter.quarter).length)}
                    </span>
                  </div>
                </div>
              </div>
            </BaseCard>

            {/* Revenue Achieved */}
            <BaseCard 
              variant="elevated" 
              className="relative overflow-hidden group hover:scale-[1.02] transition-transform"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/5 rounded-full -ml-8 -mb-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center shadow-md">
                      <Banknote className="w-6 h-6 text-primary" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wide">Revenue Achieved</p>
                      <p className="text-xs text-neutral-mid">{dataService.getPeriodLabel(periodFilter.period, periodFilter.month, periodFilter.quarter)}</p>
                    </div>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-neutral-dark mb-3">
                  {formatCurrency(selectedUnitData.revenue)}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-neutral-mid flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Achievement
                    </span>
                    <span className={`text-lg font-bold ${
                      selectedUnitData.achievement >= 100 ? 'text-green-600' : 'text-neutral-dark'
                    }`}>
                      {formatPercentage(selectedUnitData.achievement)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-mid flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Customer Count
                    </span>
                    <span className="font-semibold text-neutral-dark">
                      {selectedUnitData.customerCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-mid flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      Avg Value/Customer
                    </span>
                    <span className="font-semibold text-neutral-dark">
                      {formatCurrency(selectedUnitData.customerCount > 0 ? selectedUnitData.revenue / selectedUnitData.customerCount : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </BaseCard>

            {/* Revenue Outperformance / Gap Analysis */}
            <BaseCard 
              variant="elevated" 
              className="relative overflow-hidden group hover:scale-[1.02] transition-transform"
            >
              {selectedUnitData.achievement >= 100 ? (
                <>
                  {/* Success gradient background - using brand primary colors */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-light/10 to-primary/5"></div>
                  
                  <div className="relative">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-lg">
                          <Trophy className="w-6 h-6 text-white" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-dark uppercase tracking-wider">
                            REVENUE OUTPERFORMANCE
                          </p>
                          <p className="text-xs text-neutral-mid">
                            {dataService.getPeriodLabel(periodFilter.period, periodFilter.month, periodFilter.quarter)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Separator Line */}
                    <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-4"></div>
                    
                    {/* Main Value Section */}
                    <div className="text-center mb-4">
                      <p className="text-3xl md:text-4xl font-bold text-primary mb-1">
                        +{formatCurrency(Math.abs(selectedUnitData.revenue - selectedUnitData.target))}
                      </p>
                      <div className="h-0.5 w-24 bg-primary/30 mx-auto"></div>
                    </div>
                    
                    {/* Metrics Box */}
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-neutral-mid uppercase tracking-wide">
                            TARGET EXCEEDANCE RATE
                          </p>
                          <span className="text-2xl font-bold text-primary">
                            +{formatPercentage(selectedUnitData.achievement - 100)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                          <span>Actual</span>
                          <div className="flex-1 h-px bg-primary/30"></div>
                          <span>{formatPercentage(selectedUnitData.achievement)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Deficit gradient background - using brand accent coral */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-coral/10 to-accent-coral/5"></div>
                  
                  <div className="relative">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-accent-coral to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                          <TrendingDown className="w-6 h-6 text-white" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-dark uppercase tracking-wider">
                            REVENUE TO GO
                          </p>
                          <p className="text-xs text-neutral-mid">
                            {dataService.getPeriodLabel(periodFilter.period, periodFilter.month, periodFilter.quarter)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Separator Line */}
                    <div className="h-px bg-gradient-to-r from-transparent via-accent-coral/20 to-transparent mb-4"></div>
                    
                    {/* Main Value Section */}
                    <div className="text-center mb-4">
                      <p className="text-3xl md:text-4xl font-bold text-accent-coral mb-1">
                        -{formatCurrency(Math.abs(selectedUnitData.target - selectedUnitData.revenue))}
                      </p>
                      <div className="h-0.5 w-24 bg-accent-coral/30 mx-auto mb-2"></div>
                      <p className="text-xs font-semibold text-accent-coral uppercase tracking-wider">
                        AMOUNT NEEDED
                      </p>
                    </div>
                    
                    {/* Metrics Box */}
                    <div className="bg-accent-coral/5 border border-accent-coral/10 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-neutral-mid uppercase tracking-wide">
                            TARGET ACHIEVEMENT GAP
                          </p>
                          <span className="text-2xl font-bold text-accent-coral">
                            -{formatPercentage(100 - selectedUnitData.achievement)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-accent-coral">
                          <span>Actual</span>
                          <div className="flex-1 h-px bg-accent-coral/30"></div>
                          <span>{formatPercentage(selectedUnitData.achievement)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </BaseCard>
          </div>
        </div>
      )}
    </div>
  )
}

export default BusinessUnits