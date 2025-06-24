import React, { useState, useEffect } from 'react'
import { Truck, Package, Loader2, Users, TrendingUp, FileText } from 'lucide-react'
import { formatCurrency, formatPercentage, getAchievementStatus, getGrossProfitStatus } from '../utils/formatters'
import BusinessUnitBarChart from '../components/charts/BusinessUnitBarChart'
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
  }, [periodFilter, selectedUnit])

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
            <div className="relative overflow-hidden rounded-lg bg-secondary-pale p-6 border border-secondary-light/50 hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary-light/20 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-primary-light/50">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wide">Customer Count</p>
                </div>
                <p className="text-3xl font-bold text-neutral-dark">{selectedUnitData.customerCount || 0}</p>
                <p className="text-xs text-neutral-mid mt-1">Active customers</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg bg-secondary-pale p-6 border border-secondary-light/50 hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent-blue/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-accent-blue/20">
                    <TrendingUp className="w-5 h-5 text-accent-blue" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wide">Avg Revenue per Customer</p>
                </div>
                <p className="text-3xl font-bold text-neutral-dark">
                  {formatCurrency(selectedUnitData.customerCount > 0 ? selectedUnitData.revenue / selectedUnitData.customerCount : 0)}
                </p>
                <p className="text-xs text-neutral-mid mt-1">Per customer revenue</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg bg-secondary-pale p-6 border border-secondary-light/50 hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent-coral/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-accent-coral/20">
                    <FileText className="w-5 h-5 text-accent-coral" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wide">Receivables</p>
                </div>
                <p className="text-3xl font-bold text-neutral-dark">
                  {formatCurrency(selectedUnitData.receivables)}
                </p>
                <p className="text-xs text-neutral-mid mt-1">Outstanding amount</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BusinessUnits