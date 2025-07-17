import React, { useState, useEffect, useRef } from 'react'
import { Banknote, Target, TrendingUp, Percent, Loader2, Truck, Warehouse, Calendar, BarChart3, Package, Activity, Users, Shield, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import MetricCard from '../components/cards/MetricCard'
import ContentCard from '../components/cards/ContentCard'
import BaseCard from '../components/cards/BaseCard'
import GaugeChart from '../components/charts/GaugeChart'
import StickyPeriodFilter from '../components/filters/StickyPeriodFilter'
import { ExportButton } from '../components/export'
import ToolbarSection from '../components/layout/ToolbarSection'
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
      
      console.log('📊 Overview: Fetching data with filters:', {
        year: periodFilter.year,
        period: periodFilter.period,
        month: periodFilter.month,
        quarter: periodFilter.quarter,
        selectedMonths: periodFilter.selectedMonths,
        selectedYears: periodFilter.selectedYears
      });
      
      try {
        const data = await dataService.getOverviewData(
          periodFilter.year, 
          periodFilter.period,
          periodFilter.month,
          periodFilter.quarter
        );
        console.log('📊 Overview: Received data:', {
          revenue: data.overview?.revenue,
          target: data.overview?.target,
          serviceBreakdownCount: data.serviceBreakdown?.length
        });
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
      
      {/* Toolbar */}
      <ToolbarSection
        title={`Executive Overview - ${periodFilter.year}`}
        subtitle={`${dataService.getPeriodLabel(periodFilter.period)} performance metrics and key insights`}
      >
        <ExportButton 
          dashboardRef={dashboardRef}
          variant="glass"
          size="medium"
        />
      </ToolbarSection>

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
              {serviceBreakdown.map((unit) => (
                <BaseCard 
                  key={unit.service_type} 
                  variant="filled" 
                  padding="small"
                  className="transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {unit.service_type === 'Transportation' ? (
                          <Truck className="w-6 h-6 text-accent-blue" />
                        ) : (
                          <Warehouse className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{unit.service_type}</p>
                        <div className="flex items-baseline gap-3 mt-1">
                          <span className="text-xl font-bold text-primary">
                            {formatCurrency(unit.revenue)}
                          </span>
                          <span className="text-sm text-gray-500">
                            of {formatCurrency(unit.target)} target
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        unit.achievement_percentage >= 100 ? 'text-green-600' :
                        unit.achievement_percentage >= 80 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {formatPercentage(unit.achievement_percentage)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">achievement</p>
                    </div>
                  </div>
                </BaseCard>
              ))}
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