import React, { useState, useEffect } from 'react'
import { Users, Award, TrendingUp, Loader2 } from 'lucide-react'
import { formatCurrency, formatPercentage, getAchievementStatus } from '../utils/formatters'
import PeriodFilter from '../components/filters/PeriodFilter'
import { useFilter } from '../contexts/FilterContext'
import dataService from '../services/dataService'

const Customers = () => {
  const { periodFilter } = useFilter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [customers, setCustomers] = useState([])
  const [customerAchievement, setCustomerAchievement] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const [customersData, achievementData] = await Promise.all([
          dataService.getCustomerData(periodFilter.year, periodFilter.period),
          dataService.getCustomerAchievement(periodFilter.year, periodFilter.period)
        ])
        
        setCustomers(customersData)
        setCustomerAchievement(achievementData)
        
        // Set first customer as selected by default
        if (customersData.length > 0 && !selectedCustomer) {
          setSelectedCustomer(customersData[0].customer)
        }
      } catch (err) {
        console.error('Error fetching customer data:', err)
        setError('Failed to load customer data. Please try again.')
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

  const selectedCustomerData = customers.find(c => c.customer === selectedCustomer)
  const selectedAchievementData = customerAchievement.find(c => c.customer === selectedCustomer)
  
  // Sort customers by revenue for ranking
  const sortedCustomers = [...customers].sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <PeriodFilter />
      
      <div>
        <h1 className="text-3xl font-bold text-primary-dark tracking-tight">Customer Performance</h1>
        <p className="text-neutral-mid mt-2">Analyze customer-specific achievements and contributions</p>
      </div>

      {/* Top Customers Overview */}
      <div className="dashboard-card">
        <h2 className="section-title">Top Customers by Revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedCustomers.slice(0, 3).map((customer, index) => (
            <div key={customer.customer} className="bg-secondary-pale rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                  }`}>
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-neutral-dark">{customer.customer}</h3>
                </div>
                <Award className={`w-5 h-5 ${
                  index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-600'
                }`} />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-neutral-mid">Revenue: {formatCurrency(customer.revenue)}</p>
                <p className="text-sm text-neutral-mid">Achievement: {formatPercentage(customer.achievement)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Selector */}
      <div className="dashboard-card">
        <h2 className="section-title">Select Customer for Detailed Analysis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sortedCustomers.map((customer) => (
            <button
              key={customer.customer}
              onClick={() => setSelectedCustomer(customer.customer)}
              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                selectedCustomer === customer.customer
                  ? 'bg-primary text-white'
                  : 'bg-white text-neutral-dark hover:bg-secondary-pale border border-neutral-light'
              }`}
            >
              {customer.customer}
            </button>
          ))}
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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
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
          </div>

          {/* Service Breakdown */}
          {selectedAchievementData && selectedAchievementData.services.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-secondary mb-4">Service Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Service Type</th>
                      <th>Revenue</th>
                      <th>Target</th>
                      <th>Achievement %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAchievementData.services.map((service) => (
                      <tr key={service.serviceType}>
                        <td className="font-semibold">{service.serviceType}</td>
                        <td>{formatCurrency(service.revenue)}</td>
                        <td>{formatCurrency(service.target)}</td>
                        <td>
                          <span className={`achievement-badge ${
                            getAchievementStatus(service.achievement) === 'high' ? 'achievement-high' :
                            getAchievementStatus(service.achievement) === 'medium' ? 'achievement-medium' :
                            'achievement-low'
                          }`}>
                            {formatPercentage(service.achievement)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold bg-secondary-pale">
                      <td>Total</td>
                      <td>{formatCurrency(selectedAchievementData.totalRevenue)}</td>
                      <td>{formatCurrency(selectedAchievementData.totalTarget)}</td>
                      <td>
                        <span className={`achievement-badge ${
                          getAchievementStatus(selectedAchievementData.overallAchievement) === 'high' ? 'achievement-high' :
                          getAchievementStatus(selectedAchievementData.overallAchievement) === 'medium' ? 'achievement-medium' :
                          'achievement-low'
                        }`}>
                          {formatPercentage(selectedAchievementData.overallAchievement)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Customers Summary Table */}
      <div className="dashboard-card">
        <h2 className="section-title">All Customers Summary</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Customer</th>
                <th>Revenue</th>
                <th>Target</th>
                <th>Achievement %</th>
                <th>Services</th>
                <th>Profit Margin</th>
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.map((customer, index) => (
                <tr 
                  key={customer.customer}
                  className={selectedCustomer === customer.customer ? 'bg-primary-light/10' : ''}
                >
                  <td className="text-center font-bold">{index + 1}</td>
                  <td className="font-semibold">{customer.customer}</td>
                  <td>{formatCurrency(customer.revenue)}</td>
                  <td>{formatCurrency(customer.target)}</td>
                  <td>
                    <span className={`achievement-badge ${
                      getAchievementStatus(customer.achievement) === 'high' ? 'achievement-high' :
                      getAchievementStatus(customer.achievement) === 'medium' ? 'achievement-medium' :
                      'achievement-low'
                    }`}>
                      {formatPercentage(customer.achievement)}
                    </span>
                  </td>
                  <td>{customer.services.join(', ')}</td>
                  <td className="text-center">{formatPercentage(customer.profitMargin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Customers