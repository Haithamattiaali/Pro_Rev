'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Filter as FilterIcon, Plus, ChevronDown, ChevronRight, 
  Calendar, Users, User, AlertTriangle, CheckCircle,
  Edit3, Trash2, Copy, Flag, Clock, UserCheck, PencilLine, Lock, TrendingUp, UserPlus,
  Hash, FileText, DollarSign, Link, AlertCircle, Check, X
} from 'lucide-react'
import { Task, TaskStatus, TaskType, CriticalityLevel, User as UserType, HealthIndicator } from '@/types/project'
import { calculateImpactScore, getHealthColor } from '@/utils/calculations'
import { format } from 'date-fns'
import clsx from 'clsx'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { startEditingTask, stopEditingTask } from '@/lib/socket'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { notificationService } from '@/services/notificationService'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { TaskAssignmentModal } from './TaskAssignmentModal'
import { FilterControl } from '@/components/filters/FilterControl'
import { AddFilterDropdown } from '@/components/filters/AddFilterDropdown'
import { AVAILABLE_FILTERS, FilterConfig, getDefaultOperators } from '@/config/taskFilters'
import { Filter, FilterChangeEvent, FilterOperator } from '@/types/filter'
import { FieldSelector } from './FieldSelector'
import { getDefaultVisibleFields, getFieldConfig } from '@/config/taskFieldConfig'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { DateField } from '@/components/ui/DateField'
import { TagList } from '@/components/ui/TagList'
import { applyAllFilters, validateFilterValue } from '@/utils/filterUtils'
import { LayoutModeSelector } from './LayoutModeSelector'
import { ScrollIndicator } from '@/components/ui/ScrollIndicator'
import { TaskDetailModal } from './TaskDetailModal'

// Simplified user type for assignment
interface SimpleUser {
  id: string
  email: string
  name: string
  role: string
  teamId?: string
}

interface TaskListProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskDelete: (taskId: string) => void
  onTaskCreate: () => void
  onTaskEdit?: (task: Task) => void
  onTaskCopy?: (task: Task) => void
  projectId?: string
  currentUser?: UserType
}

