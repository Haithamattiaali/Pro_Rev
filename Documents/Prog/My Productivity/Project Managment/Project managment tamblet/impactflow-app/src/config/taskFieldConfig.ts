import { Task } from '@/types/project'

export interface TaskFieldConfig {
  key: keyof Task
  label: string
  category: 'basic' | 'dates' | 'assignment' | 'metrics' | 'financial' | 'dependencies' | 'custom'
  defaultVisible: boolean
  width?: string
  minWidth?: string
  maxWidth?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  tooltip?: string
  priority?: 'high' | 'medium' | 'low'
  collapsible?: boolean
  group?: string
}

export const TASK_FIELD_CONFIGS: TaskFieldConfig[] = [
  // Basic Information
  {
    key: 'name',
    label: 'Task Name',
    category: 'basic',
    defaultVisible: true,
    minWidth: '200px',
    sortable: true,
    priority: 'high',
    collapsible: false
  },
  {
    key: 'wbsCode',
    label: 'WBS Code',
    category: 'basic',
    defaultVisible: false,
    width: '100px',
    sortable: true
  },
  {
    key: 'type',
    label: 'Type',
    category: 'basic',
    defaultVisible: false,
    width: '100px',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    category: 'basic',
    defaultVisible: true,
    width: '140px',
    sortable: true,
    priority: 'high',
    group: 'status'
  },
  {
    key: 'deliverables',
    label: 'Deliverables',
    category: 'basic',
    defaultVisible: false,
    minWidth: '150px'
  },
  {
    key: 'notes',
    label: 'Notes',
    category: 'basic',
    defaultVisible: false,
    minWidth: '150px'
  },

  // Dates
  {
    key: 'startDate',
    label: 'Start Date',
    category: 'dates',
    defaultVisible: false,
    width: '120px',
    sortable: true
  },
  {
    key: 'endDate',
    label: 'Due Date',
    category: 'dates',
    defaultVisible: true,
    width: '120px',
    sortable: true,
    priority: 'high',
    group: 'timeline'
  },
  {
    key: 'actualStart',
    label: 'Actual Start',
    category: 'dates',
    defaultVisible: false,
    width: '120px',
    sortable: true
  },
  {
    key: 'actualEnd',
    label: 'Actual End',
    category: 'dates',
    defaultVisible: false,
    width: '120px',
    sortable: true
  },
  {
    key: 'duration',
    label: 'Duration',
    category: 'dates',
    defaultVisible: false,
    width: '80px',
    align: 'center',
    sortable: true,
    tooltip: 'Duration in days'
  },

  // Assignment
  {
    key: 'assigneeId',
    label: 'Assignee',
    category: 'assignment',
    defaultVisible: false,
    width: '150px',
    sortable: true,
    priority: 'high',
    group: 'people'
  },
  {
    key: 'resourceAssignment',
    label: 'Resources',
    category: 'assignment',
    defaultVisible: false,
    minWidth: '150px',
    priority: 'medium',
    group: 'people'
  },
  {
    key: 'teamId',
    label: 'Team',
    category: 'assignment',
    defaultVisible: false,
    width: '120px',
    sortable: true
  },
  {
    key: 'resourceLoad',
    label: 'Resource Load',
    category: 'assignment',
    defaultVisible: false,
    width: '100px',
    align: 'center',
    sortable: true,
    tooltip: 'Resource load percentage'
  },

  // Metrics
  {
    key: 'percentComplete',
    label: 'Progress',
    category: 'metrics',
    defaultVisible: true,
    width: '120px',
    align: 'center',
    sortable: true,
    priority: 'high',
    group: 'progress'
  },
  {
    key: 'impactScore',
    label: 'Impact',
    category: 'metrics',
    defaultVisible: true,
    width: '80px',
    align: 'center',
    sortable: true,
    priority: 'medium',
    group: 'scores'
  },
  {
    key: 'riskScore',
    label: 'Risk',
    category: 'metrics',
    defaultVisible: false,
    width: '80px',
    align: 'center',
    sortable: true,
    priority: 'medium',
    group: 'scores'
  },
  {
    key: 'priorityScore',
    label: 'Priority',
    category: 'metrics',
    defaultVisible: false,
    width: '80px',
    align: 'center',
    sortable: true
  },
  {
    key: 'criticalityLevel',
    label: 'Criticality',
    category: 'metrics',
    defaultVisible: false,
    width: '100px',
    sortable: true
  },
  {
    key: 'healthIndicator',
    label: 'Health',
    category: 'metrics',
    defaultVisible: false,
    width: '80px',
    align: 'center',
    sortable: true
  },
  {
    key: 'weightedProgress',
    label: 'Weighted Progress',
    category: 'metrics',
    defaultVisible: false,
    width: '120px',
    align: 'center',
    sortable: true
  },
  {
    key: 'rolledUpProgress',
    label: 'Rolled Up Progress',
    category: 'metrics',
    defaultVisible: false,
    width: '120px',
    align: 'center',
    sortable: true
  },
  {
    key: 'spi',
    label: 'SPI',
    category: 'metrics',
    defaultVisible: false,
    width: '80px',
    align: 'center',
    sortable: true,
    tooltip: 'Schedule Performance Index'
  },
  {
    key: 'cpi',
    label: 'CPI',
    category: 'metrics',
    defaultVisible: false,
    width: '80px',
    align: 'center',
    sortable: true,
    tooltip: 'Cost Performance Index'
  },
  {
    key: 'varianceDays',
    label: 'Variance',
    category: 'metrics',
    defaultVisible: false,
    width: '80px',
    align: 'center',
    sortable: true,
    tooltip: 'Schedule variance in days'
  },
  {
    key: 'totalFloat',
    label: 'Total Float',
    category: 'metrics',
    defaultVisible: false,
    width: '80px',
    align: 'center',
    sortable: true
  },
  {
    key: 'freeFloat',
    label: 'Free Float',
    category: 'metrics',
    defaultVisible: false,
    width: '80px',
    align: 'center',
    sortable: true
  },

  // Financial
  {
    key: 'costBudget',
    label: 'Budget',
    category: 'financial',
    defaultVisible: false,
    width: '100px',
    align: 'right',
    sortable: true
  },
  {
    key: 'actualCost',
    label: 'Actual Cost',
    category: 'financial',
    defaultVisible: false,
    width: '100px',
    align: 'right',
    sortable: true
  },

  // Dependencies
  {
    key: 'dependencies',
    label: 'Dependencies',
    category: 'dependencies',
    defaultVisible: false,
    minWidth: '150px'
  },
  {
    key: 'dependencyType',
    label: 'Dependency Type',
    category: 'dependencies',
    defaultVisible: false,
    width: '100px'
  },
  {
    key: 'blockingTasks',
    label: 'Blocking Tasks',
    category: 'dependencies',
    defaultVisible: false,
    minWidth: '150px'
  },
  {
    key: 'blockedBy',
    label: 'Blocked By',
    category: 'dependencies',
    defaultVisible: false,
    minWidth: '150px'
  },
  {
    key: 'lagLead',
    label: 'Lag/Lead',
    category: 'dependencies',
    defaultVisible: false,
    width: '80px',
    align: 'center',
    sortable: true
  },

  // Flags
  {
    key: 'milestone',
    label: 'Milestone',
    category: 'basic',
    defaultVisible: false,
    width: '80px',
    align: 'center',
    sortable: true,
    priority: 'high',
    group: 'critical'
  },
  {
    key: 'criticalPath',
    label: 'Critical Path',
    category: 'metrics',
    defaultVisible: false,
    width: '100px',
    align: 'center',
    sortable: true,
    priority: 'high',
    group: 'critical'
  },
  {
    key: 'agility',
    label: 'Agility',
    category: 'basic',
    defaultVisible: false,
    width: '120px',
    sortable: true
  },
  {
    key: 'riskMitigation',
    label: 'Risk Mitigation',
    category: 'metrics',
    defaultVisible: false,
    minWidth: '150px'
  },
  {
    key: 'lessonsLearned',
    label: 'Lessons Learned',
    category: 'custom',
    defaultVisible: false,
    minWidth: '150px'
  }
]

