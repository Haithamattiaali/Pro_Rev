'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Flag, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ReportWidget } from '@/types/report'
import { useProjectStore } from '@/store/projectStore'
import { TaskStatus } from '@/types/project'

interface MilestoneTimelineProps {
  widget: ReportWidget
  onUpdate: (updates: Partial<ReportWidget>) => void
  isEditing: boolean
}

export function MilestoneTimeline({ widget, onUpdate, isEditing }: MilestoneTimelineProps) {
  const { tasks } = useProjectStore()
  
  const milestoneData = useMemo(() => {
    // Filter milestone tasks and sort by date
    const milestones = tasks
      .filter(task => task.milestone)
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    
    // Calculate timeline range
    const today = new Date()
    const startDate = milestones.length > 0 
      ? new Date(Math.min(...milestones.map(m => new Date(m.startDate).getTime())))
      : today
    const endDate = milestones.length > 0
      ? new Date(Math.max(...milestones.map(m => new Date(m.endDate).getTime())))
      : new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    
    const totalDays = differenceInDays(endDate, startDate) || 1
    
    // Process milestones with position calculations
    const processedMilestones = milestones.map(milestone => {
      const milestoneDate = new Date(milestone.endDate)
      const daysFromStart = differenceInDays(milestoneDate, startDate)
      const position = (daysFromStart / totalDays) * 100
      const daysFromToday = differenceInDays(milestoneDate, today)
      
      let status: 'completed' | 'upcoming' | 'overdue' | 'at-risk'
      if (milestone.status === TaskStatus.COMPLETE) {
        status = 'completed'
      } else if (daysFromToday < 0) {
        status = 'overdue'
      } else if (daysFromToday <= 7 && milestone.percentComplete < 80) {
        status = 'at-risk'
      } else {
        status = 'upcoming'
      }
      
      return {
        ...milestone,
        position,
        daysFromToday,
        status,
      }
    })
    
    // Calculate statistics
    const completedCount = processedMilestones.filter(m => m.status === 'completed').length
    const overdueCount = processedMilestones.filter(m => m.status === 'overdue').length
    const atRiskCount = processedMilestones.filter(m => m.status === 'at-risk').length
    const upcomingCount = processedMilestones.filter(m => m.status === 'upcoming').length
    
    return {
      milestones: processedMilestones,
      startDate,
      endDate,
      totalDays,
      completedCount,
      overdueCount,
      atRiskCount,
      upcomingCount,
      totalCount: milestones.length,
    }
  }, [tasks])
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'at-risk':
        return <Clock className="w-4 h-4 text-amber-600" />
      default:
        return <Flag className="w-4 h-4 text-blue-600" />
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'at-risk':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }
  
  if (isEditing) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Milestone Timeline displays all project milestones in chronological order.
          No configuration needed - it automatically uses milestone tasks.
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-2">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-900">{milestoneData.totalCount}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-lg font-semibold text-green-600">{milestoneData.completedCount}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-semibold text-blue-600">{milestoneData.upcomingCount}</div>
          <div className="text-xs text-gray-500">Upcoming</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="text-lg font-semibold text-amber-600">{milestoneData.atRiskCount}</div>
          <div className="text-xs text-gray-500">At Risk</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <div className="text-lg font-semibold text-red-600">{milestoneData.overdueCount}</div>
          <div className="text-xs text-gray-500">Overdue</div>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="relative">
        {/* Timeline bar */}
        <div className="absolute top-8 left-0 right-0 h-2 bg-gray-200 rounded-full overflow-hidden">
          {/* Progress indicator */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(milestoneData.completedCount / milestoneData.totalCount) * 100}%` }}
            className="h-full bg-green-500"
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        
        {/* Today marker */}
        <div 
          className="absolute top-0 w-0.5 h-full bg-indigo-600"
          style={{
            left: `${(differenceInDays(new Date(), milestoneData.startDate) / milestoneData.totalDays) * 100}%`
          }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-indigo-600 whitespace-nowrap">
            Today
          </div>
        </div>
        
        {/* Milestones */}
        <div className="relative h-24 mt-12">
          {milestoneData.milestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="absolute"
              style={{
                left: `${milestone.position}%`,
                transform: 'translateX(-50%)',
              }}
            >
              {/* Milestone marker */}
              <div className="relative">
                <div className={`
                  w-4 h-4 rounded-full border-2 bg-white
                  ${milestone.status === 'completed' ? 'border-green-600' :
                    milestone.status === 'overdue' ? 'border-red-600' :
                    milestone.status === 'at-risk' ? 'border-amber-600' :
                    'border-blue-600'}
                `} />
                
                {/* Milestone card */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-40">
                  <div className={`
                    p-2 rounded-lg border text-xs cursor-pointer
                    hover:shadow-md transition-shadow
                    ${getStatusColor(milestone.status)}
                  `}>
                    <div className="flex items-start gap-2">
                      {getStatusIcon(milestone.status)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{milestone.name}</div>
                        <div className="text-[10px] opacity-75">
                          {format(new Date(milestone.endDate), 'MMM d, yyyy')}
                        </div>
                        {milestone.status !== 'completed' && (
                          <div className="text-[10px] font-medium">
                            {milestone.daysFromToday > 0 
                              ? `In ${milestone.daysFromToday} days`
                              : `${Math.abs(milestone.daysFromToday)} days overdue`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Date labels */}
        <div className="flex justify-between mt-32 text-xs text-gray-500">
          <div>{format(milestoneData.startDate, 'MMM d, yyyy')}</div>
          <div>{format(milestoneData.endDate, 'MMM d, yyyy')}</div>
        </div>
      </div>
      
      {milestoneData.milestones.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Flag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No milestones defined for this project</p>
        </div>
      )}
    </div>
  )
}