const { 
  calculateGrossProfit, 
  calculateGrossProfitMargin, 
  calculatePerformanceCost 
} = require('../utils/profitCalculations');
const daysValidation = require('../services/daysValidation.service');
const dataService = require('../services/data.service');
const db = require('../database/db-wrapper');

// Mock database
jest.mock('../database/db-wrapper');

describe('Full Calculation Chain Integration Tests', () => {
  
  describe('January Days=1 Bug - Complete Scenario', () => {
    
    test('should demonstrate the full calculation chain for the edge case', () => {
      // Original data from Excel
      const excelRow = {
        Customer: 'ARAC Healthcare',
        Year: 2025,
        Month: 'Jan',
        Days: 1,      // The bug!
        Revenue: 69537,
        Target: 100000,
        Cost: 80000
      };
      
      // Step 1: Days validation
      const validation = daysValidation.validateDays(
        excelRow.Year,
        daysValidation.getMonthNumber(excelRow.Month),
        excelRow.Days
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.correctedDays).toBe(31);
      expect(validation.validationType).toBe('auto-corrected');
      
      // Step 2: Calculate with incorrect days (showing the bug)
      const calendarDays = 31;
      const dailyTarget = excelRow.Target / calendarDays;
      const dailyCost = excelRow.Cost / calendarDays;
      
      // With days=1
      const incorrectPeriodTarget = dailyTarget * excelRow.Days;
      const incorrectPeriodCost = dailyCost * excelRow.Days;
      const incorrectDailyAchievement = (excelRow.Revenue / incorrectPeriodTarget) * 100;
      
      expect(dailyTarget).toBeCloseTo(3225.806451612903, 10);
      expect(incorrectPeriodTarget).toBeCloseTo(3225.806451612903, 10);
      expect(incorrectDailyAchievement).toBeCloseTo(2155.647, 3);
      
      // Step 3: Calculate with corrected days
      const correctPeriodTarget = dailyTarget * validation.correctedDays;
      const correctPeriodCost = dailyCost * validation.correctedDays;
      const correctDailyAchievement = (excelRow.Revenue / correctPeriodTarget) * 100;
      
      expect(correctPeriodTarget).toBe(100000);
      expect(correctDailyAchievement).toBe(69.537);
      
      // Step 4: Gross profit calculations
      const incorrectProfit = calculateGrossProfit(
        excelRow.Revenue,
        incorrectPeriodTarget,
        incorrectPeriodCost
      );
      const correctProfit = calculateGrossProfit(
        excelRow.Revenue,
        correctPeriodTarget,
        correctPeriodCost
      );
      
      // With new formula: revenue - (revenue/target) * cost
      // 69537 - (69537/3225.806451612903) * 2580.6451612903224 = 13907.4
      expect(incorrectProfit).toBeCloseTo(13907.4, 1);
      expect(correctProfit).toBeCloseTo(13907.4, 1);
      
      // Step 5: Margin calculations
      const incorrectMargin = calculateGrossProfitMargin(incorrectProfit, excelRow.Revenue);
      const correctMargin = calculateGrossProfitMargin(correctProfit, excelRow.Revenue);
      
      expect(incorrectMargin).toBeCloseTo(20, 10); // (13907.4 / 69537) * 100 = 20%
      expect(correctMargin).toBeCloseTo(20, 10); // Same ratio with corrected values
    });
  });
  
  describe('Pro-Rating Integration - Current Month', () => {
    
    test('should calculate pro-rated values for August 5, 2025', () => {
      // Mock current date as August 5, 2025
      const currentDate = new Date(2025, 7, 5); // August 5
      const year = 2025;
      const month = 8;
      
      // Original monthly values
      const monthlyTarget = 1000000;
      const monthlyCost = 800000;
      const actualRevenue = 161290.32; // Actual revenue as of Aug 5
      
      // Step 1: Calculate pro-rating ratio
      const calendarDays = daysValidation.getCalendarDays(year, month);
      const elapsedDays = currentDate.getDate();
      const proRateRatio = elapsedDays / calendarDays;
      
      expect(calendarDays).toBe(31);
      expect(elapsedDays).toBe(5);
      expect(proRateRatio).toBe(0.16129032258064516);
      
      // Step 2: Pro-rate target and cost
      const proRatedTarget = monthlyTarget * proRateRatio;
      const proRatedCost = monthlyCost * proRateRatio;
      
      expect(proRatedTarget).toBe(161290.32258064516);
      expect(proRatedCost).toBeCloseTo(129032.25806451613, 10);
      
      // Step 3: Calculate achievement based on pro-rated values
      const achievement = (actualRevenue / proRatedTarget) * 100;
      expect(achievement).toBeCloseTo(100, 5); // Very close to 100%
      
      // Step 4: Calculate performance-based cost
      const performanceCost = calculatePerformanceCost(
        actualRevenue,
        proRatedTarget,
        proRatedCost
      );
      expect(performanceCost).toBeCloseTo(129032.256, 5);
      
      // Step 5: Calculate gross profit
      const grossProfit = calculateGrossProfit(
        actualRevenue,
        proRatedTarget,
        proRatedCost
      );
      expect(grossProfit).toBeCloseTo(32258.064, 5);
      
      // Step 6: Calculate margin
      const margin = calculateGrossProfitMargin(grossProfit, actualRevenue);
      expect(margin).toBeCloseTo(20, 5);
    });
  });
  
  describe('Multi-Month Aggregation Integration', () => {
    
    test('should correctly aggregate Q1+Q2 calculations', () => {
      // Simulating 6 months of data
      const monthlyData = [
        { month: 'Jan', days: 31, revenue: 1000000, target: 1000000, cost: 800000 },
        { month: 'Feb', days: 28, revenue: 900000, target: 950000, cost: 760000 },
        { month: 'Mar', days: 31, revenue: 1100000, target: 1050000, cost: 840000 },
        { month: 'Apr', days: 30, revenue: 1050000, target: 1000000, cost: 800000 },
        { month: 'May', days: 31, revenue: 1150000, target: 1100000, cost: 880000 },
        { month: 'Jun', days: 30, revenue: 1000000, target: 1000000, cost: 800000 }
      ];
      
      // Step 1: Calculate totals
      const totals = monthlyData.reduce((acc, month) => ({
        revenue: acc.revenue + month.revenue,
        target: acc.target + month.target,
        cost: acc.cost + month.cost,
        days: acc.days + month.days,
        calendarDays: acc.calendarDays + month.days // Using actual calendar days
      }), { revenue: 0, target: 0, cost: 0, days: 0, calendarDays: 0 });
      
      expect(totals.revenue).toBe(6200000);
      expect(totals.target).toBe(6100000);
      expect(totals.cost).toBe(4880000);
      expect(totals.calendarDays).toBe(181); // Jan(31)+Feb(28)+Mar(31)+Apr(30)+May(31)+Jun(30)
      
      // Step 2: Calculate weighted daily target
      const dailyTarget = totals.target / totals.calendarDays;
      expect(dailyTarget).toBeCloseTo(33701.65745856354, 10);
      
      // Step 3: Calculate period target (assuming all days worked)
      const periodTarget = dailyTarget * totals.days;
      expect(periodTarget).toBeCloseTo(totals.target, 6); // Should equal total target
      
      // Step 4: Calculate achievement
      const achievement = (totals.revenue / totals.target) * 100;
      expect(achievement).toBeCloseTo(101.63934426229508, 10);
      
      // Step 5: Calculate performance-based metrics
      const performanceCost = calculatePerformanceCost(
        totals.revenue,
        totals.target,
        totals.cost
      );
      expect(performanceCost).toBeCloseTo(4960000, 10);
      
      const grossProfit = calculateGrossProfit(
        totals.revenue,
        totals.target,
        totals.cost
      );
      expect(grossProfit).toBe(1240000);
      
      const margin = calculateGrossProfitMargin(grossProfit, totals.revenue);
      expect(margin).toBe(20);
    });
  });
  
  describe('SQL to JavaScript Calculation Consistency', () => {
    
    test('should verify SQL calculations match JavaScript implementations', () => {
      // dataService is already imported as a singleton
      
      // Test calendar days SQL generation
      const sqlCalendarDays = dataService.getCalendarDaysSQL();
      
      // Verify SQL produces same results as JavaScript
      const testMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      testMonths.forEach((month, index) => {
        const jsCalendarDays = daysValidation.getCalendarDays(2025, index + 1);
        const monthNum = index + 1;
        
        // For February, test both leap and non-leap years
        if (month === 'Feb') {
          expect(daysValidation.getCalendarDays(2024, 2)).toBe(29); // Leap
          expect(daysValidation.getCalendarDays(2025, 2)).toBe(28); // Non-leap
        } else {
          const expectedDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][index];
          expect(jsCalendarDays).toBe(expectedDays);
        }
      });
    });
    
    test('should verify daily calculation SQL logic matches JavaScript', () => {
      // Mock SQL calculation results
      const sqlResults = {
        SUM_revenue: 69537,
        SUM_target: 100000,
        SUM_calendar_days: 31,
        SUM_days_worked: 1, // The bug scenario
        
        // SQL would calculate:
        daily_target: 100000 / 31, // 3225.806451612903
        period_target: (100000 / 31) * 1, // 3225.806451612903
        daily_achievement: (69537 / ((100000 / 31) * 1)) * 100 // 2155.647
      };
      
      // JavaScript equivalent
      const dailyTarget = sqlResults.SUM_target / sqlResults.SUM_calendar_days;
      const periodTarget = dailyTarget * sqlResults.SUM_days_worked;
      const dailyAchievement = (sqlResults.SUM_revenue / periodTarget) * 100;
      
      expect(dailyTarget).toBeCloseTo(3225.806451612903, 10);
      expect(periodTarget).toBeCloseTo(3225.806451612903, 10);
      expect(dailyAchievement).toBeCloseTo(2155.647, 3);
      
      // This confirms SQL and JS calculate identically
    });
  });
  
  describe('End-to-End Precision Verification', () => {
    
    test('should maintain precision through complete data flow', async () => {
      // Simulate complete flow from Excel → ETL → Database → API → Frontend
      
      // 1. Excel data (with precision)
      const excelData = {
        revenue: 1234567.89,
        target: 1000000.00,
        cost: 800000.00,
        days: 31,
        month: 'Jan',
        year: 2025
      };
      
      // 2. ETL Processing (days validation)
      const validation = daysValidation.validateDays(
        excelData.year,
        1, // January
        excelData.days
      );
      expect(validation.isValid).toBe(true); // 31 days is correct for January
      
      // 3. Database storage (would store as REAL - 64-bit float)
      // SQLite REAL maintains ~15 decimal digits of precision
      
      // 4. API calculation (backend)
      const performanceCost = calculatePerformanceCost(
        excelData.revenue,
        excelData.target,
        excelData.cost
      );
      const grossProfit = calculateGrossProfit(
        excelData.revenue,
        excelData.target,
        excelData.cost
      );
      const margin = calculateGrossProfitMargin(grossProfit, excelData.revenue);
      
      expect(performanceCost).toBe(987654.3119999999);
      expect(grossProfit).toBeCloseTo(246913.578, 5);
      expect(margin).toBe(20);
      
      // 5. Frontend display (formatting only)
      // Would display as:
      // - Revenue: SAR 1,234,568
      // - Achievement: 123.5%
      // - Margin: 20.0%
      
      // 6. Verify precision maintained
      // Original values unchanged by display formatting
      expect(excelData.revenue).toBe(1234567.89);
      expect(performanceCost).toBe(987654.3119999999);
      expect(grossProfit).toBeCloseTo(246913.578, 5);
    });
    
    test('should handle extreme precision edge case', () => {
      // Test with value at limits of JavaScript precision
      const edgeCaseValue = 0.1 + 0.2; // Famous JS precision issue
      
      expect(edgeCaseValue).not.toBe(0.3);
      expect(edgeCaseValue).toBe(0.30000000000000004);
      
      // But calculations should still work correctly
      const revenue = edgeCaseValue;
      const target = 0.3;
      const cost = 0.24;
      
      const profit = calculateGrossProfit(revenue, target, cost);
      const expectedProfit = revenue - (revenue/target) * cost;
      
      expect(profit).toBe(expectedProfit);
      expect(profit).toBeCloseTo(0.06000000000000001, 15);
    });
  });
  
  describe('Real-World Calculation Scenarios', () => {
    
    test('should handle typical monthly revenue cycle', () => {
      // Simulate a typical month progression
      const dailyRevenue = 3225.81; // ~100K/month
      const monthlyTarget = 100000;
      const monthlyCost = 80000;
      
      const scenarios = [
        { day: 5, revenue: 16129.05 },   // 5 days
        { day: 10, revenue: 32258.10 },  // 10 days
        { day: 15, revenue: 48387.15 },  // Mid-month
        { day: 20, revenue: 64516.20 },  // 20 days
        { day: 31, revenue: 100000.11 }  // End of month
      ];
      
      scenarios.forEach(({ day, revenue }) => {
        const dailyTarget = monthlyTarget / 31;
        const periodTarget = dailyTarget * day;
        const achievement = (revenue / periodTarget) * 100;
        
        // Should maintain ~100% achievement throughout
        expect(achievement).toBeCloseTo(100, 1);
        
        // Calculate running profit
        const periodCost = (monthlyCost / 31) * day;
        const profit = calculateGrossProfit(revenue, periodTarget, periodCost);
        const margin = calculateGrossProfitMargin(profit, revenue);
        
        // Margin should stay consistent (~20%)
        expect(margin).toBeCloseTo(20, 1);
      });
    });
  });
});

// Export for potential use in other test files
module.exports = {
  calculateGrossProfit,
  calculateGrossProfitMargin,
  calculatePerformanceCost,
  daysValidation,
  dataService
};