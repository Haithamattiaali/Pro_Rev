import { Task } from './project'

export type FilterType = 'select' | 'text' | 'date' | 'number' | 'boolean'

export type FilterOperator = 
  | 'equals' 
  | 'notEquals'
  | 'contains' 
  | 'notContains'
  | 'startsWith' 
  | 'endsWith'
  | 'greaterThan' 
  | 'lessThan' 
  | 'between'
  | 'before' 
  | 'after'

export interface Filter {
  id: string
  field: keyof Task | 'hasBlockingTasks' | 'isBlocked' | 'hasDependencies'
  label: string
  type: FilterType
  operator: FilterOperator
  value: any
  value2?: any // For 'between' operator
  options?: Array<{ value: string; label: string }> // For select type
}

export interface FilterChangeEvent {
  filterId: string
  value: any
  value2?: any
}

export interface ActiveFilter extends Filter {
  isValid: boolean
  errorMessage?: string
}