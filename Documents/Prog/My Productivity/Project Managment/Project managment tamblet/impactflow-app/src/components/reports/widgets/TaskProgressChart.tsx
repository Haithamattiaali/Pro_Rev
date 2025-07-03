'use client'

import React, { useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Filler,
} from 'chart.js'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns'
import { Calendar, Settings } from 'lucide-react'
import { ReportWidget } from '@/types/report'
import { useProjectStore } from '@/store/projectStore'
import { TaskStatus } from '@/types/project'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface TaskProgressChartProps {
  widget: ReportWidget
  onUpdate: (updates: Partial<ReportWidget>) => void
  isEditing: boolean
}

type TimeRange = '7d' | '30d' | '90d' | 'all'

export function TaskProgressChart({ widget, onUpdate, isEditing }: TaskProgressChartProps) {
  const { tasks } = useProjectStore()
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  
  const chartData = useMemo(() => {
    // Calculate date range
    const endDate = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case '7d':
        startDate = subDays(endDate, 7)
        break
      case '30d':
        startDate = subDays(endDate, 30)
        break
      case '90d':
        startDate = subDays(endDate, 90)
        break
      case 'all':
        startDate = tasks.reduce((earliest, task) => {
          const taskStart = new Date(task.startDate)
          return taskStart < earliest ? taskStart : earliest
        }, new Date())
        break
    }
    
    // Generate date labels
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
    const labels = dateRange.map(date => format(date, 'MMM d'))
    
    // Calculate cumulative progress for each day
    const plannedProgress = dateRange.map(date => {
      const plannedTasks = tasks.filter(task => 
        new Date(task.startDate) <= date && new Date(task.endDate) >= date
      ).length
      return plannedTasks
    })
    
    const actualProgress = dateRange.map(date => {
      const completedByDate = tasks.filter(task => {
        if (task.actualEnd) {
          return new Date(task.actualEnd) <= date && task.status === TaskStatus.COMPLETE
        }
        return new Date(task.endDate) <= date && task.status === TaskStatus.COMPLETE
      }).length
      return completedByDate
    })
    
    // Calculate trend line (simple linear regression)
    const n = actualProgress.length
    const sumX = n * (n - 1) / 2
    const sumY = actualProgress.reduce((sum, val) => sum + val, 0)
    const sumXY = actualProgress.reduce((sum, val, i) => sum + val * i, 0)
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    const trendLine = dateRange.map((_, i) => Math.max(0, slope * i + intercept))
    
    // Calculate completion percentage
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETE).length
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    
    return {
      labels: labels.filter((_, i) => i % Math.ceil(labels.length / 20) === 0), // Show max 20 labels
      datasets: [
        {
          label: 'Actual Progress',
          data: actualProgress,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Planned Progress',
          data: plannedProgress,
          borderColor: 'rgb(156, 163, 175)',
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          borderDash: [5, 5],
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Trend',
          data: trendLine,
          borderColor: 'rgb(34, 197, 94)',
          borderDash: [10, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
      ],
      completionPercentage,
    }
  }, [tasks, timeRange])
  
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y} tasks`
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
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Number of Tasks',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  }
  
  if (isEditing) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
        
        <button
          onClick={() => onUpdate({ config: { ...widget.config, timeRange } })}
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
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="text-sm border-0 focus:ring-0 text-gray-600 cursor-pointer"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {chartData.completionPercentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Overall Completion</div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex-1 min-h-0">
        <Line data={chartData} options={options} />
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900">
            {tasks.filter(t => t.status === TaskStatus.COMPLETE).length}
          </div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900">
            {tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}
          </div>
          <div className="text-xs text-gray-500">In Progress</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900">
            {tasks.filter(t => 
              t.status !== TaskStatus.COMPLETE && 
              t.status !== TaskStatus.CANCELLED
            ).length}
          </div>
          <div className="text-xs text-gray-500">Remaining</div>
        </div>
      </div>
    </div>
  )
}