import React, { useState, useEffect, useRef } from 'react'
import { Banknote, Target, TrendingUp, Percent, Loader2, Truck, Warehouse, Calendar, BarChart3, Package, Activity, Users, Shield, AlertTriangle, Clock, CheckCircle, Trophy, TrendingDown } from 'lucide-react'
import MetricCard from '../components/cards/MetricCard'
import ContentCard from '../components/cards/ContentCard'
import BaseCard from '../components/common/BaseCard'
import GaugeChart from '../components/charts/GaugeChart'
import StickyPeriodFilter from '../components/filters/StickyPeriodFilter'
import { ExportButton } from '../components/export'
import ToolbarSection from '../components/layout/ToolbarSection'
import { formatCurrency, formatPercentage, getAchievementStatus } from '../utils/formatters'
import { useFilter } from '../contexts/FilterContext'
import { useDataRefresh } from '../contexts/DataRefreshContext'
import { useHierarchicalFilter } from '../contexts/HierarchicalFilterContext'
import dataService from '../services/dataService'

const Overview = () => {
  const { periodFilter } = useFilter();
  const { validationData } = useHierarchicalFilter();
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
        selectedYears: periodFilter.selectedYears,
        selectedPeriods: periodFilter.selectedPeriods,
        multiSelectMode: periodFilter.multiSelectMode,
        viewMode: periodFilter.viewMode,
        rawFilter: periodFilter
      });
      
      try {
        // Prepare multi-select parameters if in multi-select mode
        let multiSelectParams = null;
        
        // Check if we have quarters or months selected (even single selection in multi-select mode)
        const hasQuarters = periodFilter.selectedQuarters && periodFilter.selectedQuarters.length > 0;
        const hasMonths = periodFilter.selectedMonths && periodFilter.selectedMonths.length > 0;
        const hasMultipleSelections = (periodFilter.selectedQuarters && periodFilter.selectedQuarters.length > 1) ||
                                     (periodFilter.selectedMonths && periodFilter.selectedMonths.length > 1) ||
                                     (periodFilter.selectedYears && periodFilter.selectedYears.length > 1);
        
        // Only use multi-select for quarterly/monthly modes, not yearly
        if (periodFilter.multiSelectMode && periodFilter.viewMode !== 'yearly' && (hasQuarters || hasMonths || hasMultipleSelections)) {
          // Build periods array from selectedQuarters/selectedMonths
          let periods = [];
          if (periodFilter.selectedQuarters && periodFilter.selectedQuarters.length > 0) {
            periods = periodFilter.selectedQuarters.map(q => `Q${q}`);
          } else if (periodFilter.selectedMonths && periodFilter.selectedMonths.length > 0) {
            periods = periodFilter.selectedMonths.map(m => String(m));
          }
          
          multiSelectParams = {
            years: periodFilter.selectedYears || [periodFilter.year],
            periods: periods,
            viewMode: periodFilter.viewMode || (periodFilter.selectedQuarters?.length > 0 ? 'quarterly' : 'monthly')
          };
        }
        
        console.log('📊 Overview: Calling API with:', {
          multiSelectMode: periodFilter.multiSelectMode,
          multiSelectParams,
          selectedPeriods: periodFilter.selectedPeriods,
          viewMode: periodFilter.viewMode,
          hasQuarters,
          hasMonths,
          hasMultipleSelections,
          periodFilter: {
            year: periodFilter.year,
            period: periodFilter.period,
            selectedYears: periodFilter.selectedYears,
            selectedMonths: periodFilter.selectedMonths,
            selectedQuarters: periodFilter.selectedQuarters
          }
        });
        
        const data = await dataService.getOverviewData(
          periodFilter.year, 
          periodFilter.period,
          periodFilter.month,
          periodFilter.quarter,
          multiSelectParams
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
      <StickyPeriodFilter useHierarchical={true} />
      
      {/* Toolbar */}
      <ToolbarSection
        title={`Executive Overview - ${periodFilter.year}`}
        subtitle={`${dataService.getPeriodLabel(periodFilter.period, periodFilter.month, periodFilter.quarter)} performance metrics and key insights`}
      >
        <ExportButton 
          dashboardRef={dashboardRef}
          variant="glass"
          size="medium"
        />
      </ToolbarSection>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
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
        {overview.revenue > 0 && (
          <MetricCard
            title="Gross Profit"
            value={overview.profit}
            icon={TrendingUp}
            iconColor="primary"
          />
        )}
        {overview.revenue > 0 && (
          <MetricCard
            title="Gross Profit Margin"
            value={overview.profitMargin}
            format="percentage"
            icon={Percent}
            iconColor="coral"
          />
        )}
      </div>

      {/* Achievement Gauge */}
      <ContentCard title="Overall Achievement" shadow="md">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="text-center">
            <GaugeChart
              value={overview.achievement}
              title={`${periodFilter.period} Achievement`}
              targetAmount={overview.target}
              currentAmount={overview.revenue}
            />
          </div>
          
          <div className="col-span-2">
            <h3 className="text-base md:text-lg font-semibold text-secondary mb-4">Business Unit Performance</h3>
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
                          <span className="text-lg md:text-xl font-bold text-primary">
                            {formatCurrency(unit.revenue)}
                          </span>
                          <span className="text-xs md:text-sm text-gray-500">
                            of {formatCurrency(unit.target)} target
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl md:text-2xl font-bold ${
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
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
                    <p className="text-xs text-neutral-mid">{dataService.getPeriodLabel(periodFilter.period, periodFilter.month, periodFilter.quarter)}</p>
                  </div>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-neutral-dark mb-3">
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
                {serviceBreakdown && serviceBreakdown.length > 0 && (
                  <>
                    {serviceBreakdown.map((service) => (
                      <div key={service.service_type} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-mid flex items-center gap-1">
                          {service.service_type === 'Transportation' ? (
                            <Truck className="w-3 h-3" />
                          ) : (
                            <Warehouse className="w-3 h-3" />
                          )}
                          {service.service_type} Avg
                        </span>
                        <span className="font-semibold text-neutral-dark">
                          {formatCurrency(service.target / dataService.getPeriodMonths(periodFilter.year, periodFilter.period, periodFilter.month, periodFilter.quarter).length)}
                        </span>
                      </div>
                    ))}
                  </>
                )}
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
                    <p className="text-xs text-neutral-mid">{dataService.getPeriodLabel(periodFilter.period, periodFilter.month, periodFilter.quarter)}</p>
                  </div>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-neutral-dark mb-3">
                {formatCurrency(overview.revenue)}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-neutral-mid flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Achievement
                  </span>
                  <span className={`text-lg font-bold ${
                    overview.achievement >= 100 ? 'text-green-600' : 'text-neutral-dark'
                  }`}>
                    {formatPercentage(overview.achievement)}
                  </span>
                </div>
                {serviceBreakdown && serviceBreakdown.length > 0 && (
                  <>
                    {serviceBreakdown.map((service) => (
                      <div key={service.service_type} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-mid flex items-center gap-1">
                          {service.service_type === 'Transportation' ? (
                            <Truck className="w-3 h-3" />
                          ) : (
                            <Warehouse className="w-3 h-3" />
                          )}
                          {service.service_type} Avg
                        </span>
                        <span className="font-semibold text-neutral-dark">
                          {formatCurrency(service.revenue / dataService.getPeriodMonths(periodFilter.year, periodFilter.period, periodFilter.month, periodFilter.quarter).length)}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </BaseCard>

          {/* Revenue Outperformance / Gap Analysis */}
          <BaseCard 
            variant="elevated" 
            className="relative overflow-hidden group hover:scale-[1.02] transition-transform"
          >
            {overview.achievement >= 100 ? (
              <>
                {/* Success gradient background - using brand primary colors */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-light/10 to-primary/5"></div>
                
                <div className="relative">
                  {/* Header Section */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-lg">
                        <Trophy className="w-6 h-6 text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-dark uppercase tracking-wider">
                          REVENUE OUTPERFORMANCE
                        </p>
                        <p className="text-xs text-neutral-mid">
                          {dataService.getPeriodLabel(periodFilter.period, periodFilter.month, periodFilter.quarter)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Separator Line */}
                  <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-4"></div>
                  
                  {/* Main Value Section */}
                  <div className="text-center mb-4">
                    <p className="text-3xl md:text-4xl font-bold text-primary mb-1">
                      +{formatCurrency(Math.abs(overview.revenue - overview.target))}
                    </p>
                    <div className="h-0.5 w-24 bg-primary/30 mx-auto"></div>
                  </div>
                  
                  {/* Metrics Box */}
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-neutral-mid uppercase tracking-wide">
                          TARGET EXCEEDANCE RATE
                        </p>
                        <span className="text-2xl font-bold text-primary">
                          +{formatPercentage(overview.achievement - 100)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <span>Actual</span>
                        <div className="flex-1 h-px bg-primary/30"></div>
                        <span>{formatPercentage(overview.achievement)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Deficit gradient background - using brand accent coral */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-coral/10 to-accent-coral/5"></div>
                
                <div className="relative">
                  {/* Header Section */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent-coral to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                        <TrendingDown className="w-6 h-6 text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-dark uppercase tracking-wider">
                          REVENUE TO GO
                        </p>
                        <p className="text-xs text-neutral-mid">
                          {dataService.getPeriodLabel(periodFilter.period, periodFilter.month, periodFilter.quarter)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Separator Line */}
                  <div className="h-px bg-gradient-to-r from-transparent via-accent-coral/20 to-transparent mb-4"></div>
                  
                  {/* Main Value Section */}
                  <div className="text-center mb-4">
                    <p className="text-3xl md:text-4xl font-bold text-accent-coral mb-1">
                      -{formatCurrency(Math.abs(overview.target - overview.revenue))}
                    </p>
                    <div className="h-0.5 w-24 bg-accent-coral/30 mx-auto mb-2"></div>
                    <p className="text-xs font-semibold text-accent-coral uppercase tracking-wider">
                      AMOUNT NEEDED
                    </p>
                  </div>
                  
                  {/* Metrics Box */}
                  <div className="bg-accent-coral/5 border border-accent-coral/10 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-neutral-mid uppercase tracking-wide">
                          TARGET ACHIEVEMENT GAP
                        </p>
                        <span className="text-2xl font-bold text-accent-coral">
                          -{formatPercentage(100 - overview.achievement)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-accent-coral">
                        <span>Actual</span>
                        <div className="flex-1 h-px bg-accent-coral/30"></div>
                        <span>{formatPercentage(overview.achievement)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </BaseCard>
        </div>
      </ContentCard>
    </div>
  )
}

export default Overview