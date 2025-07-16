import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import connectionManager from './connectionManager'

// Mock fetch globally
global.fetch = vi.fn()

// Mock import.meta.env
vi.stubGlobal('import.meta.env', {
  VITE_API_URL: 'http://localhost:3001/api',
  DEV: true
})

describe('ConnectionManager', () => {
  beforeEach(() => {
    // Reset connection manager state
    connectionManager.isConnected = true
    connectionManager.retryCount = 0
    connectionManager.lastHealthCheck = null
    connectionManager.requestQueue = []
    vi.clearAllMocks()
    // Reset fetch mock
    global.fetch.mockReset()
  })
  
  afterEach(() => {
    vi.clearAllTimers()
    connectionManager.stopHealthChecks()
  })

  describe('health check', () => {
    it('should perform health check successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', database: 'connected' })
      })

      const result = await connectionManager.checkHealth()
      
      expect(result).toBe(true)
      expect(connectionManager.isConnected).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should handle health check failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await connectionManager.checkHealth()
      
      expect(result).toBe(false)
      expect(connectionManager.isConnected).toBe(false)
    })

    it('should handle non-OK status', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ERROR', database: 'disconnected' })
      })

      const result = await connectionManager.checkHealth()
      
      expect(result).toBe(false)
      expect(connectionManager.isConnected).toBe(false)
    })
  })

  describe('request with retry', () => {
    it('should make successful request', async () => {
      const mockResponse = { data: 'test' }
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await connectionManager.requestWithRetry('/test')
      
      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should retry on failure with exponential backoff', async () => {
      vi.useFakeTimers()
      
      // Fail twice, then succeed
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' })
        })

      const requestPromise = connectionManager.requestWithRetry('/test')

      // Fast-forward through retries
      await vi.advanceTimersByTimeAsync(1000) // First retry
      await vi.advanceTimersByTimeAsync(2000) // Second retry (exponential backoff)

      const result = await requestPromise
      
      expect(result).toEqual({ data: 'success' })
      expect(global.fetch).toHaveBeenCalledTimes(3)
      
      vi.useRealTimers()
    })

    it('should throw error after max retries', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'))

      await expect(
        connectionManager.requestWithRetry('/test')
      ).rejects.toThrow('Network error')
      
      expect(global.fetch).toHaveBeenCalledTimes(4) // Initial + 3 retries
      expect(connectionManager.isConnected).toBe(false)
    })

    it('should handle HTTP errors', async () => {
      vi.useFakeTimers()
      
      // Mock all retry attempts to return 404
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const promise = connectionManager.requestWithRetry('/test')
      
      // Advance through all retries
      await vi.advanceTimersByTimeAsync(10000)
      
      await expect(promise).rejects.toThrow('HTTP error! status: 404')
      
      vi.useRealTimers()
    })
  })

  describe('connection management', () => {
    it('should ensure connection before requests', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', database: 'connected' })
      })

      await connectionManager.ensureConnection()
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.any(Object)
      )
    })

    it('should throw error in dev mode when health check fails', async () => {
      connectionManager.isConnected = false
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        connectionManager.ensureConnection()
      ).rejects.toThrow('Backend connection is not available')
    })

    it('should get connection status', () => {
      connectionManager.isConnected = true
      connectionManager.lastHealthCheck = new Date()
      connectionManager.retryCount = 2

      const status = connectionManager.getConnectionStatus()
      
      expect(status).toMatchObject({
        isConnected: true,
        lastHealthCheck: expect.any(Date),
        retryCount: 2,
        baseUrl: 'http://localhost:3001/api'
      })
    })
  })

  describe('health check intervals', () => {
    it('should start periodic health checks', () => {
      vi.useFakeTimers()
      const checkHealthSpy = vi.spyOn(connectionManager, 'checkHealth')
      
      connectionManager.startHealthChecks(1000)
      
      // Initial check
      expect(checkHealthSpy).toHaveBeenCalledTimes(1)
      
      // Advance timer
      vi.advanceTimersByTime(1000)
      expect(checkHealthSpy).toHaveBeenCalledTimes(2)
      
      vi.advanceTimersByTime(1000)
      expect(checkHealthSpy).toHaveBeenCalledTimes(3)
      
      vi.useRealTimers()
    })

    it('should stop health checks', () => {
      vi.useFakeTimers()
      const checkHealthSpy = vi.spyOn(connectionManager, 'checkHealth')
      
      connectionManager.startHealthChecks(1000)
      connectionManager.stopHealthChecks()
      
      vi.advanceTimersByTime(5000)
      
      // Only the initial check should have been called
      expect(checkHealthSpy).toHaveBeenCalledTimes(1)
      
      vi.useRealTimers()
    })
  })

  describe('request configuration', () => {
    it('should handle POST requests with body', async () => {
      const body = { test: 'data' }
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      await connectionManager.requestWithRetry('/test', {
        method: 'POST',
        body: JSON.stringify(body)
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should handle custom headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })

      await connectionManager.requestWithRetry('/test', {
        headers: {
          'X-Custom-Header': 'test-value'
        }
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'test-value',
            'Content-Type': 'application/json'
          })
        })
      )
    })
  })
})