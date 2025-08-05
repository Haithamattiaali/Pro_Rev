/**
 * Profit calculation utilities for backend
 * Updated formula: grossProfit = revenue - (revenue/target) * cost
 */

/**
 * Calculate gross profit using the new performance-based formula
 * @param {number} revenue - Actual revenue
 * @param {number} target - Target revenue
 * @param {number} cost - Total cost
 * @returns {number} Gross profit
 */
function calculateGrossProfit(revenue, target, cost) {
  // Handle edge cases
  if (!revenue || revenue === 0) return 0;
  if (!target || target === 0) {
    // When no target is set, use simple calculation
    return revenue - cost;
  }
  
  // New formula: revenue - (revenue/target) * cost
  const achievementRatio = revenue / target;
  const proportionalCost = achievementRatio * cost;
  return revenue - proportionalCost;
}

/**
 * Calculate gross profit margin as percentage
 * @param {number} grossProfit - Calculated gross profit
 * @param {number} revenue - Revenue base for margin calculation
 * @returns {number} Gross profit margin percentage
 */
function calculateGrossProfitMargin(grossProfit, revenue) {
  if (!revenue || revenue === 0) return 0;
  return (grossProfit / revenue) * 100;
}

module.exports = {
  calculateGrossProfit,
  calculateGrossProfitMargin
};