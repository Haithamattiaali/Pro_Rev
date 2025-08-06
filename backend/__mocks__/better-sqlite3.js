// Mock for better-sqlite3
class MockDatabase {
  constructor(path, options) {
    this.path = path;
    this.options = options;
    this.statements = new Map();
  }

  prepare(sql) {
    // Return cached statement if it exists
    if (this.statements.has(sql)) {
      return this.statements.get(sql);
    }

    const mockStatement = {
      run: jest.fn().mockReturnValue({ 
        lastInsertRowid: 1, 
        changes: 1 
      }),
      get: jest.fn().mockReturnValue(undefined),
      all: jest.fn().mockReturnValue([]),
      pluck: jest.fn().mockReturnThis(),
      expand: jest.fn().mockReturnThis(),
      raw: jest.fn().mockReturnThis(),
      columns: jest.fn().mockReturnThis(),
      bind: jest.fn().mockReturnThis(),
    };

    // Store the statement for reuse
    this.statements.set(sql, mockStatement);
    return mockStatement;
  }

  pragma(sql) {
    return;
  }

  exec(sql) {
    return;
  }

  transaction(fn) {
    return fn;
  }

  close() {
    return;
  }
}

module.exports = jest.fn().mockImplementation((path, options) => {
  return new MockDatabase(path, options);
});