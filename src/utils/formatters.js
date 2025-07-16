export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`
}

export const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value)
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