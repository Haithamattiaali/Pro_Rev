import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dataService from '../dataService';
import { api } from '../api.service';

// Mock the API service
vi.mock('../api.service', () => ({
  api: {
    get: vi.fn()
  }
}));

describe('DataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cache before each test
    dataService.clearCache();
  });

  describe('Cache Management', () => {
    it('should cache API responses', async () => {
      const mockData = { revenue: 1000 };
      api.get.mockResolvedValueOnce(mockData);

      // First call - should hit API
      const result1 = await dataService.getOverviewData(2025, 'month', 1);
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockData);

      // Second call - should use cache
      const result2 = await dataService.getOverviewData(2025, 'month', 1);
      expect(api.get).toHaveBeenCalledTimes(1); // Still 1, not called again
      expect(result2).toEqual(mockData);
    });

    it('should generate correct cache keys', () => {
      const key1 = dataService.getCacheKey('overview', { year: 2025, period: 'month', month: 1 });
      const key2 = dataService.getCacheKey('overview', { year: 2025, period: 'month', month: 2 });
      
      expect(key1).not.toBe(key2);
      expect(key1).toContain('overview');
      expect(key1).toContain('2025');
    });

    it('should clear cache on demand', async () => {
      const mockData = { revenue: 1000 };
      api.get.mockResolvedValue(mockData);

      // First call
      await dataService.getOverviewData(2025, 'month', 1);
      expect(api.get).toHaveBeenCalledTimes(1);

      // Clear cache
      dataService.clearCache();

      // Second call - should hit API again
      await dataService.getOverviewData(2025, 'month', 1);
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Overview Data', () => {
    it('should fetch overview data with correct parameters', async () => {
      const mockData = {
        revenue: 1000,
        target: 1200,
        achievement: 83.33
      };
      api.get.mockResolvedValueOnce(mockData);

      const result = await dataService.getOverviewData(2025, 'quarter', null, 2);
      
      expect(api.get).toHaveBeenCalledWith('/overview/2025', {
        period: 'quarter',
        month: null,
        quarter: 2
      });
      expect(result).toEqual(mockData);
    });

    it('should handle API errors gracefully', async () => {
      api.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(dataService.getOverviewData(2025, 'month', 1))
        .rejects.toThrow('API Error');
    });
  });

  describe('Business Units Data', () => {
    it('should fetch business units data', async () => {
      const mockData = [
        { unit: 'Unit A', revenue: 500 },
        { unit: 'Unit B', revenue: 600 }
      ];
      api.get.mockResolvedValueOnce(mockData);

      const result = await dataService.getBusinessUnits(2025, 'year');
      
      expect(api.get).toHaveBeenCalledWith('/business-units/2025', {
        period: 'year',
        month: undefined,
        quarter: undefined
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('Customers Data', () => {
    it('should fetch customers data with filters', async () => {
      const mockData = [
        { customer: 'Customer A', revenue: 300 },
        { customer: 'Customer B', revenue: 400 }
      ];
      api.get.mockResolvedValueOnce(mockData);

      const result = await dataService.getCustomers(2025, 'month', 3);
      
      expect(api.get).toHaveBeenCalledWith('/customers/2025', {
        period: 'month',
        month: 3,
        quarter: undefined
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('Trends Data', () => {
    it('should fetch monthly trends', async () => {
      const mockData = {
        months: ['Jan', 'Feb', 'Mar'],
        revenue: [1000, 1100, 1200],
        target: [1000, 1000, 1000]
      };
      api.get.mockResolvedValueOnce(mockData);

      const result = await dataService.getMonthlyTrends(2025);
      
      expect(api.get).toHaveBeenCalledWith('/trends/monthly/2025');
      expect(result).toEqual(mockData);
    });
  });

  describe('Validation Data', () => {
    it('should fetch analysis validation data', async () => {
      const mockData = {
        hasJanData: true,
        lastDataMonth: 6,
        missingMonths: []
      };
      api.get.mockResolvedValueOnce(mockData);

      const result = await dataService.getAnalysisValidation(2025);
      
      expect(api.get).toHaveBeenCalledWith('/analysis-validation/2025');
      expect(result).toEqual(mockData);
    });
  });

  describe('Period Mapping', () => {
    it('should correctly map period parameters', () => {
      // Month period
      const monthParams = dataService.getPeriodParams('month', 3, null);
      expect(monthParams).toEqual({ period: 'month', month: 3 });

      // Quarter period
      const quarterParams = dataService.getPeriodParams('quarter', null, 2);
      expect(quarterParams).toEqual({ period: 'quarter', quarter: 2 });

      // Year period
      const yearParams = dataService.getPeriodParams('year', null, null);
      expect(yearParams).toEqual({ period: 'year' });
    });
  });

  describe('Error Handling', () => {
    it('should propagate API errors with context', async () => {
      const apiError = new Error('Network timeout');
      api.get.mockRejectedValueOnce(apiError);

      try {
        await dataService.getOverviewData(2025, 'month', 1);
      } catch (error) {
        expect(error.message).toBe('Network timeout');
      }
    });

    it('should handle invalid parameters', async () => {
      // Test with invalid year
      await expect(dataService.getOverviewData('invalid', 'month', 1))
        .rejects.toThrow();
    });
  });
});
