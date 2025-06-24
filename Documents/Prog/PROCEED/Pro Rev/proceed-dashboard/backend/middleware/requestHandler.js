const db = require('../database/db-wrapper');

// Request queue to handle concurrent requests
class RequestQueue {
  constructor(maxConcurrent = 10) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

const requestQueue = new RequestQueue();

// Middleware to ensure database connection for each request
const ensureConnection = async (req, res, next) => {
  try {
    // Test connection with a simple query
    await db.get('SELECT 1 as test');
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Try to reconnect
    try {
      await db.reconnect();
      next();
    } catch (reconnectError) {
      res.status(503).json({
        error: 'Database connection unavailable',
        message: 'Please try again in a moment',
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Middleware to handle request timeout
const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      res.status(408).json({
        error: 'Request timeout',
        message: 'The request took too long to process',
        timestamp: new Date().toISOString()
      });
    }, timeout);

    res.on('finish', () => {
      clearTimeout(timer);
    });

    next();
  };
};

// Middleware to queue database requests
const queueRequest = (fn) => {
  return async (req, res, next) => {
    try {
      req.queuedResult = await requestQueue.add(() => fn(req, res));
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Error recovery middleware
const errorRecovery = (error, req, res, next) => {
  console.error('Request error:', error);

  // Check if it's a database error
  if (error.code === 'SQLITE_BUSY' || error.code === 'SQLITE_LOCKED') {
    // Retry the request after a delay
    setTimeout(() => {
      console.log('Retrying request after database busy error');
      next();
    }, 100);
  } else if (error.code === 'SQLITE_CORRUPT' || error.code === 'SQLITE_NOTADB') {
    res.status(500).json({
      error: 'Database error',
      message: 'Critical database error occurred',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  ensureConnection,
  requestTimeout,
  queueRequest,
  errorRecovery,
  requestQueue
};