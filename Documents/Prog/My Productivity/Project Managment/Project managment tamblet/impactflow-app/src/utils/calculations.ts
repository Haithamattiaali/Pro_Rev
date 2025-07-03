import { Task, CriticalityLevel, TaskStatus, TaskAgility, HealthIndicator } from '@/types/project'

export function calculateImpactScore(task: Partial<Task>): number {
  try {
    // Base calculations
    const duration = task.duration || 0
    const durationWeight = Math.min((duration / 40) * 25, 25)

    // Dependency count
    const depCount = task.dependencies?.length || 0
    const dependencyWeight = Math.min(depCount * 5, 30)

    // Criticality weight
    const criticalityWeights: Record<CriticalityLevel, number> = {
      [CriticalityLevel.CRITICAL]: 20,
      [CriticalityLevel.HIGH]: 15,
      [CriticalityLevel.MEDIUM]: 10,
      [CriticalityLevel.LOW]: 5,
      [CriticalityLevel.MINIMAL]: 2,
    }
    const criticalityWeight = criticalityWeights[task.criticalityLevel || CriticalityLevel.MEDIUM]

    // Timeline position weight (simplified)
    const timelineWeight = 15

    // Milestone bonus
    const milestoneBonus = task.milestone ? 15 : 0

    // Budget impact (logarithmic)
    const budget = task.costBudget || 0
    const budgetWeight = budget > 0 ? Math.min(Math.log10(budget + 1) / 6 * 10, 10) : 0

    // Calculate base score
    let baseScore = durationWeight + dependencyWeight + criticalityWeight + 
                   timelineWeight + milestoneBonus + budgetWeight

    // Apply multipliers
    const blockingMultiplier = task.blockingTasks?.length ? 1.5 : 1.0
    const parallelMultiplier = task.agility === TaskAgility.PARALLEL ? 0.7 : 1.0
    
    let statusMultiplier = 1.0
    if (task.status === TaskStatus.DELAYED) statusMultiplier = 1.3
    else if (task.status === TaskStatus.BLOCKED) statusMultiplier = 1.8

    const criticalPathMultiplier = task.criticalPath ? 1.4 : 1.0

    // Final score
    const impactScore = Math.round(
      baseScore * blockingMultiplier * parallelMultiplier * 
      statusMultiplier * criticalPathMultiplier
    )

    return Math.min(impactScore, 100)
  } catch (error) {
    console.error('Error calculating impact score:', error)
    return 50 // Default score
  }
}

export function calculateRiskScore(task: Partial<Task>): number {
  try {
    // Base risk from status
    let statusRisk = 0
    if (task.status === TaskStatus.BLOCKED) statusRisk = 30
    else if (task.status === TaskStatus.DELAYED) statusRisk = 20
    else if (task.status === TaskStatus.ON_HOLD) statusRisk = 15

    // Progress risk
    let progressRisk = 0
    const progress = task.percentComplete || 0
    if (progress < 50 && task.status === TaskStatus.IN_PROGRESS) progressRisk = 20
    else if (progress < 80 && task.status === TaskStatus.IN_PROGRESS) progressRisk = 10

    // Float risk
    let floatRisk = 0
    const totalFloat = task.totalFloat || 0
    if (totalFloat < 0) floatRisk = 25
    else if (totalFloat < 3) floatRisk = 15

    // Performance risk
    let performanceRisk = 0
    if (task.spi && task.spi < 0.8) performanceRisk += 20
    if (task.cpi && task.cpi < 0.9) performanceRisk += 15

    // Criticality multiplier
    const criticalityMultipliers: Record<CriticalityLevel, number> = {
      [CriticalityLevel.CRITICAL]: 1.5,
      [CriticalityLevel.HIGH]: 1.2,
      [CriticalityLevel.MEDIUM]: 1.0,
      [CriticalityLevel.LOW]: 0.8,
      [CriticalityLevel.MINIMAL]: 0.5,
    }
    const criticalityMultiplier = 
      criticalityMultipliers[task.criticalityLevel || CriticalityLevel.MEDIUM]

    // Calculate total risk
    const totalRisk = (statusRisk + progressRisk + floatRisk + performanceRisk) * criticalityMultiplier

    return Math.min(Math.round(totalRisk), 100)
  } catch (error) {
    console.error('Error calculating risk score:', error)
    return 0
  }
}

export function calculateHealthIndicator(task: Partial<Task>): HealthIndicator {
  try {
    if (task.status === TaskStatus.COMPLETE) return HealthIndicator.GREEN
    if (task.status === TaskStatus.CANCELLED) return HealthIndicator.BLACK

    const riskScore = task.riskScore || calculateRiskScore(task)

    if (task.status === TaskStatus.BLOCKED || riskScore > 80) return HealthIndicator.RED
    if (task.status === TaskStatus.DELAYED || riskScore > 60) return HealthIndicator.ORANGE
    if (riskScore > 40 || (task.percentComplete! < 80 && task.status === TaskStatus.IN_PROGRESS)) {
      return HealthIndicator.YELLOW
    }

    return HealthIndicator.GREEN
  } catch (error) {
    console.error('Error calculating health indicator:', error)
    return HealthIndicator.YELLOW
  }
}

export function calculatePriorityScore(impactScore: number, riskScore: number): number {
  return Math.round(impactScore * 0.6 + riskScore * 0.4)
}

export function calculateProjectHealth(tasks: Task[]): number {
  if (!tasks.length) return 0

  const completeTasks = tasks.filter(t => t.status === TaskStatus.COMPLETE).length
  const atRiskTasks = tasks.filter(t => t.riskScore > 40).length
  const totalTasks = tasks.length

  const avgProgress = tasks.reduce((sum, t) => sum + t.percentComplete, 0) / totalTasks
  const avgSpi = tasks.reduce((sum, t) => sum + (t.spi || 1), 0) / totalTasks
  const avgCpi = tasks.reduce((sum, t) => sum + (t.cpi || 1), 0) / totalTasks

  const progressScore = avgProgress
  const scheduleScore = Math.min(avgSpi * 100, 100)
  const budgetScore = Math.min(avgCpi * 100, 100)
  const riskScore = Math.max(0, 100 - (atRiskTasks / totalTasks * 100))

  const overallHealth = Math.round(
    progressScore * 0.3 + scheduleScore * 0.25 + 
    budgetScore * 0.25 + riskScore * 0.2
  )

  return overallHealth
}

export function calculateWeightedProgress(tasks: Task[], parentId: string): number {
  const childTasks = tasks.filter(t => t.parentId === parentId)
  if (!childTasks.length) return 0

  let totalWeight = 0
  let weightedSum = 0

  childTasks.forEach(task => {
    const weight = task.impactScore || 50
    totalWeight += weight
    weightedSum += task.percentComplete * weight
  })

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

export function getDaysUntil(date: Date): number {
  const now = new Date()
  const target = new Date(date)
  const diffTime = target.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getHealthColor(health: HealthIndicator): string {
  const colors: Record<HealthIndicator, string> = {
    [HealthIndicator.GREEN]: '#27AE60',
    [HealthIndicator.YELLOW]: '#F39C12',
    [HealthIndicator.ORANGE]: '#FF8C00',
    [HealthIndicator.RED]: '#E74C3C',
    [HealthIndicator.BLACK]: '#000000',
  }
  return colors[health]
}