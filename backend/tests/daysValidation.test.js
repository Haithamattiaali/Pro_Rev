const daysValidation = require('../services/daysValidation.service');

describe('Days Validation Service - Comprehensive Tests', () => {
  
  // Mock current date for consistent testing
  const originalDate = Date;
  
  beforeEach(() => {
    // Set current date to August 5, 2025 (Tuesday)
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate(2025, 7, 5); // August 5, 2025
        }
        return new originalDate(...args);
      }
      static now() {
        return new originalDate(2025, 7, 5).getTime();
      }
    };
  });
  
  afterEach(() => {
    global.Date = originalDate;
  });
  
  describe('getCalendarDays', () => {
    
    test('should return correct days for each month', () => {
      const monthDays = {
        1: 31,  // January
        2: 28,  // February (non-leap)
        3: 31,  // March
        4: 30,  // April
        5: 31,  // May
        6: 30,  // June
        7: 31,  // July
        8: 31,  // August
        9: 30,  // September
        10: 31, // October
        11: 30, // November
        12: 31  // December
      };
      
      Object.entries(monthDays).forEach(([month, expectedDays]) => {
        const result = daysValidation.getCalendarDays(2025, parseInt(month));
        expect(result).toBe(expectedDays);
      });
    });
    
    test('should handle February in leap years correctly', () => {
      // 2024 is a leap year
      expect(daysValidation.getCalendarDays(2024, 2)).toBe(29);
      
      // 2025 is not a leap year
      expect(daysValidation.getCalendarDays(2025, 2)).toBe(28);
      
      // 2000 was a leap year (divisible by 400)
      expect(daysValidation.getCalendarDays(2000, 2)).toBe(29);
      
      // 1900 was not a leap year (divisible by 100 but not 400)
      expect(daysValidation.getCalendarDays(1900, 2)).toBe(28);
    });
  });
  
  describe('isLeapYear', () => {
    
    test('should correctly identify leap years', () => {
      // Leap years
      expect(daysValidation.isLeapYear(2024)).toBe(true);
      expect(daysValidation.isLeapYear(2000)).toBe(true);
      expect(daysValidation.isLeapYear(2028)).toBe(true);
      expect(daysValidation.isLeapYear(1996)).toBe(true);
      
      // Not leap years
      expect(daysValidation.isLeapYear(2025)).toBe(false);
      expect(daysValidation.isLeapYear(1900)).toBe(false);
      expect(daysValidation.isLeapYear(2100)).toBe(false);
      expect(daysValidation.isLeapYear(2023)).toBe(false);
    });
    
    test('should handle edge cases', () => {
      // Year 0 (hypothetical)
      expect(daysValidation.isLeapYear(0)).toBe(true); // Divisible by 400
      
      // Negative years (BC)
      expect(daysValidation.isLeapYear(-4)).toBe(true);
      expect(daysValidation.isLeapYear(-100)).toBe(false);
    });
  });
  
  describe('getElapsedBusinessDays', () => {
    
    test('should calculate business days for current month (August 2025)', () => {
      // August 5, 2025 is a Tuesday
      // Business days: Aug 1 (Fri), Aug 4 (Mon), Aug 5 (Tue) = 3 days
      const result = daysValidation.getElapsedBusinessDays(2025, 8);
      expect(result).toBe(3);
    });
    
    test('should return null for past months', () => {
      const result = daysValidation.getElapsedBusinessDays(2025, 7); // July
      expect(result).toBeNull();
    });
    
    test('should return null for future months', () => {
      const result = daysValidation.getElapsedBusinessDays(2025, 9); // September
      expect(result).toBeNull();
    });
    
    test('should handle month boundaries correctly', () => {
      // Mock different current dates
      const testCases = [
        { date: new Date(2025, 0, 1), month: 1, expected: 1 },  // Jan 1 (Wed)
        { date: new Date(2025, 0, 31), month: 1, expected: 23 }, // Jan 31 (Fri)
        { date: new Date(2025, 3, 30), month: 4, expected: 22 }, // Apr 30 (Wed)
      ];
      
      testCases.forEach(({ date, month, expected }) => {
        global.Date = class extends Date {
          constructor(...args) {
            if (args.length === 0) return date;
            return new originalDate(...args);
          }
          static now() { return date.getTime(); }
        };
        
        const result = daysValidation.getElapsedBusinessDays(2025, month);
        expect(result).toBe(expected);
      });
    });
  });
  
  describe('validateDays', () => {
    
    describe('Past Months - Auto-correction', () => {
      
      test('should auto-correct January 2025 with days=1 to days=31', () => {
        const result = daysValidation.validateDays(2025, 1, 1);
        
        expect(result.isValid).toBe(false);
        expect(result.correctedDays).toBe(31);
        expect(result.validationType).toBe('auto-corrected');
        expect(result.message).toContain('Auto-corrected to 31');
        expect(result.requiresConfirmation).toBe(false);
      });
      
      test('should not correct if days already match calendar days', () => {
        const result = daysValidation.validateDays(2025, 1, 31);
        
        expect(result.isValid).toBe(true);
        expect(result.correctedDays).toBe(31);
        expect(result.validationType).toBe('none');
        expect(result.message).toBe('');
      });
      
      test('should handle February leap year correction', () => {
        const result = daysValidation.validateDays(2024, 2, 30);
        
        expect(result.isValid).toBe(false);
        expect(result.correctedDays).toBe(29); // Leap year
        expect(result.validationType).toBe('auto-corrected');
      });
    });
    
    describe('Current Month - Confirmation Required', () => {
      
      test('should require confirmation for current month variance', () => {
        // August 2025, expecting 3 business days elapsed
        const result = daysValidation.validateDays(2025, 8, 10);
        
        expect(result.isValid).toBe(true); // Not auto-corrected
        expect(result.requiresConfirmation).toBe(true);
        expect(result.validationType).toBe('current-month-variance');
        expect(result.suggestedDays).toBe(3);
        expect(result.message).toContain('3 business days have elapsed');
      });
      
      test('should not require confirmation if days match elapsed', () => {
        const result = daysValidation.validateDays(2025, 8, 3);
        
        expect(result.isValid).toBe(true);
        expect(result.requiresConfirmation).toBe(false);
        expect(result.validationType).toBe('none');
      });
    });
    
    describe('Future Months - Simulation Mode', () => {
      
      test('should mark future months as simulation', () => {
        const result = daysValidation.validateDays(2025, 9, 22);
        
        expect(result.requiresConfirmation).toBe(true);
        expect(result.validationType).toBe('future-simulation');
        expect(result.message).toContain('simulation/forecast');
        expect(result.suggestedDays).toBe(22); // Typical business days
      });
      
      test('should suggest maximum 22 days for future months', () => {
        const result = daysValidation.validateDays(2025, 12, 25);
        
        expect(result.suggestedDays).toBe(22);
      });
    });
  });
  
  describe('validateDataset', () => {
    
    test('should categorize records correctly', async () => {
      const records = [
        { customer: 'A', year: 2025, month: 'Jan', days: 1 },    // Error - needs correction
        { customer: 'B', year: 2025, month: 'Jan', days: 31 },   // Valid
        { customer: 'C', year: 2025, month: 'Aug', days: 10 },   // Confirmation needed
        { customer: 'D', year: 2025, month: 'Sep', days: 22 },   // Future - confirmation
        { customer: 'E', year: 2025, month: 'Feb', days: 30 },   // Error - needs correction
      ];
      
      const result = await daysValidation.validateDataset(records);
      
      expect(result.summary.total).toBe(5);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.errors).toBe(2);
      expect(result.summary.confirmationNeeded).toBe(2);
      expect(result.summary.warnings).toBe(0);
      
      // Check specific categorizations
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].customer).toBe('A');
      expect(result.errors[0].validation.correctedDays).toBe(31);
      
      expect(result.requiresConfirmation).toHaveLength(2);
      expect(result.requiresConfirmation[0].customer).toBe('C');
      expect(result.requiresConfirmation[0].validation.suggestedDays).toBe(3);
    });
    
    test('should handle empty dataset', async () => {
      const result = await daysValidation.validateDataset([]);
      
      expect(result.summary.total).toBe(0);
      expect(result.summary.valid).toBe(0);
      expect(result.summary.errors).toBe(0);
    });
  });
  
  describe('getMonthNumber', () => {
    
    test('should convert month names to numbers', () => {
      const monthMap = {
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
        'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
        'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
      };
      
      Object.entries(monthMap).forEach(([name, number]) => {
        expect(daysValidation.getMonthNumber(name)).toBe(number);
      });
    });
    
    test('should return 0 for invalid month names', () => {
      expect(daysValidation.getMonthNumber('Invalid')).toBe(0);
      expect(daysValidation.getMonthNumber('')).toBe(0);
      expect(daysValidation.getMonthNumber(null)).toBe(0);
    });
  });
  
  describe('applyUserDecisions', () => {
    
    test('should apply user decisions to records', () => {
      const records = [
        { customer: 'A', days: 10, validation: { suggestedDays: 3, message: 'Current month' } },
        { customer: 'B', days: 22, validation: { suggestedDays: 20, message: 'Future month' } },
        { customer: 'C', days: 15, validation: { suggestedDays: 3, message: 'Current month' } },
      ];
      
      const decisions = [
        { accepted: true },           // Keep original
        { useSuggested: true },       // Use suggested value
        { customValue: 5 },           // Custom override
      ];
      
      const result = daysValidation.applyUserDecisions(records, decisions);
      
      expect(result[0].days).toBe(10); // Accepted original
      expect(result[1].days).toBe(20); // Used suggested
      expect(result[2].days).toBe(5);  // Custom value
      
      // Check validation notes
      expect(result[0].validationNote).toContain('Current month');
      expect(result[1].validationNote).toContain('Changed from 22 to 20');
      expect(result[2].validationNote).toContain('User override: 5 days');
    });
  });
  
  describe('Edge Cases and Precision', () => {
    
    test('should handle month/year boundaries correctly', () => {
      // Using the mocked date from beforeEach (August 5, 2025)
      
      // July 2025 should be past month
      const julyResult = daysValidation.validateDays(2025, 7, 30);
      expect(julyResult.correctedDays).toBe(31);
      expect(julyResult.validationType).toBe('auto-corrected');
      
      // August 2025 should be current month (mocked as Aug 5)
      // getElapsedBusinessDays for Aug 5 would be 3 business days (Aug 1, 4, 5)
      const augResult = daysValidation.validateDays(2025, 8, 3);
      expect(augResult.requiresConfirmation).toBe(false); // 3 days matches elapsed
      
      // Test with different days to trigger confirmation
      const augResult2 = daysValidation.validateDays(2025, 8, 5);
      expect(augResult2.requiresConfirmation).toBe(true);
      expect(augResult2.validationType).toBe('current-month-variance');
    });
    
    test('should maintain integer precision for days', () => {
      // Days should always be integers
      const result = daysValidation.getCalendarDays(2025, 1);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBe(31);
      
      // Business days calculation should return integers
      const businessDays = daysValidation.getElapsedBusinessDays(2025, 8);
      expect(Number.isInteger(businessDays)).toBe(true);
    });
  });
});

// Export for integration testing
module.exports = daysValidation;