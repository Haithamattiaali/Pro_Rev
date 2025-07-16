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
  
  
  // Separate services by category
  const services2PL = serviceData.services.filter(s => s.service.includes('2PL'))
  const services3PL = serviceData.services.filter(s => !s.service.includes('2PL'))
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Service Type Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2PL Section */}
        <div className="space-y-4">
          {/* 2PL Summary Card */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-primary/10 via-white to-primary/5 border-2 border-primary/20">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 bg-primary" style={{
              borderRadius: '0 0 0 100%',
            }}></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-2xl font-bold text-primary">2PL</h4>
                  <p className="text-sm text-gray-600 mt-1">Transportation & Logistics</p>
                </div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-primary to-primary-dark">
                  <Truck className="w-7 h-7 text-white" />
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Revenue */}
                <div className="p-3 rounded-lg bg-primary/5">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(serviceData.serviceCategories['2PL'].revenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {serviceData.serviceCategories['2PL'].revenue > 0 ? `${((serviceData.serviceCategories['2PL'].revenue / (serviceData.serviceCategories['2PL'].revenue + serviceData.serviceCategories['3PL'].revenue)) * 100).toFixed(0)}% of total` : '0% of total'}
                  </p>
                </div>
                
                {/* Metrics Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-600">Opportunities</p>
                    <p className="text-xl font-bold text-gray-900">{serviceData.serviceCategories['2PL'].count}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-600">Avg GP</p>
                    <p className={`text-xl font-bold ${
                      serviceData.serviceCategories['2PL'].avg_gp >= 0.3 ? 'text-green-600' : 
                      serviceData.serviceCategories['2PL'].avg_gp >= 0.2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {(serviceData.serviceCategories['2PL'].avg_gp * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 2PL Services */}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-gray-600 px-1">2PL Services</h5>
            {services2PL.map((service, index) => {
              const Icon = getServiceIcon(service.service)
              return (
                <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h6 className="font-semibold text-gray-900">{service.service}</h6>
                        <p className="text-xs text-gray-600">{service.count} opportunities</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-600">Revenue</p>
                        <p className="font-bold text-lg text-gray-900">{formatCurrency(service.total_revenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold px-2 py-1 rounded-md ${
                          getGPColorClass(service.avg_gp_percent * 100)
                        }`}>
                          {(service.avg_gp_percent * 100).toFixed(1)}% GP
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* 3PL Section */}
        <div className="space-y-4">
          {/* 3PL Summary Card */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-accent-blue/10 via-white to-accent-blue/5 border-2 border-accent-blue/20">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 bg-accent-blue" style={{
              borderRadius: '0 0 0 100%',
            }}></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-2xl font-bold text-accent-blue">3PL</h4>
                  <p className="text-sm text-gray-600 mt-1">Warehousing & Distribution</p>
                </div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-accent-blue to-blue-600">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Revenue */}
                <div className="p-3 rounded-lg bg-accent-blue/5">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(serviceData.serviceCategories['3PL'].revenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {serviceData.serviceCategories['3PL'].revenue > 0 ? `${((serviceData.serviceCategories['3PL'].revenue / (serviceData.serviceCategories['2PL'].revenue + serviceData.serviceCategories['3PL'].revenue)) * 100).toFixed(0)}% of total` : '0% of total'}
                  </p>
                </div>
                
                {/* Metrics Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-600">Opportunities</p>
                    <p className="text-xl font-bold text-gray-900">{serviceData.serviceCategories['3PL'].count}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-600">Avg GP</p>
                    <p className={`text-xl font-bold ${
                      serviceData.serviceCategories['3PL'].avg_gp >= 0.3 ? 'text-green-600' : 
                      serviceData.serviceCategories['3PL'].avg_gp >= 0.2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {(serviceData.serviceCategories['3PL'].avg_gp * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 3PL Services */}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-gray-600 px-1">3PL Services</h5>
            {services3PL.map((service, index) => {
              const Icon = getServiceIcon(service.service)
              return (
                <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm bg-accent-blue/10">
                        <Icon className="w-5 h-5 text-accent-blue" />
                      </div>
                      <div className="flex-1">
                        <h6 className="font-semibold text-gray-900">{service.service}</h6>
                        <p className="text-xs text-gray-600">{service.count} opportunities</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-600">Revenue</p>
                        <p className="font-bold text-lg text-gray-900">{formatCurrency(service.total_revenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold px-2 py-1 rounded-md ${
                          getGPColorClass(service.avg_gp_percent * 100)
                        }`}>
                          {(service.avg_gp_percent * 100).toFixed(1)}% GP
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