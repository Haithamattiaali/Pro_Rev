import { io, Socket } from 'socket.io-client'
import type { 
  Task, 
  Update, 
  Comment, 
  User,
  UpdateStatus 
} from '@/types/project'
import type { Notification, ProjectMetrics } from '@/server/socket'

// Define event types for type safety
export interface ServerToClientEvents {
  // Task events
  taskCreated: (task: Task) => void
  taskUpdated: (taskId: string, updates: Partial<Task>) => void
  taskDeleted: (taskId: string) => void
  
  // Approval events
  approvalRequested: (update: Update) => void
  approvalStatusChanged: (updateId: string, status: UpdateStatus, approverId: string) => void
  
  // Comment events
  commentAdded: (updateId: string, comment: Comment) => void
  
  // User events
  userJoined: (user: User) => void
  userLeft: (userId: string) => void
  usersOnline: (users: User[]) => void
  
  // Collaboration events
  userStartedEditing: (userId: string, taskId: string) => void
  userStoppedEditing: (userId: string, taskId: string) => void
  cursorMove: (position: { x: number; y: number }, userId: string) => void
  
  // Notification events
  notification: (notification: Notification) => void
  
  // Metric update events
  metricsUpdated: (metrics: ProjectMetrics) => void
}

export interface ClientToServerEvents {
  // Connection events
  joinProject: (projectId: string, user: User) => void
  leaveProject: (projectId: string, userId: string) => void
  
  // Task events
  createTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  
  // Approval events
  requestApproval: (update: Update) => void
  updateApprovalStatus: (updateId: string, status: UpdateStatus, approverId: string) => void
  
  // Comment events
  addComment: (updateId: string, comment: Comment) => void
  
  // Collaboration events
  startEditing: (taskId: string, userId: string) => void
  stopEditing: (taskId: string, userId: string) => void
  cursorMove: (position: { x: number; y: number }, userId: string) => void
}

export type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>

class SocketManager {
  private socket: ClientSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventHandlers = new Map<string, Set<Function>>()

  connect(token?: string): ClientSocket {
    if (this.socket?.connected) {
      return this.socket
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
    
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
    }) as ClientSocket

    this.setupEventHandlers()
    
    return this.socket
  }

  private setupEventHandlers() {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
      this.reconnectAttempts = 0
      this.emitStoredEvents('connect')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      this.emitStoredEvents('disconnect', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emitStoredEvents('max_reconnect_failed')
      }
    })

    // Re-emit all server events to registered handlers
    const events: (keyof ServerToClientEvents)[] = [
      'taskCreated', 'taskUpdated', 'taskDeleted',
      'approvalRequested', 'approvalStatusChanged',
      'commentAdded', 'userJoined', 'userLeft', 'usersOnline',
      'userStartedEditing', 'userStoppedEditing', 'cursorMove',
      'notification', 'metricsUpdated'
    ]

    events.forEach(event => {
      this.socket!.on(event as any, (...args: any[]) => {
        this.emitStoredEvents(event, ...args)
      })
    })
  }

  private emitStoredEvents(event: string, ...args: any[]) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(...args))
    }
  }

  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  off(event: string, handler?: Function) {
    if (!handler) {
      this.eventHandlers.delete(event)
    } else {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) {
    if (!this.socket?.connected) {
      console.warn(`Cannot emit ${String(event)}: Socket not connected`)
      return
    }
    this.socket.emit(event as any, ...args)
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.eventHandlers.clear()
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getSocket(): ClientSocket | null {
    return this.socket
  }
}

// Export singleton instance
export const socketManager = new SocketManager()

// Helper functions for common operations
export function emitTaskUpdate(taskId: string, updates: Partial<Task>) {
  socketManager.emit('updateTask', taskId, updates)
}

export function emitTaskCreate(task: Task) {
  socketManager.emit('createTask', task)
}

export function emitTaskDelete(taskId: string) {
  socketManager.emit('deleteTask', taskId)
}

export function joinProject(projectId: string, user: User) {
  socketManager.emit('joinProject', projectId, user)
}

export function leaveProject(projectId: string, userId: string) {
  socketManager.emit('leaveProject', projectId, userId)
}

export function startEditingTask(taskId: string, userId: string) {
  socketManager.emit('startEditing', taskId, userId)
}

export function stopEditingTask(taskId: string, userId: string) {
  socketManager.emit('stopEditing', taskId, userId)
}

export function emitCursorMove(position: { x: number; y: number }, userId: string) {
  socketManager.emit('cursorMove', position, userId)
}