import React, { useState, useEffect, useRef } from 'react'
import { Banknote, Target, TrendingUp, Percent, Loader2, Truck, Warehouse, Calendar, Users, Package, BarChart3, Activity, Clock, AlertTriangle, Shield, CheckCircle } from 'lucide-react'
import MetricCard from '../components/cards/MetricCard'
import EnhancedMetricCard from '../components/cards/EnhancedMetricCard'
import ContentCard from '../components/cards/ContentCard'
import BaseCard from '../components/cards/BaseCard'
import GaugeChart from '../components/charts/GaugeChart'
import StickyPeriodFilter from '../components/filters/StickyPeriodFilter'
import { ExportButton } from '../components/export'
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
  const dashboardRef = useRef(null);

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

  // Check if no year is selected
  if (!periodFilter.year || periodFilter.period === 'NONE') {
    return (
      <div className="space-y-6">
        <StickyPeriodFilter />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data to Display</h3>
            <p className="text-gray-500">Please select a year to view data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={dashboardRef} data-dashboard="true">
      {/* Period Filter */}
      <StickyPeriodFilter />
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark tracking-tight">
            Executive Overview - {periodFilter.year}
          </h1>
          <p className="text-neutral-mid mt-2">
            {dataService.getPeriodLabel(periodFilter.period)} performance metrics and key insights
          </p>
        </div>
        <ExportButton 
          dashboardRef={dashboardRef}
          variant="secondary"
          size="medium"
        />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedMetricCard
          title="Total Revenue"
          value={overview.revenue}
          icon={Banknote}
          iconColor="green"
          trend={overview.achievement >= 100 ? "up" : "down"}
          trendValue={`${formatPercentage(overview.achievement)}`}
          trendLabel="vs Target"
          progress={overview.achievement}
          progressLabel="Target Achievement"
          status={overview.achievement >= 100 ? "success" : overview.achievement >= 80 ? "warning" : "danger"}
          statusLabel={overview.achievement >= 100 ? "On Track" : "At Risk"}
          detail={`${formatCurrency(Math.abs(overview.revenue - overview.target))} ${overview.revenue >= overview.target ? 'over' : 'to go'}`}
          detailIcon={overview.revenue >= overview.target ? Shield : AlertTriangle}
          footer={`Updated ${new Date().toLocaleDateString()}`}
          footerIcon={Clock}
        />
        <EnhancedMetricCard
          title="Target"
          value={overview.target}
          icon={Target}
          iconColor="blue"
          subtitle={`${periodFilter.period} Target`}
          comparison={formatCurrency(overview.revenue)}
          comparisonLabel="Current Revenue"
          detail={`${dataService.getPeriodMonths(periodFilter.year, periodFilter.period, periodFilter.month, periodFilter.quarter).length} months period`}
          detailIcon={Calendar}
          alert={overview.achievement < 80 ? "Revenue is below 80% of target. Review action items." : null}
          alertType="warning"
        />
        <EnhancedMetricCard
          title="Gross Profit"
          value={overview.profit}
          icon={TrendingUp}
          iconColor="primary"
          trend={overview.profitMargin >= 25 ? "up" : "down"}
          trendValue={`${formatPercentage(overview.profitMargin)}`}
          trendLabel="Profit Margin"
          status={overview.profitMargin >= 30 ? "success" : overview.profitMargin >= 20 ? "warning" : "danger"}
          statusLabel={overview.profitMargin >= 30 ? "Healthy" : "Review"}
          detail={`From ${formatCurrency(overview.revenue)} revenue`}
          detailIcon={BarChart3}
        />
        <EnhancedMetricCard
          title="Gross Profit Margin"
          value={overview.profitMargin}
          format="percentage"
          icon={Percent}
          iconColor="coral"
          trend={overview.profitMargin >= 25 ? "up" : "down"}
          trendValue={overview.profitMargin >= 25 ? "Above 25%" : "Below 25%"}
          trendLabel="Industry Benchmark"
          progress={(overview.profitMargin / 40) * 100}
          progressLabel="Industry Best (40%)"
          detail={`Cost ratio: ${formatPercentage(100 - overview.profitMargin)}`}
          detailIcon={Activity}
        />
      </div>

      {/* Achievement Gauge */}
      <ContentCard title="Overall Achievement" shadow="md">
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
              {serviceBreakdown.map((unit) => {
                const isTransportation = unit.service_type === 'Transportation';
                const achievement = unit.achievement_percentage;
                const achievementStatus = getAchievementStatus(achievement);
                
                return (
                  <BaseCard 
                    key={unit.service_type} 
                    variant="elevated" 
                    padding="normal"
                    className="transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl shadow-md ${
                          isTransportation 
                            ? 'bg-gradient-to-br from-accent-blue/20 to-accent-blue/10' 
                            : 'bg-gradient-to-br from-primary/20 to-primary/10'
                        }`}>
                          {isTransportation ? (
                            <Truck className="w-8 h-8 text-accent-blue" strokeWidth={1.5} />
                          ) : (
                            <Warehouse className="w-8 h-8 text-primary" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-bold text-neutral-dark text-xl">{unit.service_type}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              achievementStatus === 'high' ? 'bg-green-100 text-green-700' :
                              achievementStatus === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {achievementStatus === 'high' ? (
                                <Shield className="w-3 h-3" />
                              ) : achievementStatus === 'medium' ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                              {achievementStatus === 'high' ? 'Exceeding' : 
                               achievementStatus === 'medium' ? 'On Track' : 'Behind'}
                            </span>
                          </div>
                          
                          {/* Metrics Grid */}
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div>
                              <div className="flex items-center gap-1 text-xs text-neutral-mid mb-1">
                                <Banknote className="w-3 h-3" />
                                <span>Revenue</span>
                              </div>
                              <p className={`font-bold text-lg ${
                                unit.revenue >= unit.target ? 'text-green-600' : 'text-neutral-dark'
                              }`}>
                                {formatCurrency(unit.revenue)}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 text-xs text-neutral-mid mb-1">
                                <Target className="w-3 h-3" />
                                <span>Target</span>
                              </div>
                              <p className="font-bold text-lg text-accent-blue">
                                {formatCurrency(unit.target)}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 text-xs text-neutral-mid mb-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>Gap/Surplus</span>
                              </div>
                              <p className={`font-bold text-lg ${
                                unit.revenue >= unit.target ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {unit.revenue >= unit.target ? '+' : ''}{formatCurrency(unit.revenue - unit.target)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-600">Achievement Progress</span>
                              <span className={`text-sm font-bold ${
                                achievementStatus === 'high' ? 'text-green-600' :
                                achievementStatus === 'medium' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {formatPercentage(achievement)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  achievement >= 100 ? 'bg-green-500' :
                                  achievement >= 80 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(achievement, 120)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Side Metrics */}
                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-xs text-neutral-mid">Profit Margin</p>
                          <p className={`text-lg font-bold ${
                            unit.profit_margin >= 30 ? 'text-green-600' :
                            unit.profit_margin >= 20 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {formatPercentage(unit.profit_margin || ((unit.revenue - (unit.cost || 0)) / unit.revenue * 100))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-mid">Customers</p>
                          <div className="flex items-center justify-end gap-1">
                            <Users className="w-4 h-4 text-neutral-mid" />
                            <span className="font-semibold">{unit.customer_count || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </BaseCard>
                );
              })}
            </div>
          </div>
        </div>
      </ContentCard>

      {/* Achievement Summary */}
      <ContentCard title="Achievement Summary" shadow="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <p className="text-xs text-neutral-mid">{periodFilter.period} Goal</p>
                  </div>
                </div>
                <div className="text-xs text-accent-blue font-medium bg-accent-blue/10 px-2 py-1 rounded-full">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {periodFilter.year}
                </div>
              </div>
              <p className="text-3xl font-bold text-neutral-dark mb-3">
                {formatCurrency(overview.target)}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Monthly Avg
                  </span>
                  <span className="font-semibold text-neutral-dark">
                    {formatCurrency(overview.target / dataService.getPeriodMonths(periodFilter.year, periodFilter.period, periodFilter.month, periodFilter.quarter).length)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    Per Unit
                  </span>
                  <span className="font-semibold text-neutral-dark">
                    {formatCurrency(overview.target / 2)}
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
                    <p className="text-xs text-neutral-mid">Actual Performance</p>
                  </div>
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                  overview.achievement >= 100 ? 'bg-green-100 text-green-700' : 
                  overview.achievement >= 80 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {overview.achievement >= 100 ? 'Exceeding' : overview.achievement >= 80 ? 'On Track' : 'Behind'}
                </div>
              </div>
              <p className="text-3xl font-bold text-neutral-dark mb-3">
                {formatCurrency(overview.revenue)}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Achievement
                  </span>
                  <span className={`font-semibold ${
                    overview.achievement >= 100 ? 'text-green-600' : 'text-neutral-dark'
                  }`}>
                    {formatPercentage(overview.achievement)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      overview.achievement >= 100 ? 'bg-green-500' :
                      overview.achievement >= 80 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(overview.achievement, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Per Business Unit
                  </span>
                  <span className="font-semibold text-neutral-dark">
                    {formatCurrency(overview.revenue / 2)}
                  </span>
                </div>
              </div>
            </div>
          </BaseCard>

          {/* To Go / Over Achievement */}
          <BaseCard 
            variant="elevated" 
            className="relative overflow-hidden group hover:scale-[1.02] transition-transform"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 ${
              overview.achievement >= 100 ? 'bg-green-100/20' : 'bg-accent-coral/10'
            }`}></div>
            <div className={`absolute bottom-0 left-0 w-16 h-16 rounded-full -ml-8 -mb-8 ${
              overview.achievement >= 100 ? 'bg-green-100/10' : 'bg-accent-coral/5'
            }`}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                    overview.achievement >= 100 
                      ? 'bg-gradient-to-br from-green-100 to-green-50' 
                      : 'bg-gradient-to-br from-accent-coral/20 to-accent-coral/10'
                  }`}>
                    {overview.achievement >= 100 ? (
                      <Shield className="w-6 h-6 text-green-600" strokeWidth={2} />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-accent-coral" strokeWidth={2} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-mid uppercase tracking-wide">
                      {overview.achievement >= 100 ? 'Over Achievement' : 'Gap to Target'}
                    </p>
                    <p className="text-xs text-neutral-mid">
                      {overview.achievement >= 100 ? 'Surplus Amount' : 'Amount Needed'}
                    </p>
                  </div>
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                  overview.achievement >= 100 ? 'bg-green-100 text-green-700' : 'bg-accent-coral/10 text-accent-coral'
                }`}>
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  {overview.achievement >= 100 ? 'Surplus' : 'Deficit'}
                </div>
              </div>
              <p className={`text-3xl font-bold mb-3 ${
                overview.achievement >= 100 ? 'text-green-600' : 'text-neutral-dark'
              }`}>
                {overview.achievement >= 100 
                  ? `+${formatCurrency(overview.revenue - overview.target)}`
                  : formatCurrency(overview.target - overview.revenue)
                }
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    {overview.achievement >= 100 ? 'Exceeded by' : 'Remaining'}
                  </span>
                  <span className={`font-semibold ${
                    overview.achievement >= 100 ? 'text-green-600' : 'text-accent-coral'
                  }`}>
                    {overview.achievement >= 100 
                      ? formatPercentage(overview.achievement - 100)
                      : formatPercentage(100 - overview.achievement)
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Days in Period
                  </span>
                  <span className="font-semibold text-neutral-dark">
                    {dataService.getPeriodMonths(periodFilter.year, periodFilter.period, periodFilter.month, periodFilter.quarter).length * 30}
                  </span>
                </div>
                {overview.achievement >= 100 && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Target Successfully Achieved!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </BaseCard>
        </div>
      </ContentCard>
    </div>
  )
}

export default Overview