const path = require('path');
const fs = require('fs');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = 3002;

// Create test database directory
const testDbDir = path.join(__dirname, 'test-db');
if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}

// Set test database path
process.env.TEST_DB_PATH = path.join(testDbDir, 'test_revenue.db');

// Cleanup function for tests
global.cleanupTestDb = () => {
  const testDbPath = process.env.TEST_DB_PATH;
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
      fs.unlinkSync(testDbPath + '-shm');
      fs.unlinkSync(testDbPath + '-wal');
    } catch (err) {
      // Ignore errors
    }
  }
};

// Mock console methods in test to reduce noise
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

// Mock the database modules globally for all tests except integration tests
if (!process.env.INTEGRATION_TEST) {
  jest.mock('../database/persistent-db');
  jest.mock('better-sqlite3');
}