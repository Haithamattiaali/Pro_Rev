'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Clock, DollarSign, Users, TrendingUp, ChevronRight } from 'lucide-react'
import { Task } from '@/types/project'
import { useState } from 'react'

interface DecisionCommandProps {
  tasks: Task[]
}

interface Decision {
  id: string
  type: 'approval' | 'escalation' | 'resource' | 'budget' | 'timeline'
  priority: 'critical' | 'high' | 'medium'
  title: string
  description: string
  impact: string
  recommendation: string
  relatedTasks: Task[]
  metrics: {
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'stable'
  }[]
}

export function DecisionCommand({ tasks }: DecisionCommandProps) {
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'critical'>('all')
  
  // Generate decisions based on task data
  const decisions: Decision[] = []
  
  // 1. Blocked tasks requiring escalation
  const blockedTasks = tasks.filter(t => t.status === 'Blocked')
  if (blockedTasks.length > 0) {
    decisions.push({
      id: 'blocked-tasks',
      type: 'escalation',
      priority: 'critical',
      title: `${blockedTasks.length} Tasks Blocked`,
      description: 'Critical tasks are blocked and require immediate attention',
      impact: `${blockedTasks.reduce((sum, t) => sum + (t.impactScore || 0), 0)} impact points at risk`,
      recommendation: 'Schedule emergency meeting with blocking resource owners',
      relatedTasks: blockedTasks,
      metrics: [
        { label: 'Blocked Tasks', value: blockedTasks.length, trend: 'up' },
        { label: 'Days Blocked', value: '3.5 avg' },
        { label: 'Impact Score', value: Math.round(blockedTasks.reduce((sum, t) => sum + (t.impactScore || 0), 0) / blockedTasks.length) }
      ]
    })
  }
  
  // 2. Budget overruns
  const overBudgetTasks = tasks.filter(t => 
    t.costBudget && t.actualCost && t.actualCost > t.costBudget * 1.1
  )
  if (overBudgetTasks.length > 0) {
    const totalOverrun = overBudgetTasks.reduce((sum, t) => 
      sum + ((t.actualCost || 0) - (t.costBudget || 0)), 0
    )
    decisions.push({
      id: 'budget-overrun',
      type: 'budget',
      priority: 'high',
      title: 'Budget Overrun Alert',
      description: `${overBudgetTasks.length} tasks exceeding budget by more than 10%`,
      impact: `$${totalOverrun.toLocaleString()} total overrun`,
      recommendation: 'Review scope and consider budget reallocation',
      relatedTasks: overBudgetTasks,
      metrics: [
        { label: 'Over Budget', value: `$${totalOverrun.toLocaleString()}`, trend: 'up' },
        { label: 'Tasks Affected', value: overBudgetTasks.length },
        { label: 'Avg Overrun', value: `${Math.round(totalOverrun / overBudgetTasks.length / 1000)}k` }
      ]
    })
  }
  
  // 3. Resource conflicts
  const resourceMap = new Map<string, Task[]>()
  tasks.forEach(task => {
    if (task.resourceAssignment && task.resourceLoad && task.resourceLoad > 0) {
      const resources = task.resourceAssignment.split(',').map(r => r.trim())
      resources.forEach(resource => {
        if (!resourceMap.has(resource)) {
          resourceMap.set(resource, [])
        }
        resourceMap.get(resource)!.push(task)
      })
    }
  })
  
  const overloadedResources = Array.from(resourceMap.entries())
    .filter(([_, tasks]) => {
      const totalLoad = tasks.reduce((sum, t) => sum + (t.resourceLoad || 0), 0)
      return totalLoad > 100
    })
  
  if (overloadedResources.length > 0) {
    decisions.push({
      id: 'resource-overload',
      type: 'resource',
      priority: 'high',
      title: 'Resource Overallocation',
      description: `${overloadedResources.length} resources allocated beyond capacity`,
      impact: 'Potential delays and quality issues',
      recommendation: 'Redistribute workload or bring in additional resources',
      relatedTasks: overloadedResources.flatMap(([_, tasks]) => tasks),
      metrics: [
        { label: 'Overloaded', value: overloadedResources.length, trend: 'stable' },
        { label: 'Max Load', value: `${Math.max(...overloadedResources.map(([_, tasks]) => 
          tasks.reduce((sum, t) => sum + (t.resourceLoad || 0), 0)
        ))}%` },
        { label: 'Tasks at Risk', value: overloadedResources.reduce((sum, [_, tasks]) => sum + tasks.length, 0) }
      ]
    })
  }
  
  // 4. Critical path delays
  const criticalPathDelays = tasks.filter(t => 
    t.criticalPath && t.status === 'Delayed'
  )
  if (criticalPathDelays.length > 0) {
    decisions.push({
      id: 'critical-delays',
      type: 'timeline',
      priority: 'critical',
      title: 'Critical Path at Risk',
      description: 'Delays on critical path threatening project timeline',
      impact: 'Project completion date at risk',
      recommendation: 'Fast-track critical activities or adjust project timeline',
      relatedTasks: criticalPathDelays,
      metrics: [
        { label: 'Delayed Tasks', value: criticalPathDelays.length, trend: 'up' },
        { label: 'Total Delay', value: '12 days' },
        { label: 'Completion Risk', value: 'High' }
      ]
    })
  }
  
  // 5. Approval pending
  const pendingApprovals = tasks.filter(t => 
    t.status === 'Review' || (t.notes && t.notes.toLowerCase().includes('pending approval'))
  )
  if (pendingApprovals.length > 0) {
    decisions.push({
      id: 'pending-approvals',
      type: 'approval',
      priority: 'medium',
      title: 'Approvals Pending',
      description: `${pendingApprovals.length} tasks awaiting approval`,
      impact: 'Potential delays if not approved timely',
      recommendation: 'Review and approve or provide feedback',
      relatedTasks: pendingApprovals,
      metrics: [
        { label: 'Pending', value: pendingApprovals.length },
        { label: 'Avg Wait', value: '2.5 days' },
        { label: 'Critical', value: pendingApprovals.filter(t => t.criticalityLevel === 'Critical').length }
      ]
    })
  }
  
  // Filter decisions based on view mode
  const filteredDecisions = viewMode === 'critical' 
    ? decisions.filter(d => d.priority === 'critical')
    : decisions
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  }
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'escalation': return <AlertTriangle className="w-5 h-5" />
      case 'budget': return <DollarSign className="w-5 h-5" />
      case 'resource': return <Users className="w-5 h-5" />
      case 'timeline': return <Clock className="w-5 h-5" />
      case 'approval': return <CheckCircle className="w-5 h-5" />
      default: return <AlertTriangle className="w-5 h-5" />
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Decision Command</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'all'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All ({decisions.length})
          </button>
          <button
            onClick={() => setViewMode('critical')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'critical'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Critical ({decisions.filter(d => d.priority === 'critical').length})
          </button>
        </div>
      </div>
      
      {/* Decision Cards */}
      <div className="space-y-4">
        {filteredDecisions.length > 0 ? (
          filteredDecisions.map((decision, index) => (
            <motion.div
              key={decision.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedDecision === decision.id
                  ? 'ring-2 ring-primary ring-offset-2'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedDecision(
                selectedDecision === decision.id ? null : decision.id
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getPriorityColor(decision.priority)}`}>
                    {getTypeIcon(decision.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900">{decision.title}</h3>
                    <p className="text-sm text-neutral-600 mt-1">{decision.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                      <span className="font-medium">Impact:</span>
                      <span>{decision.impact}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-neutral-400 transition-transform ${
                  selectedDecision === decision.id ? 'rotate-90' : ''
                }`} />
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                {decision.metrics.map((metric, i) => (
                  <div key={i} className="bg-neutral-50 rounded-lg p-2 text-center">
                    <div className="text-xs text-neutral-600">{metric.label}</div>
                    <div className="text-lg font-semibold flex items-center justify-center gap-1">
                      {metric.value}
                      {metric.trend && (
                        <TrendingUp className={`w-3 h-3 ${
                          metric.trend === 'up' ? 'text-status-danger' :
                          metric.trend === 'down' ? 'text-status-success rotate-180' :
                          'text-neutral-400'
                        }`} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Recommendation */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                <div className="text-xs font-medium text-primary-700 mb-1">Recommendation</div>
                <div className="text-sm text-primary-800">{decision.recommendation}</div>
              </div>
              
              {/* Expanded Details */}
              {selectedDecision === decision.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t"
                >
                  <h4 className="text-sm font-medium text-neutral-700 mb-2">
                    Affected Tasks ({decision.relatedTasks.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {decision.relatedTasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            task.healthIndicator === 'Green' ? 'bg-status-success' :
                            task.healthIndicator === 'Yellow' ? 'bg-status-warning' :
                            task.healthIndicator === 'Red' ? 'bg-status-danger' :
                            'bg-neutral-300'
                          }`} />
                          <span className="text-neutral-700">{task.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                          <span>{task.status}</span>
                          <span>Impact: {task.impactScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="btn-primary px-4 py-2 text-sm">
                      Take Action
                    </button>
                    <button className="btn-secondary px-4 py-2 text-sm">
                      View Details
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-status-success" />
            <p>No critical decisions required at this time</p>
            <p className="text-sm mt-1">All systems operating within normal parameters</p>
          </div>
        )}
      </div>
    </div>
  )
}