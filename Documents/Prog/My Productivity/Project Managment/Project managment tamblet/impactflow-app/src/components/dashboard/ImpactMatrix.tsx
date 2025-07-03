'use client'

import { motion } from 'framer-motion'
import { Task } from '@/types/project'
import { useState } from 'react'

interface ImpactMatrixProps {
  tasks: Task[]
}

export function ImpactMatrix({ tasks }: ImpactMatrixProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null)
  
  const impactThreshold = 60
  const riskThreshold = 40
  
  const quadrants = {
    criticalFocus: tasks.filter(t => t.impactScore >= impactThreshold && t.riskScore >= riskThreshold),
    quickWins: tasks.filter(t => t.impactScore >= impactThreshold && t.riskScore < riskThreshold),
    riskMitigation: tasks.filter(t => t.impactScore < impactThreshold && t.riskScore >= riskThreshold),
    routine: tasks.filter(t => t.impactScore < impactThreshold && t.riskScore < riskThreshold),
  }

  const getQuadrantStyle = (quadrant: string) => {
    switch (quadrant) {
      case 'criticalFocus':
        return 'bg-red-50 border-red-200 text-red-700'
      case 'quickWins':
        return 'bg-green-50 border-green-200 text-green-700'
      case 'riskMitigation':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700'
      case 'routine':
        return 'bg-neutral-50 border-neutral-200 text-neutral-700'
      default:
        return ''
    }
  }

  const quadrantInfo = [
    { key: 'criticalFocus', label: 'Critical Focus', color: 'bg-status-danger' },
    { key: 'quickWins', label: 'Quick Wins', color: 'bg-status-success' },
    { key: 'riskMitigation', label: 'Risk Mitigation', color: 'bg-status-warning' },
    { key: 'routine', label: 'Routine', color: 'bg-neutral-400' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h2 className="text-xl font-semibold mb-6">Impact vs Risk Matrix</h2>
      
      {/* Matrix Grid */}
      <div className="relative bg-neutral-50 rounded-lg p-4 mb-6">
        <div className="absolute inset-0 flex">
          <div className="w-1/2 h-1/2 border-r-2 border-b-2 border-neutral-300" />
          <div className="w-1/2 h-1/2 border-b-2 border-neutral-300" />
          <div className="w-1/2 h-1/2 border-r-2 border-neutral-300" />
          <div className="w-1/2 h-1/2" />
        </div>
        
        {/* Axis Labels */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-neutral-600">
          Risk Score →
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-sm font-medium text-neutral-600">
          Impact Score →
        </div>
        
        {/* Quadrant Labels */}
        <div className="relative h-64 grid grid-cols-2 grid-rows-2 gap-2">
          <div className="flex items-center justify-center">
            <button
              onClick={() => setSelectedQuadrant('riskMitigation')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedQuadrant === 'riskMitigation' ? 'bg-yellow-200' : 'hover:bg-yellow-100'
              }`}
            >
              <div className="text-sm font-medium">Risk Mitigation</div>
              <div className="text-2xl font-bold">{quadrants.riskMitigation.length}</div>
            </button>
          </div>
          <div className="flex items-center justify-center">
            <button
              onClick={() => setSelectedQuadrant('criticalFocus')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedQuadrant === 'criticalFocus' ? 'bg-red-200' : 'hover:bg-red-100'
              }`}
            >
              <div className="text-sm font-medium">Critical Focus</div>
              <div className="text-2xl font-bold">{quadrants.criticalFocus.length}</div>
            </button>
          </div>
          <div className="flex items-center justify-center">
            <button
              onClick={() => setSelectedQuadrant('routine')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedQuadrant === 'routine' ? 'bg-neutral-200' : 'hover:bg-neutral-100'
              }`}
            >
              <div className="text-sm font-medium">Routine</div>
              <div className="text-2xl font-bold">{quadrants.routine.length}</div>
            </button>
          </div>
          <div className="flex items-center justify-center">
            <button
              onClick={() => setSelectedQuadrant('quickWins')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedQuadrant === 'quickWins' ? 'bg-green-200' : 'hover:bg-green-100'
              }`}
            >
              <div className="text-sm font-medium">Quick Wins</div>
              <div className="text-2xl font-bold">{quadrants.quickWins.length}</div>
            </button>
          </div>
        </div>
        
        {/* Task Bubbles */}
        <div className="absolute inset-4 pointer-events-none">
          {tasks.map((task, index) => {
            const x = (task.impactScore / 100) * 100
            const y = 100 - (task.riskScore / 100) * 100
            const size = Math.max(20, Math.min(40, task.duration / 2))
            
            return (
              <motion.div
                key={task.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.8 }}
                transition={{ delay: index * 0.02 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div
                  className={`rounded-full ${
                    task.impactScore >= impactThreshold && task.riskScore >= riskThreshold
                      ? 'bg-status-danger'
                      : task.impactScore >= impactThreshold && task.riskScore < riskThreshold
                      ? 'bg-status-success'
                      : task.impactScore < impactThreshold && task.riskScore >= riskThreshold
                      ? 'bg-status-warning'
                      : 'bg-neutral-400'
                  }`}
                  style={{ width: `${size}px`, height: `${size}px` }}
                  title={task.name}
                />
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Quadrant Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {quadrantInfo.map(({ key, label, color }) => (
          <div
            key={key}
            className={`p-4 rounded-lg border ${getQuadrantStyle(key)} cursor-pointer transition-all ${
              selectedQuadrant === key ? 'ring-2 ring-offset-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedQuadrant(key)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{label}</h3>
              <div className={`w-3 h-3 rounded-full ${color}`} />
            </div>
            <div className="text-2xl font-bold">{quadrants[key as keyof typeof quadrants].length}</div>
            <div className="text-sm opacity-75">tasks</div>
          </div>
        ))}
      </div>

      {/* Selected Quadrant Tasks */}
      {selectedQuadrant && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">
            {quadrantInfo.find(q => q.key === selectedQuadrant)?.label} Tasks
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {quadrants[selectedQuadrant as keyof typeof quadrants].slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{task.name}</div>
                  <div className="text-xs text-neutral-600">
                    Impact: {task.impactScore} | Risk: {task.riskScore} | Priority: {task.priorityScore}
                  </div>
                </div>
                <div className="text-xs text-neutral-500">
                  {task.resourceAssignment}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}