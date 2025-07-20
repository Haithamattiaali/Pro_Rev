import React, { useState, useEffect } from 'react'
import { Users, Award, TrendingUp, Loader2, Trophy, Star, Crown } from 'lucide-react'
import { formatCurrency, formatPercentage, getAchievementStatus } from '../utils/formatters'
import { cn } from '../utils/cn'
import StickyPeriodFilter from '../components/filters/StickyPeriodFilter'
import { ExportButton } from '../components/export'
import TableExportButton from '../components/buttons/TableExportButton'
import ToolbarSection from '../components/layout/ToolbarSection'
import BaseTable from '../components/common/BaseTable'
import { useFilter } from '../contexts/FilterContext'
import { useDataRefresh } from '../contexts/DataRefreshContext'
import dataService from '../services/dataService'
import exportService from '../services/exportService'

const Customers = () => {
  const { periodFilter } = useFilter()
  const { refreshTrigger, triggerRefresh } = useDataRefresh()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [customers, setCustomers] = useState([])
  const [customerAchievement, setCustomerAchievement] = useState([])
  const [serviceBreakdown, setServiceBreakdown] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const handleRetry = async () => {
    await triggerRefresh({
      showNotification: false,
      message: 'Retrying data fetch...'
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
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
        
        const [customersData, achievementData, breakdownData] = await Promise.all([
          dataService.getCustomerData(
            periodFilter.year, 
            periodFilter.period,
            periodFilter.month,
            periodFilter.quarter,
            multiSelectParams
          ),
          dataService.getCustomerAchievement(
            periodFilter.year, 
            periodFilter.period,
            periodFilter.month,
            periodFilter.quarter
          ),
          dataService.getCustomerServiceBreakdown(
            periodFilter.year, 
            periodFilter.period,
            periodFilter.month,
            periodFilter.quarter
          )
        ])
        
        setCustomers(customersData)
        setCustomerAchievement(achievementData)
        setServiceBreakdown(breakdownData)
        
        // Set first customer as selected by default, but preserve existing selection if customer still exists
        if (customersData.length > 0) {
          if (selectedCustomer) {
            // Check if currently selected customer still exists in new data
            const customerStillExists = customersData.some(c => c.customer === selectedCustomer)
            if (!customerStillExists) {
              setSelectedCustomer(customersData[0].customer)
            }
          } else {
            // No customer selected yet, select first one
            setSelectedCustomer(customersData[0].customer)
          }
        }
      } catch (err) {
        console.error('Error fetching customer data:', err)
        setError('Failed to load customer data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [periodFilter, refreshTrigger])

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

  const selectedCustomerData = customers.find(c => c.customer === selectedCustomer)
  const selectedAchievementData = customerAchievement.find(c => c.customer === selectedCustomer)
  
  // Sort customers by revenue for ranking
  const sortedCustomers = [...customers].sort((a, b) => b.revenue - a.revenue)

  // Check if no year is selected
  if (!periodFilter.year || periodFilter.period === 'NONE') {
    return (
      <div className="space-y-6">
        <StickyPeriodFilter useHierarchical={true} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-pale flex items-center justify-center">
              <Users className="w-8 h-8 text-neutral-mid" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-dark mb-2">No Data to Display</h3>
            <p className="text-neutral-mid">Please select a year to view customer data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <StickyPeriodFilter useHierarchical={true} />
      
      {/* Toolbar */}
      <ToolbarSection
        title="Customer Performance"
        subtitle="Analyze customer-specific achievements and contributions"
      >
        <ExportButton 
          dashboardRef={null}
          variant="glass"
          size="medium"
        />
      </ToolbarSection>

      {/* Top Customers Overview */}
      <div className="dashboard-card">
        <h2 className="section-title">Top Customers by Revenue</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {sortedCustomers.slice(0, 3).map((customer, index) => {
            // Calculate total revenue for percentage
            const totalRevenue = sortedCustomers.reduce((sum, c) => sum + c.revenue, 0);
            const revenuePercentage = ((customer.revenue / totalRevenue) * 100).toFixed(1);
            
            return (
              <div key={customer.customer} className="relative overflow-hidden rounded-lg bg-secondary-pale p-4 border border-secondary-light/50 hover:shadow-md transition-all">
                {/* Decorative gradient overlay */}
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 ${
                  index === 0 ? 'bg-primary-light/20' : 
                  index === 1 ? 'bg-accent-blue/10' : 
                  'bg-accent-coral/10'
                }`}></div>
                
                <div className="relative">
                  {/* Ranking Badge and Icon */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border ${
                        index === 0 ? 'border-primary-light/50' : 
                        index === 1 ? 'border-accent-blue/20' : 
                        'border-accent-coral/20'
                      }`}>
                        {index === 0 ? <Crown className="w-5 h-5 text-primary" /> :
                         index === 1 ? <Trophy className="w-5 h-5 text-accent-blue" /> :
                         <Star className="w-5 h-5 text-accent-coral" />}
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${
                          index === 0 ? 'text-primary' : 
                          index === 1 ? 'text-accent-blue' : 
                          'text-accent-coral'
                        }`}>
                          {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                        </p>
                        <h3 className="text-sm font-bold text-neutral-dark">{customer.customer}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Information */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-baseline justify-between">
                        <p className="text-xs font-semibold text-neutral-mid uppercase tracking-wide">Revenue</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-xs text-neutral-mid">Share:</p>
                          <p className="text-sm font-bold text-primary">{revenuePercentage}%</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-neutral-dark mt-1">
                        {formatCurrency(customer.revenue)}
                      </p>
                    </div>
                    
                    {/* Achievement with Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-neutral-mid uppercase tracking-wide">Achievement</p>
                        <p className="text-xs font-bold text-primary-dark">
                          {formatPercentage(customer.achievement)}
                        </p>
                      </div>
                      <div className="h-1.5 bg-neutral-light/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(customer.achievement, 100)}%`,
                            backgroundColor: '#721548'
                          }}
                        />
                      </div>
                    </div>

                    {/* Service Revenue Breakdown */}
                    <div className="pt-2 border-t border-secondary-light">
                      {(() => {
                        const breakdown = serviceBreakdown.find(sb => sb.customer === customer.customer);
                        if (breakdown) {
                          return (
                            <div className="space-y-1">
                              {breakdown.transportation > 0 && (
                                <div className="flex justify-between items-center">
                                  <p className="text-xs text-neutral-mid">Transportation:</p>
                                  <p className="text-xs font-semibold text-neutral-dark">{formatCurrency(breakdown.transportation)}</p>
                                </div>
                              )}
                              {breakdown.warehouses > 0 && (
                                <div className="flex justify-between items-center">
                                  <p className="text-xs text-neutral-mid">Warehouses:</p>
                                  <p className="text-xs font-semibold text-neutral-dark">{formatCurrency(breakdown.warehouses)}</p>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return <p className="text-xs text-neutral-mid">No service data</p>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Selector */}
      <div className="dashboard-card">
        <h2 className="section-title">Select Customer for Detailed Analysis</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {sortedCustomers.map((customer) => {
            // Calculate total revenue for percentage
            const totalRevenue = sortedCustomers.reduce((sum, c) => sum + c.revenue, 0);
            const revenuePercentage = ((customer.revenue / totalRevenue) * 100).toFixed(1);
            
            return (
              <button
                key={customer.customer}
                onClick={() => setSelectedCustomer(customer.customer)}
                className={`relative p-3 rounded-lg transition-all ${
                  selectedCustomer === customer.customer
                    ? 'bg-primary text-white shadow-lg scale-105'
                    : 'bg-white text-neutral-dark hover:bg-secondary-pale border border-neutral-light hover:shadow-md'
                }`}
              >
                <div className="space-y-2">
                  {/* Customer Name */}
                  <h3 className={`text-sm font-bold truncate ${
                    selectedCustomer === customer.customer ? 'text-white' : 'text-neutral-dark'
                  }`}>
                    {customer.customer}
                  </h3>
                  
                  {/* Revenue Info */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${
                        selectedCustomer === customer.customer ? 'text-white/80' : 'text-neutral-mid'
                      }`}>Revenue</span>
                      <span className={`text-xs font-semibold ${
                        selectedCustomer === customer.customer ? 'text-white' : 'text-neutral-dark'
                      }`}>
                        {formatCurrency(customer.revenue).replace('SAR ', '')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${
                        selectedCustomer === customer.customer ? 'text-white/80' : 'text-neutral-mid'
                      }`}>Share</span>
                      <span className={`text-xs font-semibold ${
                        selectedCustomer === customer.customer ? 'text-white' : 'text-primary'
                      }`}>
                        {revenuePercentage}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${
                        selectedCustomer === customer.customer ? 'text-white/80' : 'text-neutral-mid'
                      }`}>Achievement</span>
                      <span className={`text-xs font-semibold ${
                        selectedCustomer === customer.customer ? 'text-white' : 'text-primary-dark'
                      }`}>
                        {formatPercentage(customer.achievement)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Achievement Progress Bar */}
                  <div className={`h-1 rounded-full overflow-hidden ${
                    selectedCustomer === customer.customer ? 'bg-white/20' : 'bg-neutral-light/50'
                  }`}>
                    <div 
                      className={`h-full rounded-full transition-all ${
                        selectedCustomer === customer.customer ? 'bg-white' : 'bg-primary'
                      }`}
                      style={{ 
                        width: `${Math.min(customer.achievement, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Customer Details */}
      {selectedCustomerData && (
        <div className="dashboard-card">
          <h2 className="section-title flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span>{selectedCustomer} - {dataService.getPeriodLabel(periodFilter.period)} Performance</span>
          </h2>
          
          {/* Key Metrics */}
          <div className={`grid grid-cols-2 ${selectedCustomerData.revenue > 0 ? 'md:grid-cols-6' : 'md:grid-cols-4'} gap-4 mb-6`}>
            <div className="text-center p-4 bg-secondary-pale rounded-lg">
              <p className="metric-label">Revenue</p>
              <p className="text-xl font-bold text-primary mt-1">
                {formatCurrency(selectedCustomerData.revenue)}
              </p>
            </div>
            <div className="text-center p-4 bg-secondary-pale rounded-lg">
              <p className="metric-label">Target</p>
              <p className="text-xl font-bold text-primary-dark mt-1">
                {formatCurrency(selectedCustomerData.target)}
              </p>
            </div>
            <div className="text-center p-4 bg-secondary-pale rounded-lg">
              <p className="metric-label">Achievement</p>
              <p className={`text-xl font-bold mt-1 ${
                getAchievementStatus(selectedCustomerData.achievement) === 'high' ? 'text-green-600' :
                getAchievementStatus(selectedCustomerData.achievement) === 'medium' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {formatPercentage(selectedCustomerData.achievement)}
              </p>
            </div>
            <div className="text-center p-4 bg-secondary-pale rounded-lg">
              <p className="metric-label">Cost</p>
              <p className="text-xl font-bold text-accent-coral mt-1">
                {formatCurrency(selectedCustomerData.cost)}
              </p>
            </div>
            {selectedCustomerData.revenue > 0 && (
              <>
                <div className="text-center p-4 bg-secondary-pale rounded-lg">
                  <p className="metric-label">Profit</p>
                  <p className="text-xl font-bold text-accent-blue mt-1">
                    {formatCurrency(selectedCustomerData.profit)}
                  </p>
                </div>
                <div className="text-center p-4 bg-secondary-pale rounded-lg">
                  <p className="metric-label">Profit Margin</p>
                  <p className="text-xl font-bold text-accent-blue mt-1">
                    {formatPercentage(selectedCustomerData.profitMargin)}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Service Breakdown */}
          {selectedAchievementData && selectedAchievementData.services.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-secondary-pale/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-secondary-pale/20 bg-gradient-to-r from-white to-secondary-pale/5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-primary-dark">Service Breakdown</h3>
                  <TableExportButton
                    data={selectedAchievementData.services}
                    filename={`${selectedCustomer}-service-breakdown`}
                    headers={['serviceType', 'revenue', 'target', 'achievement']}
                    variant="inline"
                    size="small"
                  />
                </div>
              </div>
              
              <BaseTable variant="compact">
                <BaseTable.Header variant="minimal">
                  <BaseTable.Row>
                    <BaseTable.Head>Service Type</BaseTable.Head>
                    <BaseTable.Head align="right">Revenue</BaseTable.Head>
                    <BaseTable.Head align="right">Target</BaseTable.Head>
                    <BaseTable.Head align="right">Achievement</BaseTable.Head>
                  </BaseTable.Row>
                </BaseTable.Header>
                
                <BaseTable.Body>
                  {selectedAchievementData.services.map((service) => (
                    <BaseTable.Row key={service.serviceType}>
                      <BaseTable.Cell variant="header">{service.serviceType}</BaseTable.Cell>
                      <BaseTable.Cell align="right" variant="currency">{formatCurrency(service.revenue)}</BaseTable.Cell>
                      <BaseTable.Cell align="right" variant="currency">{formatCurrency(service.target)}</BaseTable.Cell>
                      <BaseTable.Cell align="right" variant="percentage">
                        <span className={cn(
                          getAchievementStatus(service.achievement) === 'high' ? 'text-green-600' :
                          getAchievementStatus(service.achievement) === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        )}>
                          {formatPercentage(service.achievement)}
                        </span>
                      </BaseTable.Cell>
                    </BaseTable.Row>
                  ))}
                </BaseTable.Body>
                
                <BaseTable.Footer variant="minimal">
                  <BaseTable.Row>
                    <BaseTable.Cell variant="footer">Total</BaseTable.Cell>
                    <BaseTable.Cell align="right" variant="footer">
                      {formatCurrency(selectedAchievementData.totalRevenue)}
                    </BaseTable.Cell>
                    <BaseTable.Cell align="right" variant="footer">
                      {formatCurrency(selectedAchievementData.totalTarget)}
                    </BaseTable.Cell>
                    <BaseTable.Cell align="right" variant="footer">
                      <span className={cn(
                        getAchievementStatus(selectedAchievementData.overallAchievement) === 'high' ? 'text-green-600' :
                        getAchievementStatus(selectedAchievementData.overallAchievement) === 'medium' ? 'text-yellow-600' :
                        'text-red-600'
                      )}>
                        {formatPercentage(selectedAchievementData.overallAchievement)}
                      </span>
                    </BaseTable.Cell>
                  </BaseTable.Row>
                </BaseTable.Footer>
              </BaseTable>
            </div>
          )}
        </div>
      )}

      {/* All Customers Summary Table */}
      <BaseTable elevated variant="executive">
        <div className="px-6 py-4 border-b border-secondary-pale/20 bg-gradient-to-r from-white to-secondary-pale/5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-primary-dark">All Customers Summary</h2>
            <TableExportButton
              data={sortedCustomers.map((customer, index) => ({
                Customer: customer.customer,
                Target: customer.target,
                Revenue: customer.revenue,
                'Achievement %': customer.achievement,
                'GP %': customer.profitMargin
              }))}
              filename="all-customers-summary"
              variant="inline"
              size="small"
            />
          </div>
        </div>
        
        <BaseTable.Header variant="subtle">
          <BaseTable.Row>
            <BaseTable.Head>Customer</BaseTable.Head>
            <BaseTable.Head align="right">Target</BaseTable.Head>
            <BaseTable.Head align="right">Revenue</BaseTable.Head>
            <BaseTable.Head align="right">Achievement</BaseTable.Head>
            <BaseTable.Head align="right">GP%</BaseTable.Head>
          </BaseTable.Row>
        </BaseTable.Header>
        
        <BaseTable.Body>
          {sortedCustomers.length === 0 ? (
            <BaseTable.Empty message="No customer data available" icon={Users} />
          ) : (
            sortedCustomers.map((customer, index) => {
              const isSelected = selectedCustomer === customer.customer;
              
              return (
                <BaseTable.Row 
                  key={customer.customer}
                  clickable
                  selected={isSelected}
                  onClick={() => setSelectedCustomer(customer.customer)}
                >
                  <BaseTable.Cell variant="header">
                    <div className="flex items-center gap-2">
                      {index < 3 && (
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          index === 0 && 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white',
                          index === 1 && 'bg-gradient-to-br from-gray-300 to-gray-500 text-white',
                          index === 2 && 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                        )}>
                          {index === 0 && <Crown className="w-3 h-3" />}
                          {index === 1 && '2'}
                          {index === 2 && '3'}
                        </div>
                      )}
                      {customer.customer}
                    </div>
                  </BaseTable.Cell>
                  <BaseTable.Cell align="right" variant="currency">{formatCurrency(customer.target)}</BaseTable.Cell>
                  <BaseTable.Cell align="right" variant="currency">{formatCurrency(customer.revenue)}</BaseTable.Cell>
                  <BaseTable.Cell align="right" variant="percentage">
                    <span className={cn(
                      getAchievementStatus(customer.achievement) === 'high' ? 'text-green-600' :
                      getAchievementStatus(customer.achievement) === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    )}>
                      {formatPercentage(customer.achievement)}
                    </span>
                  </BaseTable.Cell>
                  <BaseTable.Cell align="right" variant="percentage">{formatPercentage(customer.profitMargin)}</BaseTable.Cell>
                </BaseTable.Row>
              );
            })
          )}
        </BaseTable.Body>
      </BaseTable>
    </div>
  )
}

export default Customers