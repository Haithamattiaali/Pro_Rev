'use client'

import React, { useMemo } from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { Users, Activity, Clock } from 'lucide-react'
import { ReportWidget } from '@/types/report'
import { useProjectStore } from '@/store/projectStore'
import { TaskStatus } from '@/types/project'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface ResourceUtilizationChartProps {
  widget: ReportWidget
  onUpdate: (updates: Partial<ReportWidget>) => void
  isEditing: boolean
}

export function ResourceUtilizationChart({ widget, onUpdate, isEditing }: ResourceUtilizationChartProps) {
  const { tasks } = useProjectStore()
  const [viewMode, setViewMode] = React.useState<'allocation' | 'workload'>('allocation')
  
  const resourceData = useMemo(() => {
    // Group tasks by resource
    const resourceMap = new Map<string, {
      name: string
      totalTasks: number
      completedTasks: number
      inProgressTasks: number
      totalLoad: number
      allocatedHours: number
      actualHours: number
    }>()
    
    tasks.forEach(task => {
      const resource = task.resourceAssignment || 'Unassigned'
      const existing = resourceMap.get(resource) || {
        name: resource,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        totalLoad: 0,
        allocatedHours: 0,
        actualHours: 0,
      }
      
      existing.totalTasks++
      existing.totalLoad += task.resourceLoad || 0
      existing.allocatedHours += task.duration * 8 * (task.resourceLoad / 100) // Assuming 8-hour days
      
      if (task.status === TaskStatus.COMPLETE) {
        existing.completedTasks++
        existing.actualHours += task.duration * 8 * (task.resourceLoad / 100) * 1.1 // Mock actual hours
      } else if (task.status === TaskStatus.IN_PROGRESS) {
        existing.inProgressTasks++
        existing.actualHours += task.duration * 8 * (task.resourceLoad / 100) * 0.5 // Mock partial hours
      }
      
      resourceMap.set(resource, existing)
    })
    
    const resources = Array.from(resourceMap.values())
      .sort((a, b) => b.totalTasks - a.totalTasks)
      .slice(0, 8) // Top 8 resources
    
    // Calculate utilization rates
    const utilizationRates = resources.map(r => ({
      name: r.name,
      utilization: Math.min(100, (r.totalLoad / resources.length) * 100),
      efficiency: r.allocatedHours > 0 ? (r.actualHours / r.allocatedHours) * 100 : 0,
    }))
    
    return {
      resources,
      utilizationRates,
      totalResources: resourceMap.size,
      overallocated: resources.filter(r => r.totalLoad > 100).length,
      underutilized: resources.filter(r => r.totalLoad < 50).length,
    }
  }, [tasks])
  
  const allocationChartData = {
    labels: resourceData.resources.map(r => r.name),
    datasets: [{
      label: 'Task Allocation',
      data: resourceData.resources.map(r => r.totalTasks),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(147, 51, 234, 0.8)',
        'rgba(14, 165, 233, 0.8)',
        'rgba(250, 204, 21, 0.8)',
        'rgba(107, 114, 128, 0.8)',
      ],
      borderWidth: 0,
    }],
  }
  
  const workloadChartData = {
    labels: resourceData.resources.map(r => r.name),
    datasets: [
      {
        label: 'Allocated Hours',
        data: resourceData.resources.map(r => r.allocatedHours),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
      },
      {
        label: 'Actual Hours',
        data: resourceData.resources.map(r => r.actualHours),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  }
  
  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((context.parsed / total) * 100).toFixed(1)
            return `${context.label}: ${context.parsed} tasks (${percentage}%)`
          },
        },
      },
    },
    cutout: '60%',
  }
  
  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(0)} hours`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
        },
      },
    },
  }
  
  if (isEditing) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default View
          </label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'allocation' | 'workload')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="allocation">Task Allocation</option>
            <option value="workload">Workload Analysis</option>
          </select>
        </div>
        
        <button
          onClick={() => onUpdate({ config: { ...widget.config, defaultView: viewMode } })}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Save Settings
        </button>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Resource Analysis</span>
        </div>
        
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setViewMode('allocation')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'allocation'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Allocation
          </button>
          <button
            onClick={() => setViewMode('workload')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'workload'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Workload
          </button>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-900">
            {resourceData.totalResources}
          </div>
          <div className="text-xs text-gray-500">Total Resources</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-lg font-semibold text-orange-600">
            {resourceData.overallocated}
          </div>
          <div className="text-xs text-gray-500">Overallocated</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-semibold text-blue-600">
            {resourceData.underutilized}
          </div>
          <div className="text-xs text-gray-500">Underutilized</div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex-1 min-h-0">
        {viewMode === 'allocation' ? (
          <Doughnut data={allocationChartData} options={doughnutOptions} />
        ) : (
          <Bar data={workloadChartData} options={barOptions} />
        )}
      </div>
      
      {/* Utilization List */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Utilization Rates</h4>
        <div className="space-y-1">
          {resourceData.utilizationRates.slice(0, 3).map(resource => (
            <div key={resource.name} className="flex items-center justify-between">
              <span className="text-xs text-gray-600">{resource.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      resource.utilization > 80
                        ? 'bg-orange-500'
                        : resource.utilization > 60
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                    }`}
                    style={{ width: `${resource.utilization}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">
                  {resource.utilization.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}