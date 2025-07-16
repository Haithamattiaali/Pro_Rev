import React, { useState } from 'react'
import { ChevronRight, Package } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'

const OpportunityPipeline = ({ pipeline }) => {
  const [selectedBand, setSelectedBand] = useState(null)

  if (!pipeline?.pipeline || pipeline.pipeline.length === 0) {
    return <div className="text-center text-gray-500 py-4">Loading pipeline data...</div>
  }

  const getColorByGP = (avgGP) => {
    if (avgGP >= 30) return 'bg-green-500'
    if (avgGP >= 20) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTextColorByGP = (avgGP) => {
    if (avgGP >= 30) return 'text-green-600'
    if (avgGP >= 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Visualization */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Opportunity Pipeline by Value</h3>
        
        <div className="space-y-4">
          {pipeline.pipeline.map((band, index) => {
            const isSelected = selectedBand === index
            const hasOpportunities = band.count > 0
            
            return (
              <div key={index}>
                <button
                  onClick={() => setSelectedBand(isSelected ? null : index)}
                  disabled={!hasOpportunities}
                  className={`w-full text-left transition-all ${
                    hasOpportunities 
                      ? 'hover:shadow-md cursor-pointer' 
                      : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          hasOpportunities ? getColorByGP(band.avg_gp_percent) : 'bg-gray-300'
                        }`}>
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{band.name}</h4>
                          <p className="text-sm text-gray-600">{band.description}</p>
                        </div>
                      </div>
                      {hasOpportunities && (
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                          isSelected ? 'rotate-90' : ''
                        }`} />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Opportunities</p>
                        <p className="font-semibold text-gray-900">{band.count || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Value</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(band.total_revenue || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg GP%</p>
                        <p className={`font-semibold ${
                          hasOpportunities ? getTextColorByGP(band.avg_gp_percent) : 'text-gray-900'
                        }`}>
                          {(band.avg_gp_percent || 0).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    {hasOpportunities && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>GP Range: {(band.min_gp || 0).toFixed(1)}% - {(band.max_gp || 0).toFixed(1)}%</span>
                          <span>Annual Potential: {formatCurrency((band.total_revenue || 0) * 12)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
                
                {/* Expanded Details */}
                {isSelected && hasOpportunities && (
                  <div className="mt-2 ml-12 space-y-2">
                    {band.opportunities && band.opportunities.length > 0 ? (
                      band.opportunities.map((opp, oppIndex) => (
                        <div key={oppIndex} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{opp.project}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {opp.location} • {opp.service}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(opp.est_monthly_revenue)}
                              </p>
                              <p className={`text-sm font-medium ${getTextColorByGP(opp.est_gp_percent)}`}>
                                {opp.est_gp_percent.toFixed(1)}% GP
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No opportunity details available</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">GP% Legend:</p>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">High (&ge;30%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-600">Medium (20-29%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">Low (&lt;20%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpportunityPipeline