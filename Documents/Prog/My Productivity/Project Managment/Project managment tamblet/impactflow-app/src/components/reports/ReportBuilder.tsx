'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { Save, Download, Settings, Plus, X, FileDown, FileImage, MousePointer, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { emitCursorMove, socketManager } from '@/lib/socket'
import { User } from '@/types/project'
import { Report, ReportWidget, WidgetType } from '@/types/report'
import { usePermissions } from '@/hooks/usePermissions'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { WidgetLibrary } from './WidgetLibrary'
import { ProjectOverviewWidget } from './widgets/ProjectOverviewWidget'
import { TaskProgressChart } from './widgets/TaskProgressChart'
import { ResourceUtilizationChart } from './widgets/ResourceUtilizationChart'
import { BudgetBurndownChart } from './widgets/BudgetBurndownChart'
import { RiskHeatmap } from './widgets/RiskHeatmap'
import { MilestoneTimeline } from './widgets/MilestoneTimeline'
import { TeamPerformanceChart } from './widgets/TeamPerformanceChart'
import { CriticalPathDiagram } from './widgets/CriticalPathDiagram'
import { ReportTemplates } from './ReportTemplates'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface ReportBuilderProps {
  projectId: string
  initialReport?: Report
  onSave?: (report: Report) => void
  currentUser?: User
}

// Utility functions
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  } as T
}

function stringToHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

