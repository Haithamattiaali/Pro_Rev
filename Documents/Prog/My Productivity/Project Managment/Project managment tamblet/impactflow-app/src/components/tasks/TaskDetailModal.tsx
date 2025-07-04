'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ChevronDown, ChevronRight, Edit3, UserPlus, Trash2, 
  Flag, AlertTriangle, Copy, Calendar, Clock, DollarSign,
  Link, FileText, Hash, TrendingUp, Users
} from 'lucide-react'
import { Task } from '@/types/project'
import { 
  FIELD_CATEGORIES, 
  getFieldsByCategory, 
  getFieldConfig,
  TaskFieldConfig 
} from '@/config/taskFieldConfig'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { DateField } from '@/components/ui/DateField'
import { TagList } from '@/components/ui/TagList'
import clsx from 'clsx'

interface TaskDetailModalProps {
  task: Task
  displayedFields: (keyof Task)[]
  onClose: () => void
  onEdit?: (task: Task) => void
  onAssign?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onCopy?: (task: Task) => void
  renderTaskAttribute: (task: Task, fieldKey: keyof Task) => React.ReactNode
  showAllFields?: boolean // When true, show all fields regardless of displayedFields
}

interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = true 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border-b border-neutral-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-neutral-50 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-neutral-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        )}
        {icon && <div className="text-neutral-600">{icon}</div>}
        <h3 className="font-semibold text-neutral-900">{title}</h3>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const getCategoryIcon = (categoryId: string) => {
  const icons: Record<string, React.ReactNode> = {
    basic: <FileText className="w-4 h-4" />,
    dates: <Calendar className="w-4 h-4" />,
    assignment: <Users className="w-4 h-4" />,
    metrics: <TrendingUp className="w-4 h-4" />,
    financial: <DollarSign className="w-4 h-4" />,
    dependencies: <Link className="w-4 h-4" />,
    custom: <Hash className="w-4 h-4" />
  }
  return icons[categoryId] || null
}

export function TaskDetailModal({
  task,
  displayedFields,
  onClose,
  onEdit,
  onAssign,
  onDelete,
  onCopy,
  renderTaskAttribute,
  showAllFields = false
}: TaskDetailModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Group displayed fields by category
  const fieldsByCategory = useCallback(() => {
    const grouped: Record<string, TaskFieldConfig[]> = {}
    
    FIELD_CATEGORIES.forEach(category => {
      const categoryFields = getFieldsByCategory(category.id as any)
        .filter(config => showAllFields || displayedFields.includes(config.key))
      
      if (categoryFields.length > 0) {
        grouped[category.id] = categoryFields
      }
    })
    
    return grouped
  }, [displayedFields, showAllFields])

  const renderFieldGrid = (fields: TaskFieldConfig[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(config => {
          const value = task[config.key]
          if (value === null || value === undefined || value === '') return null
          
          return (
            <div key={config.key} className="flex flex-col gap-1">
              <span className="text-sm text-neutral-500">
                {config.label}
                {config.tooltip && (
                  <span className="ml-1 text-xs text-neutral-400">
                    ({config.tooltip})
                  </span>
                )}
              </span>
              <div className="text-sm font-medium text-neutral-900">
                {renderTaskAttribute(task, config.key)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const groupedFields = fieldsByCategory()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b bg-neutral-50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-neutral-900 line-clamp-2">
                  {task.name}
                </h2>
                {task.milestone && (
                  <Flag className="w-5 h-5 text-primary flex-shrink-0" />
                )}
                {task.criticalPath && (
                  <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full flex-shrink-0">
                    Critical Path
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={task.status} size="sm" />
                {task.wbsCode && (
                  <span className="text-sm text-neutral-600">
                    WBS: {task.wbsCode}
                  </span>
                )}
                {task.percentComplete > 0 && (
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Clock className="w-4 h-4" />
                    <span>{task.percentComplete}% Complete</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Always show progress bar if task has progress */}
          {task.percentComplete > 0 && (
            <div className="px-6 py-4 bg-neutral-50 border-b">
              <ProgressBar progress={task.percentComplete} size="lg" />
            </div>
          )}

          {/* Field Sections */}
          {Object.entries(groupedFields).map(([categoryId, fields]) => {
            const category = FIELD_CATEGORIES.find(c => c.id === categoryId)
            if (!category) return null

            return (
              <CollapsibleSection
                key={categoryId}
                title={category.label}
                icon={getCategoryIcon(categoryId)}
                defaultOpen={categoryId === 'basic' || categoryId === 'metrics'}
              >
                {renderFieldGrid(fields)}
              </CollapsibleSection>
            )
          })}

          {/* Special handling for task description/notes if not in displayed fields */}
          {task.notes && !displayedFields.includes('notes') && (
            <CollapsibleSection
              title="Notes"
              icon={<FileText className="w-4 h-4" />}
              defaultOpen={false}
            >
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                {task.notes}
              </p>
            </CollapsibleSection>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(task)
                  onClose()
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
            {onAssign && (
              <button
                onClick={() => {
                  onAssign(task)
                  onClose()
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Assign
              </button>
            )}
            {onCopy && (
              <button
                onClick={() => {
                  onCopy(task)
                  onClose()
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    onDelete(task.id)
                    onClose()
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}