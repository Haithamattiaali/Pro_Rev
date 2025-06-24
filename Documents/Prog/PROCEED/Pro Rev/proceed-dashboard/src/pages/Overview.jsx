import React, { useState, useEffect } from 'react'
import { DollarSign, Target, TrendingUp, Percent, Loader2 } from 'lucide-react'
import MetricCard from '../components/cards/MetricCard'
import GaugeChart from '../components/charts/GaugeChart'
import PeriodFilter from '../components/filters/PeriodFilter'
import { formatCurrency, formatPercentage, getAchievementStatus } from '../utils/formatters'
import { useFilter } from '../contexts/FilterContext'
import dataService from '../services/dataService'

const Overview = () => {
  const { periodFilter } = useFilter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overviewData, setOverviewData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await dataService.getOverviewData(periodFilter.year, periodFilter.period);
        setOverviewData(data);
      } catch (err) {
        console.error('Error fetching overview data:', err);
        setError('Failed to load overview data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [periodFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
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
    );
  }

  const { overview, serviceBreakdown } = overviewData || { overview: {}, serviceBreakdown: [] };

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <PeriodFilter />
      
      <div>
        <h1 className="text-3xl font-bold text-primary-dark tracking-tight">
          Executive Overview - {periodFilter.year}
        </h1>
        <p className="text-neutral-mid mt-2">
          {dataService.getPeriodLabel(periodFilter.period)} performance metrics and key insights
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={overview.revenue}
          icon={DollarSign}
          trend={overview.revenue >= overview.target ? "up" : "down"}
          trendValue={`${formatPercentage(overview.achievement - 100)} vs Target`}
        />
        <MetricCard
          title="Target"
          value={overview.target}
          icon={Target}
        />
        <MetricCard
          title="Gross Profit"
          value={overview.profit}
          icon={TrendingUp}
        />
        <MetricCard
          title="Gross Profit Margin"
          value={overview.profitMargin}
          format="percentage"
          icon={Percent}
        />
      </div>

      {/* Achievement Gauge */}
      <div className="dashboard-card">
        <h2 className="section-title">Overall Achievement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GaugeChart
            value={overview.achievement}
            title={`${periodFilter.period} Achievement`}
          />
          
          <div className="col-span-2">
            <h3 className="text-lg font-semibold text-secondary mb-4">Business Unit Performance</h3>
            <div className="space-y-4">
              {serviceBreakdown.map((unit) => (
                <div key={unit.service_type} className="flex items-center justify-between p-4 bg-secondary-pale rounded-lg">
                  <div>
                    <p className="font-semibold text-neutral-dark">{unit.service_type}</p>
                    <p className="text-sm text-neutral-mid mt-1">
                      Revenue: {formatCurrency(unit.revenue)} | Target: {formatCurrency(unit.target)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      getAchievementStatus(unit.achievement_percentage) === 'high' ? 'text-green-600' :
                      getAchievementStatus(unit.achievement_percentage) === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {formatPercentage(unit.achievement_percentage)}
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
          <div className="text-center p-4 bg-primary-light/20 rounded-lg">
            <p className="text-sm font-semibold text-neutral-mid uppercase">Total Cost</p>
            <p className="text-2xl font-bold text-primary mt-2">
              {formatCurrency(overview.cost)}
            </p>
          </div>
          <div className="text-center p-4 bg-accent-blue/20 rounded-lg">
            <p className="text-sm font-semibold text-neutral-mid uppercase">Revenue vs Target</p>
            <p className="text-2xl font-bold text-accent-blue mt-2">
              {overview.revenue - overview.target >= 0 ? '+' : ''}{formatCurrency(overview.revenue - overview.target)}
            </p>
          </div>
          <div className="text-center p-4 bg-accent-coral/20 rounded-lg">
            <p className="text-sm font-semibold text-neutral-mid uppercase">Cost Ratio</p>
            <p className="text-2xl font-bold text-accent-coral mt-2">
              {formatPercentage((overview.cost / overview.revenue) * 100)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview