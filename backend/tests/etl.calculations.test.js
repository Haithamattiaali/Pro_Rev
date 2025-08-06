const etlService = require('../services/etl.service');
const daysValidation = require('../services/daysValidation.service');
const db = require('../database/db-wrapper');
const xlsx = require('xlsx');

// Mock dependencies
jest.mock('../database/db-wrapper');
jest.mock('../database/persistent-db', () => ({
  db: null,
  transaction: jest.fn(),
  isConnected: jest.fn(() => true),
  reconnect: jest.fn()
}));
jest.mock('xlsx');

describe('ETL Service - Calculation and Validation Tests', () => {
  
  beforeEach(() => {
    etlService.validationCorrections.clear();
    jest.clearAllMocks();
    
    // Mock current date as August 5, 2025
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 7, 5)); // August 5, 2025
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('validateAndCleanRow - Pro-rating Calculations', () => {
    
    test('should pro-rate current month values correctly', () => {
      const row = {
        Customer: 'Test Corp',
        Service_Type: 'Consulting',
        Year: 2025,
        Month: 'Aug',
        Days: 5,
        Revenue: 161290.32,
        Target: 1000000,
        Cost: 800000,
        'Receivables Collected': 20000
      };
      
      const result = etlService.validateAndCleanRow(row);
      
      // August 5, 2025 - 5 days elapsed out of 31
      const proRateRatio = 5 / 31;
      expect(proRateRatio).toBe(0.16129032258064516);
      
      // Verify pro-rated values
      expect(result.target).toBe(161290.32258064516); // Pro-rated
      expect(result.cost).toBeCloseTo(129032.25806451613, 10);   // Pro-rated
      expect(result.original_target).toBe(1000000);   // Original preserved
      expect(result.original_cost).toBe(800000);      // Original preserved
      expect(result.revenue).toBe(161290.32);         // Revenue not pro-rated
      
      // Verify days and calendar days
      expect(result.days).toBe(5);
      expect(result.calendar_days).toBe(31);
    });
    
    test('should NOT pro-rate past month values', () => {
      const row = {
        Customer: 'Test Corp',
        Service_Type: 'Consulting',
        Year: 2025,
        Month: 'Jul',
        Days: 31,
        Revenue: 1000000,
        Target: 1000000,
        Cost: 800000,
        'Receivables Collected': 100000
      };
      
      const result = etlService.validateAndCleanRow(row);
      
      // July is a past month - no pro-rating
      expect(result.target).toBe(1000000);       // Not pro-rated
      expect(result.cost).toBe(800000);          // Not pro-rated
      expect(result.original_target).toBe(1000000);
      expect(result.original_cost).toBe(800000);
    });
    
    test('should NOT pro-rate future month values', () => {
      const row = {
        Customer: 'Test Corp',
        Service_Type: 'Consulting',
        Year: 2025,
        Month: 'Sep',
        Days: 22,
        Revenue: 0,
        Target: 1000000,
        Cost: 800000,
        'Receivables Collected': 0
      };
      
      const result = etlService.validateAndCleanRow(row);
      
      // September is a future month - no pro-rating
      expect(result.target).toBe(1000000);       // Not pro-rated
      expect(result.cost).toBe(800000);          // Not pro-rated
    });
  });
  
  describe('Days Validation and Auto-correction', () => {
    
    test('should auto-correct January days=1 to days=31', async () => {
      // First, run validation
      const validationData = [{
        customer: 'ARAC Healthcare',
        service_type: 'Support',
        year: 2025,
        month: 'Jan',
        days: 1,
        revenue: 69537,
        target: 100000,
        cost: 80000
      }];
      
      const validation = await daysValidation.validateDataset(validationData);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0].validation.correctedDays).toBe(31);
      
      // Store corrections
      etlService.storeValidationCorrections(validation);
      
      // Now process the row
      const row = {
        Customer: 'ARAC Healthcare',
        Service_Type: 'Support',
        Year: 2025,
        Month: 'Jan',
        Days: 1,
        Revenue: 69537,
        Target: 100000,
        Cost: 80000,
        'Receivables Collected': 5000
      };
      
      const result = etlService.validateAndCleanRow(row);
      
      expect(result.days).toBe(31);              // Auto-corrected
      expect(result.wasCorrected).toBe(true);    // Marked as corrected
      expect(result.calendar_days).toBe(31);     // Calendar days for January
    });
    
    test('should auto-correct February days=30 to days=28 (non-leap year)', async () => {
      const validationData = [{
        customer: 'Test Corp',
        service_type: 'Consulting',
        year: 2025,
        month: 'Feb',
        days: 30,
        revenue: 90000,
        target: 100000,
        cost: 80000
      }];
      
      const validation = await daysValidation.validateDataset(validationData);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0].validation.correctedDays).toBe(28);
      
      etlService.storeValidationCorrections(validation);
      
      const row = {
        Customer: 'Test Corp',
        Service_Type: 'Consulting',
        Year: 2025,
        Month: 'Feb',
        Days: 30,
        Revenue: 90000,
        Target: 100000,
        Cost: 80000,
        'Receivables Collected': 8000
      };
      
      const result = etlService.validateAndCleanRow(row);
      
      expect(result.days).toBe(28);              // Auto-corrected
      expect(result.calendar_days).toBe(28);     // 2025 is not a leap year
    });
    
    test('should handle February in leap year correctly', () => {
      const row = {
        Customer: 'Test Corp',
        Service_Type: 'Consulting',
        Year: 2024,
        Month: 'Feb',
        Days: 29,
        Revenue: 90000,
        Target: 100000,
        Cost: 80000,
        'Receivables Collected': 8000
      };
      
      const result = etlService.validateAndCleanRow(row);
      
      expect(result.days).toBe(29);              // Correct for leap year
      expect(result.calendar_days).toBe(29);     // 2024 is a leap year
      expect(result.wasCorrected).toBe(false);   // No correction needed
    });
  });
  
  describe('validateRequiredFields', () => {
    
    test('should validate all required fields', () => {
      const validRow = {
        Customer: 'Test Corp',
        Year: 2025,
        Month: 'Jan',
        Days: 31,
        Revenue: 100000,
        Target: 100000,
        Cost: 80000
      };
      
      const result = etlService.validateRequiredFields(validRow);
      expect(result).not.toBeNull();
      expect(result.customer).toBe('Test Corp');
      expect(result.year).toBe(2025);
      expect(result.month).toBe('Jan');
      expect(result.days).toBe(31);
    });
    
    test('should reject row without customer', () => {
      const invalidRow = {
        Year: 2025,
        Month: 'Jan',
        Revenue: 100000
      };
      
      const result = etlService.validateRequiredFields(invalidRow);
      expect(result).toBeNull();
    });
    
    test('should handle different column name variations', () => {
      const rowVariations = {
        customer: 'Lower Case Customer',     // lowercase
        'Service Type': 'With Space',        // space instead of underscore
        year: '2025',                        // string year
        month: 'Jan',
        'Days ': '31',                       // trailing space
        revenue: '100000.50',
        target: '100000',
        cost: '80000'
      };
      
      const result = etlService.validateRequiredFields(rowVariations);
      expect(result).not.toBeNull();
      expect(result.customer).toBe('Lower Case Customer');
      expect(result.service_type).toBe('With Space');
      expect(result.year).toBe(2025);          // Converted to number
      expect(result.days).toBe(31);            // Converted to number
      expect(result.revenue).toBe(100000.5);   // Converted to float
    });
    
    test('should NOT default days to 30 when missing', () => {
      const rowWithoutDays = {
        Customer: 'Test Corp',
        Year: 2025,
        Month: 'Jan',
        Revenue: 100000,
        Target: 100000,
        Cost: 80000
      };
      
      const result = etlService.validateRequiredFields(rowWithoutDays);
      expect(result).not.toBeNull();
      expect(result.days).toBeNull(); // Should be null, not defaulted
    });
  });
  
  describe('Calculation Precision in ETL', () => {
    
    test('should maintain precision for parsed float values', () => {
      const row = {
        Customer: 'Precision Test',
        Service_Type: 'Testing',
        Year: 2025,
        Month: 'Jan',
        Days: 31,
        Revenue: '1234567.89',
        Target: '1000000.00',
        Cost: '800000.00',
        'Receivables Collected': '123456.78'
      };
      
      const result = etlService.validateAndCleanRow(row);
      
      expect(result).not.toBeNull();
      expect(result.revenue).toBe(1234567.89);
      expect(result.target).toBe(1000000);
      expect(result.cost).toBe(800000);
      expect(result.receivables_collected).toBe(123456.78);
    });
    
    test('should handle very small values', () => {
      const row = {
        Customer: 'Small Values Inc',
        Service_Type: 'Testing',
        Year: 2025,
        Month: 'Jan',
        Days: 31,
        Revenue: '0.01',
        Target: '0.02',
        Cost: '0.015',
        'Receivables Collected': '0.001'
      };
      
      const result = etlService.validateAndCleanRow(row);
      
      expect(result).not.toBeNull();
      expect(result.revenue).toBe(0.01);
      expect(result.target).toBe(0.02);
      expect(result.cost).toBe(0.015);
      expect(result.receivables_collected).toBe(0.001);
    });
    
    test('should handle edge case numeric strings', () => {
      const row = {
        Customer: 'Edge Cases Ltd',
        Service_Type: 'Testing',
        Year: 2025,
        Month: 'Jan',
        Days: '31.0',         // Float string for integer
        Revenue: '1,234.56',   // Comma-formatted
        Target: '$100,000',    // Currency formatted
        Cost: '80000.00',      // Normal
        'Receivables Collected': '  5000.5  ' // Whitespace
      };
      
      // Note: Current implementation doesn't handle comma/currency formatting
      // This test documents current behavior
      const result = etlService.validateAndCleanRow(row);
      
      expect(result).not.toBeNull();
      expect(result.days).toBe(31);
      // parseFloat('1,234.56') returns 1, not NaN
      expect(result.revenue).toBe(1);          // parseFloat stops at comma
      // parseFloat('$100,000') returns NaN which becomes 0
      expect(result.target).toBe(0);           // NaN converted to 0
      expect(result.cost).toBe(80000);
      expect(result.receivables_collected).toBe(5000.5);
    });
  });
  
  describe('Pro-rating Edge Cases', () => {
    
    test('should handle month boundaries correctly', () => {
      // Test on the last day of July (should NOT pro-rate)
      jest.setSystemTime(new Date(2025, 6, 31)); // July 31, 2025
      
      const julyRow = {
        Customer: 'Test Corp',
        Service_Type: 'Testing',
        Year: 2025,
        Month: 'Jul',
        Days: 31,
        Revenue: 1000000,
        Target: 1000000,
        Cost: 800000,
        'Receivables Collected': 100000
      };
      
      const julyResult = etlService.validateAndCleanRow(julyRow);
      expect(julyResult.target).toBe(1000000); // Not pro-rated
      
      // Test on the first day of August (should pro-rate)
      jest.setSystemTime(new Date(2025, 7, 1)); // August 1, 2025
      
      const augRow = {
        Customer: 'Test Corp',
        Service_Type: 'Testing',
        Year: 2025,
        Month: 'Aug',
        Days: 1,
        Revenue: 32258.06,
        Target: 1000000,
        Cost: 800000,
        'Receivables Collected': 3000
      };
      
      const augResult = etlService.validateAndCleanRow(augRow);
      const expectedProRate = 1 / 31;
      expect(augResult.target).toBe(1000000 * expectedProRate);
      expect(augResult.target).toBeCloseTo(32258.064516129032, 10);
    });
    
    test('should handle leap year February 29th pro-rating', () => {
      // Set date to February 29, 2024 (leap year)
      jest.setSystemTime(new Date(2024, 1, 29)); // Feb 29, 2024
      
      const row = {
        Customer: 'Leap Year Corp',
        Service_Type: 'Testing',
        Year: 2024,
        Month: 'Feb',
        Days: 29,
        Revenue: 1000000,
        Target: 1000000,
        Cost: 800000,
        'Receivables Collected': 100000
      };
      
      const result = etlService.validateAndCleanRow(row);
      
      // February 29 = all days elapsed, so full values
      expect(result.target).toBe(1000000);  // 29/29 = 100%
      expect(result.cost).toBe(800000);
      expect(result.calendar_days).toBe(29);
    });
  });
  
  describe('Bulk Insert Precision', () => {
    
    test('should maintain precision through bulk insert', async () => {
      const mockData = [
        {
          customer: 'Customer A',
          service_type: 'Service 1',
          year: 2025,
          month: 'Jan',
          cost: 987654.312,              // High precision
          target: 1234567.89,
          revenue: 1234567.89,
          receivables_collected: 123.456,
          days: 31,
          calendar_days: 31,
          original_cost: 987654.312,
          original_target: 1234567.89,
          wasCorrected: false
        }
      ];
      
      // Mock the database transaction - need to mock the persistent-db properly
      const mockStmt = {
        run: jest.fn().mockReturnValue({ changes: 1 })
      };
      
      // Mock the persistent-db module's db property
      const persistentDb = require('../database/persistent-db');
      persistentDb.db = {
        prepare: jest.fn().mockReturnValue(mockStmt)
      };
      persistentDb.transaction = jest.fn().mockImplementation((fn) => {
        return (data) => {
          fn(data);
          return { changes: data.length };
        };
      });
      
      const results = await etlService.insertData(mockData);
      
      // Verify the insert was called with precise values
      expect(mockStmt.run).toHaveBeenCalledWith(
        'Customer A',
        'Service 1',
        2025,
        'Jan',
        987654.312,        // Precision maintained
        1234567.89,        // Precision maintained
        1234567.89,        // Precision maintained
        123.456,           // Precision maintained
        31,
        987654.312,        // Original cost
        1234567.89         // Original target
      );
    });
  });
});

module.exports = etlService;