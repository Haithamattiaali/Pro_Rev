import { useEffect, useCallback, useRef, useReducer } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { socketManager } from '@/lib/socket'
import { useSocket } from './useSocket'
import { 
  Task, 
  Update, 
  Comment, 
  User, 
  UpdateStatus 
} from '@/types/project'
import type { Notification, ProjectMetrics } from '@/server/socket'
import toast from 'react-hot-toast'

interface UseRealtimeUpdatesOptions {
  projectId?: string
  user?: User
  onNotification?: (notification: Notification) => void
  onMetricsUpdate?: (metrics: ProjectMetrics) => void
  onUserJoined?: (user: User) => void
  onUserLeft?: (userId: string) => void
  onEditingChange?: (userId: string, taskId: string, isEditing: boolean) => void
}

interface UseRealtimeUpdatesReturn {
  onlineUsers: User[]
  editingSessions: Map<string, Set<string>> // taskId -> Set of userIds
  notifications: Notification[]
  metrics: ProjectMetrics | null
  clearNotifications: () => void
  markNotificationRead: (notificationId: string) => void
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}): UseRealtimeUpdatesReturn {
  const {
    projectId,
    user,
    onNotification,
    onMetricsUpdate,
    onUserJoined,
    onUserLeft,
    onEditingChange,
  } = options

  const { isConnected } = useSocket({ projectId, user })
  
  // Store state
  const {
    addTask,
    updateTask,
    deleteTask,
    addUpdate,
    setUpdates,
    updates,
  } = useProjectStore()

  // Local state for real-time features
  const onlineUsersRef = useRef<User[]>([])
  const editingSessionsRef = useRef<Map<string, Set<string>>>(new Map())
  const notificationsRef = useRef<Notification[]>([])
  const metricsRef = useRef<ProjectMetrics | null>(null)

  // Force re-render when needed
  const [, forceUpdate] = useReducer(x => x + 1, 0)

  // Task event handlers
  const handleTaskCreated = useCallback((task: Task) => {
    // Don't add if we created it (avoid duplicates)
    const existingTask = useProjectStore.getState().tasks.find(t => t.id === task.id)
    if (!existingTask) {
      addTask(task)
      toast.success('New task created', {
        icon: '📋',
        duration: 3000,
      })
    }
  }, [addTask])

  const handleTaskUpdated = useCallback((taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates)
    
    // Show toast for significant updates
    if (updates.status || updates.percentComplete !== undefined) {
      const taskName = useProjectStore.getState().tasks.find(t => t.id === taskId)?.name
      toast.success(`Task "${taskName}" updated`, {
        icon: '✏️',
        duration: 3000,
      })
    }
  }, [updateTask])

  const handleTaskDeleted = useCallback((taskId: string) => {
    const task = useProjectStore.getState().tasks.find(t => t.id === taskId)
    deleteTask(taskId)
    
    if (task) {
      toast.success(`Task "${task.name}" deleted`, {
        icon: '🗑️',
        duration: 3000,
      })
    }
  }, [deleteTask])

  // Approval event handlers
  const handleApprovalRequested = useCallback((update: Update) => {
    addUpdate(update)
    
    // Show notification for approvers
    if (user?.role === 'PROJECT_MANAGER' || user?.role === 'ADMIN') {
      toast.info('New approval request', {
        icon: '⏳',
        duration: 4000,
      })
    }
  }, [addUpdate, user])

  const handleApprovalStatusChanged = useCallback((updateId: string, status: UpdateStatus, approverId: string) => {
    const currentUpdates = useProjectStore.getState().updates
    const updatedList = currentUpdates.map(update => 
      update.id === updateId 
        ? { ...update, status, approverId } 
        : update
    )
    setUpdates(updatedList)
    
    const statusIcon = status === 'APPROVED' ? '✅' : status === 'REJECTED' ? '❌' : '↩️'
    toast.success(`Update ${status.toLowerCase()}`, {
      icon: statusIcon,
      duration: 3000,
    })
  }, [setUpdates])

  // Comment event handlers
  const handleCommentAdded = useCallback((updateId: string, comment: Comment) => {
    const currentUpdates = useProjectStore.getState().updates
    const updatedList = currentUpdates.map(update => 
      update.id === updateId 
        ? { ...update, comments: [...update.comments, comment] } 
        : update
    )
    setUpdates(updatedList)
    
    // Don't show toast for own comments
    if (comment.userId !== user?.id) {
      toast.success('New comment added', {
        icon: '💬',
        duration: 3000,
      })
    }
  }, [setUpdates, user])

  // User event handlers
  const handleUserJoined = useCallback((joinedUser: User) => {
    onlineUsersRef.current = [...onlineUsersRef.current, joinedUser]
    forceUpdate()
    
    onUserJoined?.(joinedUser)
    
    if (joinedUser.id !== user?.id) {
      toast.success(`${joinedUser.name} joined the project`, {
        icon: '👋',
        duration: 3000,
      })
    }
  }, [onUserJoined, user])

  const handleUserLeft = useCallback((userId: string) => {
    const leavingUser = onlineUsersRef.current.find(u => u.id === userId)
    onlineUsersRef.current = onlineUsersRef.current.filter(u => u.id !== userId)
    forceUpdate()
    
    onUserLeft?.(userId)
    
    if (leavingUser && userId !== user?.id) {
      toast(`${leavingUser.name} left the project`, {
        icon: '👋',
        duration: 3000,
      })
    }
  }, [onUserLeft, user])

  const handleUsersOnline = useCallback((users: User[]) => {
    onlineUsersRef.current = users
    forceUpdate()
  }, [])

  // Collaboration event handlers
  const handleUserStartedEditing = useCallback((userId: string, taskId: string) => {
    if (!editingSessionsRef.current.has(taskId)) {
      editingSessionsRef.current.set(taskId, new Set())
    }
    editingSessionsRef.current.get(taskId)!.add(userId)
    forceUpdate()
    
    onEditingChange?.(userId, taskId, true)
    
    // Show indicator for other users
    if (userId !== user?.id) {
      const editingUser = onlineUsersRef.current.find(u => u.id === userId)
      const task = useProjectStore.getState().tasks.find(t => t.id === taskId)
      
      if (editingUser && task) {
        toast(`${editingUser.name} is editing "${task.name}"`, {
          icon: '✏️',
          duration: 2000,
        })
      }
    }
  }, [onEditingChange, user])

  const handleUserStoppedEditing = useCallback((userId: string, taskId: string) => {
    editingSessionsRef.current.get(taskId)?.delete(userId)
    
    if (editingSessionsRef.current.get(taskId)?.size === 0) {
      editingSessionsRef.current.delete(taskId)
    }
    forceUpdate()
    
    onEditingChange?.(userId, taskId, false)
  }, [onEditingChange])

  // Notification handlers
  const handleNotification = useCallback((notification: Notification) => {
    notificationsRef.current = [...notificationsRef.current, notification]
    forceUpdate()
    
    onNotification?.(notification)
    
    // Store in localStorage for persistence
    const storedNotifications = JSON.parse(
      localStorage.getItem('impactflow_notifications') || '[]'
    )
    localStorage.setItem(
      'impactflow_notifications',
      JSON.stringify([...storedNotifications, notification])
    )
    
    // Show toast for important notifications
    toast(notification.message, {
      icon: notification.type === 'approval' ? '⏳' : 
            notification.type === 'comment' ? '💬' : 
            notification.type === 'task' ? '📋' : 'ℹ️',
      duration: 4000,
    })
  }, [onNotification])

  // Metrics update handler
  const handleMetricsUpdated = useCallback((metrics: ProjectMetrics) => {
    metricsRef.current = metrics
    forceUpdate()
    onMetricsUpdate?.(metrics)
  }, [onMetricsUpdate])

  // Set up event listeners
  useEffect(() => {
    if (!isConnected) return

    // Task events
    const unsubTaskCreated = socketManager.on('taskCreated', handleTaskCreated)
    const unsubTaskUpdated = socketManager.on('taskUpdated', handleTaskUpdated)
    const unsubTaskDeleted = socketManager.on('taskDeleted', handleTaskDeleted)
    
    // Approval events
    const unsubApprovalRequested = socketManager.on('approvalRequested', handleApprovalRequested)
    const unsubApprovalStatusChanged = socketManager.on('approvalStatusChanged', handleApprovalStatusChanged)
    
    // Comment events
    const unsubCommentAdded = socketManager.on('commentAdded', handleCommentAdded)
    
    // User events
    const unsubUserJoined = socketManager.on('userJoined', handleUserJoined)
    const unsubUserLeft = socketManager.on('userLeft', handleUserLeft)
    const unsubUsersOnline = socketManager.on('usersOnline', handleUsersOnline)
    
    // Collaboration events
    const unsubUserStartedEditing = socketManager.on('userStartedEditing', handleUserStartedEditing)
    const unsubUserStoppedEditing = socketManager.on('userStoppedEditing', handleUserStoppedEditing)
    
    // Notification events
    const unsubNotification = socketManager.on('notification', handleNotification)
    
    // Metrics events
    const unsubMetricsUpdated = socketManager.on('metricsUpdated', handleMetricsUpdated)

    // Cleanup
    return () => {
      unsubTaskCreated()
      unsubTaskUpdated()
      unsubTaskDeleted()
      unsubApprovalRequested()
      unsubApprovalStatusChanged()
      unsubCommentAdded()
      unsubUserJoined()
      unsubUserLeft()
      unsubUsersOnline()
      unsubUserStartedEditing()
      unsubUserStoppedEditing()
      unsubNotification()
      unsubMetricsUpdated()
    }
  }, [
    isConnected,
    handleTaskCreated,
    handleTaskUpdated,
    handleTaskDeleted,
    handleApprovalRequested,
    handleApprovalStatusChanged,
    handleCommentAdded,
    handleUserJoined,
    handleUserLeft,
    handleUsersOnline,
    handleUserStartedEditing,
    handleUserStoppedEditing,
    handleNotification,
    handleMetricsUpdated,
  ])

  // Load notifications from localStorage on mount
  useEffect(() => {
    const storedNotifications = JSON.parse(
      localStorage.getItem('impactflow_notifications') || '[]'
    )
    notificationsRef.current = storedNotifications
    forceUpdate()
  }, [])

  // Utility functions
  const clearNotifications = useCallback(() => {
    notificationsRef.current = []
    localStorage.removeItem('impactflow_notifications')
    forceUpdate()
  }, [])

  const markNotificationRead = useCallback((notificationId: string) => {
    notificationsRef.current = notificationsRef.current.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    )
    
    localStorage.setItem(
      'impactflow_notifications',
      JSON.stringify(notificationsRef.current)
    )
    forceUpdate()
  }, [])

  return {
    onlineUsers: onlineUsersRef.current,
    editingSessions: editingSessionsRef.current,
    notifications: notificationsRef.current,
    metrics: metricsRef.current,
    clearNotifications,
    markNotificationRead,
  }
}