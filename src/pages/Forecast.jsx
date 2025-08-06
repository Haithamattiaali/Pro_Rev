import React, { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Calculator, Package, Download, Target, DollarSign, Loader2, Settings } from 'lucide-react'
import { useFilter } from '../contexts/FilterContext'
import { useDataRefresh } from '../contexts/DataRefreshContext'
import dataService from '../services/dataService'
import StickyPeriodFilter from '../components/filters/StickyPeriodFilter'
import MetricCard from '../components/cards/MetricCard'
import ForecastChart from '../components/forecast/ForecastChart'
import EnhancedForecastChart from '../components/forecast/EnhancedForecastChart'
import ParallelPeriodChart from '../components/forecast/ParallelPeriodChart'
import OpportunityManager from '../components/forecast/OpportunityManager'
import ForecastMetrics from '../components/forecast/ForecastMetrics'
import SimplifiedPeriodSelector from '../components/forecast/SimplifiedPeriodSelector'
import ForecastSettingsModal from '../components/forecast/ForecastSettingsModal'
import { formatCurrency, formatPercentage } from '../utils/formatters'
import { addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns'

const Forecast = () => {
  const { periodFilter } = useFilter()
  const { refreshTrigger, triggerRefresh } = useDataRefresh()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [forecastData, setForecastData] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [forecastConfig, setForecastConfig] = useState({
    periods: 6,
    includeOpportunities: true,
    probabilityThreshold: 0.5
  })
  const [showSettings, setShowSettings] = useState(false)
  
  // New state for period selection and forecast method
  const [historicalPeriod, setHistoricalPeriod] = useState({
    start: subMonths(new Date(), 12),
    end: new Date()
  })
  const [forecastPeriod, setForecastPeriod] = useState({
    start: new Date(),
    end: addMonths(new Date(), 6)
  })
  const [forecastMethod, setForecastMethod] = useState('linear')
  const [methodConfig, setMethodConfig] = useState({
    trendWeight: 50,
    outlierSensitivity: 'medium',
    includeSeasonality: false,
    confidenceLevel: 90
  })

  const handleRetry = async () => {
    await triggerRefresh({
      showNotification: false,
      message: 'Retrying forecast data fetch...'
    })
  }

  useEffect(() => {
    fetchForecastData()
  }, [periodFilter.year, refreshTrigger, historicalPeriod, forecastPeriod, forecastMethod])

  const fetchForecastData = async () => {
    console.log('Fetching forecast data...')
    setLoading(true)
    setError(null)
    
    try {
      // Fetch forecast data and opportunities in parallel
      const [forecast, opps, config] = await Promise.all([
        dataService.getForecastData({
          historicalStart: historicalPeriod.start,
          historicalEnd: historicalPeriod.end,
          forecastStart: forecastPeriod.start,
          forecastEnd: forecastPeriod.end,
          method: forecastMethod,
          methodConfig: methodConfig
        }),
        dataService.getForecastOpportunities(),
        dataService.getForecastConfig()
      ])
      
      setForecastData(forecast)
      setOpportunities(Array.isArray(opps) ? opps : [])
      setForecastConfig(config)
    } catch (err) {
      console.error('Error fetching forecast data:', err)
      setError(`Failed to load forecast data: ${err.message || 'Unknown error'}`)
      // Set some default data to prevent blank screen
      setForecastData({ forecast: [], metrics: {} })
      setOpportunities([])
      setForecastConfig({ periods: 6, includeOpportunities: true, probabilityThreshold: 0.5 })
    } finally {
      setLoading(false)
    }
  }

  const handleConfigUpdate = async (newConfig) => {
    try {
      await dataService.updateForecastConfig(newConfig)
      setForecastConfig(newConfig)
      // Regenerate forecast with new config
      await regenerateForecast(newConfig)
    } catch (err) {
      console.error('Error updating config:', err)
    }
  }

  const regenerateForecast = async (config = forecastConfig) => {
    try {
      const forecast = await dataService.generateForecast({
        historicalStart: historicalPeriod.start,
        historicalEnd: historicalPeriod.end,
        forecastStart: forecastPeriod.start,
        forecastEnd: forecastPeriod.end,
        method: forecastMethod,
        methodConfig: methodConfig,
        ...config
      })
      setForecastData(forecast)
    } catch (err) {
      console.error('Error regenerating forecast:', err)
    }
  }

  const handleOpportunityUpdate = async (updatedOpportunities) => {
    setOpportunities(updatedOpportunities)
    // Regenerate forecast when opportunities change
    await regenerateForecast()
  }

  const exportForecast = async () => {
    try {
      await dataService.exportForecast(periodFilter.year)
    } catch (err) {
      console.error('Error exporting forecast:', err)
    }
  }

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

  const metrics = forecastData?.metrics || {}
  const serviceTypeData = metrics.serviceTypeDistribution || []

  return (
    <div className="space-y-6">
      {/* Header with integrated period selector */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-dark">
              PROCEED Revenue Forecast
            </h1>
            <p className="text-sm text-neutral-mid mt-1">3PL Revenue Analysis & Advanced Forecasting System</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-neutral-light rounded-lg transition-colors"
              title="Forecast Settings"
            >
              <Settings className="w-5 h-5 text-neutral-mid" />
            </button>
            <button
              onClick={exportForecast}
              className="flex items-center px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export
            </button>
          </div>
        </div>
        
        {/* Simplified Period Selector */}
        <SimplifiedPeriodSelector 
          historicalStart={historicalPeriod.start}
          historicalEnd={historicalPeriod.end}
          forecastStart={forecastPeriod.start}
          forecastEnd={forecastPeriod.end}
          onHistoricalChange={setHistoricalPeriod}
          onForecastChange={setForecastPeriod}
        />
      </div>
      
      {/* Settings Modal */}
      <ForecastSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        selectedMethod={forecastMethod}
        config={methodConfig}
        onConfigChange={setMethodConfig}
        onMethodChange={setForecastMethod}
      />

      {/* Forecast Total Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Baseline Forecast Total"
          value={forecastData?.forecast?.reduce((sum, f) => sum + (f.base || 0), 0) || 0}
          icon={TrendingUp}
          trend={0}
          trendLabel={`${forecastData?.forecast?.length || 0} months`}
          format="currency"
          color="green"
        />
        
        <MetricCard
          title="Opportunities Total"
          value={forecastData?.forecast?.reduce((sum, f) => sum + (f.opportunities || 0), 0) || 0}
          icon={Package}
          trend={Array.isArray(opportunities) ? opportunities.filter(o => o.enabled).length : 0}
          trendLabel="active opportunities"
          format="currency"
          color="blue"
        />
        
        <MetricCard
          title="Total Forecast"
          value={forecastData?.forecast?.reduce((sum, f) => sum + (f.total || 0), 0) || 0}
          icon={Target}
          trend={0}
          trendLabel="Baseline + Opportunities"
          format="currency"
          color="primary"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Forecast Overview
          </button>
          <button
            onClick={() => setActiveTab('businessUnits')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'businessUnits'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Business Unit Analysis
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'opportunities'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Opportunity Pipeline
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <ParallelPeriodChart 
                data={forecastData}
                showConfidenceBands={true}
              />
              <ForecastMetrics 
                forecastResults={forecastData?.forecast || []}
                config={forecastConfig}
              />
            </div>
          )}

          {activeTab === 'businessUnits' && (
            <BusinessUnitAnalysis 
              forecastData={forecastData}
            />
          )}

          {activeTab === 'opportunities' && (
            <OpportunityManager
              opportunities={opportunities}
              forecastConfig={forecastConfig}
              onOpportunitiesChange={handleOpportunityUpdate}
              onConfigChange={handleConfigUpdate}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Business Unit Analysis Component
const BusinessUnitAnalysis = ({ forecastData }) => {
  // Aggregate forecast data by business unit
  const businessUnitData = React.useMemo(() => {
    if (!forecastData?.forecast) return [];
    
    // For now, we'll create sample business units
    // In production, this would come from actual business unit data
    const units = ['Central', 'Eastern', 'Western', 'Northern', 'Southern'];
    
    return units.map(unit => {
      const unitForecast = forecastData.forecast.reduce((acc, month) => {
        // Distribute forecast proportionally across units (this is sample logic)
        const proportion = 1 / units.length;
        return {
          baseline: acc.baseline + (month.base * proportion),
          opportunities: acc.opportunities + (month.opportunities * proportion),
          total: acc.total + (month.total * proportion)
        };
      }, { baseline: 0, opportunities: 0, total: 0 });
      
      // Calculate achievement percentage (baseline vs target)
      const achievement = unitForecast.baseline > 0 ? 
        ((unitForecast.total / unitForecast.baseline) * 100) - 100 : 0;
      
      return {
        businessUnit: unit,
        baselineForecast: unitForecast.baseline,
        opportunities: unitForecast.opportunities,
        totalForecast: unitForecast.total,
        achievement: achievement
      };
    });
  }, [forecastData]);
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Unit Forecast Analysis</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business Unit
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Baseline Forecast
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Opportunities
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Forecast
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Growth Potential
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {businessUnitData.map((unit, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {unit.businessUnit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(unit.baselineForecast)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(unit.opportunities)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  {formatCurrency(unit.totalForecast)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    unit.achievement >= 10 ? 'bg-green-100 text-green-800' :
                    unit.achievement >= 5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    +{formatPercentage(unit.achievement)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Forecast