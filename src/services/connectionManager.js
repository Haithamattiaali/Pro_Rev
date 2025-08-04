class ConnectionManager {
  constructor() {
    this.isConnected = true; // Assume connected initially
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.healthCheckInterval = null;
    this.lastHealthCheck = null;
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  // Perform health check
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Short timeout for health checks
        signal: AbortSignal.timeout(5000)
      });

      const data = await response.json();
      this.lastHealthCheck = new Date();
      
      if (data.status === 'OK' && data.database === 'connected') {
        this.retryCount = 0;
        this.isConnected = true;
        return true;
      } else {
        this.isConnected = false;
        return false;
      }
    } catch (error) {
      console.error('Health check failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Start periodic health checks
  startHealthChecks(interval = 30000) {
    // Initial check
    this.checkHealth();

    // Clear existing interval if any
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Set up periodic checks
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, interval);
  }

  // Stop health checks
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Make request with retry logic
  async requestWithRetry(url, options = {}, retries = this.maxRetries) {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        // Add timeout to prevent hanging requests
        signal: options.signal || AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reset retry count on success
      this.retryCount = 0;
      this.isConnected = true;
      
      return await response.json();
    } catch (error) {
      console.error(`Request failed (${this.maxRetries - retries + 1}/${this.maxRetries}):`, error);

      if (retries > 0) {
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, this.maxRetries - retries);
        console.log(`Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.requestWithRetry(url, options, retries - 1);
      }

      // All retries failed
      this.isConnected = false;
      throw error;
    }
  }

  // Ensure connection before making requests
  async ensureConnection() {
    // Skip health check if we recently checked (within last 5 minutes)
    if (this.isConnected && this.lastHealthCheck && Date.now() - this.lastHealthCheck < 300000) {
      return; // Connection is probably still good
    }
    
    // Only do health check if connection is lost or it's been too long
    if (!this.isConnected || !this.lastHealthCheck || Date.now() - this.lastHealthCheck > 300000) {
      const isHealthy = await this.checkHealth();
      if (!isHealthy) {
        console.warn('Backend health check failed, but proceeding anyway...');
        // Don't throw error in production - let the actual request fail if needed
        if (import.meta.env.DEV) {
          console.warn('Backend connection is not available - development mode');
        }
      }
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      lastHealthCheck: this.lastHealthCheck,
      retryCount: this.retryCount,
      baseUrl: this.baseUrl
    };
  }
}

export default new ConnectionManager();