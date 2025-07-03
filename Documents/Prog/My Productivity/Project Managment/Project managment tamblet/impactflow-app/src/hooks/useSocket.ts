import { useEffect, useState, useCallback, useRef } from 'react'
import { socketManager } from '@/lib/socket'
import type { ClientSocket } from '@/lib/socket'
import { useProjectStore } from '@/store/projectStore'
import { User } from '@/types/project'
import toast from 'react-hot-toast'

interface UseSocketOptions {
  autoConnect?: boolean
  token?: string
  user?: User
  projectId?: string
}

interface UseSocketReturn {
  socket: ClientSocket | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  reconnect: () => void
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true, token, user, projectId } = options
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<ClientSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const hasConnectedRef = useRef(false)

  const connect = useCallback(() => {
    try {
      const connectedSocket = socketManager.connect(token)
      setSocket(connectedSocket)
      
      // Join project room if projectId and user are provided
      if (projectId && user && connectedSocket.connected) {
        socketManager.emit('joinProject', projectId, user)
      }
      
      hasConnectedRef.current = true
    } catch (error) {
      console.error('Failed to connect socket:', error)
      toast.error('Failed to connect to real-time updates')
    }
  }, [token, projectId, user])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    // Leave project room if connected
    if (projectId && user?.id && socketManager.isConnected()) {
      socketManager.emit('leaveProject', projectId, user.id)
    }
    
    socketManager.disconnect()
    setSocket(null)
    setIsConnected(false)
    hasConnectedRef.current = false
  }, [projectId, user])

  const reconnect = useCallback(() => {
    disconnect()
    
    // Wait a bit before reconnecting
    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, 1000)
  }, [connect, disconnect])

  useEffect(() => {
    // Set up connection state listeners
    const unsubConnect = socketManager.on('connect', () => {
      setIsConnected(true)
      
      // Auto-join project room on reconnect
      if (projectId && user && hasConnectedRef.current) {
        socketManager.emit('joinProject', projectId, user)
        toast.success('Reconnected to real-time updates')
      }
    })

    const unsubDisconnect = socketManager.on('disconnect', (reason: string) => {
      setIsConnected(false)
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, don't auto-reconnect
        toast.error('Disconnected by server')
      } else if (reason === 'transport close' || reason === 'transport error') {
        // Connection issue, attempt to reconnect
        toast.error('Connection lost. Attempting to reconnect...')
      }
    })

    const unsubMaxReconnectFailed = socketManager.on('max_reconnect_failed', () => {
      toast.error('Failed to reconnect. Please refresh the page.')
    })

    // Auto-connect on mount if enabled
    if (autoConnect && !socketManager.isConnected()) {
      connect()
    } else if (socketManager.isConnected()) {
      setSocket(socketManager.getSocket())
      setIsConnected(true)
    }

    // Cleanup on unmount
    return () => {
      unsubConnect()
      unsubDisconnect()
      unsubMaxReconnectFailed()
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      // Only disconnect if this was the component that initiated the connection
      if (hasConnectedRef.current) {
        disconnect()
      }
    }
  }, []) // Only run on mount/unmount

  // Handle project/user changes
  useEffect(() => {
    if (isConnected && projectId && user) {
      socketManager.emit('joinProject', projectId, user)
    }
  }, [isConnected, projectId, user])

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    reconnect,
  }
}