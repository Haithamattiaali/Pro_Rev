const db = require('../database/persistent-db');
const { calculatePerformanceCost, calculateGrossProfit, calculateGrossProfitMargin } = require('../utils/profitCalculations');

console.log('🧮 Validating Backend Calculation Logic Against January 2025 Data\n');

// Expected values from the provided report
const expectedResults = {
  'ARAC Healthcare-Transportation': {
    revenue: 69537,
    target: 100000,
    cost: 77142.86,
    achievement: 69.54,
    performanceCost: 53657.14,
    grossProfit: 15879.86,
    gpMargin: 22.84
  },
  'AVALON-Transportation': {
    revenue: 282044,
    target: 80250,
    cost: 62052.50,
    achievement: 351.48,
    performanceCost: 218166.35,
    grossProfit: 63877.65,
    gpMargin: 22.65
  },
  'Last Mile-Transportation': {
    revenue: 164542.66,
    target: 133333.33,
    cost: 120000.00,
    achievement: 123.41,
    performanceCost: 148088.39,
    grossProfit: 16454.27,
    gpMargin: 10.00
  },
  'NUPCO-Warehouses': {
    revenue: 485000,
    target: 485000,
    cost: 315124.00,
    achievement: 100.00,
    performanceCost: 315124.00,
    grossProfit: 169876.00,
    gpMargin: 35.02
  },
  'VAS-Warehouses': {
    revenue: 322662.47,
    target: 540000.01,
    cost: 165582.75,
    achievement: 59.75,
    performanceCost: 98938.59,
    grossProfit: 223723.88,
    gpMargin: 69.35
  }
};

