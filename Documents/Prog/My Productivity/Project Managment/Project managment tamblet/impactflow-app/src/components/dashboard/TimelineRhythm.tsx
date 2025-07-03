'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, Flag, AlertCircle } from 'lucide-react'
import { Task } from '@/types/project'
import { useState } from 'react'

interface TimelineRhythmProps {
  tasks: Task[]
}

interface MilestoneData {
  task: Task
  daysUntil: number
  progress: number
  dependencies: number
  risk: 'low' | 'medium' | 'high'
}

export function TimelineRhythm({ tasks }: TimelineRhythmProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null)
  
  const today = new Date()
  const timeRangeMap = {
    week: 7,
    month: 30,
    quarter: 90
  }
  
  // Get milestones and critical tasks
  const milestones = tasks.filter(t => 
    t.milestone || t.criticalityLevel === 'Critical' || t.type === 'Milestone'
  )
  
  // Calculate milestone data
  const milestoneData: MilestoneData[] = milestones
    .map(task => {
      const targetDate = task.endDate || task.startDate || new Date()
      const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calculate dependencies
      const dependencies = tasks.filter(t => 
        t.dependencies?.includes(task.id) || t.blockingTasks?.includes(task.id)
      ).length
      
      // Determine risk level
      let risk: 'low' | 'medium' | 'high' = 'low'
      if (task.riskScore > 60 || (daysUntil < 7 && task.percentComplete < 80)) {
        risk = 'high'
      } else if (task.riskScore > 30 || (daysUntil < 14 && task.percentComplete < 60)) {
        risk = 'medium'
      }
      
      return {
        task,
        daysUntil,
        progress: task.percentComplete,
        dependencies,
        risk
      }
    })
    .filter(m => m.daysUntil >= -7 && m.daysUntil <= timeRangeMap[timeRange])
    .sort((a, b) => a.daysUntil - b.daysUntil)
  
  // Group tasks by week for burn chart
  const weeklyData = []
  const weeks = Math.ceil(timeRangeMap[timeRange] / 7)
  
  for (let i = 0; i < weeks; i++) {
    const weekStart = i * 7
    const weekEnd = (i + 1) * 7
    const weekTasks = tasks.filter(t => {
      const daysUntil = t.endDate 
        ? Math.ceil((t.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      return daysUntil >= weekStart && daysUntil < weekEnd
    })
    
    weeklyData.push({
      week: i + 1,
      planned: weekTasks.length,
      completed: weekTasks.filter(t => t.status === 'Complete').length,
      atRisk: weekTasks.filter(t => t.riskScore > 60).length
    })
  }
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-status-danger bg-red-50 border-red-200'
      case 'medium': return 'text-status-warning bg-yellow-50 border-yellow-200'
      default: return 'text-status-success bg-green-50 border-green-200'
    }
  }
  
  const getProgressColor = (progress: number, daysUntil: number) => {
    if (daysUntil < 0) return progress === 100 ? 'bg-status-success' : 'bg-status-danger'
    if (daysUntil < 7) return progress > 80 ? 'bg-status-success' : 'bg-status-warning'
    return 'bg-primary'
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Timeline Rhythm</h2>
        <div className="flex items-center gap-2">
          {(['week', 'month', 'quarter'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors capitalize ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      {/* Milestone Timeline */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-neutral-700 mb-3">Upcoming Milestones</h3>
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-neutral-200" />
          
          <div className="space-y-4">
            {milestoneData.length > 0 ? (
              milestoneData.map((milestone, index) => (
                <motion.div
                  key={milestone.task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedMilestone === milestone.task.id
                      ? 'border-primary bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => setSelectedMilestone(
                    selectedMilestone === milestone.task.id ? null : milestone.task.id
                  )}
                >
                  {/* Timeline Dot */}
                  <div className={`relative z-10 w-4 h-4 rounded-full border-2 border-white ${
                    milestone.daysUntil < 0 
                      ? milestone.progress === 100 ? 'bg-status-success' : 'bg-status-danger'
                      : milestone.risk === 'high' ? 'bg-status-danger'
                      : milestone.risk === 'medium' ? 'bg-status-warning'
                      : 'bg-primary'
                  }`} />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {milestone.task.name}
                          <Flag className="w-3 h-3 text-neutral-400" />
                        </div>
                        <div className="text-sm text-neutral-600 mt-1">
                          {milestone.daysUntil < 0 ? (
                            <span className="text-status-danger">
                              {Math.abs(milestone.daysUntil)} days overdue
                            </span>
                          ) : milestone.daysUntil === 0 ? (
                            <span className="text-primary font-medium">Due today</span>
                          ) : (
                            <span>{milestone.daysUntil} days remaining</span>
                          )}
                          {milestone.dependencies > 0 && (
                            <span className="text-neutral-500 ml-2">
                              • {milestone.dependencies} dependencies
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-full ${getRiskColor(milestone.risk)}`}>
                        {milestone.risk} risk
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                        <span>Progress</span>
                        <span>{milestone.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div
                          className={getProgressColor(milestone.progress, milestone.daysUntil)}
                          initial={{ width: 0 }}
                          animate={{ width: `${milestone.progress}%` }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No milestones in the selected time range
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Weekly Burn Chart */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-neutral-700 mb-3">Weekly Delivery Rhythm</h3>
        <div className="space-y-2">
          {weeklyData.map((week, index) => (
            <div key={week.week} className="flex items-center gap-3">
              <div className="text-xs text-neutral-600 w-12">Wk {week.week}</div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-6 bg-neutral-100 rounded-lg overflow-hidden relative">
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-status-success"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: week.planned > 0 
                        ? `${(week.completed / week.planned) * 100}%` 
                        : '0%' 
                    }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                  {week.atRisk > 0 && (
                    <motion.div
                      className="absolute right-0 top-0 h-full bg-status-danger opacity-50"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: week.planned > 0 
                          ? `${(week.atRisk / week.planned) * 100}%` 
                          : '0%' 
                      }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.05 }}
                    />
                  )}
                </div>
                <div className="text-xs text-neutral-600 w-16 text-right">
                  {week.completed}/{week.planned}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-neutral-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-status-success rounded" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-status-danger rounded opacity-50" />
            <span>At Risk</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-neutral-100 rounded" />
            <span>Remaining</span>
          </div>
        </div>
      </div>
      
      {/* Critical Path Alert */}
      {tasks.some(t => t.criticalPath && t.percentComplete < 100) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-orange-800">Critical Path Alert</div>
            <div className="text-orange-700">
              {tasks.filter(t => t.criticalPath && t.percentComplete < 100).length} tasks on critical path need attention
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}