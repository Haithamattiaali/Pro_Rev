'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Info } from 'lucide-react'
import { ReportWidget } from '@/types/report'
import { useProjectStore } from '@/store/projectStore'

interface RiskHeatmapProps {
  widget: ReportWidget
  onUpdate: (updates: Partial<ReportWidget>) => void
  isEditing: boolean
}

const IMPACT_LEVELS = ['Low', 'Medium', 'High', 'Critical']
const PROBABILITY_LEVELS = ['Unlikely', 'Possible', 'Likely', 'Almost Certain']

const RISK_COLORS = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
}

export function RiskHeatmap({ widget, onUpdate, isEditing }: RiskHeatmapProps) {
  const { tasks } = useProjectStore()
  
  const riskData = useMemo(() => {
    // Create risk matrix based on task risk scores
    const matrix: { [key: string]: any[] } = {}
    
    // Initialize matrix
    PROBABILITY_LEVELS.forEach(prob => {
      IMPACT_LEVELS.forEach(impact => {
        const key = `${prob}-${impact}`
        matrix[key] = []
      })
    })
    
    // Map tasks to risk matrix based on risk score
    tasks.forEach(task => {
      if (task.riskScore > 0) {
        // Simple mapping of risk score to matrix position
        const impactIndex = Math.min(Math.floor(task.riskScore / 2.5), 3)
        const probabilityIndex = Math.min(Math.floor((task.riskScore % 10) / 2.5), 3)
        
        const impact = IMPACT_LEVELS[impactIndex]
        const probability = PROBABILITY_LEVELS[probabilityIndex]
        const key = `${probability}-${impact}`
        
        matrix[key].push({
          id: task.id,
          name: task.name,
          riskScore: task.riskScore,
          mitigation: task.riskMitigation,
        })
      }
    })
    
    // Calculate risk statistics
    const totalRisks = tasks.filter(t => t.riskScore > 0).length
    const criticalRisks = tasks.filter(t => t.riskScore >= 8).length
    const highRisks = tasks.filter(t => t.riskScore >= 6 && t.riskScore < 8).length
    const mediumRisks = tasks.filter(t => t.riskScore >= 3 && t.riskScore < 6).length
    const lowRisks = tasks.filter(t => t.riskScore > 0 && t.riskScore < 3).length
    
    return {
      matrix,
      totalRisks,
      criticalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
    }
  }, [tasks])
  
  const getRiskLevel = (probability: string, impact: string) => {
    const probIndex = PROBABILITY_LEVELS.indexOf(probability)
    const impactIndex = IMPACT_LEVELS.indexOf(impact)
    const score = (probIndex + 1) * (impactIndex + 1)
    
    if (score >= 12) return 'critical'
    if (score >= 8) return 'high'
    if (score >= 4) return 'medium'
    return 'low'
  }
  
  if (isEditing) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Risk Heatmap displays task risks based on probability and impact.
          No configuration needed - it automatically uses task risk data.
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Risk Summary */}
      <div className="grid grid-cols-5 gap-2">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-900">{riskData.totalRisks}</div>
          <div className="text-xs text-gray-500">Total Risks</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <div className="text-lg font-semibold text-red-600">{riskData.criticalRisks}</div>
          <div className="text-xs text-gray-500">Critical</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-lg font-semibold text-orange-600">{riskData.highRisks}</div>
          <div className="text-xs text-gray-500">High</div>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded-lg">
          <div className="text-lg font-semibold text-yellow-600">{riskData.mediumRisks}</div>
          <div className="text-xs text-gray-500">Medium</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-lg font-semibold text-green-600">{riskData.lowRisks}</div>
          <div className="text-xs text-gray-500">Low</div>
        </div>
      </div>
      
      {/* Risk Matrix */}
      <div className="relative">
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-gray-600">
          Probability →
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-600">
          Impact →
        </div>
        
        <div className="grid grid-cols-5 gap-1">
          {/* Header row */}
          <div className="h-8" />
          {IMPACT_LEVELS.map(impact => (
            <div key={impact} className="text-xs text-center font-medium text-gray-600 flex items-end justify-center pb-1">
              {impact}
            </div>
          ))}
          
          {/* Matrix rows */}
          {[...PROBABILITY_LEVELS].reverse().map(probability => (
            <React.Fragment key={probability}>
              <div className="text-xs font-medium text-gray-600 flex items-center justify-end pr-2">
                {probability}
              </div>
              {IMPACT_LEVELS.map(impact => {
                const key = `${probability}-${impact}`
                const risks = riskData.matrix[key] || []
                const riskLevel = getRiskLevel(probability, impact)
                
                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    className={`
                      relative h-20 p-2 rounded border cursor-pointer
                      ${RISK_COLORS[riskLevel]}
                    `}
                  >
                    {risks.length > 0 && (
                      <>
                        <div className="text-center">
                          <div className="text-lg font-bold">{risks.length}</div>
                          <div className="text-xs opacity-75">
                            {risks.length === 1 ? 'risk' : 'risks'}
                          </div>
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          {risks.slice(0, 3).map(risk => (
                            <div key={risk.id}>{risk.name}</div>
                          ))}
                          {risks.length > 3 && <div>...and {risks.length - 3} more</div>}
                        </div>
                      </>
                    )}
                  </motion.div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded" />
          <span className="text-xs text-gray-600">Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded" />
          <span className="text-xs text-gray-600">Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded" />
          <span className="text-xs text-gray-600">High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded" />
          <span className="text-xs text-gray-600">Critical Risk</span>
        </div>
      </div>
    </div>
  )
}