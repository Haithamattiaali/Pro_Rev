import React, { useState, useEffect } from 'react'
import dataService from '../../../services/dataService'
import OpportunityInsights from '../components/OpportunityInsights'
import OpportunityPipeline from '../components/OpportunityPipeline'
import OpportunityPipelineFlow from '../components/OpportunityPipelineFlow'
import OpportunityServiceBreakdown from '../components/OpportunityServiceBreakdown'
import OpportunitiesByLocation from '../components/OpportunitiesByLocation'
import OpportunityValueMatrix from '../components/OpportunityValueMatrix'
import { Loader2 } from 'lucide-react'

const OpportunitiesChart = ({ data }) => {
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState(null)
  const [pipeline, setPipeline] = useState(null)
  const [pipelineFlow, setPipelineFlow] = useState(null)
  const [serviceData, setServiceData] = useState(null)
  const [locationData, setLocationData] = useState(null)
  const [opportunities, setOpportunities] = useState(null)
  const [activeView, setActiveView] = useState('value-matrix')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [insightsData, pipelineData, pipelineFlowData, serviceAnalysis, locationAnalysis, opportunitiesData] = await Promise.all([
          dataService.getOpportunitiesInsights(),
          dataService.getOpportunitiesPipeline(),
          dataService.getOpportunitiesPipelineByStatus(),
          dataService.getOpportunitiesServiceAnalysis(),
          dataService.getOpportunitiesByLocation(),
          dataService.getOpportunities()
        ])
        setInsights(insightsData)
        setPipeline(pipelineData)
        setPipelineFlow(pipelineFlowData)
        setServiceData(serviceAnalysis)
        setLocationData(locationAnalysis)
        setOpportunities(opportunitiesData)
      } catch (error) {
        console.error('Error fetching opportunities data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2 flex-wrap bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveView('value-matrix')}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeView === 'value-matrix'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Value Matrix
        </button>
        <button
          onClick={() => setActiveView('pipeline-flow')}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeView === 'pipeline-flow'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pipeline Status
        </button>
        <button
          onClick={() => setActiveView('location')}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeView === 'location'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Location Analysis
        </button>
        <button
          onClick={() => setActiveView('service')}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeView === 'service'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Service Analysis
        </button>
        <button
          onClick={() => setActiveView('insights')}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeView === 'insights'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Quick Insights
        </button>
        <button
          onClick={() => setActiveView('pipeline')}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeView === 'pipeline'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Value Bands
        </button>
      </div>

      {/* Content */}
      {activeView === 'value-matrix' && <OpportunityValueMatrix opportunities={opportunities} />}
      {activeView === 'pipeline-flow' && <OpportunityPipelineFlow pipeline={pipelineFlow} />}
      {activeView === 'location' && <OpportunitiesByLocation locationData={locationData} />}
      {activeView === 'service' && <OpportunityServiceBreakdown serviceData={serviceData} />}
      {activeView === 'insights' && <OpportunityInsights insights={insights} />}
      {activeView === 'pipeline' && <OpportunityPipeline pipeline={pipeline} />}
    </div>
  )
}

export default OpportunitiesChart