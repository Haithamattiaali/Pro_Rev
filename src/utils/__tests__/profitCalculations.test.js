import { describe, it, expect } from 'vitest';
import { 
  calculateGrossProfit, 
  calculateGrossProfitMargin, 
  calculatePerformanceCost,
  calculateGrossProfitLegacy 
} from '../profitCalculations';

describe('Frontend Profit Calculations - Precision Tests', () => {
  
  describe('calculateGrossProfit', () => {
    
    it('should maintain exact precision for normal calculations', () => {
      const revenue = 1234567.89;
      const target = 1000000;
      const cost = 800000;
      
      // Expected: revenue - (revenue/target) * cost
      // = 1234567.89 - (1234567.89/1000000) * 800000
      // = 1234567.89 - 987654.312
      // = 246913.578
      
      const result = calculateGrossProfit(revenue, target, cost);
      expect(result).toBeCloseTo(246913.578, 2);
    });
    
    it('should handle edge case when target is 0', () => {
      const revenue = 100000;
      const target = 0;
      const cost = 80000;
      
      // Should fallback to simple calculation
      const result = calculateGrossProfit(revenue, target, cost);
      expect(result).toBe(20000);
    });
    
    it('should handle edge case when revenue is 0', () => {
      const revenue = 0;
      const target = 100000;
      const cost = 80000;
      
      const result = calculateGrossProfit(revenue, target, cost);
      expect(result).toBe(0);
    });
    
    it('should handle null/undefined inputs safely', () => {
      expect(calculateGrossProfit(null, 100000, 80000)).toBe(0);
      expect(calculateGrossProfit(undefined, 100000, 80000)).toBe(0);
      expect(calculateGrossProfit(100000, null, 80000)).toBe(20000);
      expect(calculateGrossProfit(100000, undefined, 80000)).toBe(20000);
      expect(calculateGrossProfit(100000, 100000, null)).toBe(100000);
      expect(calculateGrossProfit(100000, 100000, undefined)).toBe(100000);
    });
    
    it('should handle string inputs that can be converted', () => {
      const result = calculateGrossProfit('100000', '100000', '80000');
      expect(result).toBe(20000);
    });
    
    it('should handle negative values correctly', () => {
      const revenue = -50000; // Loss scenario
      const target = 100000;
      const cost = 80000;
      
      // Expected: -50000 - (-50000/100000) * 80000
      // = -50000 - (-0.5) * 80000
      // = -50000 + 40000
      // = -10000
      
      const result = calculateGrossProfit(revenue, target, cost);
      expect(result).toBe(-10000);
    });
    
    it('should handle very small values with precision', () => {
      const revenue = 0.0000001; // 1e-7
      const target = 0.0000002;  // 2e-7
      const cost = 0.00000015;   // 1.5e-7
      
      // Expected: 0.0000001 - (0.5) * 0.00000015 = 0.000000025
      const result = calculateGrossProfit(revenue, target, cost);
      expect(result).toBeCloseTo(0.000000025, 15);
    });
    
    it('should handle the January days=1 edge case scenario', () => {
      // Simulating the bug scenario
      const revenue = 69537;
      const periodTarget = 3225.806451612903; // Daily target * 1 day
      const periodCost = 2580.6451612903226;   // Daily cost * 1 day
      
      const result = calculateGrossProfit(revenue, periodTarget, periodCost);
      
      // This would give misleading profit margins
      const achievementRatio = revenue / periodTarget; // 21.556470000000002
      expect(achievementRatio).toBeCloseTo(21.556470000000002, 10);
      
      // Versus correct calculation with full month
      const monthlyResult = calculateGrossProfit(revenue, 100000, 80000);
      expect(monthlyResult).toBeCloseTo(14074.4, 1); // Much more reasonable
    });
    
    it('should verify precision with React state values', () => {
      // Simulating values that might come from React state
      const stateValues = {
        revenue: 5678901.23,
        target: 6000000,
        cost: 4800000
      };
      
      const result = calculateGrossProfit(
        stateValues.revenue,
        stateValues.target,
        stateValues.cost
      );
      
      // Expected: 5678901.23 - (5678901.23/6000000) * 4800000
      // = 5678901.23 - 4543120.984
      // = 1135780.246
      
      expect(result).toBeCloseTo(1135780.246, 2);
    });
  });
  
  describe('calculateGrossProfitMargin', () => {
    
    it('should calculate margin percentage with full precision', () => {
      const grossProfit = 246913.578;
      const revenue = 1234567.89;
      
      // Expected: (246913.578 / 1234567.89) * 100
      const result = calculateGrossProfitMargin(grossProfit, revenue);
      expect(result).toBeCloseTo(20.0, 1);
    });
    
    it('should handle zero revenue', () => {
      const result = calculateGrossProfitMargin(1000, 0);
      expect(result).toBe(0);
    });
    
    it('should handle negative margins', () => {
      const grossProfit = -50000;
      const revenue = 100000;
      
      const result = calculateGrossProfitMargin(grossProfit, revenue);
      expect(result).toBe(-50);
    });
    
    it('should handle very small percentages', () => {
      const grossProfit = 0.01;
      const revenue = 1000000;
      
      const result = calculateGrossProfitMargin(grossProfit, revenue);
      expect(result).toBe(0.000001);
    });
    
    it('should maintain precision for display rounding edge cases', () => {
      // Values that round differently when displayed
      const testCases = [
        { profit: 69.537, revenue: 100, expected: 69.537 },      // Displays as 69.5%
        { profit: 69.567, revenue: 100, expected: 69.567 },      // Displays as 69.6%
        { profit: 99.949, revenue: 100, expected: 99.949 },      // Displays as 99.9%
        { profit: 99.951, revenue: 100, expected: 99.951 },      // Displays as 100.0%
        { profit: 0.049, revenue: 100, expected: 0.049 },        // Displays as 0.0%
        { profit: 0.051, revenue: 100, expected: 0.051 },        // Displays as 0.1%
      ];
      
      testCases.forEach(({ profit, revenue, expected }) => {
        const result = calculateGrossProfitMargin(profit, revenue);
        expect(result).toBeCloseTo(expected, 10);
      });
    });
  });
  
  describe('calculatePerformanceCost', () => {
    
    it('should calculate performance cost with exact precision', () => {
      const revenue = 1234567.89;
      const target = 1000000;
      const originalCost = 800000;
      
      // Expected: (1234567.89 / 1000000) * 800000 = 987654.312
      const result = calculatePerformanceCost(revenue, target, originalCost);
      expect(result).toBeCloseTo(987654.312, 2);
    });
    
    it('should handle zero values correctly', () => {
      expect(calculatePerformanceCost(0, 100000, 80000)).toBe(0);
      expect(calculatePerformanceCost(100000, 0, 80000)).toBe(80000);
      expect(calculatePerformanceCost(100000, 100000, 0)).toBe(0);
    });
    
    it('should handle overachievement scenarios', () => {
      const revenue = 1500000; // 150% of target
      const target = 1000000;
      const originalCost = 800000;
      
      const result = calculatePerformanceCost(revenue, target, originalCost);
      expect(result).toBe(1200000); // 150% of cost
    });
    
    it('should handle underachievement scenarios', () => {
      const revenue = 500000; // 50% of target
      const target = 1000000;
      const originalCost = 800000;
      
      const result = calculatePerformanceCost(revenue, target, originalCost);
      expect(result).toBe(400000); // 50% of cost
    });
    
    it('should maintain precision for pro-rated values', () => {
      // August 5th pro-rating example
      const elapsedDays = 5;
      const calendarDays = 31;
      const proRateRatio = elapsedDays / calendarDays;
      
      const originalTarget = 1000000;
      const originalCost = 800000;
      
      const proRatedTarget = originalTarget * proRateRatio;
      const proRatedCost = originalCost * proRateRatio;
      
      expect(proRateRatio).toBeCloseTo(0.1613, 4);
      expect(proRatedTarget).toBeCloseTo(161290.32, 2);
      expect(proRatedCost).toBeCloseTo(129032.26, 2);
      
      // If revenue equals pro-rated target, performance cost should equal pro-rated cost
      const result = calculatePerformanceCost(proRatedTarget, proRatedTarget, proRatedCost);
      expect(result).toBe(proRatedCost);
    });
  });
  
  describe('calculateGrossProfitLegacy', () => {
    
    it('should use simple subtraction (deprecated)', () => {
      const target = 100000;
      const cost = 80000;
      
      const result = calculateGrossProfitLegacy(target, cost);
      expect(result).toBe(20000);
    });
    
    it('should not consider revenue in legacy calculation', () => {
      // Legacy formula ignores actual performance
      const result1 = calculateGrossProfitLegacy(100000, 80000);
      const result2 = calculateGrossProfitLegacy(100000, 80000);
      
      expect(result1).toBe(result2);
      expect(result1).toBe(20000);
    });
  });
  
  describe('React Component Integration Scenarios', () => {
    
    it('should handle values from FilterContext state', () => {
      // Simulating multi-select filter state
      const multiSelectData = {
        revenue: 12345678.90,
        target: 10000000,
        cost: 8000000
      };
      
      const performanceCost = calculatePerformanceCost(
        multiSelectData.revenue,
        multiSelectData.target,
        multiSelectData.cost
      );
      
      const grossProfit = calculateGrossProfit(
        multiSelectData.revenue,
        multiSelectData.target,
        multiSelectData.cost
      );
      
      const margin = calculateGrossProfitMargin(grossProfit, multiSelectData.revenue);
      
      expect(performanceCost).toBeCloseTo(9876543.12, 2);
      expect(grossProfit).toBeCloseTo(2469135.78, 2);
      expect(margin).toBeCloseTo(19.999999991843, 10);
    });
    
    it('should handle formatted string inputs from forms', () => {
      // User might input formatted values
      const formInputs = {
        revenue: '1,234,567.89',
        target: '1,000,000',
        cost: '800,000'
      };
      
      // Parse formatted strings
      const parseFormatted = (str) => parseFloat(str.replace(/,/g, ''));
      
      const result = calculateGrossProfit(
        parseFormatted(formInputs.revenue),
        parseFormatted(formInputs.target),
        parseFormatted(formInputs.cost)
      );
      
      expect(result).toBeCloseTo(246913.578, 2);
    });
  });
  
  describe('Precision Edge Cases', () => {
    
    it('should handle Number.MAX_SAFE_INTEGER calculations', () => {
      const maxSafe = Number.MAX_SAFE_INTEGER;
      const revenue = maxSafe - 1;
      const target = maxSafe;
      const cost = maxSafe - 2;
      
      const result = calculateGrossProfit(revenue, target, cost);
      expect(result).toBeCloseTo(1, 1);
    });
    
    it('should demonstrate JavaScript 0.1 + 0.2 precision issue', () => {
      const revenue = 0.3;
      const target = 0.1 + 0.2; // Actually 0.30000000000000004
      const cost = 0.1;
      
      expect(target).not.toBe(0.3);
      expect(target).toBe(0.30000000000000004);
      
      const result = calculateGrossProfit(revenue, target, cost);
      expect(result).toBeCloseTo(0.19999999999999998, 15); // Due to floating point precision
    });
    
    it('should handle Number.EPSILON precision differences', () => {
      const revenue = 1;
      const target = 1 + Number.EPSILON;
      const cost = 1;
      
      const result = calculateGrossProfit(revenue, target, cost);
      expect(result).not.toBe(0);
      expect(result).toBeCloseTo(2.220446049250313e-16, 20);
    });
    
    it('should verify precision is maintained through calculation chain', () => {
      const revenue = 123456789.123456789;
      const target = 100000000;
      const cost = 80000000;
      
      // Step 1: Performance cost
      const perfCost = calculatePerformanceCost(revenue, target, cost);
      expect(perfCost).toBeCloseTo(98765431.29876544, 6);
      
      // Step 2: Gross profit
      const grossProfit = calculateGrossProfit(revenue, target, cost);
      expect(grossProfit).toBeCloseTo(24691357.824691355, 6);
      
      // Step 3: Verify relationship
      expect(grossProfit).toBeCloseTo(revenue - perfCost, 10);
      
      // Step 4: Margin
      const margin = calculateGrossProfitMargin(grossProfit, revenue);
      expect(margin).toBeCloseTo(19.999999999999993, 12);
    });
  });
});