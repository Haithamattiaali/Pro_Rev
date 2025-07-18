const dataService = require('../services/data.service');

// Mock the database
jest.mock('../database/db-wrapper', () => ({
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn(),
  prepare: jest.fn(() => ({
    run: jest.fn()
  }))
}));

const db = require('../database/db-wrapper');

describe('DataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMonthlyTrends', () => {
    it('should only return compliant months', async () => {
      // Mock validation data
      const mockValidationData = {
        compliantMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        nonCompliantMonths: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        missingDataDetails: {
          'Jul': ['cost', 'target'],
          'Aug': ['cost', 'target'],
          'Sep': ['cost', 'target'],
          'Oct': ['cost', 'target'],
          'Nov': ['cost', 'target'],
          'Dec': ['cost', 'target']
        }
      };

      // Mock getAnalysisPeriodValidation to return validation data
      dataService.getAnalysisPeriodValidation = jest.fn().mockResolvedValue(mockValidationData);

      // Mock monthly trends data
      const mockMonthlyData = [
        { month: 'Jan', revenue: 100000, target: 90000, cost: 80000, receivables: 5000 },
        { month: 'Feb', revenue: 110000, target: 95000, cost: 85000, receivables: 6000 },
        { month: 'Mar', revenue: 120000, target: 100000, cost: 90000, receivables: 7000 },
        { month: 'Apr', revenue: 130000, target: 105000, cost: 95000, receivables: 8000 },
        { month: 'May', revenue: 140000, target: 110000, cost: 100000, receivables: 9000 },
        { month: 'Jun', revenue: 150000, target: 115000, cost: 105000, receivables: 10000 }
      ];

      db.all.mockResolvedValue(mockMonthlyData);

      // Call getMonthlyTrends
      const result = await dataService.getMonthlyTrends(2025);

      // Verify it called getAnalysisPeriodValidation
      expect(dataService.getAnalysisPeriodValidation).toHaveBeenCalledWith(2025);

      // Verify SQL query includes only compliant months
      expect(db.all).toHaveBeenCalledWith(
        expect.stringContaining('WHERE year = ? AND month IN (?,?,?,?,?,?)'),
        [2025, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      );

      // Verify result contains only compliant months
      expect(result).toHaveLength(6);
      expect(result.map(r => r.month)).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']);
    });

    it('should return empty array when no compliant months', async () => {
      // Mock validation data with no compliant months
      const mockValidationData = {
        compliantMonths: [],
        nonCompliantMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        missingDataDetails: {}
      };

      dataService.getAnalysisPeriodValidation = jest.fn().mockResolvedValue(mockValidationData);

      // Call getMonthlyTrends
      const result = await dataService.getMonthlyTrends(2025);

      // Verify it returns empty array
      expect(result).toEqual([]);
      
      // Verify db.all was not called
      expect(db.all).not.toHaveBeenCalled();
    });

    it('should filter by service type when provided', async () => {
      // Mock validation data
      const mockValidationData = {
        compliantMonths: ['Jan', 'Feb', 'Mar'],
        nonCompliantMonths: [],
        missingDataDetails: {}
      };

      dataService.getAnalysisPeriodValidation = jest.fn().mockResolvedValue(mockValidationData);

      const mockMonthlyData = [
        { month: 'Jan', revenue: 50000, target: 45000, cost: 40000, receivables: 2500 },
        { month: 'Feb', revenue: 55000, target: 47500, cost: 42500, receivables: 3000 },
        { month: 'Mar', revenue: 60000, target: 50000, cost: 45000, receivables: 3500 }
      ];

      db.all.mockResolvedValue(mockMonthlyData);

      // Call getMonthlyTrends with service type
      const result = await dataService.getMonthlyTrends(2025, 'Transportation');

      // Verify SQL query includes service type filter
      expect(db.all).toHaveBeenCalledWith(
        expect.stringContaining('WHERE year = ? AND month IN (?,?,?) AND service_type = ?'),
        [2025, 'Jan', 'Feb', 'Mar', 'Transportation']
      );

      expect(result).toEqual(mockMonthlyData);
    });
  });
});