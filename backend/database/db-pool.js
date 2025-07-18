const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'proceed_revenue.db');

class DatabasePool {
  constructor() {
    this.db = null;
    this.connectPromise = null;
  }

  async getConnection() {
    if (this.db && this.db.open) {
      return this.db;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = this.connect();
    return this.connectPromise;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(
        DB_PATH,
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        (err) => {
          if (err) {
            console.error('Database connection error:', err);
            this.connectPromise = null;
            reject(err);
          } else {
            console.log('Database connected successfully');
            
            // Configure for better performance
            this.db.configure('busyTimeout', 30000); // 30 second timeout
            
            // Enable Write-Ahead Logging for better concurrency
            this.db.run('PRAGMA journal_mode = WAL', (err) => {
              if (err) console.error('WAL mode error:', err);
            });
            
            // Keep connection alive
            this.keepAlive();
            
            resolve(this.db);
          }
        }
      );
    });
  }

  keepAlive() {
    // Ping database every 30 seconds to keep connection alive
    setInterval(() => {
      if (this.db && this.db.open) {
        this.db.get('SELECT 1', (err) => {
          if (err) {
            console.error('Keep-alive ping failed:', err);
            this.reconnect();
          }
        });
      }
    }, 30000);
  }

  async reconnect() {
    console.log('Attempting to reconnect to database...');
    this.db = null;
    this.connectPromise = null;
    return this.getConnection();
  }

  async run(sql, params = []) {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          console.error('Query error:', err, sql);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Query error:', err, sql);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Query error:', err, sql);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
}

module.exports = new DatabasePool();