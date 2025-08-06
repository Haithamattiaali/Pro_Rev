import { describe, it, expect, vi, beforeEach } from 'vitest'
import dataService from './dataService'
import apiService from './api.service'

// Mock the API service
vi.mock('./api.service', () => ({
  default: {
    getOverviewData: vi.fn(),
    getBusinessUnitData: vi.fn(),
    getCustomerData: vi.fn(),
    getMonthlyTrends: vi.fn(),
    getAvailableYears: vi.fn(),
    getForecastData: vi.fn(),
    generateForecast: vi.fn()
  }
}))

describe('DataService', () => {
  beforeEach(() => {
    // Clear cache before each test
    dataService.clearCache()
    vi.clearAllMocks()
  })

  describe('caching functionality', () => {
    it('should cache data after first request', async () => {
      const mockData = { revenue: 100000, target: 120000 }
      apiService.getOverviewData.mockResolvedValueOnce(mockData)

      // First call - should hit API
      const result1 = await dataService.getOverviewData(2025, 'YTD')
      expect(apiService.getOverviewData).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(mockData)

      // Second call - should use cache
      const result2 = await dataService.getOverviewData(2025, 'YTD')
      expect(apiService.getOverviewData).toHaveBeenCalledTimes(1) // No additional call
      expect(result2).toEqual(mockData)
    })

    it('should use different cache keys for different parameters', async () => {
      const mockData1 = { revenue: 100000 }
      const mockData2 = { revenue: 50000 }
      
      apiService.getOverviewData
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2)

      const result1 = await dataService.getOverviewData(2025, 'YTD')
      const result2 = await dataService.getOverviewData(2025, 'MTD')

      expect(apiService.getOverviewData).toHaveBeenCalledTimes(2)
      expect(result1).toEqual(mockData1)
      expect(result2).toEqual(mockData2)
    })

    it('should clear cache when clearCache is called', async () => {
      const mockData = { revenue: 100000 }
      apiService.getOverviewData.mockResolvedValue(mockData)

      // First call
      await dataService.getOverviewData(2025, 'YTD')
      expect(apiService.getOverviewData).toHaveBeenCalledTimes(1)

      // Clear cache
      dataService.clearCache()

      // Second call - should hit API again
      await dataService.getOverviewData(2025, 'YTD')
      expect(apiService.getOverviewData).toHaveBeenCalledTimes(2)
    })
  })

  describe('data formatting methods', () => {
    it('should format currency correctly', () => {
      // Note: Intl.NumberFormat may use non-breaking spaces
      const result1 = dataService.formatCurrency(1234567)
      expect(result1).toMatch(/SAR[\s\u00A0]1,234,567/)
      
      const result2 = dataService.formatCurrency(0)
      expect(result2).toMatch(/SAR[\s\u00A0]0/)
      
      const result3 = dataService.formatCurrency(null)
      expect(result3).toMatch(/SAR[\s\u00A0]0/)
    })

    it('should format percentage correctly', () => {
      expect(dataService.formatPercentage(85.456)).toBe('85.5%')
      expect(dataService.formatPercentage(0)).toBe('0.0%')
      expect(dataService.formatPercentage(null)).toBe('0.0%')
    })

    it('should calculate achievement percentage', () => {
      expect(dataService.calculateAchievement(85, 100)).toBe(85)
      expect(dataService.calculateAchievement(120, 100)).toBe(120)
      expect(dataService.calculateAchievement(0, 100)).toBe(0)
      expect(dataService.calculateAchievement(100, 0)).toBe(0)
      expect(dataService.calculateAchievement(100, null)).toBe(0)
    })
  })

  describe('period methods', () => {
    it('should get correct period label', () => {
      expect(dataService.getPeriodLabel('MTD')).toBe('Month to Date')
      expect(dataService.getPeriodLabel('QTD')).toBe('Quarter to Date')
      expect(dataService.getPeriodLabel('YTD')).toBe('Year to Date')
      expect(dataService.getPeriodLabel('CUSTOM')).toBe('CUSTOM')
    })

    it('should get current period correctly', () => {
      const currentPeriod = dataService.getCurrentPeriod()
      const now = new Date()
      
      expect(currentPeriod.year).toBe(now.getFullYear())
      expect(currentPeriod.month).toBe(now.getMonth() + 1)
      expect(currentPeriod.quarter).toBe(Math.ceil((now.getMonth() + 1) / 3))
    })

    it('should get period months correctly for YTD', () => {
      const months = dataService.getPeriodMonths(2025, 'YTD')
      expect(months).toContain('Jan')
      expect(months.length).toBeGreaterThan(0)
    })

    it('should get period months correctly for MTD', () => {
      const months = dataService.getPeriodMonths(2025, 'MTD', 3)
      expect(months).toEqual(['Mar'])
    })

    it('should get period months correctly for QTD', () => {
      const months = dataService.getPeriodMonths(2025, 'QTD', null, 2)
      expect(months).toEqual(['Apr', 'May', 'Jun'])
    })
  })

  describe('API method wrappers', () => {
    it('should call getBusinessUnitData with correct parameters', async () => {
      const mockData = [{ name: 'Transportation', revenue: 100000 }]
      apiService.getBusinessUnitData.mockResolvedValueOnce(mockData)

      const result = await dataService.getBusinessUnitData(2025, 'MTD', 6)
      
      expect(apiService.getBusinessUnitData).toHaveBeenCalledWith(2025, 'MTD', 6, null, null)
      expect(result).toEqual(mockData)
    })

    it('should call getCustomerData with correct parameters', async () => {
      const mockData = [{ customer: 'Customer A', revenue: 50000 }]
      apiService.getCustomerData.mockResolvedValueOnce(mockData)

      const result = await dataService.getCustomerData(2025, 'QTD', null, 2)
      
      expect(apiService.getCustomerData).toHaveBeenCalledWith(2025, 'QTD', null, 2, null)
      expect(result).toEqual(mockData)
    })

    it('should call getMonthlyTrends with service type filter', async () => {
      const mockData = [{ month: 'Jan', revenue: 100000 }]
      apiService.getMonthlyTrends.mockResolvedValueOnce(mockData)

      const result = await dataService.getMonthlyTrends(2025, 'Transportation')
      
      expect(apiService.getMonthlyTrends).toHaveBeenCalledWith(2025, 'Transportation')
      expect(result).toEqual(mockData)
    })
  })

  describe('forecast methods', () => {
    it('should generate forecast and clear cache', async () => {
      const mockForecast = { forecast: [{ month: 'Jul', revenue: 110000 }] }
      apiService.generateForecast.mockResolvedValueOnce(mockForecast)

      // Test with legacy year parameter
      const result = await dataService.generateForecast(2025)
      
      expect(apiService.generateForecast).toHaveBeenCalledWith(2025)
      expect(result).toEqual(mockForecast)
      
      // Test with new params object
      const params = {
        historicalStart: new Date('2025-01-01'),
        historicalEnd: new Date('2025-06-30'),
        forecastStart: new Date('2025-07-01'),
        forecastEnd: new Date('2025-12-31'),
        method: 'linear'
      }
      apiService.generateForecast.mockResolvedValueOnce(mockForecast)
      const result2 = await dataService.generateForecast(params)
      
      expect(apiService.generateForecast).toHaveBeenCalledWith(params)
      expect(result2).toEqual(mockForecast)
    })

    it('should get forecast data with caching', async () => {
      const mockData = { forecast: [] }
      apiService.getForecastData.mockResolvedValueOnce(mockData)

      // Test with legacy year parameter
      await dataService.getForecastData(2025)
      // Second call - should use cache
      await dataService.getForecastData(2025)
      
      expect(apiService.getForecastData).toHaveBeenCalledTimes(1)
      expect(apiService.getForecastData).toHaveBeenCalledWith({ year: 2025 })
      
      // Clear mocks for next test
      apiService.getForecastData.mockClear()
      
      // Test with new params object
      const params = {
        historicalStart: new Date('2025-01-01'),
        historicalEnd: new Date('2025-06-30'),
        forecastStart: new Date('2025-07-01'),
        forecastEnd: new Date('2025-12-31'),
        method: 'linear'
      }
      apiService.getForecastData.mockResolvedValueOnce(mockData)
      
      await dataService.getForecastData(params)
      expect(apiService.getForecastData).toHaveBeenCalledWith(params)
    })
  })
})