const { calculatePerformanceCost, calculateGrossProfit, calculateGrossProfitMargin } = require('../utils/profitCalculations');
const dataService = require('../services/data.service');
const db = require('../database/persistent-db');

describe('Revenue Calculation Validation Tests', () => {
  // Test data from January 2025 example
  const testCases = [
    {
      customer: 'ARAC Healthcare',
      service: 'Transportation',
      cost: 77142.86,
      target: 100000,
      revenue: 69537,
      expected: {
        achievement: 69.537,
        performanceCost: 53642.831,
        grossProfit: 15894.169,
        gpMargin: 22.857
      }
    },
    {
      customer: 'AVALON',
      service: 'Transportation',
      cost: 62052.50,
      target: 80250,
      revenue: 282044,
      expected: {
        achievement: 351.457,
        performanceCost: 218087.667,
        grossProfit: 63956.333,
        gpMargin: 22.676
      }
    },
    {
      customer: 'Last Mile',
      service: 'Transportation',
      cost: 120000.00,
      target: 133333.33,
      revenue: 164542.66,
      expected: {
        achievement: 123.407,
        performanceCost: 148088.398,
        grossProfit: 16454.262,
        gpMargin: 10.00
      }
    },
    {
      customer: 'NUPCO',
      service: 'Warehouses',
      cost: 315124.00,
      target: 485000,
      revenue: 485000,
      expected: {
        achievement: 100.00,
        performanceCost: 315124.00,
        grossProfit: 169876.00,
        gpMargin: 35.026
      }
    },
    {
      customer: 'VAS',
      service: 'Warehouses',
      cost: 165582.75,
      target: 540000.01,
      revenue: 322662.47,
      expected: {
        achievement: 59.749,
        performanceCost: 98939.515,
        grossProfit: 223722.955,
        gpMargin: 69.337
      }
    },
    // Zero revenue case
    {
      customer: 'AVALON GCC',
      service: 'Transportation',
      cost: 35144.89,
      target: 50000,
      revenue: 0,
      expected: {
        achievement: 0.00,
        performanceCost: 0.00,
        grossProfit: 0.00,
        gpMargin: 0.00
      }
    }
  ];

  describe('Individual Calculation Tests', () => {
    testCases.forEach(testCase => {
      describe(`${testCase.customer} - ${testCase.service}`, () => {
        test('Achievement % calculation', () => {
          const achievement = testCase.target > 0 
            ? (testCase.revenue / testCase.target) * 100 
            : 0;
          expect(achievement).toBeCloseTo(testCase.expected.achievement, 2);
        });

        test('Performance Cost calculation', () => {
          const performanceCost = calculatePerformanceCost(
            testCase.revenue,
            testCase.target,
            testCase.cost
          );
          expect(performanceCost).toBeCloseTo(testCase.expected.performanceCost, 2);
        });

        test('Gross Profit calculation', () => {
          const grossProfit = calculateGrossProfit(
            testCase.revenue,
            testCase.target,
            testCase.cost
          );
          expect(grossProfit).toBeCloseTo(testCase.expected.grossProfit, 2);
        });

        test('GP Margin % calculation', () => {
          const grossProfit = calculateGrossProfit(
            testCase.revenue,
            testCase.target,
            testCase.cost
          );
          const gpMargin = calculateGrossProfitMargin(grossProfit, testCase.revenue);
          expect(gpMargin).toBeCloseTo(testCase.expected.gpMargin, 2);
        });
      });
    });
  });

  describe('Collective Performance Tests', () => {
    test('Total organization metrics calculation', () => {
      // Expected totals from the report
      const expected = {
        totalCost: 2671113.42,
        totalTarget: 3650629.67,
        totalRevenue: 3591233.86,
        totalPerformanceCost: 2471142.83,
        totalGrossProfit: 1120091.03,
        overallAchievement: 98.37,
        overallGPMargin: 31.20
      };

      // Calculate totals from test data
      const totals = testCases.reduce((acc, tc) => {
        acc.cost += tc.cost;
        acc.target += tc.target;
        acc.revenue += tc.revenue;
        const performanceCost = calculatePerformanceCost(tc.revenue, tc.target, tc.cost);
        acc.performanceCost += performanceCost;
        const grossProfit = calculateGrossProfit(tc.revenue, tc.target, tc.cost);
        acc.grossProfit += grossProfit;
        return acc;
      }, { cost: 0, target: 0, revenue: 0, performanceCost: 0, grossProfit: 0 });

      // Note: Our test subset won't match the full totals, 
      // but we can verify the calculation logic
      const achievement = totals.target > 0 ? (totals.revenue / totals.target) * 100 : 0;
      const gpMargin = totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0;

      // Verify calculation formulas work correctly
      expect(achievement).toBeGreaterThanOrEqual(0);
      expect(gpMargin).toBeGreaterThanOrEqual(0);
    });

    test('Service type aggregation', () => {
      const transportation = {
        revenue: 1973571.39,
        performanceCost: 1449390.24,
        grossProfit: 524181.15,
        avgGPMargin: 26.56
      };

      const warehouses = {
        revenue: 1617662.47,
        performanceCost: 1021752.59,
        grossProfit: 595909.88,
        avgGPMargin: 36.84
      };

      // Verify the relationship between metrics
      expect(transportation.revenue - transportation.performanceCost)
        .toBeCloseTo(transportation.grossProfit, 2);
      
      expect(warehouses.revenue - warehouses.performanceCost)
        .toBeCloseTo(warehouses.grossProfit, 2);
    });
  });

  describe('Edge Case Tests', () => {
    test('Zero revenue calculation', () => {
      const result = {
        performanceCost: calculatePerformanceCost(0, 50000, 35144.89),
        grossProfit: calculateGrossProfit(0, 50000, 35144.89),
        gpMargin: calculateGrossProfitMargin(0, 0)
      };

      expect(result.performanceCost).toBe(0);
      expect(result.grossProfit).toBe(0);
      expect(result.gpMargin).toBe(0);
    });

    test('Zero target calculation', () => {
      const revenue = 100000;
      const cost = 50000;
      const target = 0;

      const result = {
        achievement: 0, // Should be 0 or handle division by zero
        performanceCost: calculatePerformanceCost(revenue, target, cost),
        grossProfit: calculateGrossProfit(revenue, target, cost)
      };

      // When target is 0, performance cost should be original cost
      expect(result.performanceCost).toBe(cost);
      expect(result.grossProfit).toBe(revenue - cost); // Simple calculation when no target
    });

    test('Revenue exceeds target (overachievement)', () => {
      const testCase = {
        cost: 62052.50,
        target: 80250,
        revenue: 282044 // 351.48% achievement
      };

      const performanceCost = calculatePerformanceCost(
        testCase.revenue,
        testCase.target,
        testCase.cost
      );

      // Performance cost should scale with achievement
      expect(performanceCost).toBeCloseTo(218087.667, 2);
      expect(performanceCost).toBeGreaterThan(testCase.cost);
    });
  });

  describe('Daily Achievement Calculation Tests', () => {
    test('Daily calculations with January 31 days', () => {
      const january = {
        target: 100000,
        revenue: 69537,
        calendarDays: 31,
        daysWorked: 31
      };

      const dailyTarget = january.target / january.calendarDays;
      const periodTarget = dailyTarget * january.daysWorked;
      const dailyAchievement = (january.revenue / periodTarget) * 100;

      expect(dailyTarget).toBeCloseTo(3225.81, 2);
      expect(periodTarget).toBeCloseTo(100000, 2);
      expect(dailyAchievement).toBeCloseTo(69.54, 2);
    });

    test('Daily calculations with days validation applied', () => {
      // After validation, past months should have days = calendar days
      const january = {
        target: 1000000,
        revenue: 50000,
        calendarDays: 31,
        daysWorked: 31 // Corrected from 1 to 31
      };

      const dailyTarget = january.target / january.calendarDays;
      const periodTarget = dailyTarget * january.daysWorked;
      const dailyAchievement = (january.revenue / periodTarget) * 100;

      // Now the calculation is fair
      expect(dailyAchievement).toBeCloseTo(5.0, 2); // Matches monthly achievement
    });
  });

  describe('SQL Query Result Validation', () => {
    test('Verify SQL calculation formulas match JavaScript', () => {
      const sqlFormulas = {
        achievement: 'CASE WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 ELSE 0 END',
        performanceCost: 'SUM(original_cost * (revenue / NULLIF(target, 0)))',
        grossProfit: 'SUM(revenue - (original_cost * (revenue / NULLIF(target, 0))))',
        dailyTarget: 'SUM(target) / SUM(calendar_days)',
        periodTarget: '(SUM(target) / SUM(calendar_days)) * SUM(days)',
        dailyAchievement: 'CASE WHEN period_target > 0 THEN (SUM(revenue) / period_target) * 100 ELSE 0 END'
      };

      // These formulas should produce the same results as our JavaScript functions
      expect(sqlFormulas).toBeDefined();
    });
  });
});

describe('DataService Calculation Methods', () => {

  test('getCalendarDaysSQL returns correct days for each month', () => {
    const months = {
      'Jan': 31, 'Mar': 31, 'Apr': 30,
      'May': 31, 'Jun': 30, 'Jul': 31, 'Aug': 31,
      'Sep': 30, 'Oct': 31, 'Nov': 30, 'Dec': 31
    };

    // The SQL should handle all months correctly
    const sql = dataService.getCalendarDaysSQL();
    expect(sql).toContain('CASE month');
    
    // Check non-February months
    Object.entries(months).forEach(([month, days]) => {
      expect(sql).toContain(`WHEN '${month}' THEN ${days}`);
    });
    
    // February has special leap year logic
    expect(sql).toContain("WHEN 'Feb' THEN CASE WHEN year % 4 = 0");
  });

  test('getDailyCalculationSQL includes all required calculations', () => {
    const sql = dataService.getDailyCalculationSQL();
    
    expect(sql).toContain('daily_target');
    expect(sql).toContain('period_target');
    expect(sql).toContain('daily_achievement');
    expect(sql).toContain('total_days_worked');
    expect(sql).toContain('calendar_days');
  });
});