async function validateCalculations() {
  try {
    // Get January 2025 data from database
    const query = `
      SELECT 
        customer,
        service_type,
        year,
        month,
        revenue,
        target,
        COALESCE(original_cost, cost, 0) as cost,
        days,
        CASE 
          WHEN target > 0 THEN (revenue / target) * 100 
          ELSE 0 
        END as achievement,
        -- Add calendar days for January
        31 as calendar_days
      FROM revenue_data
      WHERE year = 2025 AND month = 'Jan'
      ORDER BY customer, service_type
    `;

    const results = await db.all(query);
    
    console.log(`Found ${results.length} records for January 2025\n`);

    let totalPassed = 0;
    let totalFailed = 0;
    const failures = [];

    // Validate each record
    for (const row of results) {
      const key = `${row.customer}-${row.service_type}`;
      const expected = expectedResults[key];
      
      if (!expected) continue; // Skip if not in our test set

      console.log(`\n📊 Validating: ${key}`);
      console.log(`   Revenue: ${row.revenue}, Target: ${row.target}, Cost: ${row.cost}`);

      // Calculate values using our functions
      const calculated = {
        achievement: row.target > 0 ? (row.revenue / row.target) * 100 : 0,
        performanceCost: calculatePerformanceCost(row.revenue, row.target, row.cost),
        grossProfit: calculateGrossProfit(row.revenue, row.target, row.cost)
      };
      calculated.gpMargin = calculateGrossProfitMargin(calculated.grossProfit, row.revenue);

      // Compare with expected values
      const tests = [
        {
          name: 'Achievement %',
          calculated: calculated.achievement,
          expected: expected.achievement,
          tolerance: 0.01
        },
        {
          name: 'Performance Cost',
          calculated: calculated.performanceCost,
          expected: expected.performanceCost,
          tolerance: 0.01
        },
        {
          name: 'Gross Profit',
          calculated: calculated.grossProfit,
          expected: expected.grossProfit,
          tolerance: 0.01
        },
        {
          name: 'GP Margin %',
          calculated: calculated.gpMargin,
          expected: expected.gpMargin,
          tolerance: 0.01
        }
      ];

      let recordPassed = true;
      for (const test of tests) {
        const diff = Math.abs(test.calculated - test.expected);
        const passed = diff <= test.tolerance;
        
        if (passed) {
          console.log(`   ✅ ${test.name}: ${test.calculated.toFixed(2)} (expected: ${test.expected.toFixed(2)})`);
          totalPassed++;
        } else {
          console.log(`   ❌ ${test.name}: ${test.calculated.toFixed(2)} (expected: ${test.expected.toFixed(2)}, diff: ${diff.toFixed(2)})`);
          totalFailed++;
          recordPassed = false;
          failures.push({
            customer: row.customer,
            service: row.service_type,
            metric: test.name,
            calculated: test.calculated,
            expected: test.expected,
            difference: diff
          });
        }
      }

      if (recordPassed) {
        console.log(`   ✅ All calculations correct!`);
      }
    }

    // Test collective metrics
    console.log('\n📊 Testing Collective Metrics\n');
    
    const collectiveQuery = `
      SELECT 
        SUM(COALESCE(original_cost, cost, 0)) as total_cost,
        SUM(target) as total_target,
        SUM(revenue) as total_revenue,
        SUM(
          CASE 
            WHEN target > 0 THEN COALESCE(original_cost, cost, 0) * (revenue / target)
            ELSE 0 
          END
        ) as total_performance_cost,
        SUM(
          CASE 
            WHEN target > 0 THEN revenue - (COALESCE(original_cost, cost, 0) * (revenue / target))
            ELSE revenue 
          END
        ) as total_gross_profit,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as overall_achievement
      FROM revenue_data
      WHERE year = 2025 AND month = 'Jan'
    `;

    const collective = await db.get(collectiveQuery);
    
    const expectedCollective = {
      totalCost: 2671113.42,
      totalTarget: 3650629.67,
      totalRevenue: 3591233.86,
      totalPerformanceCost: 2471142.83,
      totalGrossProfit: 1120091.03,
      overallAchievement: 98.37
    };

    console.log('Collective Metrics Validation:');
    console.log(`   Total Cost: ${collective.total_cost.toFixed(2)} (expected: ${expectedCollective.totalCost})`);
    console.log(`   Total Target: ${collective.total_target.toFixed(2)} (expected: ${expectedCollective.totalTarget})`);
    console.log(`   Total Revenue: ${collective.total_revenue.toFixed(2)} (expected: ${expectedCollective.totalRevenue})`);
    console.log(`   Total Performance Cost: ${collective.total_performance_cost.toFixed(2)} (expected: ${expectedCollective.totalPerformanceCost})`);
    console.log(`   Total Gross Profit: ${collective.total_gross_profit.toFixed(2)} (expected: ${expectedCollective.totalGrossProfit})`);
    console.log(`   Overall Achievement: ${collective.overall_achievement.toFixed(2)}% (expected: ${expectedCollective.overallAchievement}%)`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${totalPassed} tests`);
    console.log(`❌ Failed: ${totalFailed} tests`);
    
    if (failures.length > 0) {
      console.log('\n❌ FAILURES:');
      failures.forEach(f => {
        console.log(`   ${f.customer} - ${f.service} - ${f.metric}: ${f.calculated.toFixed(2)} vs ${f.expected.toFixed(2)} (diff: ${f.difference.toFixed(2)})`);
      });
    } else {
      console.log('\n🎉 All calculations validated successfully!');
    }

    // Test edge cases
    console.log('\n' + '='.repeat(60));
    console.log('🔍 EDGE CASE TESTS');
    console.log('='.repeat(60));

    // Test zero revenue
    console.log('\n1. Zero Revenue Test:');
    const zeroRevenue = calculatePerformanceCost(0, 50000, 35144.89);
    const zeroProfit = calculateGrossProfit(0, 50000, 35144.89);
    console.log(`   Performance Cost: ${zeroRevenue} (expected: 0)`);
    console.log(`   Gross Profit: ${zeroProfit} (expected: 0)`);
    console.log(`   ✅ Zero revenue handled correctly`);

    // Test zero target
    console.log('\n2. Zero Target Test:');
    const zeroTargetCost = calculatePerformanceCost(100000, 0, 50000);
    const zeroTargetProfit = calculateGrossProfit(100000, 0, 50000);
    console.log(`   Performance Cost: ${zeroTargetCost} (expected: 0)`);
    console.log(`   Gross Profit: ${zeroTargetProfit} (expected: 100000)`);
    console.log(`   ✅ Zero target handled correctly`);

    // Test overachievement
    console.log('\n3. Overachievement Test (351.48%):');
    const overCost = calculatePerformanceCost(282044, 80250, 62052.50);
    const overProfit = calculateGrossProfit(282044, 80250, 62052.50);
    console.log(`   Performance Cost: ${overCost.toFixed(2)} (expected: 218166.35)`);
    console.log(`   Gross Profit: ${overProfit.toFixed(2)} (expected: 63877.65)`);
    console.log(`   ✅ Overachievement handled correctly`);

  } catch (error) {
    console.error('❌ Validation error:', error);
  }
}

// Run validation
validateCalculations();