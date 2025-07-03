'use client'

import React, { useMemo } from 'react'
import { Bar, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { Users, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { ReportWidget } from '@/types/report'
import { useProjectStore } from '@/store/projectStore'
import { TaskStatus } from '@/types/project'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface TeamPerformanceChartProps {
  widget: ReportWidget
  onUpdate: (updates: Partial<ReportWidget>) => void
  isEditing: boolean
}

export function TeamPerformanceChart({ widget, onUpdate, isEditing }: TeamPerformanceChartProps) {
  const { tasks } = useProjectStore()
  const [viewMode, setViewMode] = React.useState<'productivity' | 'skills'>('productivity')
  
  const performanceData = useMemo(() => {
    // Group tasks by team member
    const teamMap = new Map<string, {
      name: string
      totalTasks: number
      completedTasks: number
      inProgressTasks: number
      onTimeTasks: number
      delayedTasks: number
      totalEffort: number
      actualEffort: number
      avgCompletionTime: number
      productivity: number
      efficiency: number
      quality: number
    }>()
    
    tasks.forEach(task => {
      const member = task.resourceAssignment || 'Unassigned'
      const existing = teamMap.get(member) || {
        name: member,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        onTimeTasks: 0,
        delayedTasks: 0,
        totalEffort: 0,
        actualEffort: 0,
        avgCompletionTime: 0,
        productivity: 0,
        efficiency: 0,
        quality: 0,
      }
      
      existing.totalTasks++
      existing.totalEffort += task.duration * (task.resourceLoad / 100)
      
      if (task.status === TaskStatus.COMPLETE) {
        existing.completedTasks++
        if (task.actualEnd && new Date(task.actualEnd) <= new Date(task.endDate)) {
          existing.onTimeTasks++
        }
        existing.actualEffort += task.duration * (task.resourceLoad / 100) * 1.1 // Mock actual effort
      } else if (task.status === TaskStatus.IN_PROGRESS) {
        existing.inProgressTasks++
      }
      
      if (task.varianceDays > 0) {
        existing.delayedTasks++
      }
      
      teamMap.set(member, existing)
    })
    
    // Calculate performance metrics
    const teamMembers = Array.from(teamMap.values()).map(member => {
      const completionRate = member.totalTasks > 0 
        ? (member.completedTasks / member.totalTasks) * 100 
        : 0
      
      const onTimeRate = member.completedTasks > 0 
        ? (member.onTimeTasks / member.completedTasks) * 100 
        : 0
      
      const efficiency = member.totalEffort > 0 
        ? (member.totalEffort / member.actualEffort) * 100 
        : 100
      
      const quality = 100 - (member.delayedTasks / member.totalTasks) * 50
      
      const productivity = (completionRate * 0.4) + (onTimeRate * 0.3) + (efficiency * 0.3)
      
      return {
        ...member,
        completionRate,
        onTimeRate,
        efficiency: Math.min(100, efficiency),
        quality: Math.max(0, quality),
        productivity: Math.min(100, productivity),
      }
    })
    
    // Sort by productivity
    teamMembers.sort((a, b) => b.productivity - a.productivity)
    
    // Calculate team averages
    const avgProductivity = teamMembers.reduce((sum, m) => sum + m.productivity, 0) / teamMembers.length
    const avgEfficiency = teamMembers.reduce((sum, m) => sum + m.efficiency, 0) / teamMembers.length
    const avgQuality = teamMembers.reduce((sum, m) => sum + m.quality, 0) / teamMembers.length
    
    return {
      teamMembers: teamMembers.slice(0, 8), // Top 8 members
      avgProductivity,
      avgEfficiency,
      avgQuality,
      topPerformer: teamMembers[0],
    }
  }, [tasks])
  
  const productivityChartData = {
    labels: performanceData.teamMembers.map(m => m.name),
    datasets: [
      {
        label: 'Productivity Score',
        data: performanceData.teamMembers.map(m => m.productivity),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
      },
      {
        label: 'Completion Rate',
        data: performanceData.teamMembers.map(m => m.completionRate),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: 'On-Time Rate',
        data: performanceData.teamMembers.map(m => m.onTimeRate),
        backgroundColor: 'rgba(251, 146, 60, 0.8)',
      },
    ],
  }
  
  const skillsRadarData = {
    labels: ['Productivity', 'Efficiency', 'Quality', 'Timeliness', 'Workload'],
    datasets: performanceData.teamMembers.slice(0, 3).map((member, index) => ({
      label: member.name,
      data: [
        member.productivity,
        member.efficiency,
        member.quality,
        member.onTimeRate,
        (member.totalTasks / performanceData.teamMembers[0].totalTasks) * 100,
      ],
      borderColor: ['rgb(99, 102, 241)', 'rgb(34, 197, 94)', 'rgb(251, 146, 60)'][index],
      backgroundColor: ['rgba(99, 102, 241, 0.2)', 'rgba(34, 197, 94, 0.2)', 'rgba(251, 146, 60, 0.2)'][index],
      pointBackgroundColor: ['rgb(99, 102, 241)', 'rgb(34, 197, 94)', 'rgb(251, 146, 60)'][index],
    })),
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
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
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
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
  }
  
  const radarOptions: ChartOptions<'radar'> = {
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
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
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
            onChange={(e) => setViewMode(e.target.value as 'productivity' | 'skills')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="productivity">Productivity Metrics</option>
            <option value="skills">Skills Radar</option>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Team Performance</span>
        </div>
        
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setViewMode('productivity')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'productivity'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Productivity
          </button>
          <button
            onClick={() => setViewMode('skills')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'skills'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Skills Radar
          </button>
        </div>
      </div>
      
      {/* Team Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-indigo-50 rounded-lg">
          <div className="text-lg font-semibold text-indigo-600">
            {performanceData.avgProductivity.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">Avg Productivity</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-lg font-semibold text-green-600">
            {performanceData.avgEfficiency.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">Avg Efficiency</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-lg font-semibold text-purple-600">
            {performanceData.avgQuality.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">Avg Quality</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="text-xs font-medium text-amber-800 mb-1">Top Performer</div>
          <div className="text-xs text-amber-600">
            {performanceData.topPerformer?.name || 'N/A'}
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex-1 min-h-0">
        {viewMode === 'productivity' ? (
          <Bar data={productivityChartData} options={barOptions} />
        ) : (
          <Radar data={skillsRadarData} options={radarOptions} />
        )}
      </div>
      
      {/* Performance Indicators */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Key Performance Indicators</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-xs text-gray-600">Tasks Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-blue-500" />
            <span className="text-xs text-gray-600">On-Time Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-indigo-500" />
            <span className="text-xs text-gray-600">Efficiency Rate</span>
          </div>
        </div>
      </div>
    </div>
  )
}