import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercentage, formatNumber } from '../formatters';

describe('Formatters - Precision and Rounding Tests', () => {
  
  describe('formatPercentage - Precision Tests', () => {
    
    it('should round using toFixed(1) rules (round half away from zero)', () => {
      // Test rounding boundaries
      const testCases = [
        { input: 69.44, expected: '69.4%' },   // Round down
        { input: 69.45, expected: '69.5%' },   // Round up (exact half)
        { input: 69.46, expected: '69.5%' },   // Round up
        { input: 69.54, expected: '69.5%' },   // Round down
        { input: 69.55, expected: '69.6%' },   // Round up (exact half)
        { input: 69.56, expected: '69.6%' },   // Round up
        { input: 99.94, expected: '99.9%' },   // Round down
        { input: 99.95, expected: '100.0%' },  // Round up (exact half)
        { input: 99.96, expected: '100.0%' },  // Round up
      ];
      
      testCases.forEach(({ input, expected }) => {
        expect(formatPercentage(input)).toBe(expected);
      });
    });
    
    it('should maintain precision from calculation results', () => {
      // Simulating actual calculation results with full precision
      const calculationResults = [
        { input: 69.53700000000001, expected: '69.5%' },     // Common float precision
        { input: 2155.6470000000001, expected: '2155.6%' },  // January days=1 bug
        { input: 0.0499999999999, expected: '0.0%' },        // Just under 0.05
        { input: 0.0500000000001, expected: '0.1%' },        // Just over 0.05
      ];
      
      calculationResults.forEach(({ input, expected }) => {
        expect(formatPercentage(input)).toBe(expected);
      });
    });
    
    it('should handle negative percentages correctly', () => {
      expect(formatPercentage(-23.44)).toBe('-23.4%');
      expect(formatPercentage(-23.45)).toBe('-23.5%');
      expect(formatPercentage(-23.46)).toBe('-23.5%');
      expect(formatPercentage(-0.049)).toBe('-0.0%');
      expect(formatPercentage(-0.051)).toBe('-0.1%');
    });
    
    it('should handle very large percentages', () => {
      expect(formatPercentage(999.94)).toBe('999.9%');
      expect(formatPercentage(999.95)).toBe('1000.0%');
      expect(formatPercentage(12345.67)).toBe('12345.7%');
      expect(formatPercentage(Number.MAX_SAFE_INTEGER)).toBe('9007199254740991.0%');
    });
    
    it('should handle very small percentages near zero', () => {
      const testCases = [
        { input: 0.001, expected: '0.0%' },
        { input: 0.049, expected: '0.0%' },
        { input: 0.050, expected: '0.1%' },
        { input: 0.051, expected: '0.1%' },
        { input: 0.149, expected: '0.1%' },
        { input: 0.150, expected: '0.2%' },
      ];
      
      testCases.forEach(({ input, expected }) => {
        expect(formatPercentage(input)).toBe(expected);
      });
    });
  });
  
  describe('formatCurrency - Precision Tests', () => {
    
    it('should round to nearest integer (no decimal places)', () => {
      const testCases = [
        { input: 1234567.49, expected: 'SAR 1,234,567' },  // Round down
        { input: 1234567.50, expected: 'SAR 1,234,568' },  // Round up (exact half)
        { input: 1234567.51, expected: 'SAR 1,234,568' },  // Round up
        { input: 1234567.89, expected: 'SAR 1,234,568' },  // Round up
        { input: 0.49, expected: 'SAR 0' },                // Round down
        { input: 0.50, expected: 'SAR 1' },                // Round up
      ];
      
      testCases.forEach(({ input, expected }) => {
        expect(formatCurrency(input)).toBe(expected);
      });
    });
    
    it('should handle negative currency values', () => {
      expect(formatCurrency(-5000.49)).toBe('-SAR 5,000');
      expect(formatCurrency(-5000.50)).toBe('-SAR 5,001');
      expect(formatCurrency(-5000.51)).toBe('-SAR 5,001');
      expect(formatCurrency(-0.49)).toBe('-SAR 0');
      expect(formatCurrency(-0.50)).toBe('-SAR 1');
    });
    
    it('should format very large currency values', () => {
      expect(formatCurrency(9007199254740990.99)).toBe('SAR 9,007,199,254,740,991');
      expect(formatCurrency(Number.MAX_SAFE_INTEGER)).toBe('SAR 9,007,199,254,740,991');
    });
    
    it('should handle calculation results with full precision', () => {
      // Simulating gross profit calculation results
      const grossProfitResults = [
        { input: 246913.57799999998, expected: 'SAR 246,914' },
        { input: 1135780.246, expected: 'SAR 1,135,780' },
        { input: 14138.806451612904, expected: 'SAR 14,139' },
        { input: 34768.5, expected: 'SAR 34,769' },
      ];
      
      grossProfitResults.forEach(({ input, expected }) => {
        expect(formatCurrency(input)).toBe(expected);
      });
    });
    
    it('should handle pro-rated values correctly', () => {
      // August 5th pro-rating examples
      const proRatedValues = [
        { input: 161290.32258064516, expected: 'SAR 161,290' },
        { input: 129032.25806451613, expected: 'SAR 129,032' },
        { input: 32258.064516129032, expected: 'SAR 32,258' },
      ];
      
      proRatedValues.forEach(({ input, expected }) => {
        expect(formatCurrency(input)).toBe(expected);
      });
    });
  });
  
  describe('formatNumber - Precision Tests', () => {
    
    it('should preserve all decimal places', () => {
      const testCases = [
        { input: 1234567.89, expected: '1,234,567.89' },
        { input: 0.123456789, expected: '0.123456789' },
        { input: 1000.00, expected: '1,000' },  // Trailing zeros removed
        { input: 1000.10, expected: '1,000.1' },
        { input: 1000.001, expected: '1,000.001' },
      ];
      
      testCases.forEach(({ input, expected }) => {
        expect(formatNumber(input)).toBe(expected);
      });
    });
    
    it('should handle very precise decimal values', () => {
      const precisonValues = [
        { input: 0.0000001, expected: '0.0000001' },
        { input: 0.000000025, expected: '0.000000025' },
        { input: 3.141592653589793, expected: '3.141592653589793' },
        { input: 2.718281828459045, expected: '2.718281828459045' },
      ];
      
      precisonValues.forEach(({ input, expected }) => {
        expect(formatNumber(input)).toBe(expected);
      });
    });
    
    it('should add thousand separators without affecting precision', () => {
      expect(formatNumber(1234567890.123456789)).toBe('1,234,567,890.123457');
      expect(formatNumber(9007199254740991)).toBe('9,007,199,254,740,991');
    });
  });
  
  describe('Display vs Calculation Precision', () => {
    
    it('should demonstrate display formatting does not affect calculation values', () => {
      // Original calculation value
      const calculatedAchievement = 69.53700000000001;
      const calculatedProfit = 1234567.8901234567;
      const calculatedMargin = 20.000000032374674;
      
      // Display formatting
      const displayAchievement = formatPercentage(calculatedAchievement);
      const displayProfit = formatCurrency(calculatedProfit);
      const displayMargin = formatPercentage(calculatedMargin);
      
      // Verify display values
      expect(displayAchievement).toBe('69.5%');
      expect(displayProfit).toBe('SAR 1,234,568');
      expect(displayMargin).toBe('20.0%');
      
      // Original values remain unchanged
      expect(calculatedAchievement).toBe(69.53700000000001);
      expect(calculatedProfit).toBe(1234567.8901234567);
      expect(calculatedMargin).toBe(20.000000032374674);
    });
    
    it('should handle edge cases that expose rounding differences', () => {
      // Values that are exactly on rounding boundaries
      const edgeCases = [
        { 
          value: 99.95,
          percentage: '100.0%',
          currency: 'SAR 100',
          number: '99.95'
        },
        {
          value: 0.05,
          percentage: '0.1%',
          currency: 'SAR 0',
          number: '0.05'
        },
        {
          value: 0.5,
          percentage: '0.5%',
          currency: 'SAR 1',
          number: '0.5'
        },
        {
          value: -0.5,
          percentage: '-0.5%',
          currency: '-SAR 1',
          number: '-0.5'
        }
      ];
      
      edgeCases.forEach(({ value, percentage, currency, number }) => {
        expect(formatPercentage(value)).toBe(percentage);
        expect(formatCurrency(value)).toBe(currency);
        expect(formatNumber(value)).toBe(number);
      });
    });
  });
  
  describe('Special Values Handling', () => {
    
    it('should handle -0 (negative zero)', () => {
      expect(formatCurrency(-0)).toBe('SAR 0');
      expect(formatPercentage(-0)).toBe('0.0%');
      expect(formatNumber(-0)).toBe('0');
      
      // Verify -0 is normalized to 0
      expect(Object.is(formatCurrency(-0), formatCurrency(0))).toBe(true);
    });
    
    it('should verify Intl.NumberFormat behavior', () => {
      // Test that Intl.NumberFormat rounds as expected
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      
      expect(formatter.format(1234.49)).toBe('SAR 1,234');
      expect(formatter.format(1234.50)).toBe('SAR 1,235');
      expect(formatter.format(1234.51)).toBe('SAR 1,235');
    });
    
    it('should verify toFixed behavior', () => {
      // JavaScript toFixed uses "round half away from zero"
      expect((69.45).toFixed(1)).toBe('69.5');
      expect((69.55).toFixed(1)).toBe('69.6');
      expect((-69.45).toFixed(1)).toBe('-69.5');
      expect((-69.55).toFixed(1)).toBe('-69.6');
      
      // Not banker's rounding (which would round 0.5 to nearest even)
      expect((0.5).toFixed(0)).toBe('1'); // Not '0' (banker's would give 0)
      expect((1.5).toFixed(0)).toBe('2'); // Not '2' (banker's would give 2)
      expect((2.5).toFixed(0)).toBe('3'); // Not '2' (banker's would give 2)
    });
  });
});