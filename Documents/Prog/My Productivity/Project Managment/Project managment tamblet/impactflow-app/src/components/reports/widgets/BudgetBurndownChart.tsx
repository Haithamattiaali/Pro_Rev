'use client'

import React, { useMemo } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Filler,
} from 'chart.js'
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { ReportWidget } from '@/types/report'
import { useProjectStore } from '@/store/projectStore'
import { TaskStatus } from '@/types/project'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface BudgetBurndownChartProps {
  widget: ReportWidget
  onUpdate: (updates: Partial<ReportWidget>) => void
  isEditing: boolean
}

export function BudgetBurndownChart({ widget, onUpdate, isEditing }: BudgetBurndownChartProps) {
  const { tasks } = useProjectStore()
  const [viewMode, setViewMode] = React.useState<'burndown' | 'comparison'>('burndown')
  
  const budgetData = useMemo(() => {
    // Calculate total budget and spent
    const totalBudget = tasks.reduce((sum, task) => sum + (task.costBudget || 0), 0)
    const totalSpent = tasks.reduce((sum, task) => sum + (task.actualCost || 0), 0)
    const remainingBudget = totalBudget - totalSpent
    
    // Get project date range
    const projectStart = tasks.reduce((earliest, task) => {
      const taskStart = new Date(task.startDate)
      return taskStart < earliest ? taskStart : earliest
    }, new Date())
    
    const projectEnd = tasks.reduce((latest, task) => {
      const taskEnd = new Date(task.endDate)
      return taskEnd > latest ? taskEnd : latest
    }, new Date())
    
    // Generate monthly intervals
    const months = eachMonthOfInterval({
      start: startOfMonth(projectStart),
      end: endOfMonth(projectEnd),
    })
    
    // Calculate planned vs actual spending per month
    const monthlyData = months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      // Planned spending (based on task duration and budget)
      const plannedSpending = tasks.reduce((sum, task) => {
        const taskStart = new Date(task.startDate)
        const taskEnd = new Date(task.endDate)
        
        if (taskEnd < monthStart || taskStart > monthEnd) return sum
        
        // Calculate overlap percentage
        const overlapStart = taskStart > monthStart ? taskStart : monthStart
        const overlapEnd = taskEnd < monthEnd ? taskEnd : monthEnd
        const taskDuration = taskEnd.getTime() - taskStart.getTime()
        const overlapDuration = overlapEnd.getTime() - overlapStart.getTime()
        const overlapPercentage = taskDuration > 0 ? overlapDuration / taskDuration : 0
        
        return sum + (task.costBudget || 0) * overlapPercentage
      }, 0)
      
      // Actual spending (simplified - would need real data)
      const actualSpending = tasks.reduce((sum, task) => {
        const taskStart = new Date(task.startDate)
        const taskEnd = new Date(task.endDate)
        
        if (taskEnd < monthStart || taskStart > monthEnd) return sum
        
        // For completed tasks, use actual cost
        if (task.status === TaskStatus.COMPLETE && task.actualEnd && new Date(task.actualEnd) <= monthEnd) {
          return sum + (task.actualCost || 0)
        }
        
        // For in-progress tasks, estimate based on progress
        if (task.status === TaskStatus.IN_PROGRESS) {
          return sum + (task.actualCost || 0) * (task.percentComplete / 100)
        }
        
        return sum
      }, 0)
      
      return {
        month: format(month, 'MMM yyyy'),
        planned: plannedSpending,
        actual: actualSpending,
      }
    })
    
    // Calculate cumulative values for burndown
    let cumulativePlanned = 0
    let cumulativeActual = 0
    const burndownData = monthlyData.map(data => {
      cumulativePlanned += data.planned
      cumulativeActual += data.actual
      
      return {
        month: data.month,
        plannedRemaining: totalBudget - cumulativePlanned,
        actualRemaining: totalBudget - cumulativeActual,
        plannedSpent: cumulativePlanned,
        actualSpent: cumulativeActual,
      }
    })
    
    // Calculate CPI (Cost Performance Index)
    const earnedValue = tasks
      .filter(t => t.status === TaskStatus.COMPLETE)
      .reduce((sum, t) => sum + (t.costBudget || 0), 0)
    const cpi = totalSpent > 0 ? earnedValue / totalSpent : 1
    
    // Forecast completion cost
    const forecastCost = cpi > 0 ? totalBudget / cpi : totalBudget
    const variance = forecastCost - totalBudget
    
    return {
      totalBudget,
      totalSpent,
      remainingBudget,
      monthlyData,
      burndownData,
      cpi,
      forecastCost,
      variance,
      burnRate: totalSpent / months.length,
      isOverBudget: totalSpent > totalBudget,
      percentSpent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    }
  }, [tasks])
  
  const burndownChartData = {
    labels: budgetData.burndownData.map(d => d.month),
    datasets: [
      {
        label: 'Planned Budget Remaining',
        data: budgetData.burndownData.map(d => d.plannedRemaining),
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderDash: [5, 5],
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Actual Budget Remaining',
        data: budgetData.burndownData.map(d => d.actualRemaining),
        borderColor: budgetData.isOverBudget ? 'rgb(239, 68, 68)' : 'rgb(99, 102, 241)',
        backgroundColor: budgetData.isOverBudget ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Forecast',
        data: budgetData.burndownData.map((d, i) => {
          if (i < budgetData.burndownData.length / 2) return null
          return budgetData.totalBudget - (budgetData.forecastCost * (i / budgetData.burndownData.length))
        }),
        borderColor: 'rgb(251, 146, 60)',
        borderDash: [10, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  }
  
  const comparisonChartData = {
    labels: budgetData.monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Planned Spending',
        data: budgetData.monthlyData.map(d => d.planned),
        backgroundColor: 'rgba(156, 163, 175, 0.8)',
      },
      {
        label: 'Actual Spending',
        data: budgetData.monthlyData.map(d => d.actual),
        backgroundColor: budgetData.isOverBudget ? 'rgba(239, 68, 68, 0.8)' : 'rgba(99, 102, 241, 0.8)',
      },
    ],
  }
  
  const lineOptions: ChartOptions<'line'> = {
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
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return `${context.dataset.label}: $${value.toLocaleString()}`
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
          callback: (value) => `$${Number(value).toLocaleString()}`,
        },
        title: {
          display: true,
          text: 'Budget ($)',
        },
      },
    },
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
            const value = context.parsed.y
            return `${context.dataset.label}: $${value.toLocaleString()}`
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
          callback: (value) => `$${Number(value).toLocaleString()}`,
        },
      },
    },
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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
            onChange={(e) => setViewMode(e.target.value as 'burndown' | 'comparison')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="burndown">Burndown Chart</option>
            <option value="comparison">Monthly Comparison</option>
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
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Budget Analysis</span>
        </div>
        
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setViewMode('burndown')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'burndown'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Burndown
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'comparison'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Comparison
          </button>
        </div>
      </div>
      
      {/* Budget Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-sm font-semibold text-gray-900">
            {formatCurrency(budgetData.totalBudget)}
          </div>
          <div className="text-xs text-gray-500">Total Budget</div>
        </div>
        <div className={`text-center p-2 rounded-lg ${
          budgetData.isOverBudget ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <div className={`text-sm font-semibold ${
            budgetData.isOverBudget ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(budgetData.totalSpent)}
          </div>
          <div className="text-xs text-gray-500">Spent</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-sm font-semibold text-blue-600">
            {formatCurrency(budgetData.remainingBudget)}
          </div>
          <div className="text-xs text-gray-500">Remaining</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-sm font-semibold text-purple-600 flex items-center justify-center gap-1">
            {budgetData.cpi.toFixed(2)}
            {budgetData.cpi >= 1 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
          </div>
          <div className="text-xs text-gray-500">CPI</div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex-1 min-h-0">
        {viewMode === 'burndown' ? (
          <Line data={burndownChartData} options={lineOptions} />
        ) : (
          <Bar data={comparisonChartData} options={barOptions} />
        )}
      </div>
      
      {/* Forecast Warning */}
      {budgetData.variance > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Budget Risk</p>
            <p className="text-xs text-amber-600 mt-1">
              Forecast completion cost: {formatCurrency(budgetData.forecastCost)} 
              ({formatCurrency(Math.abs(budgetData.variance))} over budget)
            </p>
          </div>
        </div>
      )}
      
      {/* Burn Rate */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Monthly Burn Rate</span>
          <span className="text-xs font-medium text-gray-900">
            {formatCurrency(budgetData.burnRate)}/month
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              budgetData.percentSpent > 90
                ? 'bg-red-500'
                : budgetData.percentSpent > 70
                ? 'bg-amber-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, budgetData.percentSpent)}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-500 text-right">
          {budgetData.percentSpent.toFixed(1)}% of budget spent
        </div>
      </div>
    </div>
  )
}