const db = require('./persistent-db');

// Wrapper to convert synchronous better-sqlite3 to async for compatibility with retry logic
class DatabaseWrapper {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 100;
  }

  async executeWithRetry(operation, sql, params = []) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Check connection before operation
        if (!db.isConnected()) {
          await db.reconnect();
        }
        
        const result = await operation(sql, params);
        return result;
      } catch (error) {
        lastError = error;
        console.error(`Database operation failed (attempt ${attempt}/${this.maxRetries}):`, error.message);
        
        // Handle specific SQLite errors
        if (error.code === 'SQLITE_BUSY' || error.code === 'SQLITE_LOCKED') {
          // Wait with exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // For other errors, try reconnecting
        if (attempt < this.maxRetries) {
          try {
            await db.reconnect();
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          } catch (reconnectError) {
            console.error('Reconnection failed:', reconnectError);
          }
        }
      }
    }
    
    throw lastError;
  }

  async run(sql, params = []) {
    return this.executeWithRetry(async (sql, params) => {
      return new Promise((resolve, reject) => {
        try {
          const result = db.run(sql, params);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    }, sql, params);
  }

  async get(sql, params = []) {
    return this.executeWithRetry(async (sql, params) => {
      return new Promise((resolve, reject) => {
        try {
          const result = db.get(sql, params);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    }, sql, params);
  }

  async all(sql, params = []) {
    return this.executeWithRetry(async (sql, params) => {
      return new Promise((resolve, reject) => {
        try {
          const result = db.all(sql, params);
          resolve(result || []);
        } catch (error) {
          reject(error);
        }
      });
    }, sql, params);
  }

  // Direct access to synchronous methods when needed (no retry)
  runSync(sql, params = []) {
    return db.run(sql, params);
  }

  getSync(sql, params = []) {
    return db.get(sql, params);
  }

  allSync(sql, params = []) {
    return db.all(sql, params);
  }

  // Transaction support with retry
  async transaction(fn) {
    return this.executeWithRetry(async () => {
      return db.transaction(fn)();
    });
  }

  // Connection management
  async reconnect() {
    return db.reconnect();
  }

  isConnected() {
    return db.isConnected();
  }

  // Health check
  async checkHealth() {
    try {
      await this.get('SELECT 1 as test');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

module.exports = new DatabaseWrapper();