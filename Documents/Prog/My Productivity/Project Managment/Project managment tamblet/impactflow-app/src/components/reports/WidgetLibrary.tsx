'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { X, BarChart, PieChart, LineChart, Activity, Target, Users, GitBranch, Calendar } from 'lucide-react'
import { WidgetType, WidgetLibraryItem } from '@/types/report'

interface WidgetLibraryProps {
  onClose: () => void
  onAddWidget: (type: WidgetType, defaultConfig?: any) => void
}

const widgetLibraryItems: WidgetLibraryItem[] = [
  {
    type: WidgetType.PROJECT_OVERVIEW,
    name: 'Project Overview',
    description: 'Key metrics summary with health indicators',
    icon: 'Activity',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
    maxSize: { w: 12, h: 4 },
  },
  {
    type: WidgetType.TASK_PROGRESS,
    name: 'Task Progress Chart',
    description: 'Progress over time with trend analysis',
    icon: 'LineChart',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
  },
  {
    type: WidgetType.RESOURCE_UTILIZATION,
    name: 'Resource Utilization',
    description: 'Team allocation and capacity visualization',
    icon: 'PieChart',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 6, h: 6 },
  },
  {
    type: WidgetType.BUDGET_BURNDOWN,
    name: 'Budget Burndown',
    description: 'Budget consumption vs. planned spending',
    icon: 'BarChart',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
  },
  {
    type: WidgetType.RISK_HEATMAP,
    name: 'Risk Heatmap',
    description: 'Risk matrix with impact and probability',
    icon: 'Target',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 6, h: 6 },
  },
  {
    type: WidgetType.MILESTONE_TIMELINE,
    name: 'Milestone Timeline',
    description: 'Gantt-style milestone visualization',
    icon: 'Calendar',
    defaultSize: { w: 8, h: 4 },
    minSize: { w: 6, h: 3 },
    maxSize: { w: 12, h: 6 },
  },
  {
    type: WidgetType.TEAM_PERFORMANCE,
    name: 'Team Performance',
    description: 'Team productivity and efficiency metrics',
    icon: 'Users',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 6, h: 6 },
  },
  {
    type: WidgetType.CRITICAL_PATH,
    name: 'Critical Path Diagram',
    description: 'Network diagram of critical tasks',
    icon: 'GitBranch',
    defaultSize: { w: 8, h: 5 },
    minSize: { w: 6, h: 4 },
    maxSize: { w: 12, h: 8 },
  },
]

const iconComponents = {
  Activity,
  BarChart,
  PieChart,
  LineChart,
  Target,
  Users,
  GitBranch,
  Calendar,
}

export function WidgetLibrary({ onClose, onAddWidget }: WidgetLibraryProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40"
      />
      
      {/* Sidebar */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-hidden"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Widget Library</h2>
              <button
                onClick={onClose}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Drag or click to add widgets to your report
            </p>
          </div>
          
          {/* Widget List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid gap-4">
              {widgetLibraryItems.map((item) => {
                const Icon = iconComponents[item.icon as keyof typeof iconComponents]
                
                return (
                  <motion.button
                    key={item.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAddWidget(item.type, {
                      title: item.name,
                      size: item.defaultSize,
                    })}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg border border-gray-200 group-hover:border-indigo-300">
                        <Icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                        <div className="mt-2 text-xs text-gray-400">
                          Default size: {item.defaultSize.w}×{item.defaultSize.h}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Tip: You can resize and reposition widgets after adding them
            </p>
          </div>
        </div>
      </motion.div>
    </>
  )
}