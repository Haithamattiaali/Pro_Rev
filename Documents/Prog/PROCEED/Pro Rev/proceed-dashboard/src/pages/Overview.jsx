import React from 'react'
import { DollarSign, Target, TrendingUp, Percent } from 'lucide-react'
import MetricCard from '../components/cards/MetricCard'
import GaugeChart from '../components/charts/GaugeChart'
import { landingAchievement, businessUnitLanding } from '../data/dashboardData'
import { formatCurrency, formatPercentage, getAchievementStatus } from '../utils/formatters'

const Overview = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-dark tracking-tight">
          Executive Overview - {landingAchievement.Year}
        </h1>
        <p className="text-neutral-mid mt-2">Comprehensive performance metrics and key insights</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={landingAchievement['Total Revenue']}
          icon={DollarSign}
          trend="up"
          trendValue={`${formatPercentage(landingAchievement['Total Achievement %'] - 100)} vs Target`}
        />
        <MetricCard
          title="Target"
          value={landingAchievement['Total Target']}
          icon={Target}
        />
        <MetricCard
          title="Gross Profit"
          value={landingAchievement['Total Gross Profit']}
          icon={TrendingUp}
        />
        <MetricCard
          title="Gross Profit Margin"
          value={landingAchievement['Total Gross Profit %']}
          format="percentage"
          icon={Percent}
        />
      </div>

      {/* Achievement Gauge */}
      <div className="dashboard-card">
        <h2 className="section-title">Overall Achievement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GaugeChart
            value={landingAchievement['Total Achievement %']}
            title="YTD Achievement"
          />
          
          <div className="col-span-2">
            <h3 className="text-lg font-semibold text-secondary mb-4">Business Unit Performance</h3>
            <div className="space-y-4">
              {businessUnitLanding.map((unit) => (
                <div key={unit.Service_Type} className="flex items-center justify-between p-4 bg-secondary-pale rounded-lg">
                  <div>
                    <p className="font-semibold text-neutral-dark">{unit.Service_Type}</p>
                    <p className="text-sm text-neutral-mid mt-1">
                      Revenue: {formatCurrency(unit.Revenue)} | Target: {formatCurrency(unit.Target)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      getAchievementStatus(unit['Achievement %']) === 'high' ? 'text-green-600' :
                      getAchievementStatus(unit['Achievement %']) === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {formatPercentage(unit['Achievement %'])}
                    </p>
                    <p className="text-xs text-neutral-mid">Achievement</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="dashboard-card">
        <h2 className="section-title">Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-primary-light bg-opacity-20 rounded-lg">
            <p className="text-sm font-semibold text-neutral-mid uppercase">Total Cost</p>
            <p className="text-2xl font-bold text-primary mt-2">
              {formatCurrency(landingAchievement['Total Cost'])}
            </p>
          </div>
          <div className="text-center p-4 bg-accent-blue bg-opacity-20 rounded-lg">
            <p className="text-sm font-semibold text-neutral-mid uppercase">Revenue vs Target</p>
            <p className="text-2xl font-bold text-accent-blue mt-2">
              +{formatCurrency(landingAchievement['Total Revenue'] - landingAchievement['Total Target'])}
            </p>
          </div>
          <div className="text-center p-4 bg-accent-coral bg-opacity-20 rounded-lg">
            <p className="text-sm font-semibold text-neutral-mid uppercase">Cost Ratio</p>
            <p className="text-2xl font-bold text-accent-coral mt-2">
              {formatPercentage((landingAchievement['Total Cost'] / landingAchievement['Total Revenue']) * 100)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview