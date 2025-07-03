'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { X, FileText, Users, DollarSign, AlertTriangle } from 'lucide-react'
import { Report, ReportTemplateType, WidgetType } from '@/types/report'

interface ReportTemplatesProps {
  onClose: () => void
  onSelectTemplate: (template: Report) => void
}

const templates: Report[] = [
  {
    id: 'template-executive',
    name: 'Executive Summary',
    description: 'High-level overview for stakeholders',
    projectId: '',
    widgets: [
      {
        id: 'exec-1',
        type: WidgetType.PROJECT_OVERVIEW,
        title: 'Project Health Dashboard',
        position: { x: 0, y: 0 },
        size: { w: 12, h: 3 },
        config: {},
      },
      {
        id: 'exec-2',
        type: WidgetType.BUDGET_BURNDOWN,
        title: 'Budget Overview',
        position: { x: 0, y: 3 },
        size: { w: 6, h: 4 },
        config: {},
      },
      {
        id: 'exec-3',
        type: WidgetType.MILESTONE_TIMELINE,
        title: 'Key Milestones',
        position: { x: 6, y: 3 },
        size: { w: 6, h: 4 },
        config: {},
      },
      {
        id: 'exec-4',
        type: WidgetType.RISK_HEATMAP,
        title: 'Risk Assessment',
        position: { x: 0, y: 7 },
        size: { w: 4, h: 4 },
        config: {},
      },
      {
        id: 'exec-5',
        type: WidgetType.TASK_PROGRESS,
        title: 'Overall Progress',
        position: { x: 4, y: 7 },
        size: { w: 8, h: 4 },
        config: {},
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    isTemplate: true,
    templateType: ReportTemplateType.EXECUTIVE_SUMMARY,
  },
  {
    id: 'template-weekly',
    name: 'Weekly Status Report',
    description: 'Detailed progress update for team meetings',
    projectId: '',
    widgets: [
      {
        id: 'weekly-1',
        type: WidgetType.TASK_PROGRESS,
        title: 'Weekly Progress',
        position: { x: 0, y: 0 },
        size: { w: 8, h: 4 },
        config: { dateRange: { start: new Date(), end: new Date() } },
      },
      {
        id: 'weekly-2',
        type: WidgetType.TEAM_PERFORMANCE,
        title: 'Team Productivity',
        position: { x: 8, y: 0 },
        size: { w: 4, h: 4 },
        config: {},
      },
      {
        id: 'weekly-3',
        type: WidgetType.CRITICAL_PATH,
        title: 'Critical Path Analysis',
        position: { x: 0, y: 4 },
        size: { w: 12, h: 5 },
        config: {},
      },
      {
        id: 'weekly-4',
        type: WidgetType.RESOURCE_UTILIZATION,
        title: 'Resource Allocation',
        position: { x: 0, y: 9 },
        size: { w: 6, h: 4 },
        config: {},
      },
      {
        id: 'weekly-5',
        type: WidgetType.RISK_HEATMAP,
        title: 'Current Risks',
        position: { x: 6, y: 9 },
        size: { w: 6, h: 4 },
        config: {},
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    isTemplate: true,
    templateType: ReportTemplateType.WEEKLY_STATUS,
  },
  {
    id: 'template-resource',
    name: 'Resource Planning',
    description: 'Team allocation and capacity analysis',
    projectId: '',
    widgets: [
      {
        id: 'resource-1',
        type: WidgetType.RESOURCE_UTILIZATION,
        title: 'Overall Resource Utilization',
        position: { x: 0, y: 0 },
        size: { w: 6, h: 4 },
        config: {},
      },
      {
        id: 'resource-2',
        type: WidgetType.TEAM_PERFORMANCE,
        title: 'Team Performance Metrics',
        position: { x: 6, y: 0 },
        size: { w: 6, h: 4 },
        config: {},
      },
      {
        id: 'resource-3',
        type: WidgetType.TASK_PROGRESS,
        title: 'Task Distribution by Team',
        position: { x: 0, y: 4 },
        size: { w: 12, h: 4 },
        config: {},
      },
      {
        id: 'resource-4',
        type: WidgetType.BUDGET_BURNDOWN,
        title: 'Resource Cost Analysis',
        position: { x: 0, y: 8 },
        size: { w: 8, h: 4 },
        config: {},
      },
      {
        id: 'resource-5',
        type: WidgetType.PROJECT_OVERVIEW,
        title: 'Capacity Summary',
        position: { x: 8, y: 8 },
        size: { w: 4, h: 4 },
        config: {},
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    isTemplate: true,
    templateType: ReportTemplateType.RESOURCE_PLANNING,
  },
  {
    id: 'template-risk',
    name: 'Risk Assessment',
    description: 'Comprehensive risk analysis and mitigation tracking',
    projectId: '',
    widgets: [
      {
        id: 'risk-1',
        type: WidgetType.RISK_HEATMAP,
        title: 'Risk Matrix',
        position: { x: 0, y: 0 },
        size: { w: 8, h: 5 },
        config: {},
      },
      {
        id: 'risk-2',
        type: WidgetType.PROJECT_OVERVIEW,
        title: 'Risk Summary',
        position: { x: 8, y: 0 },
        size: { w: 4, h: 5 },
        config: {},
      },
      {
        id: 'risk-3',
        type: WidgetType.CRITICAL_PATH,
        title: 'Critical Path Risks',
        position: { x: 0, y: 5 },
        size: { w: 12, h: 5 },
        config: {},
      },
      {
        id: 'risk-4',
        type: WidgetType.TASK_PROGRESS,
        title: 'At-Risk Tasks',
        position: { x: 0, y: 10 },
        size: { w: 6, h: 4 },
        config: {},
      },
      {
        id: 'risk-5',
        type: WidgetType.BUDGET_BURNDOWN,
        title: 'Budget Risk Analysis',
        position: { x: 6, y: 10 },
        size: { w: 6, h: 4 },
        config: {},
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    isTemplate: true,
    templateType: ReportTemplateType.RISK_ASSESSMENT,
  },
]

const templateIcons = {
  [ReportTemplateType.EXECUTIVE_SUMMARY]: FileText,
  [ReportTemplateType.WEEKLY_STATUS]: FileText,
  [ReportTemplateType.RESOURCE_PLANNING]: Users,
  [ReportTemplateType.RISK_ASSESSMENT]: AlertTriangle,
}

const templateColors = {
  [ReportTemplateType.EXECUTIVE_SUMMARY]: 'bg-blue-100 text-blue-600',
  [ReportTemplateType.WEEKLY_STATUS]: 'bg-green-100 text-green-600',
  [ReportTemplateType.RESOURCE_PLANNING]: 'bg-purple-100 text-purple-600',
  [ReportTemplateType.RISK_ASSESSMENT]: 'bg-red-100 text-red-600',
}

export function ReportTemplates({ onClose, onSelectTemplate }: ReportTemplatesProps) {
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
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Report Templates</h2>
              <button
                onClick={onClose}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Start with a pre-built template and customize it to your needs
            </p>
          </div>
          
          {/* Template Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => {
                const Icon = templateIcons[template.templateType!] || FileText
                const colorClass = templateColors[template.templateType!] || 'bg-gray-100 text-gray-600'
                
                return (
                  <motion.button
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectTemplate(template)}
                    className="p-6 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-gray-400">
                            {template.widgets.length} widgets
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">
                            Ready to customize
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}