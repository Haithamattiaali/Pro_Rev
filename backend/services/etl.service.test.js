const ETLService = require('./etl.service');
const { createTestDatabase, seedTestData } = require('../test/utils');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Mock the database modules
jest.mock('../database/db-wrapper');
jest.mock('../database/persistent-db');
jest.mock('fs');

describe('ETLService', () => {
  let testDb;
  let etlService;
  const mockDbWrapper = require('../database/db-wrapper');
  const mockPersistentDb = require('../database/persistent-db');

  beforeEach(() => {
    testDb = createTestDatabase();
    etlService = new ETLService();
    
    // Configure mocks to use test database
    mockDbWrapper.run = jest.fn((sql, params) => testDb.prepare(sql).run(params));
    mockDbWrapper.get = jest.fn((sql, params) => testDb.prepare(sql).get(params));
    mockDbWrapper.all = jest.fn((sql, params) => testDb.prepare(sql).all(params));
    mockDbWrapper.transaction = jest.fn((fn) => testDb.transaction(fn));
    
    mockPersistentDb.run = jest.fn((sql, params) => testDb.prepare(sql).run(params));
    mockPersistentDb.prepare = jest.fn((sql) => testDb.prepare(sql));
    mockPersistentDb.transaction = jest.fn((fn) => testDb.transaction(fn));
    
    // Mock fs.promises
    fs.promises = {
      unlink: jest.fn().mockResolvedValue(undefined)
    };
  });

  afterEach(() => {
    if (testDb) {
      testDb.close();
    }
  });

  describe('processExcelFile', () => {
    it('should process valid Excel file', async () => {
      const data = [
        ['Customer', 'ServiceType', 'Year', 'Month', 'Cost', 'Target', 'Revenue', 'Receivables Collected'],
        ['Customer A', 'Transportation', 2025, 'Jan', 100000, 150000, 140000, 130000],
        ['Customer B', 'Warehouses', 2025, 'Feb', 50000, 80000, 75000, 70000]
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      
      // Create a temporary test file
      const testFilePath = path.join(__dirname, 'test-file.xlsx');
      XLSX.writeFile(wb, testFilePath);

      // Mock the insertData method
      etlService.insertData = jest.fn().mockResolvedValue({
        success: true,
        inserted: 2,
        updated: 0,
        errors: []
      });

      const result = await etlService.processExcelFile(testFilePath);

      expect(result.success).toBe(true);
      expect(result.inserted).toBe(2);
      expect(etlService.insertData).toHaveBeenCalled();
      
      // Clean up
      try {
        await fs.unlink(testFilePath);
      } catch (err) {
        // Ignore
      }
    });

    it('should handle file read errors', async () => {
      const invalidPath = '/nonexistent/file.xlsx';

      await expect(etlService.processExcelFile(invalidPath)).rejects.toThrow();
    });
  });

  describe('insertData', () => {
    it('should insert new data successfully', async () => {
      const data = [
        {
          Customer: 'Customer A',
          ServiceType: 'Transportation',
          Year: 2025,
          Month: 'Jan',
          Cost: 100000,
          Target: 150000,
          Revenue: 140000,
          'Receivables Collected': 130000
        }
      ];

      const result = await etlService.insertData(data);

      expect(result.success).toBe(true);
      expect(result.inserted).toBeGreaterThan(0);
      expect(result.errors).toBe(0);
    });

    it('should handle pro-rating for current month', async () => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthName = Object.keys(etlService.monthMap).find(key => etlService.monthMap[key] === currentMonth);
      
      const data = [
        {
          Customer: 'Customer A',
          ServiceType: 'Transportation',
          Year: currentYear,
          Month: monthName,
          Cost: 100000,
          Target: 150000,
          Revenue: 140000,
          'Receivables Collected': 130000
        }
      ];

      const result = await etlService.insertData(data);

      expect(result.success).toBe(true);
      expect(result.inserted).toBeGreaterThan(0);
    });

    it('should update existing data', async () => {
      // First insert
      const data = [
        {
          Customer: 'Customer A',
          ServiceType: 'Transportation',
          Year: 2025,
          Month: 'Jan',
          Cost: 100000,
          Target: 150000,
          Revenue: 140000,
          'Receivables Collected': 130000
        }
      ];

      await etlService.insertData(data);

      // Update with new values
      const updatedData = [
        {
          Customer: 'Customer A',
          ServiceType: 'Transportation',
          Year: 2025,
          Month: 'Jan',
          Cost: 120000,
          Target: 160000,
          Revenue: 150000,
          'Receivables Collected': 140000
        }
      ];

      const result = await etlService.insertData(updatedData);

      expect(result.success).toBe(true);
      expect(result.updated).toBeGreaterThan(0);
    });

    it('should handle database errors gracefully', async () => {
      // Mock transaction to throw error
      mockPersistentDb.transaction = jest.fn(() => {
        throw new Error('Database error');
      });

      const data = [
        {
          Customer: 'Customer A',
          ServiceType: 'Transportation',
          Year: 2025,
          Month: 'Jan',
          Cost: 100000,
          Target: 150000,
          Revenue: 140000,
          'Receivables Collected': 130000
        }
      ];

      await expect(etlService.insertData(data)).rejects.toThrow('Database error');
    });
  });

  describe('validation', () => {
    it('should handle missing columns gracefully', async () => {
      const invalidData = [
        {
          Customer: 'Customer A',
          Year: 2025,
          Month: 'Jan'
          // Missing required fields
        }
      ];

      const result = await etlService.insertData(invalidData);

      expect(result.errors).toBeGreaterThan(0);
    });

    it('should handle invalid month values', async () => {
      const invalidData = [
        {
          Customer: 'Customer A',
          ServiceType: 'Transportation',
          Year: 2025,
          Month: 'InvalidMonth',
          Cost: 100000,
          Target: 150000,
          Revenue: 140000,
          'Receivables Collected': 130000
        }
      ];

      const result = await etlService.insertData(invalidData);

      expect(result.errors).toBeGreaterThan(0);
    });

    it('should handle invalid service types', async () => {
      const invalidData = [
        {
          Customer: 'Customer A',
          ServiceType: 'InvalidType',
          Year: 2025,
          Month: 'Jan',
          Cost: 100000,
          Target: 150000,
          Revenue: 140000,
          'Receivables Collected': 130000
        }
      ];

      const result = await etlService.insertData(invalidData);

      expect(result.errors).toBeGreaterThan(0);
    });
  });
});