export function TaskList({ tasks, onTaskUpdate, onTaskDelete, onTaskCreate, onTaskEdit, onTaskCopy, projectId, currentUser }: TaskListProps) {
  console.log('TaskList received tasks:', tasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Filter[]>([])
  const [sortBy, setSortBy] = useState<'impact' | 'dueDate' | 'progress'>('impact')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [assigningTask, setAssigningTask] = useState<Task | null>(null)
  const [availableUsers, setAvailableUsers] = useState<SimpleUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const { user: authUser } = useAuth()
  
  // State for dynamic field display
  const [displayedFields, setDisplayedFields] = useState<(keyof Task)[]>(() => {
    // Load from localStorage or use defaults
    const savedFields = localStorage.getItem('taskListDisplayedFields')
    if (savedFields) {
      try {
        return JSON.parse(savedFields)
      } catch (e) {
        console.error('Error parsing saved fields:', e)
      }
    }
    return getDefaultVisibleFields()
  })
  
  // Layout mode state
  type LayoutMode = 'compact' | 'comfortable' | 'expanded'
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const savedMode = localStorage.getItem('taskListLayoutMode')
    return (savedMode as LayoutMode) || 'comfortable'
  })
  
  // Scroll container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // State for task detail modal
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null)
  
  // Permission hooks
  const { canCreate, canUpdate, canDelete, canAssign, isOwner, getResourceScope } = usePermissions()

  // Real-time updates
  const { onlineUsers, editingSessions } = useRealtimeUpdates({
    projectId,
    user: currentUser,
  })

  // Save displayed fields to localStorage when they change
  useEffect(() => {
    localStorage.setItem('taskListDisplayedFields', JSON.stringify(displayedFields))
  }, [displayedFields])
  
  // Save layout mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('taskListLayoutMode', layoutMode)
  }, [layoutMode])

  // Fetch available users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const response = await fetch(`/api/users?projectId=${projectId}`)
        if (!response.ok) throw new Error('Failed to fetch users')
        const data = await response.json()
        setAvailableUsers(data.users)
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Failed to load users')
      } finally {
        setIsLoadingUsers(false)
      }
    }

    if (projectId) {
      fetchUsers()
    }
  }, [projectId])

  // Filter handlers
  const handleAddFilter = (filterConfig: FilterConfig) => {
    const newFilter: Filter = {
      id: `${filterConfig.field}-${Date.now()}`,
      field: filterConfig.field as any,
      label: filterConfig.label,
      type: filterConfig.type,
      operator: (filterConfig.operators ? filterConfig.operators[0] : getDefaultOperators(filterConfig.type)[0]) as FilterOperator,
      value: null,
      options: filterConfig.options
    }
    setActiveFilters([...activeFilters, newFilter])
  }

  const handleRemoveFilter = (filterId: string) => {
    setActiveFilters(activeFilters.filter(f => f.id !== filterId))
  }

  const handleFilterChange = (event: FilterChangeEvent) => {
    setActiveFilters(activeFilters.map(filter => 
      filter.id === event.filterId
        ? { ...filter, value: event.value, value2: event.value2 }
        : filter
    ))
  }

  const handleFilterOperatorChange = (filterId: string, operator: FilterOperator) => {
    setActiveFilters(activeFilters.map(filter => 
      filter.id === filterId
        ? { ...filter, operator, value2: undefined } // Clear value2 when operator changes
        : filter
    ))
  }

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!task.name.toLowerCase().includes(query) &&
            !task.deliverables?.toLowerCase().includes(query) &&
            !task.notes?.toLowerCase().includes(query)) {
          return false
        }
      }

      // Apply active filters
      const validFilters = activeFilters.filter(f => {
        const validation = validateFilterValue(f)
        return validation.isValid
      })
      
      if (!applyAllFilters(task, validFilters)) {
        return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'impact':
          return (b.impactScore || 0) - (a.impactScore || 0)
        case 'dueDate':
          return (a.endDate?.getTime() || 0) - (b.endDate?.getTime() || 0)
        case 'progress':
          return b.percentComplete - a.percentComplete
        default:
          return 0
      }
    })

    return filtered
  }, [tasks, searchQuery, activeFilters, sortBy])

  // Group tasks by parent for tree view
  const taskTree = useMemo(() => {
    const tree = new Map<string | null, Task[]>()
    
    filteredTasks.forEach(task => {
      const parentId = task.parentId || null
      if (!tree.has(parentId)) {
        tree.set(parentId, [])
      }
      tree.get(parentId)!.push(task)
    })

    return tree
  }, [filteredTasks])

  // Check if a task has children in the complete task list (not just filtered)
  const taskHasChildren = useMemo(() => {
    const hasChildrenMap = new Map<string, boolean>()
    
    tasks.forEach(task => {
      if (task.parentId) {
        hasChildrenMap.set(task.parentId, true)
      }
    })
    
    return hasChildrenMap
  }, [tasks])

  // Handle task assignment with notifications
  const handleTaskAssignment = async (taskId: string, assigneeId: string, previousAssigneeId?: string) => {
    try {
      // Update the task
      onTaskUpdate(taskId, { assigneeId })
      
      // Find the task
      const task = tasks.find(t => t.id === taskId)
      if (!task || !authUser) return
      
      // Send notification if assigning to someone else
      if (assigneeId && assigneeId !== authUser.id && assigneeId !== previousAssigneeId) {
        await notificationService.notifyTaskAssignment(
          { ...task, assigneeId },
          authUser
        )
        toast.success('Task assigned and notification sent')
      }
    } catch (error) {
      console.error('Failed to assign task:', error)
      toast.error('Failed to assign task')
    }
  }

  // Handle bulk assignment
  const handleBulkAssign = async () => {
    // This would open a modal to select assignee
    // For now, we'll show a placeholder
    toast('Bulk assignment feature coming soon')
  }

  // Enhance filters with dynamic options
  const getEnhancedFilters = () => {
    return AVAILABLE_FILTERS.map(config => {
      // Enhance assigneeId filter with available users
      if (config.field === 'assigneeId' && availableUsers.length > 0) {
        return {
          ...config,
          options: availableUsers.map(user => ({
            value: user.id,
            label: user.name
          }))
        }
      }
      
      // Enhance resource assignment filter with unique values from tasks
      if (config.field === 'resourceAssignment') {
        const uniqueAssignees = new Set<string>()
        tasks.forEach(task => {
          if (task.resourceAssignment) {
            task.resourceAssignment.split(',').forEach(r => uniqueAssignees.add(r.trim()))
          }
        })
        
        if (uniqueAssignees.size > 0) {
          return {
            ...config,
            type: 'select' as const,
            options: Array.from(uniqueAssignees).map(name => ({
              value: name,
              label: name
            }))
          }
        }
      }
      
      return config
    })
  }


  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETE:
        return <CheckCircle className="w-4 h-4 text-status-success" />
      case TaskStatus.IN_PROGRESS:
        return <Clock className="w-4 h-4 text-primary" />
      case TaskStatus.BLOCKED:
        return <AlertTriangle className="w-4 h-4 text-status-danger" />
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-neutral-300" />
    }
  }

  // Dynamic task attribute rendering function
  const renderTaskAttribute = (task: Task, fieldKey: keyof Task) => {
    const value = task[fieldKey]
    const config = getFieldConfig(fieldKey)
    
    // Handle null/undefined values
    if (value === null || value === undefined || value === '') {
      return <span className="text-neutral-400 text-sm">-</span>
    }

    switch (fieldKey) {
      // Status fields
      case 'status':
        return <StatusBadge status={value as TaskStatus} size="sm" />
      
      case 'criticalityLevel':
        return (
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            value === CriticalityLevel.CRITICAL ? 'bg-red-100 text-red-700' :
            value === CriticalityLevel.HIGH ? 'bg-orange-100 text-orange-700' :
            value === CriticalityLevel.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
            value === CriticalityLevel.LOW ? 'bg-green-100 text-green-700' :
            'bg-neutral-100 text-neutral-700'
          )}>
            {value as string}
          </span>
        )
      
      case 'healthIndicator':
        return (
          <div className="flex items-center justify-center">
            <div 
              className={clsx(
                'w-3 h-3 rounded-full',
                `bg-${getHealthColor(value as HealthIndicator)}`
              )}
              title={`Health: ${value}`}
            />
          </div>
        )
      
      // Progress fields
      case 'percentComplete':
      case 'weightedProgress':
      case 'rolledUpProgress':
        return <ProgressBar progress={value as number} size="sm" showLabel={false} />
      
      case 'resourceLoad':
        return (
          <div className="text-center">
            <span className="text-sm font-medium">{value}%</span>
          </div>
        )
      
      // Score fields
      case 'impactScore':
      case 'riskScore':
      case 'priorityScore':
        return <ScoreBadge score={value as number} size="sm" />
      
      // Date fields
      case 'startDate':
      case 'endDate':
      case 'actualStart':
      case 'actualEnd':
        return <DateField date={value as Date} showIcon={false} />
      
      // Duration and numeric fields
      case 'duration':
        return (
          <span className="text-sm text-neutral-600">
            {value} days
          </span>
        )
      
      case 'varianceDays':
        return (
          <span className={clsx(
            'text-sm font-medium',
            (value as number) > 0 ? 'text-red-600' : 
            (value as number) < 0 ? 'text-green-600' : 
            'text-neutral-600'
          )}>
            {(value as number) > 0 ? '+' : ''}{value} days
          </span>
        )
      
      case 'totalFloat':
      case 'freeFloat':
      case 'lagLead':
        return (
          <span className="text-sm text-neutral-600">
            {value} days
          </span>
        )
      
      // Financial fields
      case 'costBudget':
      case 'actualCost':
        return (
          <span className="text-sm font-medium text-neutral-700">
            ${(value as number).toLocaleString()}
          </span>
        )
      
      // Performance indices
      case 'spi':
      case 'cpi':
        return (
          <span className={clsx(
            'text-sm font-medium',
            (value as number) >= 1 ? 'text-green-600' : 'text-red-600'
          )}>
            {(value as number).toFixed(2)}
          </span>
        )
      
      // Array fields
      case 'dependencies':
      case 'blockingTasks':
      case 'blockedBy':
        return <TagList tags={value as string[]} maxVisible={2} size="sm" />
      
      // Boolean fields
      case 'milestone':
      case 'criticalPath':
        return (
          <div className="flex items-center justify-center">
            {value ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <X className="w-4 h-4 text-neutral-300" />
            )}
          </div>
        )
      
      // Text fields
      case 'name':
      case 'wbsCode':
      case 'deliverables':
      case 'notes':
      case 'resourceAssignment':
      case 'riskMitigation':
      case 'lessonsLearned':
        return (
          <span className="text-sm text-neutral-700 truncate" title={value as string}>
            {value as string}
          </span>
        )
      
      // Enum fields
      case 'type':
      case 'agility':
      case 'dependencyType':
        return (
          <span className="text-sm text-neutral-600">
            {(value as string).replace(/_/g, ' ')}
          </span>
        )
      
      // IDs (usually not displayed, but handle if selected)
      case 'assigneeId':
      case 'teamId':
        const user = availableUsers.find(u => u.id === value)
        return (
          <span className="text-sm text-neutral-600">
            {user ? user.name : (value as string)}
          </span>
        )
      
      default:
        // Generic fallback for any other fields
        return (
          <span className="text-sm text-neutral-700">
            {value?.toString() || '-'}
          </span>
        )
    }
  }

  // Handle editing session
  useEffect(() => {
    if (editingTaskId && currentUser) {
      startEditingTask(editingTaskId, currentUser.id)
      
      return () => {
        stopEditingTask(editingTaskId, currentUser.id)
      }
    }
  }, [editingTaskId, currentUser])

  const renderTask = (task: Task, level: number = 0) => {
    const hasChildren = taskHasChildren.has(task.id)
    const hasVisibleChildren = taskTree.has(task.id)
    const isExpanded = expandedTasks.has(task.id)
    const isSelected = selectedTasks.has(task.id)
    const children = hasVisibleChildren ? taskTree.get(task.id) || [] : []
    const editingUsers = Array.from(editingSessions.get(task.id) || [])
      .filter(userId => userId !== currentUser?.id)
      .map(userId => onlineUsers.find(u => u.id === userId))
      .filter(Boolean) as UserType[]

    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="group"
      >
        <div
          className={clsx(
            'flex gap-3 p-3 rounded-lg border transition-all relative',
            layoutMode === 'expanded' ? 'items-start' : 'items-center',
            isSelected 
              ? 'border-primary bg-primary-50' 
              : editingUsers.length > 0
                ? 'border-blue-300 bg-blue-50'
                : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
            'cursor-pointer'
          )}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => setSelectedTaskForDetail(task)}
        >
          {/* Editing indicator */}
          {editingUsers.length > 0 && (
            <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-sm z-10">
              <PencilLine className="w-3 h-3" />
              <span>{editingUsers[0].name}{editingUsers.length > 1 ? ` +${editingUsers.length - 1}` : ''}</span>
            </div>
          )}
          {/* Expand/Collapse */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleTaskExpansion(task.id)
              }}
              className="p-1 hover:bg-neutral-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              toggleTaskSelection(task.id)
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary"
          />

          {/* Status Icon */}
          {getStatusIcon(task.status)}

          {/* Task Info - Always show name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-900 truncate">
                {task.name}
              </span>
              {task.criticalPath && (
                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                  Critical Path
                </span>
              )}
              {task.milestone && (
                <Flag className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-600">
              <span>{task.wbsCode}</span>
              <span className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to view all details
              </span>
            </div>
          </div>

          {/* Dynamic Fields */}
          <div className={clsx(
            'flex items-center',
            layoutMode === 'compact' ? 'gap-2' : 'gap-4',
            layoutMode === 'expanded' && 'flex-wrap'
          )}>
            {displayedFields
              .filter(field => field !== 'name') // Name is always shown in the first column
              .map(fieldKey => {
                const config = getFieldConfig(fieldKey)
                return (
                  <div 
                    key={fieldKey} 
                    className={clsx(
                      'flex items-center',
                      config?.align === 'center' && 'justify-center',
                      config?.align === 'right' && 'justify-end',
                      layoutMode === 'expanded' && 'py-1'
                    )}
                    style={{ 
                      width: layoutMode === 'compact' ? 'auto' : config?.width,
                      minWidth: layoutMode === 'compact' ? 'auto' : config?.minWidth,
                      maxWidth: layoutMode === 'expanded' ? 'none' : config?.maxWidth,
                      flexShrink: layoutMode === 'compact' ? 1 : 0
                    }}
                  >
                    {renderTaskAttribute(task, fieldKey)}
                  </div>
                )
              })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <PermissionGate 
              resource="tasks" 
              action="update" 
              resourceOwnerId={task.assigneeId}
              resourceTeamId={task.teamId}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingTaskId(task.id)
                  if (onTaskEdit) {
                    onTaskEdit(task)
                  }
                }}
                className="p-1.5 hover:bg-neutral-200 rounded"
                disabled={editingUsers.length > 0}
                title={editingUsers.length > 0 ? `Being edited by ${editingUsers[0].name}` : 'Edit task'}
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </PermissionGate>
            
            <PermissionGate resource="tasks" action="create">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (onTaskCopy) {
                    // Create a copy of the task WITHOUT an ID (so it opens in create mode)
                    const { id, taskId, ...taskDataWithoutId } = task
                    const taskCopy = {
                      ...taskDataWithoutId,
                      name: `Copy of ${task.name}`,
                    }
                    onTaskCopy(taskCopy as Task)
                  }
                }}
                className="p-1.5 hover:bg-neutral-200 rounded"
                title="Duplicate task"
              >
                <Copy className="w-4 h-4" />
              </button>
            </PermissionGate>
            
            <PermissionGate resource="tasks" action="assign">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  console.log('Opening assignment modal for task:', task.id)
                  setAssigningTask(task)
                }}
                className="p-1.5 hover:bg-neutral-200 rounded"
                title="Assign task"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </PermissionGate>
            
            <PermissionGate 
              resource="tasks" 
              action="delete" 
              resourceOwnerId={task.assigneeId}
              resourceTeamId={task.teamId}
              fallback={
                <button
                  className="p-1.5 text-neutral-300 cursor-not-allowed"
                  title="You don't have permission to delete this task"
                >
                  <Lock className="w-4 h-4" />
                </button>
              }
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTaskDelete(task.id)
                }}
                className="p-1.5 hover:bg-red-100 text-red-600 rounded"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Children */}
        {isExpanded && children.length > 0 && (
          <div className="mt-1">
            {children.map(child => renderTask(child, level + 1))}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Task Management</h2>
            {/* Online users indicator */}
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {onlineUsers.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium border-2 border-white"
                      title={user.name}
                    >
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                  {onlineUsers.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-neutral-300 text-neutral-700 flex items-center justify-center text-xs font-medium border-2 border-white">
                      +{onlineUsers.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm text-neutral-500">
                  {onlineUsers.length} online
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'px-3 py-1 text-sm rounded-lg transition-colors',
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={clsx(
                'px-3 py-1 text-sm rounded-lg transition-colors',
                viewMode === 'kanban'
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              Kanban View
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="impact">Sort by Impact</option>
            <option value="dueDate">Sort by Due Date</option>
            <option value="progress">Sort by Progress</option>
          </select>

          <LayoutModeSelector
            value={layoutMode}
            onChange={setLayoutMode}
          />

          <FieldSelector
            selectedFields={displayedFields}
            onFieldsChange={setDisplayedFields}
          />

          <PermissionGate 
            resource="tasks" 
            action="create"
            fallback={
              <button
                className="px-4 py-2 flex items-center gap-2 bg-neutral-200 text-neutral-400 rounded-lg cursor-not-allowed"
                title="You don't have permission to create tasks"
              >
                <Lock className="w-4 h-4" />
                New Task
              </button>
            }
          >
            <button
              onClick={onTaskCreate}
              className="btn-primary px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </PermissionGate>
        </div>

        {/* Dynamic Filters */}
        <div className="flex items-start gap-2 mt-4">
          <FilterIcon className="w-4 h-4 text-neutral-500 mt-2" />
          <div className="flex-1 flex flex-wrap items-center gap-2">
            {activeFilters.map(filter => (
              <FilterControl
                key={filter.id}
                filter={filter}
                onChange={handleFilterChange}
                onRemove={handleRemoveFilter}
                onOperatorChange={handleFilterOperatorChange}
              />
            ))}
            <AddFilterDropdown
              availableFilters={getEnhancedFilters()}
              activeFilters={activeFilters}
              onAddFilter={handleAddFilter}
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="relative">
        {viewMode === 'list' && layoutMode !== 'compact' && (
          <ScrollIndicator containerRef={scrollContainerRef} />
        )}
        <div 
          ref={scrollContainerRef}
          className={clsx(
            'p-6',
            layoutMode !== 'compact' && 'overflow-x-auto'
          )}
        >
          {viewMode === 'list' ? (
            <div className={clsx(
              layoutMode === 'expanded' ? 'min-w-0' : 'min-w-max'
            )}>
              <AnimatePresence>
                {taskTree.get(null)?.map(task => renderTask(task))}
              </AnimatePresence>
            </div>
          ) : (
          <div className="kanban-board flex gap-4 overflow-x-auto pb-4">
            {/* Kanban Columns */}
            {['Not Started', 'In Progress', 'Review', 'Blocked', 'Complete', 'Delayed'].map(status => {
              const columnTasks = filteredTasks.filter(task => task.status === status)
              const statusColors = {
                'Not Started': 'bg-neutral-100 border-neutral-300',
                'In Progress': 'bg-blue-50 border-blue-300',
                'Review': 'bg-purple-50 border-purple-300',
                'Blocked': 'bg-red-50 border-red-300',
                'Complete': 'bg-green-50 border-green-300',
                'Delayed': 'bg-orange-50 border-orange-300'
              }
              
              return (
                <div key={status} className="flex-shrink-0 w-80">
                  <div className={`rounded-lg border-2 ${statusColors[status as keyof typeof statusColors]} min-h-[600px]`}>
                    <div className="p-4 border-b-2 border-inherit">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{status}</h3>
                        <span className="text-sm text-neutral-600 bg-white px-2 py-1 rounded-full">
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <AnimatePresence>
                        {columnTasks.map(task => (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedTaskForDetail(task)}
                          >
                            {/* Always show task name */}
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-medium text-sm line-clamp-2">{task.name}</h4>
                              <div className="flex items-center gap-1">
                                {task.milestone && (
                                  <Flag className="w-4 h-4 text-primary flex-shrink-0" />
                                )}
                                <div className="text-xs text-neutral-400">
                                  Click for details
                                </div>
                              </div>
                            </div>
                            
                            {/* Dynamic fields for Kanban cards - show a subset of selected fields */}
                            <div className="space-y-2">
                              {displayedFields
                                .filter(field => {
                                  // Show only key fields in kanban view
                                  const priorityFields: (keyof Task)[] = [
                                    'status', 'endDate', 'assigneeId', 'resourceAssignment',
                                    'percentComplete', 'impactScore', 'criticalityLevel'
                                  ]
                                  return priorityFields.includes(field) && field !== 'name'
                                })
                                .slice(0, 4) // Limit to 4 fields to keep cards compact
                                .map(fieldKey => {
                                  const config = getFieldConfig(fieldKey)
                                  const value = task[fieldKey]
                                  
                                  if (!value) return null
                                  
                                  return (
                                    <div key={fieldKey} className="flex items-center justify-between text-xs">
                                      <span className="text-neutral-500">
                                        {config?.label || fieldKey}:
                                      </span>
                                      <div className="ml-2">
                                        {renderTaskAttribute(task, fieldKey)}
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                            
                            {/* Always show progress if > 0 */}
                            {task.percentComplete > 0 && !displayedFields.includes('percentComplete') && (
                              <div className="mt-3">
                                <div className="w-full bg-neutral-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-primary rounded-full h-1.5 transition-all duration-300"
                                    style={{ width: `${task.percentComplete}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {columnTasks.length === 0 && (
                        <div className="text-center py-8 text-neutral-400 text-sm">
                          No tasks in this status
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            No tasks found matching your filters
          </div>
        )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTasks.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white rounded-lg shadow-xl p-4 flex items-center gap-4"
        >
          <span className="text-sm">{selectedTasks.size} tasks selected</span>
          <PermissionGate resource="tasks" action="update">
            <button className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors">
              Update Status
            </button>
          </PermissionGate>
          <PermissionGate resource="tasks" action="assign">
            <button 
              onClick={() => handleBulkAssign()}
              className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
            >
              Assign To
            </button>
          </PermissionGate>
          <PermissionGate resource="tasks" action="delete">
            <button className="px-3 py-1 bg-red-500/80 rounded hover:bg-red-500 transition-colors">
              Delete
            </button>
          </PermissionGate>
        </motion.div>
      )}

      {/* Task Assignment Modal */}
      {assigningTask && (
        <TaskAssignmentModal
          task={assigningTask}
          currentAssignee={availableUsers.find(u => u.id === assigningTask.assigneeId)}
          availableUsers={availableUsers}
          onAssign={async (taskId, userId) => {
            const previousAssigneeId = assigningTask.assigneeId
            await handleTaskAssignment(taskId, userId, previousAssigneeId)
            setAssigningTask(null)
          }}
          onClose={() => setAssigningTask(null)}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTaskForDetail && (
        <AnimatePresence>
          <TaskDetailModal
            task={selectedTaskForDetail}
            displayedFields={displayedFields}
            onClose={() => setSelectedTaskForDetail(null)}
            onEdit={onTaskEdit}
            onAssign={setAssigningTask}
            onDelete={canDelete(selectedTaskForDetail.assigneeId, selectedTaskForDetail.teamId) ? onTaskDelete : undefined}
            onCopy={onTaskCopy}
            renderTaskAttribute={renderTaskAttribute}
            showAllFields={viewMode === 'list'} // Show all fields when opened from List view
          />
        </AnimatePresence>
      )}
    </div>
  )
}