export function ReportBuilder({ projectId, initialReport, onSave, currentUser }: ReportBuilderProps) {
  const { canCreate, canUpdate, canDelete, canExport } = usePermissions()
  const { hasMinimumRole } = useRoleAccess()
  const isReadOnly = !canUpdate('reports') && !canCreate('reports')
  
  const [report, setReport] = useState<Report>(
    initialReport || {
      id: `report-${Date.now()}`,
      name: 'Untitled Report',
      description: '',
      projectId,
      widgets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser?.id || 'current-user',
    }
  )
  
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingWidget, setEditingWidget] = useState<string | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)
  const [collaboratorCursors, setCollaboratorCursors] = useState<Map<string, { x: number; y: number; user: User }>>(new Map())
  const cursorTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Real-time updates
  const { onlineUsers } = useRealtimeUpdates({
    projectId,
    user: currentUser,
  })

  // Handle cursor movement
  useEffect(() => {
    if (!currentUser || !reportRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = reportRef.current!.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      
      // Throttle cursor updates
      emitCursorMove({ x, y }, currentUser.id)
    }

    const throttledMouseMove = throttle(handleMouseMove, 50)
    reportRef.current.addEventListener('mousemove', throttledMouseMove)

    return () => {
      reportRef.current?.removeEventListener('mousemove', throttledMouseMove)
    }
  }, [currentUser])

  // Listen for cursor movements from other users
  useEffect(() => {
    const handleCursorMove = (position: { x: number; y: number }, userId: string) => {
      if (userId === currentUser?.id) return
      
      const user = onlineUsers.find(u => u.id === userId)
      if (!user) return

      setCollaboratorCursors(prev => {
        const next = new Map(prev)
        next.set(userId, { ...position, user })
        return next
      })

      // Clear existing timeout
      if (cursorTimeouts.current.has(userId)) {
        clearTimeout(cursorTimeouts.current.get(userId)!)
      }

      // Hide cursor after 3 seconds of inactivity
      const timeout = setTimeout(() => {
        setCollaboratorCursors(prev => {
          const next = new Map(prev)
          next.delete(userId)
          return next
        })
      }, 3000)

      cursorTimeouts.current.set(userId, timeout)
    }

    const unsubscribe = socketManager.on('cursorMove', handleCursorMove)

    return () => {
      unsubscribe()
      // Clear all timeouts
      cursorTimeouts.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [currentUser, onlineUsers])

  const handleLayoutChange = useCallback((layout: Layout[]) => {
    setReport(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget => {
        const layoutItem = layout.find(l => l.i === widget.id)
        if (layoutItem) {
          return {
            ...widget,
            position: { x: layoutItem.x, y: layoutItem.y },
            size: { w: layoutItem.w, h: layoutItem.h },
          }
        }
        return widget
      }),
      updatedAt: new Date(),
    }))
  }, [])

  const handleAddWidget = useCallback((type: WidgetType, defaultConfig?: any) => {
    const newWidget: ReportWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: defaultConfig?.title || 'New Widget',
      position: { x: 0, y: 0 },
      size: defaultConfig?.size || { w: 4, h: 3 },
      config: {
        projectId,
        ...defaultConfig?.config,
      },
    }
    
    setReport(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      updatedAt: new Date(),
    }))
    
    setShowWidgetLibrary(false)
    toast.success('Widget added to report')
  }, [projectId])

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setReport(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date(),
    }))
    toast.success('Widget removed')
  }, [])

  const handleUpdateWidget = useCallback((widgetId: string, updates: Partial<ReportWidget>) => {
    setReport(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      ),
      updatedAt: new Date(),
    }))
  }, [])

  const handleSaveReport = useCallback(() => {
    if (onSave) {
      onSave(report)
      toast.success('Report saved successfully')
    }
  }, [report, onSave])

  const handleExportPDF = useCallback(async () => {
    if (!reportRef.current) return
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${report.name}.pdf`)
      
      toast.success('Report exported as PDF')
    } catch (error) {
      toast.error('Failed to export PDF')
      console.error(error)
    }
  }, [report.name])

  const handleExportPNG = useCallback(async () => {
    if (!reportRef.current) return
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      })
      
      const link = document.createElement('a')
      link.download = `${report.name}.png`
      link.href = canvas.toDataURL()
      link.click()
      
      toast.success('Report exported as PNG')
    } catch (error) {
      toast.error('Failed to export PNG')
      console.error(error)
    }
  }, [report.name])

  const handleLoadTemplate = useCallback((template: Report) => {
    setReport({
      ...template,
      id: `report-${Date.now()}`,
      projectId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isTemplate: false,
    })
    setShowTemplates(false)
    toast.success('Template loaded')
  }, [projectId])

  const renderWidget = (widget: ReportWidget) => {
    const commonProps = {
      widget,
      onUpdate: (updates: Partial<ReportWidget>) => handleUpdateWidget(widget.id, updates),
      isEditing: editingWidget === widget.id,
    }

    switch (widget.type) {
      case WidgetType.PROJECT_OVERVIEW:
        return <ProjectOverviewWidget {...commonProps} />
      case WidgetType.TASK_PROGRESS:
        return <TaskProgressChart {...commonProps} />
      case WidgetType.RESOURCE_UTILIZATION:
        return <ResourceUtilizationChart {...commonProps} />
      case WidgetType.BUDGET_BURNDOWN:
        return <BudgetBurndownChart {...commonProps} />
      case WidgetType.RISK_HEATMAP:
        return <RiskHeatmap {...commonProps} />
      case WidgetType.MILESTONE_TIMELINE:
        return <MilestoneTimeline {...commonProps} />
      case WidgetType.TEAM_PERFORMANCE:
        return <TeamPerformanceChart {...commonProps} />
      case WidgetType.CRITICAL_PATH:
        return <CriticalPathDiagram {...commonProps} />
      default:
        return <div className="p-4">Widget not implemented</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
              type="text"
              value={report.name}
              onChange={(e) => setReport(prev => ({ ...prev, name: e.target.value }))}
              className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2"
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
            <input
              type="text"
              value={report.description || ''}
              onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add a description..."
              className="text-sm text-gray-500 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 mt-1 w-full"
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
            </div>
            {onlineUsers.length > 1 && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  {onlineUsers.filter(u => u.id !== currentUser?.id).slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-medium border-2 border-white"
                      style={{ backgroundColor: `hsl(${stringToHue(user.id)}, 70%, 50%)` }}
                    >
                      {user.name.charAt(0)}
                    </div>
                  ))}
                </div>
                <span>{onlineUsers.length - 1} collaborating</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <PermissionGate resource="reports" action="read">
              <button
                onClick={() => setShowTemplates(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Templates
              </button>
            </PermissionGate>
            
            <PermissionGate 
              resource="reports" 
              action="update"
              fallback={
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg flex items-center gap-2 cursor-not-allowed"
                  title="You don't have permission to edit this report"
                >
                  <Lock className="w-4 h-4" />
                  Add Widget
                </button>
              }
            >
              <button
                onClick={() => setShowWidgetLibrary(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Widget
              </button>
            </PermissionGate>
            
            <div className="h-8 w-px bg-gray-300" />
            
            <PermissionGate resource="reports" action="update">
              <button
                onClick={handleSaveReport}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Save Report"
              >
                <Save className="w-5 h-5" />
              </button>
            </PermissionGate>
            
            <PermissionGate resource="reports" action="export">
              <button
                onClick={handleExportPDF}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Export as PDF"
              >
                <FileDown className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleExportPNG}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Export as PNG"
              >
                <FileImage className="w-5 h-5" />
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* Report Canvas */}
      <div ref={reportRef} className="p-6 relative">
        {/* Collaborator Cursors */}
        <AnimatePresence>
          {Array.from(collaboratorCursors.values()).map(({ x, y, user }) => (
            <motion.div
              key={user.id}
              className="absolute pointer-events-none z-50"
              style={{ left: `${x}%`, top: `${y}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <div className="relative">
                <MousePointer
                  className="w-4 h-4 text-primary transform -rotate-12"
                  style={{ filter: `hue-rotate(${stringToHue(user.id)}deg)` }}
                />
                <div className="absolute left-6 -top-1 bg-primary text-white text-xs px-2 py-1 rounded-full whitespace-nowrap shadow-sm"
                  style={{ backgroundColor: `hsl(${stringToHue(user.id)}, 70%, 50%)` }}
                >
                  {user.name}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {report.widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Plus className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start building your report</h3>
            <p className="text-sm text-gray-500 mb-4">Add widgets to visualize your project data</p>
            <button
              onClick={() => setShowWidgetLibrary(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Add First Widget
            </button>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: report.widgets.map(w => ({
              i: w.id,
              x: w.position.x,
              y: w.position.y,
              w: w.size.w,
              h: w.size.h,
            })) }}
            onLayoutChange={handleLayoutChange}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            isDraggable
            isResizable
            margin={[16, 16]}
          >
            {report.widgets.map(widget => (
              <div key={widget.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{widget.title}</h3>
                  <div className="flex items-center gap-2">
                    <PermissionGate resource="reports" action="update">
                      <button
                        onClick={() => setEditingWidget(editingWidget === widget.id ? null : widget.id)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </PermissionGate>
                    <PermissionGate resource="reports" action="update">
                      <button
                        onClick={() => handleRemoveWidget(widget.id)}
                        className="p-1 text-gray-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </PermissionGate>
                  </div>
                </div>
                <div className="p-4">
                  {renderWidget(widget)}
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>

      {/* Widget Library Sidebar */}
      <AnimatePresence>
        {showWidgetLibrary && (
          <WidgetLibrary
            onClose={() => setShowWidgetLibrary(false)}
            onAddWidget={handleAddWidget}
          />
        )}
      </AnimatePresence>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <ReportTemplates
            onClose={() => setShowTemplates(false)}
            onSelectTemplate={handleLoadTemplate}
          />
        )}
      </AnimatePresence>
    </div>
  )
}