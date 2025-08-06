// Mock for persistent-db module
const mockDb = {
  prepare: jest.fn().mockReturnValue({
    run: jest.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 }),
    get: jest.fn(),
    all: jest.fn().mockReturnValue([])
  }),
  pragma: jest.fn(),
  exec: jest.fn(),
  transaction: jest.fn((fn) => fn),
  close: jest.fn()
};

const mockPersistentDb = {
  db: mockDb,
  getDatabase: jest.fn().mockReturnValue(mockDb),
  isConnected: jest.fn().mockReturnValue(true),
  reconnect: jest.fn().mockResolvedValue(undefined),
  run: jest.fn().mockReturnValue({ id: 1, changes: 1 }),
  get: jest.fn(),
  all: jest.fn().mockReturnValue([]),
  transaction: jest.fn((fn) => fn),
  close: jest.fn(),
  initializeDatabase: jest.fn(),
  configurePragmas: jest.fn(),
  initializeSchema: jest.fn(),
  runMigrations: jest.fn(),
  initializeSalesPlanSchema: jest.fn(),
  initializeForecastSchema: jest.fn(),
  ensureOpportunitiesTable: jest.fn()
};

module.exports = mockPersistentDb;