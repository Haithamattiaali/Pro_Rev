// Test file to verify calculation formulas match the documented formulas exactly

describe('Formula Validation Tests', () => {
  
  describe('Core Calculation Formulas', () => {
    test('Achievement % = (Revenue / Target) × 100', () => {
      const testCases = [
        { revenue: 69537, target: 100000, expected: 69.54 },
        { revenue: 282044, target: 80250, expected: 351.456698 },
        { revenue: 164542.66, target: 133333.33, expected: 123.41 },
        { revenue: 485000, target: 485000, expected: 100.00 },
        { revenue: 0, target: 50000, expected: 0.00 }
      ];

      testCases.forEach(({ revenue, target, expected }) => {
        const achievement = target > 0 ? (revenue / target) * 100 : 0;
        expect(achievement).toBeCloseTo(expected, 2);
      });
    });

    test('Performance Cost = Cost × (Revenue / Target)', () => {
      const testCases = [
        { cost: 77142.86, revenue: 69537, target: 100000, expected: 53642.831 },
        { cost: 62052.50, revenue: 282044, target: 80250, expected: 218087.667 },
        { cost: 120000.00, revenue: 164542.66, target: 133333.33, expected: 148088.398 },
        { cost: 315124.00, revenue: 485000, target: 485000, expected: 315124.00 },
        { cost: 35144.89, revenue: 0, target: 50000, expected: 0.00 }
      ];

      testCases.forEach(({ cost, revenue, target, expected }) => {
        const performanceCost = target > 0 ? cost * (revenue / target) : 0;
        expect(performanceCost).toBeCloseTo(expected, 2);
      });
    });

    test('Gross Profit = Revenue - Performance Cost', () => {
      const testCases = [
        { revenue: 69537, performanceCost: 53642.831, expected: 15894.169 },
        { revenue: 282044, performanceCost: 218087.667, expected: 63956.333 },
        { revenue: 164542.66, performanceCost: 148088.398, expected: 16454.262 },
        { revenue: 485000, performanceCost: 315124.00, expected: 169876.00 },
        { revenue: 322662.47, performanceCost: 98938.59, expected: 223723.88 }
      ];

      testCases.forEach(({ revenue, performanceCost, expected }) => {
        const grossProfit = revenue - performanceCost;
        expect(grossProfit).toBeCloseTo(expected, 2);
      });
    });

    test('Gross Profit Margin % = (Gross Profit / Revenue) × 100', () => {
      const testCases = [
        { grossProfit: 15894.169, revenue: 69537, expected: 22.857 },
        { grossProfit: 63956.333, revenue: 282044, expected: 22.676 },
        { grossProfit: 16454.27, revenue: 164542.66, expected: 10.00 },
        { grossProfit: 169876.00, revenue: 485000, expected: 35.026 },
        { grossProfit: 223723.88, revenue: 322662.47, expected: 69.337 }
      ];

      testCases.forEach(({ grossProfit, revenue, expected }) => {
        const gpMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        expect(gpMargin).toBeCloseTo(expected, 2);
      });
    });
  });

  describe('Collective Performance Formulas', () => {
    test('Revenue Efficiency = Revenue / Original Cost', () => {
      const totalRevenue = 3591233.86;
      const totalOriginalCost = 2671113.42;
      const revenueEfficiency = totalRevenue / totalOriginalCost;
      expect(revenueEfficiency).toBeCloseTo(1.34, 2);
    });

    test('Cost Efficiency = (Performance Cost / Original Cost) × 100', () => {
      const totalPerformanceCost = 2471142.83;
      const totalOriginalCost = 2671113.42;
      const costEfficiency = (totalPerformanceCost / totalOriginalCost) * 100;
      expect(costEfficiency).toBeCloseTo(92.51, 2);
    });

    test('Target Efficiency = Achievement of collective targets', () => {
      const totalRevenue = 3591233.86;
      const totalTarget = 3650629.67;
      const targetEfficiency = (totalRevenue / totalTarget) * 100;
      expect(targetEfficiency).toBeCloseTo(98.37, 2);
    });
  });

  describe('Service Type Aggregation', () => {
    test('Transportation services totals', () => {
      const transportation = {
        totalRevenue: 1973571.39,
        totalPerformanceCost: 1449390.24,
        totalGrossProfit: 524181.15,
        avgGPMargin: 26.56
      };

      // Verify gross profit calculation
      const calculatedProfit = transportation.totalRevenue - transportation.totalPerformanceCost;
      expect(calculatedProfit).toBeCloseTo(transportation.totalGrossProfit, 2);

      // Verify average GP margin
      const calculatedMargin = (transportation.totalGrossProfit / transportation.totalRevenue) * 100;
      expect(calculatedMargin).toBeCloseTo(transportation.avgGPMargin, 2);
    });

    test('Warehouse services totals', () => {
      const warehouses = {
        totalRevenue: 1617662.47,
        totalPerformanceCost: 1021752.59,
        totalGrossProfit: 595909.88,
        avgGPMargin: 36.84
      };

      // Verify gross profit calculation
      const calculatedProfit = warehouses.totalRevenue - warehouses.totalPerformanceCost;
      expect(calculatedProfit).toBeCloseTo(warehouses.totalGrossProfit, 2);

      // Verify average GP margin
      const calculatedMargin = (warehouses.totalGrossProfit / warehouses.totalRevenue) * 100;
      expect(calculatedMargin).toBeCloseTo(warehouses.avgGPMargin, 2);
    });
  });

  describe('Daily Achievement Formulas', () => {
    test('Daily Target = Monthly Target / Calendar Days', () => {
      const monthlyTarget = 100000;
      const calendarDays = 31; // January
      const dailyTarget = monthlyTarget / calendarDays;
      expect(dailyTarget).toBeCloseTo(3225.81, 2);
    });

    test('Period Target = Daily Target × Days Worked', () => {
      const dailyTarget = 3225.81;
      const daysWorked = 31;
      const periodTarget = dailyTarget * daysWorked;
      expect(periodTarget).toBeCloseTo(100000, 0); // Close to monthly target when all days worked
    });

    test('Daily Achievement = (Revenue / Period Target) × 100', () => {
      const revenue = 69537;
      const periodTarget = 100000;
      const dailyAchievement = (revenue / periodTarget) * 100;
      expect(dailyAchievement).toBeCloseTo(69.54, 2);
    });

    test('Edge case: January with 1 work day (before validation)', () => {
      const target = 1000000;
      const revenue = 50000;
      const calendarDays = 31;
      const daysWorked = 1;

      const dailyTarget = target / calendarDays;
      const periodTarget = dailyTarget * daysWorked;
      const dailyAchievement = (revenue / periodTarget) * 100;

      expect(dailyTarget).toBeCloseTo(32258.06, 2);
      expect(periodTarget).toBeCloseTo(32258.06, 2);
      expect(dailyAchievement).toBeCloseTo(155.0, 1); // Misleading high achievement
    });

    test('Edge case: January with corrected days (after validation)', () => {
      const target = 1000000;
      const revenue = 50000;
      const calendarDays = 31;
      const daysWorked = 31; // Corrected by validation

      const dailyTarget = target / calendarDays;
      const periodTarget = dailyTarget * daysWorked;
      const dailyAchievement = (revenue / periodTarget) * 100;

      expect(dailyTarget).toBeCloseTo(32258.06, 2);
      expect(periodTarget).toBeCloseTo(1000000, 1);
      expect(dailyAchievement).toBeCloseTo(5.0, 1); // Now matches monthly achievement
    });
  });

  describe('SQL Formula Equivalence', () => {
    test('SQL achievement formula matches JavaScript', () => {
      const sqlFormula = (revenue, target) => {
        // CASE WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 ELSE 0 END
        return target > 0 ? (revenue / target) * 100 : 0;
      };

      expect(sqlFormula(69537, 100000)).toBeCloseTo(69.54, 2);
      expect(sqlFormula(0, 50000)).toBe(0);
      expect(sqlFormula(100000, 0)).toBe(0);
    });

    test('SQL daily calculation formula matches JavaScript', () => {
      const sqlDailyCalc = (targets, calendarDays, daysWorked, revenues) => {
        // Simulating SQL aggregation
        const sumTargets = targets.reduce((a, b) => a + b, 0);
        const sumCalendarDays = calendarDays.reduce((a, b) => a + b, 0);
        const sumDaysWorked = daysWorked.reduce((a, b) => a + b, 0);
        const sumRevenues = revenues.reduce((a, b) => a + b, 0);

        const dailyTarget = sumCalendarDays > 0 ? sumTargets / sumCalendarDays : 0;
        const periodTarget = dailyTarget * sumDaysWorked;
        const dailyAchievement = periodTarget > 0 ? (sumRevenues / periodTarget) * 100 : 0;

        return { dailyTarget, periodTarget, dailyAchievement };
      };

      // Test with single month
      const single = sqlDailyCalc([100000], [31], [31], [69537]);
      expect(single.dailyTarget).toBeCloseTo(3225.81, 2);
      expect(single.periodTarget).toBeCloseTo(100000, 1);
      expect(single.dailyAchievement).toBeCloseTo(69.54, 2);

      // Test with multiple months
      const multi = sqlDailyCalc(
        [1000000, 900000], // targets
        [31, 28],          // calendar days
        [1, 20],           // days worked
        [50000, 800000]    // revenues
      );
      expect(multi.dailyTarget).toBeCloseTo(32203.39, 2);
      expect(multi.periodTarget).toBeCloseTo(676271.19, 2);
      expect(multi.dailyAchievement).toBeCloseTo(125.7, 1);
    });
  });
});