import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock import.meta.env
vi.stubEnv('VITE_API_URL', 'http://test-api.com/api');

describe('ConnectionManager', () => {
  let ConnectionManager;
  let connectionManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    global.fetch.mockReset();
    
    // Import the class dynamically to ensure fresh instance
    const module = await import('../connectionManager.js');
    ConnectionManager = module.default;
    connectionManager = new ConnectionManager();
  });

  afterEach(() => {
    vi.clearAllTimers();
    if (connectionManager && connectionManager.healthCheckInterval) {
      clearInterval(connectionManager.healthCheckInterval);
    }
  });

  describe('constructor', () => {
    it('should initialize with correct default values', () => {
      expect(connectionManager.isConnected).toBe(true);
      expect(connectionManager.retryCount).toBe(0);
      expect(connectionManager.maxRetries).toBe(3);
      expect(connectionManager.retryDelay).toBe(1000);
      expect(connectionManager.baseUrl).toBe('http://test-api.com/api');
      expect(connectionManager.requestQueue).toEqual([]);
      expect(connectionManager.isProcessingQueue).toBe(false);
    });
  });

  describe('checkHealth', () => {
    it('should return true when API is healthy', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ status: 'OK', database: 'connected' })
      });

      const result = await connectionManager.checkHealth();
      
      expect(result).toBe(true);
      expect(connectionManager.isConnected).toBe(true);
      expect(connectionManager.retryCount).toBe(0);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api.com/api/health',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should return false when database is not connected', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ status: 'OK', database: 'disconnected' })
      });

      const result = await connectionManager.checkHealth();
      
      expect(result).toBe(false);
      expect(connectionManager.isConnected).toBe(false);
    });

    it('should return false on network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await connectionManager.checkHealth();
      
      expect(result).toBe(false);
      expect(connectionManager.isConnected).toBe(false);
    });

    it('should update lastHealthCheck timestamp', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ status: 'OK', database: 'connected' })
      });

      expect(connectionManager.lastHealthCheck).toBe(null);
      
      await connectionManager.checkHealth();
      
      expect(connectionManager.lastHealthCheck).toBeInstanceOf(Date);
    });
  });

  describe('startHealthChecks', () => {
    it('should perform initial health check', () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ status: 'OK', database: 'connected' })
      });

      connectionManager.startHealthChecks();
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should set up periodic health checks', () => {
      vi.useFakeTimers();
      
      global.fetch.mockResolvedValue({
        json: async () => ({ status: 'OK', database: 'connected' })
      });

      connectionManager.startHealthChecks(5000); // 5 second interval
      
      expect(connectionManager.healthCheckInterval).toBeTruthy();
      
      // Fast-forward time
      vi.advanceTimersByTime(5000);
      
      // Should have called fetch twice (initial + 1 interval)
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });

    it('should clear existing interval before starting new one', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      connectionManager.healthCheckInterval = 123; // Mock existing interval
      connectionManager.startHealthChecks();
      
      expect(clearIntervalSpy).toHaveBeenCalledWith(123);
    });
  });

  describe('stopHealthChecks', () => {
    it('should clear health check interval', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      connectionManager.healthCheckInterval = 456;
      connectionManager.stopHealthChecks();
      
      expect(clearIntervalSpy).toHaveBeenCalledWith(456);
      expect(connectionManager.healthCheckInterval).toBe(null);
    });
  });

  describe('makeRequest', () => {
    it('should make successful request when connected', async () => {
      connectionManager.isConnected = true;
      
      const mockResponse = { data: 'test' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await connectionManager.makeRequest('/test', { method: 'GET' });
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api.com/api/test',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should throw error immediately when not connected', async () => {
      connectionManager.isConnected = false;
      
      await expect(connectionManager.makeRequest('/test'))
        .rejects.toThrow('Backend connection is not available');
      
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
