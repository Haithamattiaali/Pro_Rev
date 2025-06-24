const db = require('./persistent-db');

// Wrapper to convert synchronous better-sqlite3 to async for compatibility
class DatabaseWrapper {
  async run(sql, params = []) {
    return new Promise((resolve) => {
      try {
        const result = db.run(sql, params);
        resolve(result);
      } catch (error) {
        console.error('Database run error:', error);
        throw error;
      }
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve) => {
      try {
        const result = db.get(sql, params);
        resolve(result);
      } catch (error) {
        console.error('Database get error:', error);
        throw error;
      }
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve) => {
      try {
        const result = db.all(sql, params);
        resolve(result || []);
      } catch (error) {
        console.error('Database all error:', error);
        throw error;
      }
    });
  }

  // Direct access to synchronous methods when needed
  runSync(sql, params = []) {
    return db.run(sql, params);
  }

  getSync(sql, params = []) {
    return db.get(sql, params);
  }

  allSync(sql, params = []) {
    return db.all(sql, params);
  }

  // Transaction support
  transaction(fn) {
    return db.transaction(fn);
  }
}

module.exports = new DatabaseWrapper();