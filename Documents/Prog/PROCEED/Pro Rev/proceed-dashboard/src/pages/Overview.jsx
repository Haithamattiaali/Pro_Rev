import React, { useState, useEffect } from 'react'
import { Banknote, Target, TrendingUp, Percent, Loader2, Truck, Warehouse } from 'lucide-react'
import MetricCard from '../components/cards/MetricCard'
import GaugeChart from '../components/charts/GaugeChart'
import StickyPeriodFilter from '../components/filters/StickyPeriodFilter'
import { formatCurrency, formatPercentage, getAchievementStatus } from '../utils/formatters'
import { useFilter } from '../contexts/FilterContext'
import { useDataRefresh } from '../contexts/DataRefreshContext'
import dataService from '../services/dataService'

const Overview = () => {
  const { periodFilter } = useFilter();
  const { refreshTrigger, triggerRefresh } = useDataRefresh();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overviewData, setOverviewData] = useState(null);

  const handleRetry = async () => {
    await triggerRefresh({
      showNotification: false,
      message: 'Retrying data fetch...'
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await dataService.getOverviewData(
          periodFilter.year, 
          periodFilter.period,
          periodFilter.month,
          periodFilter.quarter
        );
        setOverviewData(data);
      } catch (err) {
        console.error('Error fetching overview data:', err);
        setError('Failed to load overview data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [periodFilter, refreshTrigger]);

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
          onClick={handleRetry} 
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
      <StickyPeriodFilter />
      
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
          icon={Banknote}
          iconColor="green"
          trend="up"
          trendValue={`${formatPercentage(overview.achievement)} vs Target`}
        />
        <MetricCard
          title="Target"
          value={overview.target}
          icon={Target}
          iconColor="blue"
        />
        <MetricCard
          title="Gross Profit"
          value={overview.profit}
          icon={TrendingUp}
          iconColor="primary"
        />
        <MetricCard
          title="Gross Profit Margin"
          value={overview.profitMargin}
          format="percentage"
          icon={Percent}
          iconColor="coral"
        />
      </div>

      {/* Achievement Gauge */}
      <div className="dashboard-card">
        <h2 className="section-title">Overall Achievement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <GaugeChart
              value={overview.achievement}
              title={`${periodFilter.period} Achievement`}
              targetAmount={overview.target}
              currentAmount={overview.revenue}
            />
          </div>
          
          <div className="col-span-2">
            <h3 className="text-lg font-semibold text-secondary mb-4">Business Unit Performance</h3>
            <div className="space-y-4">
              {serviceBreakdown.map((unit) => (
                <div key={unit.service_type} className="flex items-center justify-between p-4 bg-secondary-pale rounded-lg transition-all hover:shadow-md">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {unit.service_type === 'Transportation' ? (
                        <Truck className="w-6 h-6 text-accent-blue" />
                      ) : (
                        <Warehouse className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-dark text-lg">{unit.service_type}</p>
                    <p className="text-sm mt-1">
                      <span className="font-semibold">Revenue:</span>{' '}
                      <span className={`font-bold ${
                        unit.revenue >= unit.target ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {formatCurrency(unit.revenue)}
                      </span>
                      <span className="text-neutral-mid mx-2">|</span>
                      <span className="font-semibold">Target:</span>{' '}
                      <span className="font-bold text-accent-blue">
                        {formatCurrency(unit.target)}
                      </span>
                    </p>
                    </div>
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

      {/* Achievement Summary */}
      <div className="dashboard-card">
        <h2 className="section-title">Achievement Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Target */}
          <div className="relative overflow-hidden rounded-lg bg-secondary-pale p-6 border border-secondary-light/50 hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-accent-blue/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-accent-blue/20">
                  <Target className="w-5 h-5 text-accent-blue" />
                </div>
                <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wide">Target</p>
              </div>
              <p className="text-3xl font-bold text-neutral-dark">
                {formatCurrency(overview.target)}
              </p>
              <p className="text-xs text-neutral-mid mt-1">{periodFilter.period} Target Amount</p>
            </div>
          </div>

          {/* Revenue Achieved */}
          <div className="relative overflow-hidden rounded-lg bg-secondary-pale p-6 border border-secondary-light/50 hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary-light/20 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-primary-light/50">
                  <Banknote className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wide">Revenue Achieved</p>
              </div>
              <p className="text-3xl font-bold text-neutral-dark">
                {formatCurrency(overview.revenue)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-20 bg-secondary-light rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(overview.achievement, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-mid">{formatPercentage(overview.achievement)} Achieved</p>
              </div>
            </div>
          </div>

          {/* To Go / Over Achievement */}
          <div className="relative overflow-hidden rounded-lg bg-secondary-pale p-6 border border-secondary-light/50 hover:shadow-md transition-all">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 ${
              overview.achievement >= 100 ? 'bg-green-100/30' : 'bg-accent-coral/10'
            }`}></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border ${
                  overview.achievement >= 100 ? 'border-green-200' : 'border-accent-coral/20'
                }`}>
                  <TrendingUp className={`w-5 h-5 ${
                    overview.achievement >= 100 ? 'text-green-600' : 'text-accent-coral'
                  }`} />
                </div>
                <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wide">
                  {overview.achievement >= 100 ? 'Over Achievement' : 'To Go'}
                </p>
              </div>
              <p className="text-3xl font-bold text-neutral-dark">
                {overview.achievement >= 100 
                  ? `+${formatCurrency(overview.revenue - overview.target)}`
                  : formatCurrency(overview.target - overview.revenue)
                }
              </p>
              <p className={`text-xs mt-1 ${
                overview.achievement >= 100 ? 'text-green-600 font-semibold' : 'text-neutral-mid'
              }`}>
                {overview.achievement < 100 
                  ? `${formatPercentage(100 - overview.achievement)} remaining`
                  : overview.achievement === 100
                  ? 'Target Achieved!'
                  : `Exceeded by ${formatPercentage(overview.achievement - 100)}`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview