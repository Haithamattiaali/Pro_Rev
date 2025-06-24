import React, { useState, useEffect } from 'react'
import { Truck, Package, Loader2 } from 'lucide-react'
import { formatCurrency, formatPercentage, getAchievementStatus, getGrossProfitStatus } from '../utils/formatters'
import PeriodComparisonChart from '../components/charts/PeriodComparisonChart'
import PeriodFilter from '../components/filters/PeriodFilter'
import { useFilter } from '../contexts/FilterContext'
import dataService from '../services/dataService'

const BusinessUnits = () => {
  const [selectedUnit, setSelectedUnit] = useState('Transportation')
  const { periodFilter } = useFilter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [businessUnits, setBusinessUnits] = useState([])
  const [monthlyTrends, setMonthlyTrends] = useState([])

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
          dataService.getMonthlyTrends(periodFilter.year)
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
  }, [periodFilter])

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
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Retry
        </button>
      </div>
    )
  }

  const selectedUnitData = businessUnits.find(unit => unit.businessUnit === selectedUnit)
  const unitMonthlyData = monthlyTrends.map(month => ({
    ...month,
    achievement: month.target > 0 ? (month.revenue / month.target) * 100 : 0,
    grossProfit: month.revenue - month.cost,
    grossProfitMargin: month.revenue > 0 ? ((month.revenue - month.cost) / month.revenue) * 100 : 0
  }))

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <PeriodFilter />
      
      <div>
        <h1 className="text-3xl font-bold text-primary-dark tracking-tight">Business Units Performance</h1>
        <p className="text-neutral-mid mt-2">Deep dive into service-specific metrics and trends</p>
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

      {/* Period Comparison Chart */}
      <div className="dashboard-card">
        <h2 className="section-title">Monthly Trends</h2>
        <PeriodComparisonChart 
          data={{ [selectedUnit]: unitMonthlyData }} 
          serviceType={selectedUnit} 
        />
      </div>

      {/* Detailed Period Breakdown */}
      <div className="dashboard-card">
        <h2 className="section-title">Monthly Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Target</th>
                <th>Revenue</th>
                <th>Cost</th>
                <th>Achievement %</th>
                <th>Gross Profit</th>
                <th>GP Margin</th>
              </tr>
            </thead>
            <tbody>
              {unitMonthlyData.map((month) => (
                <tr key={month.month}>
                  <td className="font-semibold">{month.month}</td>
                  <td>{formatCurrency(month.target)}</td>
                  <td>{formatCurrency(month.revenue)}</td>
                  <td>{formatCurrency(month.cost)}</td>
                  <td>
                    <span className={`achievement-badge ${
                      getAchievementStatus(month.achievement) === 'high' ? 'achievement-high' :
                      getAchievementStatus(month.achievement) === 'medium' ? 'achievement-medium' :
                      'achievement-low'
                    }`}>
                      {formatPercentage(month.achievement)}
                    </span>
                  </td>
                  <td>{formatCurrency(month.grossProfit)}</td>
                  <td>
                    <span className={`${
                      getGrossProfitStatus(month.grossProfitMargin) === 'high' ? 'text-green-600' :
                      getGrossProfitStatus(month.grossProfitMargin) === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {formatPercentage(month.grossProfitMargin)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Mix */}
      {selectedUnitData && (
        <div className="dashboard-card">
          <h2 className="section-title">Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-primary-light/20 rounded-lg">
              <p className="text-sm font-semibold text-neutral-mid uppercase">Customer Count</p>
              <p className="text-3xl font-bold text-primary mt-2">{selectedUnitData.customerCount || 0}</p>
            </div>
            <div className="text-center p-6 bg-accent-blue/20 rounded-lg">
              <p className="text-sm font-semibold text-neutral-mid uppercase">Avg Revenue per Customer</p>
              <p className="text-3xl font-bold text-accent-blue mt-2">
                {formatCurrency(selectedUnitData.customerCount > 0 ? selectedUnitData.revenue / selectedUnitData.customerCount : 0)}
              </p>
            </div>
            <div className="text-center p-6 bg-accent-coral/20 rounded-lg">
              <p className="text-sm font-semibold text-neutral-mid uppercase">Receivables</p>
              <p className="text-3xl font-bold text-accent-coral mt-2">
                {formatCurrency(selectedUnitData.receivables)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BusinessUnits