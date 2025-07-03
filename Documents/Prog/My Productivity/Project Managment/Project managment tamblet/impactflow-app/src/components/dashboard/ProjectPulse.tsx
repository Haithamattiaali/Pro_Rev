'use client'

import { motion } from 'framer-motion'
import { AlertCircle, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import { Task, User } from '@/types/project'
import { calculateProjectHealth, getHealthColor } from '@/utils/calculations'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { useEffect, useState } from 'react'

interface ProjectPulseProps {
  tasks: Task[]
  projectId?: string
  currentUser?: User
}

export function ProjectPulse({ tasks, projectId, currentUser }: ProjectPulseProps) {
  const [realTimeHealthScore, setRealTimeHealthScore] = useState<number | null>(null)
  const healthScore = realTimeHealthScore ?? calculateProjectHealth(tasks)
  const previousHealth = 71 // This would come from historical data
  const trend = healthScore - previousHealth
  
  // Real-time updates
  const { metrics } = useRealtimeUpdates({
    projectId,
    user: currentUser,
    onMetricsUpdate: (newMetrics) => {
      if (newMetrics.healthScore) {
        setRealTimeHealthScore(newMetrics.healthScore)
      }
    },
  })
  
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: 'text-status-success' }
    if (score >= 60) return { text: 'Good', color: 'text-status-warning' }
    if (score >= 40) return { text: 'At Risk', color: 'text-orange-500' }
    return { text: 'Critical', color: 'text-status-danger' }
  }

  const healthStatus = getHealthStatus(healthScore)
  
  // Calculate vital signs
  const completeTasks = tasks.filter(t => t.status === 'Complete').length
  const blockedTasks = tasks.filter(t => t.status === 'Blocked').length
  const delayedTasks = tasks.filter(t => t.status === 'Delayed').length
  const atRiskTasks = tasks.filter(t => t.riskScore > 60).length
  
  const vitalSigns = [
    {
      label: 'Schedule',
      value: tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.spi || 1), 0) / tasks.length * 100) : 100,
      target: 90,
      unit: '%',
    },
    {
      label: 'Budget',
      value: tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.cpi || 1), 0) / tasks.length * 100) : 100,
      target: 90,
      unit: '%',
    },
    {
      label: 'Risk Level',
      value: Math.round((atRiskTasks / Math.max(tasks.length, 1)) * 100),
      target: 20,
      unit: '%',
      inverse: true,
    },
    {
      label: 'Team Load',
      value: 78, // This would be calculated from resource data
      target: 75,
      unit: '%',
    },
  ]

  const alerts = []
  if (blockedTasks > 0) {
    alerts.push({ type: 'error', message: `${blockedTasks} tasks blocked` })
  }
  if (delayedTasks > 0) {
    alerts.push({ type: 'warning', message: `${delayedTasks} tasks delayed` })
  }
  if (atRiskTasks > 5) {
    alerts.push({ type: 'warning', message: `${atRiskTasks} high-risk tasks` })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Project Pulse</h2>
        {metrics && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"
          >
            <Activity className="w-3 h-3" />
            <span>Live</span>
          </motion.div>
        )}
      </div>
      
      {/* Main Health Gauge */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              stroke={getHealthColor(healthScore >= 80 ? 'Green' : healthScore >= 60 ? 'Yellow' : 'Red')}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - healthScore / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold">{healthScore}</div>
            <div className={`text-sm font-medium ${healthStatus.color}`}>
              {healthStatus.text}
            </div>
            <div className="flex items-center mt-2">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-status-success mr-1" />
              ) : trend < 0 ? (
                <TrendingDown className="w-4 h-4 text-status-danger mr-1" />
              ) : (
                <Minus className="w-4 h-4 text-neutral-400 mr-1" />
              )}
              <span className={`text-sm ${trend > 0 ? 'text-status-success' : trend < 0 ? 'text-status-danger' : 'text-neutral-400'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vital Signs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {vitalSigns.map((sign) => {
          const isGood = sign.inverse ? sign.value <= sign.target : sign.value >= sign.target
          return (
            <div key={sign.label} className="bg-neutral-50 rounded-lg p-3">
              <div className="text-sm text-neutral-600 mb-1">{sign.label}</div>
              <div className="flex items-end justify-between">
                <div className={`text-2xl font-semibold ${isGood ? 'text-status-success' : 'text-status-warning'}`}>
                  {sign.value}{sign.unit}
                </div>
                <div className="text-xs text-neutral-500">
                  Target: {sign.target}{sign.unit}
                </div>
              </div>
              <div className="mt-2 h-1 bg-neutral-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${isGood ? 'bg-status-success' : 'bg-status-warning'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(sign.value, 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Critical Alerts</h3>
          {alerts.map((alert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-2 p-2 rounded-lg ${
                alert.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{alert.message}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}