// Helper functions
export const getFieldConfig = (key: keyof Task): TaskFieldConfig | undefined => {
  return TASK_FIELD_CONFIGS.find(config => config.key === key)
}

export const getDefaultVisibleFields = (): (keyof Task)[] => {
  return TASK_FIELD_CONFIGS
    .filter(config => config.defaultVisible)
    .map(config => config.key)
}

export const getFieldsByCategory = (category: TaskFieldConfig['category']): TaskFieldConfig[] => {
  return TASK_FIELD_CONFIGS.filter(config => config.category === category)
}

export const FIELD_CATEGORIES = [
  { id: 'basic', label: 'Basic Information' },
  { id: 'dates', label: 'Dates & Timeline' },
  { id: 'assignment', label: 'Assignment & Resources' },
  { id: 'metrics', label: 'Metrics & Performance' },
  { id: 'financial', label: 'Financial' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'custom', label: 'Custom Fields' }
] as const

// Field groups for logical grouping
export const FIELD_GROUPS = [
  { id: 'status', label: 'Status' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'people', label: 'People' },
  { id: 'progress', label: 'Progress' },
  { id: 'scores', label: 'Scores' },
  { id: 'critical', label: 'Critical Info' },
  { id: 'financial', label: 'Financial' }
] as const

// Get fields by priority
export const getFieldsByPriority = (priority: 'high' | 'medium' | 'low'): TaskFieldConfig[] => {
  return TASK_FIELD_CONFIGS.filter(config => config.priority === priority)
}

// Get fields by group
export const getFieldsByGroup = (group: string): TaskFieldConfig[] => {
  return TASK_FIELD_CONFIGS.filter(config => config.group === group)
}

// Sort fields by priority (high first)
export const sortFieldsByPriority = (fields: (keyof Task)[]): (keyof Task)[] => {
  const configs = fields.map(field => getFieldConfig(field)).filter(Boolean) as TaskFieldConfig[]
  
  return configs.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 }
    const aPriority = priorityOrder[a.priority || 'undefined']
    const bPriority = priorityOrder[b.priority || 'undefined']
    return aPriority - bPriority
  }).map(config => config.key)
}