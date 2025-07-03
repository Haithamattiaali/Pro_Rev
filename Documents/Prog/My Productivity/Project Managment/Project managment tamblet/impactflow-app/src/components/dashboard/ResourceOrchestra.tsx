'use client'

import { motion } from 'framer-motion'
import { Users, Activity, AlertTriangle, TrendingUp } from 'lucide-react'
import { Task } from '@/types/project'
import { useState } from 'react'

interface ResourceOrchestraProps {
  tasks: Task[]
}

interface ResourceData {
  name: string
  workload: number
  taskCount: number
  criticalTasks: number
  blockedTasks: number
  efficiency: number
  trend: number
}

export function ResourceOrchestra({ tasks }: ResourceOrchestraProps) {
  const [selectedResource, setSelectedResource] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'workload' | 'efficiency'>('workload')
  
  // Group tasks by resource
  const resourceMap = new Map<string, Task[]>()
  tasks.forEach(task => {
    if (task.resourceAssignment) {
      const resources = task.resourceAssignment.split(',').map(r => r.trim())
      resources.forEach(resource => {
        if (!resourceMap.has(resource)) {
          resourceMap.set(resource, [])
        }
        resourceMap.get(resource)!.push(task)
      })
    }
  })
  
  // Calculate resource metrics
  const resourceData: ResourceData[] = Array.from(resourceMap.entries())
    .map(([name, resourceTasks]) => {
      const totalWorkload = resourceTasks.reduce((sum, task) => 
        sum + (task.resourceLoad || 0), 0) / resourceTasks.length
      
      const criticalTasks = resourceTasks.filter(t => 
        t.criticalityLevel === 'Critical' || t.criticalPath
      ).length
      
      const blockedTasks = resourceTasks.filter(t => 
        t.status === 'Blocked'
      ).length
      
      const completedTasks = resourceTasks.filter(t => 
        t.status === 'Complete'
      ).length
      
      const efficiency = resourceTasks.length > 0 
        ? Math.round((completedTasks / resourceTasks.length) * 100)
        : 0
        
      // Mock trend data
      const trend = Math.floor(Math.random() * 20) - 10
      
      return {
        name,
        workload: Math.round(totalWorkload),
        taskCount: resourceTasks.length,
        criticalTasks,
        blockedTasks,
        efficiency,
        trend
      }
    })
    .sort((a, b) => b.workload - a.workload)
  
  const maxWorkload = Math.max(...resourceData.map(r => r.workload), 100)
  
  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return 'bg-status-danger'
    if (workload >= 75) return 'bg-status-warning'
    if (workload >= 50) return 'bg-status-success'
    return 'bg-neutral-300'
  }
  
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'text-status-success'
    if (efficiency >= 60) return 'text-status-warning'
    return 'text-status-danger'
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Resource Orchestra</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('workload')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'workload'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Workload
          </button>
          <button
            onClick={() => setViewMode('efficiency')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'efficiency'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Efficiency
          </button>
        </div>
      </div>
      
      {/* Resource List */}
      <div className="space-y-3 mb-6">
        {resourceData.slice(0, 8).map((resource, index) => (
          <motion.div
            key={resource.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedResource === resource.name
                ? 'border-primary bg-primary-50'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
            onClick={() => setSelectedResource(
              selectedResource === resource.name ? null : resource.name
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-neutral-600" />
                </div>
                <div>
                  <div className="font-medium">{resource.name}</div>
                  <div className="text-xs text-neutral-600">
                    {resource.taskCount} tasks
                    {resource.blockedTasks > 0 && (
                      <span className="text-status-danger ml-2">
                        • {resource.blockedTasks} blocked
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {viewMode === 'workload' ? (
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold">
                      {resource.workload}%
                    </div>
                    {resource.trend !== 0 && (
                      <div className={`flex items-center text-xs ${
                        resource.trend > 0 ? 'text-status-danger' : 'text-status-success'
                      }`}>
                        <TrendingUp className={`w-3 h-3 ${
                          resource.trend < 0 ? 'rotate-180' : ''
                        }`} />
                        {Math.abs(resource.trend)}%
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`text-lg font-semibold ${
                    getEfficiencyColor(resource.efficiency)
                  }`}>
                    {resource.efficiency}%
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <motion.div
                className={viewMode === 'workload' 
                  ? getWorkloadColor(resource.workload)
                  : 'bg-primary'
                }
                initial={{ width: 0 }}
                animate={{ 
                  width: `${viewMode === 'workload' 
                    ? (resource.workload / maxWorkload) * 100 
                    : resource.efficiency
                  }%` 
                }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              />
            </div>
            
            {resource.criticalTasks > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-status-danger">
                <AlertTriangle className="w-3 h-3" />
                {resource.criticalTasks} critical tasks
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-neutral-900">
            {resourceData.length}
          </div>
          <div className="text-xs text-neutral-600">Total Resources</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-status-warning">
            {resourceData.filter(r => r.workload > 80).length}
          </div>
          <div className="text-xs text-neutral-600">Overloaded</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-status-success">
            {Math.round(
              resourceData.reduce((sum, r) => sum + r.efficiency, 0) / 
              resourceData.length
            )}%
          </div>
          <div className="text-xs text-neutral-600">Avg Efficiency</div>
        </div>
      </div>
      
      {/* Selected Resource Details */}
      {selectedResource && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 p-4 bg-neutral-50 rounded-lg"
        >
          <h4 className="font-medium mb-3">{selectedResource} - Task Details</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {resourceMap.get(selectedResource)?.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    task.status === 'Complete' ? 'bg-status-success' :
                    task.status === 'Blocked' ? 'bg-status-danger' :
                    task.status === 'In Progress' ? 'bg-primary' :
                    'bg-neutral-300'
                  }`} />
                  <span className="text-neutral-700">{task.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span>{task.percentComplete}%</span>
                  <span className={task.criticalPath ? 'text-status-danger font-medium' : ''}>
                    {task.criticalPath ? 'Critical' : `${task.duration}d`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}