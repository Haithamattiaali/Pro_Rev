const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use Render's persistent disk in production
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? '/var/data/proceed_revenue.db'
  : path.join(__dirname, 'proceed_revenue.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

class PersistentDatabase {
  constructor() {
    this.db = null;
    this.initializeDatabase();
  }

  initializeDatabase() {
    try {
      // Ensure directory exists before creating database
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        try {
          fs.mkdirSync(dbDir, { recursive: true });
          console.log(`Created database directory: ${dbDir}`);
        } catch (err) {
          // If we can't create the directory (e.g., /var/data in development), fall back to local
          if (err.code === 'EACCES' && DB_PATH.startsWith('/var/')) {
            console.log('Cannot create /var/data in development, using local directory');
            // Use local directory instead
            const localDbPath = path.join(__dirname, 'proceed_revenue.db');
            this.db = new Database(localDbPath, {
              fileMustExist: false,
              timeout: 60000,
            });
            this.configurePragmas();
            this.initializeSchema();
            console.log('Database initialized with persistent connection (fallback to local)');
            return;
          }
          throw err;
        }
      }
      
      // Create database with optimal settings for persistence
      this.db = new Database(DB_PATH, {
        fileMustExist: false,
        timeout: 60000, // 60 second timeout
      });

      this.configurePragmas();
      
      // Initialize schema if needed
      this.initializeSchema();
      
      console.log('Database initialized with persistent connection');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  configurePragmas() {
    // Configure for maximum persistence and performance
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging
    this.db.pragma('busy_timeout = 60000'); // 60 second busy timeout
    this.db.pragma('synchronous = NORMAL'); // Balance between safety and speed
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('page_size = 4096'); // Optimal page size
    this.db.pragma('temp_store = MEMORY'); // Use memory for temp tables
    this.db.pragma('mmap_size = 134217728'); // 128MB memory map
    this.db.pragma('locking_mode = NORMAL'); // Normal locking
    this.db.pragma('auto_vacuum = INCREMENTAL'); // Incremental auto vacuum
  }

  initializeSchema() {
    if (!fs.existsSync(SCHEMA_PATH)) {
      console.log('Schema file not found, skipping schema initialization');
      return;
    }

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          this.db.exec(statement);
        } catch (err) {
          // Ignore errors for existing tables/indexes
          if (!err.message.includes('already exists')) {
            console.error('Schema execution error:', err.message);
          }
        }
      }
    }
    
    // Run migrations
    this.runMigrations();
  }
  
  runMigrations() {
    try {
      // Check if original_target column exists
      const columns = this.db.prepare("PRAGMA table_info(revenue_data)").all();
      const hasOriginalTarget = columns.some(col => col.name === 'original_target');
      const hasAnalysisDate = columns.some(col => col.name === 'analysis_date');
      const hasOriginalCost = columns.some(col => col.name === 'original_cost');
      
      if (!hasOriginalTarget) {
        console.log('Adding original_target column...');
        this.db.prepare('ALTER TABLE revenue_data ADD COLUMN original_target REAL DEFAULT 0').run();
        this.db.prepare('UPDATE revenue_data SET original_target = target WHERE original_target = 0').run();
      }
      
      if (!hasAnalysisDate) {
        console.log('Adding analysis_date column...');
        this.db.prepare('ALTER TABLE revenue_data ADD COLUMN analysis_date DATE').run();
        this.db.prepare("UPDATE revenue_data SET analysis_date = date('now') WHERE analysis_date IS NULL").run();
      }
      
      if (!hasOriginalCost) {
        console.log('Adding original_cost column...');
        this.db.prepare('ALTER TABLE revenue_data ADD COLUMN original_cost REAL DEFAULT 0').run();
        this.db.prepare('UPDATE revenue_data SET original_cost = cost WHERE original_cost = 0').run();
      }
      
      console.log('Migrations completed');
    } catch (error) {
      console.log('Migration error (may be already applied):', error.message);
    }
    
    // Initialize sales plan schema FIRST (before forecast)
    this.initializeSalesPlanSchema();
    
    // Initialize forecast schema
    this.initializeForecastSchema();
    
    // Ensure opportunities_data table exists
    this.ensureOpportunitiesTable();
  }
  
  initializeForecastSchema() {
    try {
      const forecastSchemaPath = path.join(__dirname, 'forecast-schema.sql');
      if (!fs.existsSync(forecastSchemaPath)) {
        console.log('Forecast schema file not found, skipping forecast initialization');
        return;
      }
      
      const forecastSchema = fs.readFileSync(forecastSchemaPath, 'utf8');
      const statements = forecastSchema.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            this.db.exec(statement);
          } catch (err) {
            // Ignore errors for existing tables/indexes
            if (!err.message.includes('already exists')) {
              console.error('Forecast schema execution error:', err.message);
            }
          }
        }
      }
      
      console.log('Forecast schema initialized');
    } catch (error) {
      console.error('Forecast schema initialization error:', error.message);
    }
  }

  // Synchronous query methods for better-sqlite3
  run(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...params);
      return {
        id: result.lastInsertRowid,
        changes: result.changes
      };
    } catch (error) {
      console.error('Query error:', error.message);
      throw error;
    }
  }

  get(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.get(...params);
    } catch (error) {
      console.error('Query error:', error.message);
      throw error;
    }
  }

  all(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(...params);
    } catch (error) {
      console.error('Query error:', error.message);
      throw error;
    }
  }

  // Transaction support
  transaction(fn) {
    return this.db.transaction(fn);
  }

  // Close database (rarely needed)
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
  
  initializeSalesPlanSchema() {
    try {
      const migrationPath = path.join(__dirname, 'migrations', 'add-sales-plan-tables.sql');
      if (fs.existsSync(migrationPath)) {
        console.log('Initializing sales plan schema...');
        const salesPlanSchema = fs.readFileSync(migrationPath, 'utf8');
        const statements = salesPlanSchema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              this.db.exec(statement);
            } catch (err) {
              // Ignore errors for existing tables/indexes
              if (!err.message.includes('already exists')) {
                console.error('Sales plan schema error:', err.message);
              }
            }
          }
        }
        console.log('Sales plan schema initialized');
      }
    } catch (error) {
      console.error('Error initializing sales plan schema:', error);
    }
  }

  // Check if database is connected
  isConnected() {
    try {
      if (!this.db) return false;
      // Test connection with a simple query
      this.db.prepare('SELECT 1').get();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Reconnect to database
  async reconnect() {
    console.log('Reconnecting to database...');
    try {
      // Close existing connection if any
      if (this.db) {
        try {
          this.db.close();
        } catch (error) {
          console.error('Error closing database:', error);
        }
      }
      
      // Re-initialize connection
      this.initializeDatabase();
      console.log('Database reconnected successfully');
    } catch (error) {
      console.error('Failed to reconnect to database:', error);
      throw error;
    }
  }

  // Get database instance with connection check
  getDatabase() {
    if (!this.db || !this.isConnected()) {
      console.log('Database connection lost, attempting to reconnect...');
      this.initializeDatabase();
    }
    return this.db;
  }
  
  // Ensure opportunities table exists
  ensureOpportunitiesTable() {
    try {
      // Check if opportunities_data table exists
      const tableExists = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='opportunities_data'"
      ).get();
      
      if (!tableExists) {
        console.log('Creating opportunities_data table...');
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS opportunities_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project TEXT NOT NULL,
            service TEXT NOT NULL,
            location TEXT,
            scope_of_work TEXT,
            requirements TEXT,
            status TEXT,
            est_monthly_revenue REAL DEFAULT 0,
            est_gp_percent REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Create indexes
        this.db.exec(`
          CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities_data(status);
          CREATE INDEX IF NOT EXISTS idx_opportunities_service ON opportunities_data(service);
          CREATE INDEX IF NOT EXISTS idx_opportunities_project ON opportunities_data(project);
        `);
        
        console.log('Opportunities table created successfully');
      }
    } catch (error) {
      console.error('Error ensuring opportunities table:', error);
    }
  }
}

// Export singleton instance
module.exports = new PersistentDatabase();