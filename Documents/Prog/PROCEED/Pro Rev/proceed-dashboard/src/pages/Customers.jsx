import React, { useState } from 'react'
import { Building, TrendingUp, AlertCircle } from 'lucide-react'
import { customerAchievement, customerByService } from '../data/dashboardData'
import { formatCurrency, formatPercentage, getAchievementStatus } from '../utils/formatters'
import CustomerPerformanceChart from '../components/charts/CustomerPerformanceChart'

const Customers = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('YTD')
  const [selectedService, setSelectedService] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  const getFilteredCustomers = () => {
    let customers = customerAchievement

    if (selectedService !== 'All') {
      const serviceCustomers = customerByService[selectedService]
      customers = customers.filter(c => 
        serviceCustomers.some(sc => sc.Customer === c.Customer)
      )
    }

    if (searchTerm) {
      customers = customers.filter(c => 
        c.Customer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return customers
  }

  const getTopPerformers = () => {
    return [...customerAchievement]
      .sort((a, b) => b['YTD Achievement %'] - a['YTD Achievement %'])
      .slice(0, 5)
  }

  const getUnderperformers = () => {
    return customerAchievement
      .filter(c => c['YTD Achievement %'] < 80)
      .sort((a, b) => a['YTD Achievement %'] - b['YTD Achievement %'])
  }

  const filteredCustomers = getFilteredCustomers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-dark tracking-tight">Customer Performance</h1>
        <p className="text-neutral-mid mt-2">Comprehensive customer achievement analysis</p>
      </div>

      {/* Controls */}
      <div className="dashboard-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-secondary-pale rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="YTD">Year to Date</option>
              <option value="QTD">Quarter to Date</option>
            </select>
            
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="px-4 py-2 border border-secondary-pale rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="All">All Services</option>
              <option value="Transportation">Transportation</option>
              <option value="Warehouses">Warehouses</option>
            </select>
          </div>
          
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-secondary-pale rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Performance Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-secondary">Top Performers</h3>
          </div>
          <div className="space-y-3">
            {getTopPerformers().map((customer) => (
              <div key={customer.Customer} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-semibold text-neutral-dark">{customer.Customer}</p>
                  <p className="text-sm text-neutral-mid">
                    Revenue: {formatCurrency(customer['YTD Revenue'])}
                  </p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatPercentage(customer['YTD Achievement %'])}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-secondary">Needs Attention</h3>
          </div>
          <div className="space-y-3">
            {getUnderperformers().slice(0, 5).map((customer) => (
              <div key={customer.Customer} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-semibold text-neutral-dark">{customer.Customer}</p>
                  <p className="text-sm text-neutral-mid">
                    Gap: {formatCurrency(customer['YTD Target'] - customer['YTD Revenue'])}
                  </p>
                </div>
                <p className="text-lg font-bold text-red-600">
                  {formatPercentage(customer['YTD Achievement %'])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Performance Chart */}
      <div className="dashboard-card">
        <h2 className="section-title">Customer Revenue Comparison</h2>
        <CustomerPerformanceChart data={filteredCustomers} period={selectedPeriod} />
      </div>

      {/* Detailed Customer Table */}
      <div className="dashboard-card">
        <h2 className="section-title">Detailed Customer Metrics</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>QTD Target</th>
                <th>QTD Revenue</th>
                <th>QTD Achievement</th>
                <th>YTD Target</th>
                <th>YTD Revenue</th>
                <th>YTD Achievement</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.Customer}>
                  <td className="font-semibold">{customer.Customer}</td>
                  <td>{formatCurrency(customer['QTD Target'])}</td>
                  <td>{formatCurrency(customer['QTD Revenue'])}</td>
                  <td>
                    <span className={`achievement-badge ${
                      getAchievementStatus(customer['QTD Achievement %']) === 'high' ? 'achievement-high' :
                      getAchievementStatus(customer['QTD Achievement %']) === 'medium' ? 'achievement-medium' :
                      'achievement-low'
                    }`}>
                      {formatPercentage(customer['QTD Achievement %'])}
                    </span>
                  </td>
                  <td>{formatCurrency(customer['YTD Target'])}</td>
                  <td>{formatCurrency(customer['YTD Revenue'])}</td>
                  <td>
                    <span className={`achievement-badge ${
                      getAchievementStatus(customer['YTD Achievement %']) === 'high' ? 'achievement-high' :
                      getAchievementStatus(customer['YTD Achievement %']) === 'medium' ? 'achievement-medium' :
                      'achievement-low'
                    }`}>
                      {formatPercentage(customer['YTD Achievement %'])}
                    </span>
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

export default Customers