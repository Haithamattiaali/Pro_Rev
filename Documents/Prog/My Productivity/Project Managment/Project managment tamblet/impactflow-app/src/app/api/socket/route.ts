import { NextRequest } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { initializeSocketServer } from '@/server/socket'

let io: SocketIOServer | null = null

export async function GET(request: NextRequest) {
  if (!io) {
    // In production, you'd want to set up a proper WebSocket server
    // This is a simplified example for development
    return new Response('Socket.IO server not initialized. Use a custom server setup for production.', {
      status: 501,
    })
  }

  return new Response('Socket.IO server is running', {
    status: 200,
  })
}

// Note: For Socket.io to work properly with Next.js App Router,
// you need to set up a custom server. Here's an example setup:

/*
// server.js (create this file in your project root)
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { initializeSocketServer } = require('./src/server/socket')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

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
  const io = initializeSocketServer(server)

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})

// Update your package.json scripts:
// "dev": "node server.js",
// "start": "NODE_ENV=production node server.js"
*/