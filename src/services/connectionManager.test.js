import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import connectionManager from './connectionManager'

// Mock fetch globally
global.fetch = vi.fn()

// Create a proper AbortSignal mock
class MockAbortSignal {
  constructor() {
    this.aborted = false;
    this.reason = undefined;
    this.onabort = null;
  }
  
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {}
  throwIfAborted() {
    if (this.aborted) {
      throw this.reason;
    }
  }
}

// Mock AbortSignal.timeout
if (!global.AbortSignal) {
  global.AbortSignal = MockAbortSignal;
}
global.AbortSignal.timeout = vi.fn((ms) => new MockAbortSignal())

describe('ConnectionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Reset connection state
    connectionManager.isConnected = true
    connectionManager.retryCount = 0
    connectionManager.lastHealthCheck = null
  })

  afterEach(() => {
    vi.useRealTimers()
    connectionManager.stopHealthChecks()
  })

  describe('checkHealth', () => {
    it('should return true when health check succeeds', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          status: 'OK',
          database: 'connected'
        })
      }
      fetch.mockResolvedValueOnce(mockResponse)

      const result = await connectionManager.checkHealth()

      expect(result).toBe(true)
      expect(connectionManager.isConnected).toBe(true)
      expect(connectionManager.retryCount).toBe(0)
      expect(connectionManager.lastHealthCheck).toBeInstanceOf(Date)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: expect.any(MockAbortSignal)
        })
      )
    })

    it('should return false when health check response is not OK', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          status: 'ERROR',
          database: 'disconnected'
        })
      }
      fetch.mockResolvedValueOnce(mockResponse)

      const result = await connectionManager.checkHealth()

      expect(result).toBe(false)
      expect(connectionManager.isConnected).toBe(false)
    })

    it('should return false when health check throws error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await connectionManager.checkHealth()

      expect(result).toBe(false)
      expect(connectionManager.isConnected).toBe(false)
    })

    it('should handle fetch timeout', async () => {
      // Mock fetch to simulate an aborted request
      fetch.mockRejectedValueOnce(new DOMException('The user aborted a request.', 'AbortError'))

      const result = await connectionManager.checkHealth()

      expect(result).toBe(false)
      expect(connectionManager.isConnected).toBe(false)
    })
  })

  describe('startHealthChecks', () => {
    it('should perform initial health check', () => {
      const checkHealthSpy = vi.spyOn(connectionManager, 'checkHealth').mockResolvedValue(true)
      
      connectionManager.startHealthChecks(1000)

      expect(checkHealthSpy).toHaveBeenCalledTimes(1)
    })

    it('should set up periodic health checks', () => {
      const checkHealthSpy = vi.spyOn(connectionManager, 'checkHealth').mockResolvedValue(true)
      
      connectionManager.startHealthChecks(1000)

      // Advance timer for multiple intervals
      vi.advanceTimersByTime(3000)

      // Initial + 3 periodic checks
      expect(checkHealthSpy).toHaveBeenCalledTimes(4)
    })

    it('should clear existing interval when called again', () => {
      vi.spyOn(connectionManager, 'checkHealth').mockResolvedValue(true)
      
      connectionManager.startHealthChecks(1000)
      const firstInterval = connectionManager.healthCheckInterval

      connectionManager.startHealthChecks(2000)
      const secondInterval = connectionManager.healthCheckInterval

      expect(firstInterval).not.toBe(secondInterval)
    })
  })

  describe('stopHealthChecks', () => {
    it('should clear health check interval', () => {
      vi.spyOn(connectionManager, 'checkHealth').mockResolvedValue(true)
      
      connectionManager.startHealthChecks(1000)
      expect(connectionManager.healthCheckInterval).not.toBeNull()

      connectionManager.stopHealthChecks()
      expect(connectionManager.healthCheckInterval).toBeNull()
    })

    it('should handle being called when no interval is set', () => {
      expect(() => connectionManager.stopHealthChecks()).not.toThrow()
    })
  })

  describe('requestWithRetry', () => {
    it('should successfully make request on first attempt', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' })
      }
      fetch.mockResolvedValueOnce(mockResponse)

      const result = await connectionManager.requestWithRetry('/test')

      expect(result).toEqual({ data: 'test' })
      expect(connectionManager.retryCount).toBe(0)
      expect(connectionManager.isConnected).toBe(true)
      expect(fetch).toHaveBeenCalledTimes(1)
      const [url, options] = fetch.mock.calls[0]
      expect(url).toBe('http://localhost:3001/api/test')
      expect(options.headers['Content-Type']).toBe('application/json')
      expect(options.signal).toBeDefined()
      expect(options.signal.aborted).toBe(false)
    })

    it('should retry on failure with exponential backoff', async () => {
      vi.useRealTimers() // Use real timers for retry delays
      
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: 'success' })
        })

      const result = await connectionManager.requestWithRetry('/test')

      expect(result).toEqual({ data: 'success' })
      expect(fetch).toHaveBeenCalledTimes(3)
      
      vi.useFakeTimers()
    })

    it('should throw error after max retries', async () => {
      vi.useRealTimers() // Use real timers for retry delays
      
      fetch.mockRejectedValue(new Error('Network error'))

      await expect(connectionManager.requestWithRetry('/test'))
        .rejects.toThrow('Network error')

      expect(fetch).toHaveBeenCalledTimes(connectionManager.maxRetries + 1)
      expect(connectionManager.isConnected).toBe(false)
      
      vi.useFakeTimers()
    })

    it('should handle non-ok HTTP responses', async () => {
      vi.useRealTimers() // Use real timers for retry delays
      
      fetch.mockResolvedValue({
        ok: false,
        status: 404
      })

      await expect(connectionManager.requestWithRetry('/test'))
        .rejects.toThrow('HTTP error! status: 404')
        
      vi.useFakeTimers()
    })

    it('should use custom options', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' })
      }
      fetch.mockResolvedValueOnce(mockResponse)

      const customOptions = {
        method: 'POST',
        headers: { 'X-Custom': 'header' },
        body: JSON.stringify({ test: 'data' })
      }

      await connectionManager.requestWithRetry('/test', customOptions)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Custom': 'header'
          },
          body: JSON.stringify({ test: 'data' })
        })
      )
    })

    it('should use custom signal from options', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' })
      }
      fetch.mockResolvedValueOnce(mockResponse)

      const customSignal = { custom: 'signal' }
      await connectionManager.requestWithRetry('/test', { signal: customSignal })

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: customSignal
        })
      )
    })
  })

  describe('ensureConnection', () => {
    it('should not check health if recently checked and connected', async () => {
      connectionManager.isConnected = true
      connectionManager.lastHealthCheck = new Date()
      const checkHealthSpy = vi.spyOn(connectionManager, 'checkHealth')

      await connectionManager.ensureConnection()

      expect(checkHealthSpy).not.toHaveBeenCalled()
    })

    it('should check health if not connected', async () => {
      connectionManager.isConnected = false
      const checkHealthSpy = vi.spyOn(connectionManager, 'checkHealth')
      checkHealthSpy.mockResolvedValue(true)

      await connectionManager.ensureConnection()

      expect(checkHealthSpy).toHaveBeenCalled()
    })

    it('should check health if last check was over 5 minutes ago', async () => {
      connectionManager.isConnected = true
      connectionManager.lastHealthCheck = new Date(Date.now() - 301000) // 5 minutes + 1 second
      const checkHealthSpy = vi.spyOn(connectionManager, 'checkHealth')
      checkHealthSpy.mockResolvedValue(true)

      await connectionManager.ensureConnection()

      expect(checkHealthSpy).toHaveBeenCalled()
    })

    it('should not throw error even in development when health check fails', async () => {
      import.meta.env.DEV = true
      connectionManager.isConnected = false
      const checkHealthSpy = vi.spyOn(connectionManager, 'checkHealth')
      checkHealthSpy.mockResolvedValue(false)
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await connectionManager.ensureConnection() // Should not throw

      expect(checkHealthSpy).toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith('Backend health check failed, but proceeding anyway...')
      expect(consoleWarnSpy).toHaveBeenCalledWith('Backend connection is not available - development mode')
      
      consoleWarnSpy.mockRestore()
    })

    it('should not throw error in production when health check fails', async () => {
      import.meta.env.DEV = false
      connectionManager.isConnected = false
      const checkHealthSpy = vi.spyOn(connectionManager, 'checkHealth')
      checkHealthSpy.mockResolvedValue(false)

      await expect(connectionManager.ensureConnection()).resolves.not.toThrow()
    })
  })

  describe('getConnectionStatus', () => {
    it('should return complete connection status', () => {
      const testDate = new Date()
      connectionManager.isConnected = true
      connectionManager.lastHealthCheck = testDate
      connectionManager.retryCount = 2

      const status = connectionManager.getConnectionStatus()

      expect(status).toEqual({
        isConnected: true,
        lastHealthCheck: testDate,
        retryCount: 2,
        baseUrl: expect.stringContaining('api')
      })
    })

    it('should handle null lastHealthCheck', () => {
      connectionManager.lastHealthCheck = null

      const status = connectionManager.getConnectionStatus()

      expect(status.lastHealthCheck).toBeNull()
    })
  })

  describe('baseUrl configuration', () => {
    it('should use environment variable when available', () => {
      const originalEnv = import.meta.env.VITE_API_URL
      import.meta.env.VITE_API_URL = 'https://test.api.com'
      
      // Create new instance to test constructor
      const ConnectionManager = connectionManager.constructor
      const instance = new ConnectionManager()
      
      expect(instance.baseUrl).toBe('https://test.api.com')
      
      import.meta.env.VITE_API_URL = originalEnv
    })

    it('should use default URL when environment variable is not set', () => {
      expect(connectionManager.baseUrl).toMatch(/localhost:3001\/api|test\.api\.com/)
    })
  })
})