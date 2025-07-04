import { TaskStatus, TaskType, CriticalityLevel, TaskAgility, HealthIndicator } from '@/types/project'

export interface FilterConfig {
  field: string
  label: string
  type: 'select' | 'text' | 'date' | 'number' | 'boolean'
  options?: Array<{ value: string; label: string }>
  operators?: string[]
  placeholder?: string
  min?: number
  max?: number
}

export const AVAILABLE_FILTERS: FilterConfig[] = [
  // Status and Type
  {
    field: 'status',
    label: 'Status',
    type: 'select',
    options: Object.values(TaskStatus).map(status => ({
      value: status,
      label: status.replace(/_/g, ' ')
    }))
  },
  {
    field: 'type',
    label: 'Task Type',
    type: 'select',
    options: Object.values(TaskType).map(type => ({
      value: type,
      label: type
    }))
  },
  
  // Assignment and Team
  {
    field: 'resourceAssignment',
    label: 'Assignee',
    type: 'text',
    operators: ['contains', 'equals', 'notContains'],
    placeholder: 'Enter assignee name'
  },
  {
    field: 'assigneeId',
    label: 'Assigned To',
    type: 'select',
    options: [] // Will be populated dynamically
  },
  {
    field: 'teamId',
    label: 'Team',
    type: 'select',
    options: [] // Will be populated dynamically
  },
  
  // Priority and Risk
  {
    field: 'criticalityLevel',
    label: 'Criticality',
    type: 'select',
    options: Object.values(CriticalityLevel).map(level => ({
      value: level,
      label: level
    }))
  },
  {
    field: 'healthIndicator',
    label: 'Health Status',
    type: 'select',
    options: Object.values(HealthIndicator).map(indicator => ({
      value: indicator,
      label: indicator
    }))
  },
  {
    field: 'impactScore',
    label: 'Impact Score',
    type: 'number',
    operators: ['equals', 'greaterThan', 'lessThan', 'between'],
    min: 0,
    max: 100
  },
  {
    field: 'riskScore',
    label: 'Risk Score',
    type: 'number',
    operators: ['equals', 'greaterThan', 'lessThan', 'between'],
    min: 0,
    max: 100
  },
  {
    field: 'priorityScore',
    label: 'Priority Score',
    type: 'number',
    operators: ['equals', 'greaterThan', 'lessThan', 'between'],
    min: 0,
    max: 100
  },
  
  // Progress and Performance
  {
    field: 'percentComplete',
    label: 'Progress %',
    type: 'number',
    operators: ['equals', 'greaterThan', 'lessThan', 'between'],
    min: 0,
    max: 100
  },
  {
    field: 'spi',
    label: 'Schedule Performance Index',
    type: 'number',
    operators: ['equals', 'greaterThan', 'lessThan', 'between'],
    min: 0
  },
  {
    field: 'cpi',
    label: 'Cost Performance Index',
    type: 'number',
    operators: ['equals', 'greaterThan', 'lessThan', 'between'],
    min: 0
  },
  
  // Dates
  {
    field: 'startDate',
    label: 'Start Date',
    type: 'date',
    operators: ['equals', 'before', 'after', 'between']
  },
  {
    field: 'endDate',
    label: 'Due Date',
    type: 'date',
    operators: ['equals', 'before', 'after', 'between']
  },
  {
    field: 'actualStart',
    label: 'Actual Start',
    type: 'date',
    operators: ['equals', 'before', 'after', 'between']
  },
  {
    field: 'actualEnd',
    label: 'Actual End',
    type: 'date',
    operators: ['equals', 'before', 'after', 'between']
  },
  
  // Duration and Time
  {
    field: 'duration',
    label: 'Duration (days)',
    type: 'number',
    operators: ['equals', 'greaterThan', 'lessThan', 'between'],
    min: 0
  },
  {
    field: 'varianceDays',
    label: 'Schedule Variance (days)',
    type: 'number',
    operators: ['equals', 'greaterThan', 'lessThan', 'between']
  },
  {
    field: 'totalFloat',
    label: 'Total Float',
    type: 'number',
    operators: ['equals', 'greaterThan', 'lessThan', 'between'],
    min: 0
  },
  
  // Cost
  {
    field: 'costBudget',
    label: 'Budget',
    type: 'number',
    operators: ['equals', 'greaterThan', 'lessThan', 'between'],
    min: 0
  },
  {
    field: 'actualCost',
    label: 'Actual Cost',
    type: 'number',
    operators: ['equals', 'greaterThan', 'lessThan', 'between'],
    min: 0
  },
  
  // Resource Load
  {
    field: 'resourceLoad',
    label: 'Resource Load %',
    type: 'number',
    operators: ['equals', 'greaterThan', 'lessThan', 'between'],
    min: 0,
    max: 100
  },
  
  // Boolean Flags
  {
    field: 'milestone',
    label: 'Is Milestone',
    type: 'boolean'
  },
  {
    field: 'criticalPath',
    label: 'On Critical Path',
    type: 'boolean'
  },
  
  // Text Search
  {
    field: 'name',
    label: 'Task Name',
    type: 'text',
    operators: ['contains', 'equals', 'startsWith', 'endsWith'],
    placeholder: 'Enter task name'
  },
  {
    field: 'deliverables',
    label: 'Deliverables',
    type: 'text',
    operators: ['contains', 'equals', 'notContains'],
    placeholder: 'Enter deliverable text'
  },
  {
    field: 'notes',
    label: 'Notes',
    type: 'text',
    operators: ['contains', 'equals', 'notContains'],
    placeholder: 'Enter note text'
  },
  {
    field: 'wbsCode',
    label: 'WBS Code',
    type: 'text',
    operators: ['equals', 'startsWith', 'contains'],
    placeholder: 'Enter WBS code'
  },
  
  // Agility
  {
    field: 'agility',
    label: 'Task Agility',
    type: 'select',
    options: Object.values(TaskAgility).map(agility => ({
      value: agility,
      label: agility.replace(/-/g, ' ')
    }))
  },
  
  // Dependencies and Blocking
  {
    field: 'hasBlockingTasks',
    label: 'Has Blocking Tasks',
    type: 'boolean'
  },
  {
    field: 'isBlocked',
    label: 'Is Blocked',
    type: 'boolean'
  },
  {
    field: 'hasDependencies',
    label: 'Has Dependencies',
    type: 'boolean'
  }
]

// Helper function to get default operators for a filter type
export function getDefaultOperators(type: string): string[] {
  switch (type) {
    case 'select':
      return ['equals', 'notEquals']
    case 'text':
      return ['contains', 'equals', 'startsWith', 'endsWith', 'notContains']
    case 'number':
      return ['equals', 'greaterThan', 'lessThan', 'between', 'notEquals']
    case 'date':
      return ['equals', 'before', 'after', 'between']
    case 'boolean':
      return ['equals']
    default:
      return ['equals']
  }
}