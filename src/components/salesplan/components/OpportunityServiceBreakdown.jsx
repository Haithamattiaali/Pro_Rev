import React from 'react'
import { Truck, Package, Building2 } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'

const OpportunityServiceBreakdown = ({ serviceData }) => {
  if (!serviceData?.services || serviceData.services.length === 0) {
    return <div className="text-center text-gray-500 py-4">Loading service data...</div>
  }
  
  // Brand colors
  const COLORS = {
    '2PL': '#9e1f63',
    '3PL': '#005b8c',
    high: '#22c55e',
    medium: '#eab308',
    low: '#ef4444'
  }
  
  // Service type colors for pie chart
  const SERVICE_COLORS = ['#9e1f63', '#005b8c', '#e05e3d', '#721548']
  
  
  const getServiceIcon = (service) => {
    if (service.includes('2PL')) return Truck
    if (service.includes('B2B')) return Package
    if (service.includes('B2G')) return Building2
    return Package
  }
  
  const getGPColorClass = (gp) => {
    if (gp >= 30) return 'text-green-600 bg-green-50'
    if (gp >= 20) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }
  
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Service Type Analysis</h3>
      
      <div className="space-y-8">
        {/* 2PL vs 3PL Summary Cards at the top */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(serviceData.serviceCategories).map(([category, data], index) => {
          const is2PL = category === '2PL'
          const Icon = is2PL ? Truck : Building2
          
          return (
            <div key={category} className={`relative overflow-hidden rounded-2xl p-8 ${
              is2PL 
                ? 'bg-gradient-to-br from-primary/10 via-white to-primary/5 border-2 border-primary/20' 
                : 'bg-gradient-to-br from-accent-blue/10 via-white to-accent-blue/5 border-2 border-accent-blue/20'
            }`}>
              {/* Background Pattern */}
              <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 ${
                is2PL ? 'bg-primary' : 'bg-accent-blue'
              }`} style={{
                borderRadius: '0 0 0 100%',
              }}></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h4 className={`text-2xl font-bold ${
                      is2PL ? 'text-primary' : 'text-accent-blue'
                    }`}>{category}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {is2PL ? 'Transportation & Logistics' : 'Warehousing & Distribution'}
                    </p>
                  </div>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                    is2PL 
                      ? 'bg-gradient-to-br from-primary to-primary-dark' 
                      : 'bg-gradient-to-br from-accent-blue to-blue-600'
                  }`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Revenue */}
                  <div className={`p-4 rounded-xl ${
                    is2PL ? 'bg-primary/5' : 'bg-accent-blue/5'
                  }`}>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.revenue)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.revenue > 0 ? `${((data.revenue / (serviceData.serviceCategories['2PL'].revenue + serviceData.serviceCategories['3PL'].revenue)) * 100).toFixed(0)}% of total` : '0% of total'}
                    </p>
                  </div>
                  
                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-600">Opportunities</p>
                      <p className="text-2xl font-bold text-gray-900">{data.count}</p>
                      <p className="text-xs text-gray-500">Active deals</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-600">Gross Profit</p>
                      <p className={`text-2xl font-bold ${
                        data.avg_gp >= 0.3 ? 'text-green-600' : 
                        data.avg_gp >= 0.2 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(data.avg_gp * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">Average GP</p>
                    </div>
                  </div>
                  
                  {/* Visual Indicator */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Performance Score</span>
                      <span>{Math.round((data.avg_gp * 100 + (data.count > 5 ? 20 : data.count * 4)) / 2)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          is2PL 
                            ? 'bg-gradient-to-r from-primary-light to-primary' 
                            : 'bg-gradient-to-r from-accent-blue to-blue-600'
                        }`}
                        style={{ 
                          width: `${Math.min((data.avg_gp * 100 + (data.count > 5 ? 20 : data.count * 4)) / 2, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        </div>
        
        {/* Detailed Service Breakdown */}
        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-4">Service Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {serviceData.services.map((service, index) => {
              const Icon = getServiceIcon(service.service)
              return (
                <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-5 border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-sm`}
                           style={{ backgroundColor: SERVICE_COLORS[index % SERVICE_COLORS.length] + '20' }}>
                        <Icon className="w-6 h-6" style={{ color: SERVICE_COLORS[index % SERVICE_COLORS.length] }} />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900 text-lg">{service.service}</h5>
                        <p className="text-sm text-gray-600">{service.count} opportunities</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="font-bold text-xl text-gray-900">{formatCurrency(service.total_revenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Gross Profit</p>
                        <p className={`text-lg font-bold px-3 py-1 rounded-md ${
                          getGPColorClass(service.avg_gp_percent * 100)
                        }`}>
                          {(service.avg_gp_percent * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpportunityServiceBreakdown