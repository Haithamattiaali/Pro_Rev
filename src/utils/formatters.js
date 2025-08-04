export const formatCurrency = (value) => {
  // Handle null, undefined, or non-numeric values
  const numValue = value == null ? 0 : Number(value);
  
  // Handle NaN and Infinity cases
  if (!isFinite(numValue)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

export const formatPercentage = (value) => {
  // Handle null, undefined, or non-numeric values
  const numValue = value == null ? 0 : Number(value);
  
  // Handle NaN and Infinity cases
  if (!isFinite(numValue)) {
    return '0.0%';
  }
  
  return `${numValue.toFixed(1)}%`;
}

export const formatNumber = (value) => {
  // Handle null, undefined, or non-numeric values
  const numValue = value == null ? 0 : Number(value);
  
  // Handle NaN and Infinity cases
  if (!isFinite(numValue)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US').format(numValue);
}

export const getAchievementStatus = (percentage) => {
  if (percentage >= 100) return 'high'
  if (percentage >= 80) return 'medium'
  return 'low'
}

export const getGrossProfitStatus = (percentage) => {
  if (percentage >= 35) return 'high'
  if (percentage >= 25) return 'medium'
  return 'low'
}