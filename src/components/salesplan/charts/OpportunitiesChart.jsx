import React, { useState, useEffect } from 'react'
import dataService from '../../../services/dataService'
import OpportunityInsights from '../components/OpportunityInsights'
import OpportunityPipeline from '../components/OpportunityPipeline'
import OpportunityPipelineFlow from '../components/OpportunityPipelineFlow'
import ServicePortfolioInsight from '../components/ServicePortfolioInsight'
import { Loader2 } from 'lucide-react'

const OpportunitiesChart = ({ data }) => {
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState(null)
  const [pipeline, setPipeline] = useState(null)
  const [pipelineFlow, setPipelineFlow] = useState(null)
  const [serviceData, setServiceData] = useState(null)
  const [opportunities, setOpportunities] = useState(null)
  const [matrixData, setMatrixData] = useState(null)
  const [activeView, setActiveView] = useState('pipeline-flow')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [insightsData, pipelineData, pipelineFlowData, serviceAnalysis, opportunitiesData, matrixAnalysis] = await Promise.all([
          dataService.getOpportunitiesInsights(),
          dataService.getOpportunitiesPipeline(),
          dataService.getOpportunitiesPipelineByStatus(),
          dataService.getOpportunitiesServiceAnalysis(),
          dataService.getOpportunities(),
          dataService.getOpportunitiesMatrix()
        ])
        setInsights(insightsData)
        setPipeline(pipelineData)
        setPipelineFlow(pipelineFlowData)
        setServiceData(serviceAnalysis)
        setOpportunities(opportunitiesData)
        setMatrixData(matrixAnalysis)
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
      <div className="flex gap-2 flex-wrap bg-secondary-pale p-1 rounded-lg">
        <button
          onClick={() => setActiveView('pipeline-flow')}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeView === 'pipeline-flow'
              ? 'bg-white text-primary shadow-sm'
              : 'text-secondary hover:text-secondary-dark'
          }`}
        >
          Pipeline Status
        </button>
        <button
          onClick={() => setActiveView('value-matrix')}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeView === 'value-matrix'
              ? 'bg-white text-primary shadow-sm'
              : 'text-secondary hover:text-secondary-dark'
          }`}
        >
          Pipeline Analysis
        </button>
        {/* Commented out Quick Insights and Value Bands as requested
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
        */}
      </div>

      {/* Content */}
      {activeView === 'value-matrix' && <ServicePortfolioInsight serviceData={serviceData} />}
      {activeView === 'pipeline-flow' && <OpportunityPipelineFlow pipeline={pipelineFlow} />}
      {/* Commented out Quick Insights and Value Bands content as requested
      {activeView === 'insights' && <OpportunityInsights insights={insights} />}
      {activeView === 'pipeline' && <OpportunityPipeline pipeline={pipeline} />}
      */}
    </div>
  )
}

export default OpportunitiesChart