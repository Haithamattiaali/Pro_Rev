const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server: SocketIOServer } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Import the socket initialization after Next.js prepares
app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Socket.IO connection handling
  const projectUsers = new Map()
  const editingSessions = new Map()

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)

    socket.on('joinProject', (projectId, user) => {
      socket.join(`project:${projectId}`)
      socket.data.user = user
      socket.data.projectId = projectId

      if (!projectUsers.has(projectId)) {
        projectUsers.set(projectId, new Map())
      }
      projectUsers.get(projectId).set(user.id, user)

      socket.to(`project:${projectId}`).emit('userJoined', user)
      
      const onlineUsers = Array.from(projectUsers.get(projectId)?.values() || [])
      socket.emit('usersOnline', onlineUsers)
    })

    socket.on('leaveProject', (projectId, userId) => {
      socket.leave(`project:${projectId}`)
      projectUsers.get(projectId)?.delete(userId)
      socket.to(`project:${projectId}`).emit('userLeft', userId)
    })

    // Task events
    socket.on('createTask', (task) => {
      const projectId = socket.data.projectId
      if (!projectId) return
      io.to(`project:${projectId}`).emit('taskCreated', task)
    })

    socket.on('updateTask', (taskId, updates) => {
      const projectId = socket.data.projectId
      if (!projectId) return
      io.to(`project:${projectId}`).emit('taskUpdated', taskId, updates)
    })

    socket.on('deleteTask', (taskId) => {
      const projectId = socket.data.projectId
      if (!projectId) return
      io.to(`project:${projectId}`).emit('taskDeleted', taskId)
    })

    // Collaboration events
    socket.on('startEditing', (taskId, userId) => {
      const projectId = socket.data.projectId
      if (!projectId) return

      if (!editingSessions.has(taskId)) {
        editingSessions.set(taskId, new Set())
      }
      editingSessions.get(taskId).add(userId)

      socket.to(`project:${projectId}`).emit('userStartedEditing', userId, taskId)
    })

    socket.on('stopEditing', (taskId, userId) => {
      const projectId = socket.data.projectId
      if (!projectId) return

      editingSessions.get(taskId)?.delete(userId)
      socket.to(`project:${projectId}`).emit('userStoppedEditing', userId, taskId)
    })

    // Cursor tracking
    socket.on('cursorMove', (position, userId) => {
      const projectId = socket.data.projectId
      if (!projectId) return
      socket.volatile.to(`project:${projectId}`).emit('cursorMove', position, userId)
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`)
      
      const projectId = socket.data.projectId
      const user = socket.data.user
      
      if (projectId && user) {
        projectUsers.get(projectId)?.delete(user.id)
        socket.to(`project:${projectId}`).emit('userLeft', user.id)
        
        // Clean up editing sessions
        editingSessions.forEach((users, taskId) => {
          if (users.has(user.id)) {
            users.delete(user.id)
            socket.to(`project:${projectId}`).emit('userStoppedEditing', user.id, taskId)
          }
        })
      }
    })
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log('> Socket.IO server initialized')
  })
})