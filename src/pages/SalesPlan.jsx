import React, { useState, useEffect, useRef } from 'react'
import { useFilter } from '../contexts/FilterContext'
import { SalesPlanProvider, useSalesPlanData } from '../contexts/SalesPlanContext'
import dataService from '../services/dataService'
import MetricCard from '../components/cards/MetricCard'
import { TrendingUp, FileSpreadsheet, Target } from 'lucide-react'
import { ExportButton } from '../components/export'
import StickyPeriodFilter from '../components/filters/StickyPeriodFilter'
import ToolbarSection from '../components/layout/ToolbarSection'
// Import chart components
import GLChart from '../components/salesplan/charts/GLChart'
import BusinessUnitChart from '../components/salesplan/charts/BusinessUnitChart'
import MonthlyChart from '../components/salesplan/charts/MonthlyChart'
import OpportunitiesChart from '../components/salesplan/charts/OpportunitiesChart'

// Import table components
import GLTable from '../components/salesplan/tables/GLTable'
import BusinessUnitTable from '../components/salesplan/tables/BusinessUnitTable'
import MonthlyTable from '../components/salesplan/tables/MonthlyTable'

const SalesPlanContent = () => {
  const { periodFilter } = useFilter()
  const { setActualDateRange } = useSalesPlanData()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('gl')
  const dashboardRef = useRef(null)
  
  // Data states
  const [overviewData, setOverviewData] = useState(null)
  const [glData, setGlData] = useState(null)
  const [businessUnitData, setBusinessUnitData] = useState(null)
  const [monthlyData, setMonthlyData] = useState(null)
  const [opportunitiesData, setOpportunitiesData] = useState(null)

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // Clear cache when switching modes to ensure fresh data
      if (periodFilter.multiSelectMode) {
        dataService.clearCache();
      }
      
      try {
        const { year, period, month, quarter } = periodFilter
        
        // Prepare multi-select parameters if in multi-select mode
        let multiSelectParams = null;
        
        // Use multi-select if multiSelectMode is true (regardless of selections)
        if (periodFilter.multiSelectMode === true && periodFilter.viewMode !== 'yearly') {
          // Build periods array from selectedQuarters/selectedMonths
          let periods = [];
          
          // For quarterly view mode, if no specific quarters selected, assume all quarters
          if (periodFilter.viewMode === 'quarterly') {
            if (periodFilter.selectedQuarters && periodFilter.selectedQuarters.length > 0) {
              periods = periodFilter.selectedQuarters.map(q => `Q${q}`);
            } else {
              // Default to all quarters if none selected
              periods = ['Q1', 'Q2', 'Q3', 'Q4'];
            }
          } else if (periodFilter.viewMode === 'monthly') {
            if (periodFilter.selectedMonths && periodFilter.selectedMonths.length > 0) {
              periods = periodFilter.selectedMonths.map(m => String(m));
            } else {
              // Default to all months if none selected
              periods = Array.from({ length: 12 }, (_, i) => String(i + 1));
            }
          }
          
          // Always create multiSelectParams when in multi-select mode
          multiSelectParams = {
            years: periodFilter.selectedYears || [periodFilter.year],
            periods: periods,
            viewMode: periodFilter.viewMode || 'quarterly'
          };
        }
        
        // Fetch all data in parallel
        const [overview, byGL, byBU, monthly, opportunities] = await Promise.all([
          dataService.getSalesPlanOverview(year, period, month, quarter, null, multiSelectParams),
          dataService.getSalesPlanByGL(year, period, month, quarter, null, multiSelectParams),
          // Business unit doesn't support multi-select yet, use regular endpoint
          multiSelectParams ? 
            { data: [], message: 'Multi-select not supported for Business Units yet' } :
            fetch(`${import.meta.env.VITE_API_URL}/sales-plan/by-business-unit?year=${year}&period=${period}${month ? `&month=${month}` : ''}${quarter ? `&quarter=${quarter}` : ''}`).then(r => r.json()),
          dataService.getSalesPlanMonthly(year, period, month, quarter, null, multiSelectParams),
          dataService.getOpportunities()
        ])
        
        
        setOverviewData(overview)
        setGlData(byGL)
        setBusinessUnitData(byBU)
        setMonthlyData(monthly)
        setOpportunitiesData(opportunities)
        
        // Update the actual date range in context
        if (overview && overview.actualDateRange) {
          setActualDateRange(overview.actualDateRange)
        }
      } catch (error) {
        console.error('Error fetching sales plan data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [periodFilter])

  // Get period label for display
  const getPeriodLabel = () => {
    const { period, month, quarter, year } = periodFilter
    switch (period) {
      case 'MTD':
        return month && month !== 'all' ? `${dataService.getCurrentPeriod().monthName} ${year}` : `Current Month ${year}`
      case 'QTD':
        return quarter && quarter !== 'all' ? `Q${quarter} ${year}` : `Current Quarter ${year}`
      default:
        return `Year to Date ${year}`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-mid">Loading sales plan data...</p>
        </div>
      </div>
    )
  }

  // Check if no year is selected
  if (!periodFilter.year || periodFilter.period === 'NONE') {
    return (
      <div className="p-6 bg-neutral-light min-h-screen">
        <StickyPeriodFilter useHierarchical={true} disableValidation={true} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data to Display</h3>
            <p className="text-gray-500">Please select a year to view sales plan data</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-neutral-light min-h-screen" ref={dashboardRef} data-dashboard="true">
      {/* Period Filter */}
      <StickyPeriodFilter useHierarchical={true} disableValidation={true} />

      {/* Toolbar */}
      <ToolbarSection
        title="Sales Plan"
        subtitle={getPeriodLabel()}
      >
        <ExportButton 
          dashboardRef={dashboardRef}
          variant="glass"
          size="medium"
        />
      </ToolbarSection>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MetricCard
          title="Baseline Forecast"
          value={overviewData?.totals?.total_baseline_forecast || 0}
          format="currency"
          icon={TrendingUp}
          iconColor="blue"
        />
        <MetricCard
          title="Opportunities"
          value={overviewData?.totals?.total_opportunity_value || 0}
          format="currency"
          icon={Target}
          iconColor="coral"
        />
        <MetricCard
          title="Total Forecast"
          value={overviewData?.totals?.total_forecast || 0}
          format="currency"
          icon={FileSpreadsheet}
          iconColor="primary"
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-1 grid grid-cols-4 gap-1 mb-6">
        <button
          onClick={() => setActiveTab('gl')}
          className={`px-4 py-3 rounded-md transition-all font-medium ${
            activeTab === 'gl' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-neutral-dark hover:bg-gray-50'
          }`}
        >
          By GL
        </button>
        <button
          onClick={() => setActiveTab('business-unit')}
          className={`px-4 py-3 rounded-md transition-all font-medium ${
            activeTab === 'business-unit' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-neutral-dark hover:bg-gray-50'
          }`}
        >
          By Business Unit
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-3 rounded-md transition-all font-medium ${
            activeTab === 'monthly' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-neutral-dark hover:bg-gray-50'
          }`}
        >
          By Month
        </button>
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`px-4 py-3 rounded-md transition-all font-medium ${
            activeTab === 'opportunities' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-neutral-dark hover:bg-gray-50'
          }`}
        >
          Opportunities
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* By GL Tab */}
        {activeTab === 'gl' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Plan by GL Account</h3>
                <GLChart data={glData} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <GLTable data={glData} />
              </div>
            </div>
          </div>
        )}

        {/* By Business Unit Tab */}
        {activeTab === 'business-unit' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Plan by Business Unit</h3>
                <BusinessUnitChart data={businessUnitData} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <BusinessUnitTable data={businessUnitData} />
              </div>
            </div>
          </div>
        )}

        {/* By Month Tab */}
        {activeTab === 'monthly' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales Plan</h3>
                <MonthlyChart data={monthlyData} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <MonthlyTable data={monthlyData} />
              </div>
            </div>
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunities Analysis</h3>
              <OpportunitiesChart data={opportunitiesData} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const SalesPlan = () => {
  return (
    <SalesPlanProvider>
      <SalesPlanContent />
    </SalesPlanProvider>
  )
}

export default SalesPlan