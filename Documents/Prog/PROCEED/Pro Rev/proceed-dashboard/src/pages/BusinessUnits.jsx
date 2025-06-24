import React, { useState } from 'react'
import { Truck, Package } from 'lucide-react'
import { businessUnitLanding, businessUnitPeriod } from '../data/dashboardData'
import { formatCurrency, formatPercentage, getAchievementStatus, getGrossProfitStatus } from '../utils/formatters'
import PeriodComparisonChart from '../components/charts/PeriodComparisonChart'

const BusinessUnits = () => {
  const [selectedUnit, setSelectedUnit] = useState('Transportation')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-dark tracking-tight">Business Unit Performance</h1>
        <p className="text-neutral-mid mt-2">Detailed analysis by service type and period</p>
      </div>

      {/* Business Unit Selector */}
      <div className="flex space-x-4">
        {['Transportation', 'Warehouses'].map((unit) => (
          <button
            key={unit}
            onClick={() => setSelectedUnit(unit)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              selectedUnit === unit
                ? 'bg-primary text-white'
                : 'bg-white text-neutral-dark hover:bg-secondary-pale'
            }`}
          >
            {unit === 'Transportation' ? <Truck className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            <span>{unit}</span>
          </button>
        ))}
      </div>

      {/* Unit Overview */}
      <div className="dashboard-card">
        <h2 className="section-title">YTD Performance Summary</h2>
        {businessUnitLanding
          .filter(unit => unit.Service_Type === selectedUnit)
          .map(unit => (
            <div key={unit.Service_Type} className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-secondary-pale rounded-lg">
                <p className="metric-label">Target</p>
                <p className="text-xl font-bold text-primary-dark mt-1">{formatCurrency(unit.Target)}</p>
              </div>
              <div className="text-center p-4 bg-secondary-pale rounded-lg">
                <p className="metric-label">Revenue</p>
                <p className="text-xl font-bold text-primary mt-1">{formatCurrency(unit.Revenue)}</p>
              </div>
              <div className="text-center p-4 bg-secondary-pale rounded-lg">
                <p className="metric-label">Cost</p>
                <p className="text-xl font-bold text-accent-coral mt-1">{formatCurrency(unit.Cost)}</p>
              </div>
              <div className="text-center p-4 bg-secondary-pale rounded-lg">
                <p className="metric-label">Achievement</p>
                <p className={`text-xl font-bold mt-1 ${
                  getAchievementStatus(unit['Achievement %']) === 'high' ? 'text-green-600' :
                  getAchievementStatus(unit['Achievement %']) === 'medium' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {formatPercentage(unit['Achievement %'])}
                </p>
              </div>
              <div className="text-center p-4 bg-secondary-pale rounded-lg">
                <p className="metric-label">Gross Profit</p>
                <p className="text-xl font-bold text-accent-blue mt-1">{formatCurrency(unit['Gross Profit'])}</p>
              </div>
              <div className="text-center p-4 bg-secondary-pale rounded-lg">
                <p className="metric-label">GP Margin</p>
                <p className={`text-xl font-bold mt-1 ${
                  getGrossProfitStatus(unit['Gross Profit %']) === 'high' ? 'text-green-600' :
                  getGrossProfitStatus(unit['Gross Profit %']) === 'medium' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {formatPercentage(unit['Gross Profit %'])}
                </p>
              </div>
            </div>
          ))}
      </div>

      {/* Period Comparison Chart */}
      <div className="dashboard-card">
        <h2 className="section-title">Period Comparison</h2>
        <PeriodComparisonChart data={businessUnitPeriod} serviceType={selectedUnit} />
      </div>

      {/* Detailed Period Breakdown */}
      <div className="dashboard-card">
        <h2 className="section-title">Detailed Period Analysis</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Target</th>
                <th>Revenue</th>
                <th>Cost</th>
                <th>Achievement %</th>
                <th>Gross Profit</th>
                <th>GP Margin</th>
              </tr>
            </thead>
            <tbody>
              {businessUnitPeriod[selectedUnit].map((period, index) => (
                <tr key={index}>
                  <td className="font-semibold">{period.Period}</td>
                  <td>{formatCurrency(period.Target)}</td>
                  <td>{formatCurrency(period.Revenue)}</td>
                  <td>{formatCurrency(period.Cost)}</td>
                  <td>
                    <span className={`achievement-badge ${
                      getAchievementStatus(period['Achievement %']) === 'high' ? 'achievement-high' :
                      getAchievementStatus(period['Achievement %']) === 'medium' ? 'achievement-medium' :
                      'achievement-low'
                    }`}>
                      {formatPercentage(period['Achievement %'])}
                    </span>
                  </td>
                  <td className={period['Gross Profit'] < 0 ? 'text-red-600' : ''}>
                    {formatCurrency(period['Gross Profit'])}
                  </td>
                  <td className={period['Gross Profit %'] < 0 ? 'text-red-600' : ''}>
                    {formatPercentage(period['Gross Profit %'])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default BusinessUnits