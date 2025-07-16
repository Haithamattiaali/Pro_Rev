import React, { useState, useEffect } from 'react'
import { ChevronRight, AlertCircle, CheckCircle, Clock, Building2, Package, MapPin, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'

const OpportunityPipelineFlow = ({ pipeline }) => {
  const [selectedStage, setSelectedStage] = useState(null)
  const [allOpportunities, setAllOpportunities] = useState([])
  
  useEffect(() => {
    // Fetch all opportunities for the cards
    fetch(`${import.meta.env.VITE_API_URL}/opportunities`)
      .then(r => r.json())
      .then(data => {
        if (data?.opportunities) {
          setAllOpportunities(data.opportunities)
        }
      })
      .catch(console.error)
  }, [])
  
  if (!pipeline?.pipeline || pipeline.pipeline.length === 0) {
    return <div className="text-center text-gray-500 py-4">Loading pipeline data...</div>
  }
  
  // Define stage colors and icons
  const getStageStyle = (stage) => {
    switch (stage.order) {
      case 0:
        return {
          color: 'bg-gray-500',
          lightColor: 'bg-gray-50',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-700',
          icon: AlertCircle
        }
      case 1:
        return {
          color: 'bg-yellow-500',
          lightColor: 'bg-yellow-50',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-700',
          icon: Clock
        }
      case 2:
        return {
          color: 'bg-blue-500',
          lightColor: 'bg-blue-50',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-700',
          icon: AlertCircle
        }
      case 3:
        return {
          color: 'bg-green-500',
          lightColor: 'bg-green-50',
          borderColor: 'border-green-500',
          textColor: 'text-green-700',
          icon: CheckCircle
        }
      default:
        return {
          color: 'bg-gray-500',
          lightColor: 'bg-gray-50',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-700',
          icon: ChevronRight
        }
    }
  }
  
  const getGPColor = (gp) => {
    if (gp >= 30) return 'text-green-600'
    if (gp >= 20) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  return (
    <div className="space-y-6">
      {/* Pipeline Flow Visualization */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Opportunity Pipeline Status Flow</h3>
        
        {/* Pipeline Stages */}
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            {pipeline.pipeline.map((stage, index) => {
              const style = getStageStyle(stage)
              const Icon = style.icon
              const isSelected = selectedStage === index
              
              return (
                <div key={index} className="flex-1 relative">
                  {/* Connection Line */}
                  {index < pipeline.pipeline.length - 1 && (
                    <div className="absolute top-10 left-1/2 w-full h-1 bg-gray-200">
                      <div 
                        className={`h-full ${style.color} transition-all duration-500`}
                        style={{ 
                          width: stage.count > 0 ? '100%' : '0%',
                          opacity: stage.count > 0 ? 1 : 0.3
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Stage Card */}
                  <button
                    onClick={() => setSelectedStage(isSelected ? null : index)}
                    className={`relative z-10 w-full max-w-[200px] mx-auto cursor-pointer transition-all ${
                      isSelected ? 'scale-105' : 'hover:scale-102'
                    }`}
                  >
                    <div className={`${style.lightColor} rounded-lg p-4 border-2 ${style.borderColor} ${
                      isSelected ? 'shadow-lg' : ''
                    }`}>
                      <div className="flex items-center justify-center mb-2">
                        <div className={`w-12 h-12 rounded-full ${style.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      
                      <h4 className={`font-semibold ${style.textColor} text-sm mb-1`}>
                        {stage.stage}
                      </h4>
                      
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-gray-900">
                          {stage.count || 0}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(stage.total_revenue || 0)}
                        </p>
                        <p className={`text-xs font-medium ${getGPColor(stage.avg_gp_percent)}`}>
                          {((stage.avg_gp_percent || 0) * 100).toFixed(1)}% GP
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
          
          {/* Stage Details */}
          {selectedStage !== null && pipeline.pipeline[selectedStage].projects?.length > 0 && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-3">
                Projects in {pipeline.pipeline[selectedStage].stage}
              </h5>
              <div className="space-y-2">
                {pipeline.pipeline[selectedStage].projects.map((project, idx) => (
                  <div key={idx} className="bg-white rounded-md p-3 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{project.project}</p>
                        <p className="text-sm text-gray-600">{project.service}</p>
                        <p className="text-xs text-gray-500 mt-1">{project.location || 'No location'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(project.est_monthly_revenue)}
                        </p>
                        <p className={`text-sm font-medium ${getGPColor(project.est_gp_percent)}`}>
                          {(project.est_gp_percent * 100).toFixed(1)}% GP
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Customer Opportunity Cards */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Opportunities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allOpportunities.map((opp, index) => {
            // Find which stage this opportunity belongs to
            const currentStage = pipeline.pipeline.find(stage => 
              stage.projects?.some(p => p.project === opp.project)
            )
            const stageIndex = currentStage ? pipeline.pipeline.indexOf(currentStage) : -1
            const stageStyle = currentStage ? getStageStyle(currentStage) : getStageStyle({ order: 0 })
            
            // Get service icon
            const ServiceIcon = opp.service?.includes('2PL') ? Package : Building2
            
            // GP color (est_gp_percent is stored as decimal, e.g., 0.30 = 30%)
            const gpColorClass = opp.est_gp_percent >= 0.30 ? 'text-green-600 bg-green-50' : 
                               opp.est_gp_percent >= 0.20 ? 'text-yellow-600 bg-yellow-50' : 
                               'text-red-600 bg-red-50'
            
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                {/* Status Bar */}
                <div className={`h-2 ${stageStyle.color}`}></div>
                
                {/* Card Content */}
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{opp.project}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <ServiceIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{opp.service}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${stageStyle.lightColor} ${stageStyle.textColor}`}>
                      {currentStage?.stage || 'Unknown'}
                    </div>
                  </div>
                  
                  {/* Revenue Section */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm text-gray-600">Monthly Revenue</span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(opp.est_monthly_revenue)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-500">Annual Potential</span>
                      <span className="text-sm font-semibold text-gray-700">
                        {formatCurrency(opp.est_monthly_revenue * 12)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Metrics Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{opp.location || 'No location'}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-md text-sm font-semibold ${gpColorClass}`}>
                      {(opp.est_gp_percent * 100).toFixed(1)}% GP
                    </div>
                  </div>
                  
                  {/* Pipeline Progress */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>Pipeline Progress</span>
                      <span>{stageIndex >= 0 ? `Stage ${stageIndex + 1} of ${pipeline.pipeline.length}` : 'Not Started'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${stageStyle.color}`}
                        style={{ 
                          width: stageIndex >= 0 ? `${((stageIndex + 1) / pipeline.pipeline.length) * 100}%` : '0%' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default OpportunityPipelineFlow