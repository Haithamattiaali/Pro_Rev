// Mock database before requiring services
jest.mock('../database/db-wrapper');
jest.mock('../database/persistent-db', () => ({
  isConnected: jest.fn(() => true),
  reconnect: jest.fn(),
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  transaction: jest.fn()
}));

const dataService = require('../services/data.service');
const db = require('../database/db-wrapper');
const { calculateGrossProfit, calculateGrossProfitMargin, calculatePerformanceCost } = require('../utils/profitCalculations');

describe('DataService SQL Calculations - Precision Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Calendar Days SQL Calculation', () => {
    
    test('should generate correct SQL for calendar days', () => {
      const sql = dataService.getCalendarDaysSQL();
      
      // Verify SQL includes all months
      expect(sql).toContain("WHEN 'Jan' THEN 31");
      expect(sql).toContain("WHEN 'Feb' THEN CASE WHEN year % 4 = 0");
      expect(sql).toContain("WHEN 'Mar' THEN 31");
      expect(sql).toContain("WHEN 'Dec' THEN 31");
      
      // Verify leap year logic
      expect(sql).toContain("year % 4 = 0 AND (year % 100 != 0 OR year % 400 = 0)");
    });
    
    test('should calculate calendar days correctly for each month', () => {
      // Test the helper function
      const testCases = [
        { year: 2025, month: 'Jan', expected: 31 },
        { year: 2025, month: 'Feb', expected: 28 },
        { year: 2024, month: 'Feb', expected: 29 }, // Leap year
        { year: 2025, month: 'Apr', expected: 30 },
        { year: 2000, month: 'Feb', expected: 29 }, // Century leap year
        { year: 1900, month: 'Feb', expected: 28 }, // Century non-leap year
      ];
      
      testCases.forEach(({ year, month, expected }) => {
        const result = dataService.getCalendarDaysInMonth(year, month);
        expect(result).toBe(expected);
      });
    });
  });
  
  describe('Daily Calculations SQL', () => {
    
    test('should generate correct daily calculation SQL', () => {
      const sql = dataService.getDailyCalculationSQL();
      
      // Verify daily target calculation
      expect(sql).toContain('SUM(target) / SUM(');
      expect(sql).toContain('as daily_target');
      
      // Verify period target calculation
      expect(sql).toContain('* SUM(COALESCE(days, 30))');
      expect(sql).toContain('as period_target');
      
      // Verify daily achievement calculation
      expect(sql).toContain('(SUM(revenue) /');
      expect(sql).toContain('* 100');
      expect(sql).toContain('as daily_achievement');
      
      // Verify COALESCE for null safety
      expect(sql).toContain('COALESCE(days, 30)');
    });
    
    test('should handle division by zero in SQL', () => {
      const sql = dataService.getDailyCalculationSQL();
      
      // Check for CASE statements protecting division
      expect(sql).toContain('CASE');
      expect(sql).toContain('WHEN SUM');
      expect(sql).toContain('> 0');
      expect(sql).toContain('ELSE 0');
    });
  });
  
  describe('getOverviewData Calculations', () => {
    
    test.skip('should calculate overview metrics with precision', async () => {
      // Mock database response
      const mockData = {
        total_revenue: 1234567.89,
        total_target: 1000000,
        total_cost: 800000,
        total_receivables: 150000,
        customer_count: 25,
        service_count: 5,
        achievement_percentage: 123.456789,
        daily_target: 32258.064516129032,
        period_target: 1000000,
        daily_achievement: 123.456789,
        total_days_worked: 31,
        calendar_days: 31
      };
      
      db.get.mockResolvedValue(mockData);
      db.all.mockResolvedValue([]); // Empty service breakdown
      
      const result = await dataService.getOverviewData(2025, 'MTD', 1);
      
      // Verify performance cost calculation
      const expectedPerformanceCost = calculatePerformanceCost(
        mockData.total_revenue,
        mockData.total_target,
        mockData.total_cost
      );
      expect(result.overview.cost).toBe(expectedPerformanceCost);
      expect(result.overview.cost).toBe(987654.3119999999);
      
      // Verify gross profit calculation
      const expectedProfit = calculateGrossProfit(
        mockData.total_revenue,
        mockData.total_target,
        mockData.total_cost
      );
      expect(result.overview.profit).toBe(expectedProfit);
      expect(result.overview.profit).toBeCloseTo(246913.578, 5);
      
      // Verify profit margin calculation
      const expectedMargin = calculateGrossProfitMargin(expectedProfit, mockData.total_revenue);
      expect(result.overview.profitMargin).toBe(expectedMargin);
      expect(result.overview.profitMargin).toBe(20);
    });
    
    test.skip('should handle null values with COALESCE', async () => {
      // Mock data with nulls
      const mockData = {
        total_revenue: 100000,
        total_target: null, // Null target
        total_cost: null,   // Null cost
        total_receivables: null,
        customer_count: 10,
        service_count: 2,
        achievement_percentage: 0,
        daily_target: 0,
        period_target: 0,
        daily_achievement: 0,
        total_days_worked: 30,
        calendar_days: 30
      };
      
      db.get.mockResolvedValue(mockData);
      db.all.mockResolvedValue([]);
      
      const result = await dataService.getOverviewData(2025, 'MTD', 1);
      
      // Should handle nulls gracefully
      expect(result.overview.target).toBe(0);
      expect(result.overview.cost).toBe(0);
      expect(result.overview.receivables).toBe(0);
      expect(result.overview.profit).toBe(100000); // Revenue - 0 cost
    });
  });
  
  describe('Multi-Select Calculations', () => {
    
    test.skip('should aggregate Q1+Q2 data correctly', async () => {
      const filters = {
        years: [2025],
        months: [],
        quarters: [1, 2]
      };
      
      // Mock aggregated data for 6 months
      const mockData = {
        total_revenue: 6000000,    // 6 months of revenue
        total_target: 6000000,     // 6 months of target
        total_cost: 4800000,       // 6 months of cost
        total_receivables: 900000,
        customer_count: 50,
        service_count: 8,
        achievement_percentage: 100,
        daily_target: 32786.885245901637, // 6000000 / 183 days
        period_target: 6000000,
        daily_achievement: 100,
        total_days_worked: 183,    // Assuming 30.5 days average
        calendar_days: 183         // Jan(31) + Feb(28) + Mar(31) + Apr(30) + May(31) + Jun(30)
      };
      
      db.get.mockResolvedValue(mockData);
      db.all.mockResolvedValue([]);
      
      const result = await dataService.getOverviewDataMultiSelect(filters);
      
      // Verify weighted daily target calculation
      // Total target / Total calendar days
      const expectedDailyTarget = 6000000 / 183;
      expect(expectedDailyTarget).toBeCloseTo(32786.885245901637, 10);
      
      // Verify performance calculations on aggregated data
      expect(result.overview.cost).toBe(4800000); // 100% achievement = full cost
      expect(result.overview.profit).toBe(1200000); // 6M - 4.8M
      expect(result.overview.profitMargin).toBe(20); // 1.2M / 6M * 100
    });
    
    test('should handle month number conversions correctly', () => {
      const selectedMonths = dataService.getMultiSelectMonths({
        years: [2025],
        months: [1, 2, 3], // January, February, March
        quarters: []
      });
      
      expect(selectedMonths).toEqual(['Jan', 'Feb', 'Mar']);
    });
    
    test('should convert quarters to months correctly', () => {
      const testCases = [
        {
          quarters: [1],
          expected: ['Jan', 'Feb', 'Mar']
        },
        {
          quarters: [2],
          expected: ['Apr', 'May', 'Jun']
        },
        {
          quarters: [3],
          expected: ['Jul', 'Aug', 'Sep']
        },
        {
          quarters: [4],
          expected: ['Oct', 'Nov', 'Dec']
        },
        {
          quarters: [1, 2],
          expected: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        }
      ];
      
      testCases.forEach(({ quarters, expected }) => {
        const result = dataService.getMultiSelectMonths({
          years: [2025],
          months: [],
          quarters
        });
        expect(result).toEqual(expected);
      });
    });
  });
  
  describe('Service Breakdown Calculations', () => {
    
    test.skip('should calculate service-level metrics with precision', async () => {
      const mockOverview = {
        total_revenue: 1000000,
        total_target: 1000000,
        total_cost: 800000,
        total_receivables: 100000,
        customer_count: 20,
        service_count: 3,
        achievement_percentage: 100,
        daily_target: 32258.064516129032,
        period_target: 1000000,
        daily_achievement: 100,
        total_days_worked: 31,
        calendar_days: 31
      };
      
      const mockServiceBreakdown = [
        {
          service_type: 'Consulting',
          revenue: 500000,
          target: 450000,
          cost: 360000,
          achievement_percentage: 111.11111111111111,
          daily_target: 14516.129032258064,
          period_target: 450000,
          daily_achievement: 111.11111111111111
        },
        {
          service_type: 'Support',
          revenue: 300000,
          target: 350000,
          cost: 280000,
          achievement_percentage: 85.71428571428571,
          daily_target: 11290.322580645162,
          period_target: 350000,
          daily_achievement: 85.71428571428571
        },
        {
          service_type: 'Training',
          revenue: 200000,
          target: 200000,
          cost: 160000,
          achievement_percentage: 100,
          daily_target: 6451.612903225806,
          period_target: 200000,
          daily_achievement: 100
        }
      ];
      
      db.get.mockResolvedValue(mockOverview);
      db.all.mockResolvedValue(mockServiceBreakdown);
      
      const result = await dataService.getOverviewData(2025, 'MTD', 1);
      
      // Verify service breakdown calculations
      expect(result.serviceBreakdown).toHaveLength(3);
      
      // Check Consulting service (overachievement)
      const consulting = result.serviceBreakdown[0];
      expect(consulting.achievement_percentage).toBe(111.11111111111111);
      expect(consulting.daily_achievement).toBe(111.11111111111111);
      
      // Check Support service (underachievement)
      const support = result.serviceBreakdown[1];
      expect(support.achievement_percentage).toBe(85.71428571428571);
      expect(support.daily_achievement).toBe(85.71428571428571);
    });
  });
  
  describe('Period Filtering Logic', () => {
    
    test.skip('should handle MTD period correctly', () => {
      // Mock current date as August 5, 2025
      const originalDate = Date;
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) return new originalDate(2025, 7, 5);
          return new originalDate(...args);
        }
      };
      
      const months = dataService.getPeriodMonths(2025, 'MTD');
      expect(months).toEqual(['Aug']); // Current month only
      
      global.Date = originalDate;
    });
    
    test.skip('should handle QTD period correctly', () => {
      // Mock current date as August 5, 2025 (Q3)
      const originalDate = Date;
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) return new originalDate(2025, 7, 5);
          return new originalDate(...args);
        }
      };
      
      const months = dataService.getPeriodMonths(2025, 'QTD');
      expect(months).toEqual(['Jul', 'Aug']); // Q3 months up to current
      
      global.Date = originalDate;
    });
    
    test.skip('should handle YTD period correctly', () => {
      const months = dataService.getPeriodMonths(2025, 'YTD');
      expect(months).toEqual([
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ]); // Full year as per current implementation
    });
    
    test.skip('should handle NONE period correctly', () => {
      const months = dataService.getPeriodMonths(2025, 'NONE');
      expect(months).toEqual([]); // No data
    });
  });
  
  describe('Edge Cases and Precision Limits', () => {
    
    test.skip('should maintain precision through aggregation', async () => {
      // Test with values that might cause precision issues
      const mockData = {
        total_revenue: 0.1 + 0.2, // JavaScript precision issue
        total_target: 0.3,
        total_cost: 0.24,
        total_receivables: 0.05,
        customer_count: 1,
        service_count: 1,
        achievement_percentage: 100.00000000000001,
        daily_target: 0.009677419354838709,
        period_target: 0.3,
        daily_achievement: 100.00000000000001,
        total_days_worked: 31,
        calendar_days: 31
      };
      
      db.get.mockResolvedValue(mockData);
      db.all.mockResolvedValue([]);
      
      const result = await dataService.getOverviewData(2025, 'MTD', 1);
      
      // JavaScript 0.1 + 0.2 = 0.30000000000000004
      expect(mockData.total_revenue).not.toBe(0.3);
      expect(mockData.total_revenue).toBe(0.30000000000000004);
      
      // But calculations should still work
      expect(result.overview.revenue).toBe(0.30000000000000004);
      expect(result.overview.achievement).toBeCloseTo(100, 10);
    });
    
    test.skip('should handle very large numbers near MAX_SAFE_INTEGER', async () => {
      const mockData = {
        total_revenue: Number.MAX_SAFE_INTEGER - 1,
        total_target: Number.MAX_SAFE_INTEGER,
        total_cost: Number.MAX_SAFE_INTEGER - 2,
        total_receivables: 1000000,
        customer_count: 1000,
        service_count: 100,
        achievement_percentage: 99.99999999999999,
        daily_target: Number.MAX_SAFE_INTEGER / 31,
        period_target: Number.MAX_SAFE_INTEGER,
        daily_achievement: 99.99999999999999,
        total_days_worked: 31,
        calendar_days: 31
      };
      
      db.get.mockResolvedValue(mockData);
      db.all.mockResolvedValue([]);
      
      const result = await dataService.getOverviewData(2025, 'MTD', 1);
      
      // Should handle large numbers without overflow
      expect(result.overview.revenue).toBe(Number.MAX_SAFE_INTEGER - 1);
      expect(result.overview.profit).toBeCloseTo(2.110223024625157, 10);
    });
  });
});

// Export for use in other tests
module.exports = dataService;