import { Server as HTTPServer } from 'http'
import { Socket, Server as SocketIOServer } from 'socket.io'
import { 
  Task, 
  Update, 
  Comment, 
  User,
  UpdateStatus 
} from '@/types/project'

interface ServerToClientEvents {
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
  
  // Notification events
  notification: (notification: Notification) => void
  
  // Metric update events
  metricsUpdated: (metrics: ProjectMetrics) => void
}

interface ClientToServerEvents {
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
  
  // Cursor tracking for report builder
  cursorMove: (position: { x: number; y: number }, userId: string) => void
}

interface InterServerEvents {
  ping: () => void
}

interface SocketData {
  user: User
  projectId: string
}

export interface Notification {
  id: string
  type: 'task' | 'approval' | 'comment' | 'system'
  title: string
  message: string
  userId: string
  projectId: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

export interface ProjectMetrics {
  projectId: string
  overallProgress: number
  tasksCompleted: number
  tasksTotal: number
  healthScore: number
  criticalPathTasks: number
  blockedTasks: number
  overdueTaskss: number
  teamVelocity: number
  burndownRate: number
  resourceUtilization: number
}

export type SocketServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>

// Store active users per project
const projectUsers = new Map<string, Map<string, User>>()

// Store editing sessions
const editingSessions = new Map<string, Set<string>>() // taskId -> Set of userIds

export function initializeSocketServer(httpServer: HTTPServer): SocketServer {
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      // In a real app, verify JWT token here
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication error'))
      }
      
      // For now, we'll accept any token
      next()
    } catch (err) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)

    // Join project room
    socket.on('joinProject', (projectId, user) => {
      socket.join(`project:${projectId}`)
      socket.data.user = user
      socket.data.projectId = projectId

      // Track online users
      if (!projectUsers.has(projectId)) {
        projectUsers.set(projectId, new Map())
      }
      projectUsers.get(projectId)!.set(user.id, user)

      // Notify others in the project
      socket.to(`project:${projectId}`).emit('userJoined', user)
      
      // Send current online users to the new user
      const onlineUsers = Array.from(projectUsers.get(projectId)?.values() || [])
      socket.emit('usersOnline', onlineUsers)
    })

    // Leave project room
    socket.on('leaveProject', (projectId, userId) => {
      socket.leave(`project:${projectId}`)
      
      // Remove from online users
      projectUsers.get(projectId)?.delete(userId)
      
      // Notify others
      socket.to(`project:${projectId}`).emit('userLeft', userId)
      
      // Clean up any editing sessions
      editingSessions.forEach((users, taskId) => {
        if (users.has(userId)) {
          users.delete(userId)
          socket.to(`project:${projectId}`).emit('userStoppedEditing', userId, taskId)
        }
      })
    })

    // Task events
    socket.on('createTask', (task) => {
      const projectId = socket.data.projectId
      if (!projectId) return

      // Broadcast to all users in the project (including sender)
      io.to(`project:${projectId}`).emit('taskCreated', task)
      
      // Update metrics
      broadcastMetricsUpdate(io, projectId)
    })

    socket.on('updateTask', (taskId, updates) => {
      const projectId = socket.data.projectId
      if (!projectId) return

      io.to(`project:${projectId}`).emit('taskUpdated', taskId, updates)
      broadcastMetricsUpdate(io, projectId)
    })

    socket.on('deleteTask', (taskId) => {
      const projectId = socket.data.projectId
      if (!projectId) return

      io.to(`project:${projectId}`).emit('taskDeleted', taskId)
      broadcastMetricsUpdate(io, projectId)
    })

    // Approval events
    socket.on('requestApproval', (update) => {
      const projectId = socket.data.projectId
      if (!projectId) return

      io.to(`project:${projectId}`).emit('approvalRequested', update)
      
      // Send notification to approvers
      const notification: Notification = {
        id: generateId(),
        type: 'approval',
        title: 'New Approval Request',
        message: `${socket.data.user.name} requested approval for a task update`,
        userId: socket.data.user.id,
        projectId,
        timestamp: new Date(),
        read: false,
        actionUrl: `/projects/${projectId}?approval=${update.id}`,
      }
      
      io.to(`project:${projectId}`).emit('notification', notification)
    })

    socket.on('updateApprovalStatus', (updateId, status, approverId) => {
      const projectId = socket.data.projectId
      if (!projectId) return

      io.to(`project:${projectId}`).emit('approvalStatusChanged', updateId, status, approverId)
    })

    // Comment events
    socket.on('addComment', (updateId, comment) => {
      const projectId = socket.data.projectId
      if (!projectId) return

      io.to(`project:${projectId}`).emit('commentAdded', updateId, comment)
    })

    // Collaboration events
    socket.on('startEditing', (taskId, userId) => {
      const projectId = socket.data.projectId
      if (!projectId) return

      if (!editingSessions.has(taskId)) {
        editingSessions.set(taskId, new Set())
      }
      editingSessions.get(taskId)!.add(userId)

      socket.to(`project:${projectId}`).emit('userStartedEditing', userId, taskId)
    })

    socket.on('stopEditing', (taskId, userId) => {
      const projectId = socket.data.projectId
      if (!projectId) return

      editingSessions.get(taskId)?.delete(userId)
      
      if (editingSessions.get(taskId)?.size === 0) {
        editingSessions.delete(taskId)
      }

      socket.to(`project:${projectId}`).emit('userStoppedEditing', userId, taskId)
    })

    // Cursor tracking for report builder
    socket.on('cursorMove', (position, userId) => {
      const projectId = socket.data.projectId
      if (!projectId) return

      // Throttle cursor updates by only sending to others in the same room
      socket.volatile.to(`project:${projectId}`).emit('cursorMove', position, userId)
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`)
      
      const projectId = socket.data.projectId
      const user = socket.data.user
      
      if (projectId && user) {
        // Remove from online users
        projectUsers.get(projectId)?.delete(user.id)
        
        // Notify others
        socket.to(`project:${projectId}`).emit('userLeft', user.id)
        
        // Clean up editing sessions
        editingSessions.forEach((users, taskId) => {
          if (users.has(user.id)) {
            users.delete(user.id)
            socket.to(`project:${projectId}`).emit('userStoppedEditing', user.id, taskId)
          }
        })
        
        // Clean up empty project rooms
        if (projectUsers.get(projectId)?.size === 0) {
          projectUsers.delete(projectId)
        }
      }
    })
  })

  return io
}

// Helper function to broadcast metrics updates
async function broadcastMetricsUpdate(io: SocketServer, projectId: string) {
  // In a real app, fetch actual metrics from database
  const metrics: ProjectMetrics = {
    projectId,
    overallProgress: Math.random() * 100,
    tasksCompleted: Math.floor(Math.random() * 50),
    tasksTotal: 100,
    healthScore: Math.random() * 100,
    criticalPathTasks: Math.floor(Math.random() * 10),
    blockedTasks: Math.floor(Math.random() * 5),
    overdueTaskss: Math.floor(Math.random() * 3),
    teamVelocity: Math.random() * 20,
    burndownRate: Math.random() * 10,
    resourceUtilization: Math.random() * 100,
  }

  io.to(`project:${projectId}`).emit('metricsUpdated', metrics)
}

// Helper function to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Export helper to get online users for a project
export function getOnlineUsers(projectId: string): User[] {
  return Array.from(projectUsers.get(projectId)?.values() || [])
}

// Export helper to get current editing sessions
export function getEditingSessions(taskId: string): string[] {
  return Array.from(editingSessions.get(taskId) || [])
}