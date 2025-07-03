'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react'
import { ReportWidget } from '@/types/report'
import { useProjectStore } from '@/store/projectStore'
import { TaskStatus, HealthIndicator } from '@/types/project'

interface ProjectOverviewWidgetProps {
  widget: ReportWidget
  onUpdate: (updates: Partial<ReportWidget>) => void
  isEditing: boolean
}

export function ProjectOverviewWidget({ widget, onUpdate, isEditing }: ProjectOverviewWidgetProps) {
  const { tasks, currentProject } = useProjectStore()
  
  const metrics = useMemo(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETE).length
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length
    const blockedTasks = tasks.filter(t => t.status === TaskStatus.BLOCKED).length
    const overdueTasks = tasks.filter(t => 
      t.endDate < new Date() && t.status !== TaskStatus.COMPLETE
    ).length
    
    const totalBudget = tasks.reduce((sum, t) => sum + (t.costBudget || 0), 0)
    const spentBudget = tasks.reduce((sum, t) => sum + (t.actualCost || 0), 0)
    const budgetUtilization = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0
    
    const avgSPI = tasks.length > 0 
      ? tasks.reduce((sum, t) => sum + (t.spi || 1), 0) / tasks.length 
      : 1
    
    const avgCPI = tasks.length > 0 
      ? tasks.reduce((sum, t) => sum + (t.cpi || 1), 0) / tasks.length 
      : 1
    
    const criticalTasks = tasks.filter(t => t.criticalPath).length
    const highRiskTasks = tasks.filter(t => t.riskScore >= 7).length
    
    const healthCounts = {
      [HealthIndicator.GREEN]: tasks.filter(t => t.healthIndicator === HealthIndicator.GREEN).length,
      [HealthIndicator.YELLOW]: tasks.filter(t => t.healthIndicator === HealthIndicator.YELLOW).length,
      [HealthIndicator.ORANGE]: tasks.filter(t => t.healthIndicator === HealthIndicator.ORANGE).length,
      [HealthIndicator.RED]: tasks.filter(t => t.healthIndicator === HealthIndicator.RED).length,
      [HealthIndicator.BLACK]: tasks.filter(t => t.healthIndicator === HealthIndicator.BLACK).length,
    }
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      totalBudget,
      spentBudget,
      budgetUtilization,
      avgSPI,
      avgCPI,
      criticalTasks,
      highRiskTasks,
      healthCounts,
      overallHealth: currentProject?.healthScore || 0,
    }
  }, [tasks, currentProject])
  
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
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
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Project Overview widget shows key metrics and health indicators.
          No configuration needed - it automatically uses project data.
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Overall Health Score */}
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-gray-600" />
          <h4 className="text-sm font-medium text-gray-600">Overall Health Score</h4>
        </div>
        <div className={`inline-flex items-center px-4 py-2 rounded-full ${getHealthColor(metrics.overallHealth)}`}>
          <span className="text-2xl font-bold">{metrics.overallHealth}%</span>
        </div>
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Completion Rate */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-3 bg-white border border-gray-200 rounded-lg"
        >
          <div className="flex items-center justify-between mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-500">
              {metrics.completedTasks}/{metrics.totalTasks}
            </span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {metrics.completionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Completed</div>
        </motion.div>
        
        {/* Budget Utilization */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-3 bg-white border border-gray-200 rounded-lg"
        >
          <div className="flex items-center justify-between mb-1">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className={`text-xs ${metrics.budgetUtilization > 90 ? 'text-red-500' : 'text-gray-500'}`}>
              {metrics.budgetUtilization.toFixed(0)}%
            </span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(metrics.spentBudget)}
          </div>
          <div className="text-xs text-gray-500">Budget Used</div>
        </motion.div>
        
        {/* Schedule Performance */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-3 bg-white border border-gray-200 rounded-lg"
        >
          <div className="flex items-center justify-between mb-1">
            <Clock className="w-4 h-4 text-purple-600" />
            {metrics.avgSPI >= 1 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {metrics.avgSPI.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">Schedule Index</div>
        </motion.div>
        
        {/* Risks & Issues */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-3 bg-white border border-gray-200 rounded-lg"
        >
          <div className="flex items-center justify-between mb-1">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-red-500">
              {metrics.blockedTasks} blocked
            </span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {metrics.highRiskTasks}
          </div>
          <div className="text-xs text-gray-500">High Risk Tasks</div>
        </motion.div>
      </div>
      
      {/* Task Status Summary */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Task Distribution</h4>
        <div className="flex gap-2">
          <div className="flex-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded text-center">
            {metrics.completedTasks} Complete
          </div>
          <div className="flex-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded text-center">
            {metrics.inProgressTasks} In Progress
          </div>
          <div className="flex-1 bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded text-center">
            {metrics.blockedTasks} Blocked
          </div>
          <div className="flex-1 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded text-center">
            {metrics.overdueTasks} Overdue
          </div>
        </div>
      </div>
      
      {/* Health Distribution */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Health Distribution</h4>
        <div className="flex gap-1 h-8">
          {Object.entries(metrics.healthCounts).map(([health, count]) => {
            if (count === 0) return null
            const percentage = (count / metrics.totalTasks) * 100
            const colors = {
              [HealthIndicator.GREEN]: 'bg-green-500',
              [HealthIndicator.YELLOW]: 'bg-yellow-500',
              [HealthIndicator.ORANGE]: 'bg-orange-500',
              [HealthIndicator.RED]: 'bg-red-500',
              [HealthIndicator.BLACK]: 'bg-gray-800',
            }
            
            return (
              <motion.div
                key={health}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                className={`${colors[health as HealthIndicator]} rounded transition-all duration-500`}
                title={`${health}: ${count} tasks (${percentage.toFixed(1)}%)`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}