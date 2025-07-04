import { Task } from '@/types/project'
import { Filter, FilterOperator } from '@/types/filter'
import { isAfter, isBefore, isEqual, parseISO } from 'date-fns'

/**
 * Apply a single filter to a task
 */
export function applyFilter(task: Task, filter: Filter): boolean {
  // Handle special computed fields
  let value: any
  
  switch (filter.field) {
    case 'hasBlockingTasks':
      value = task.blockingTasks && task.blockingTasks.length > 0
      break
    case 'isBlocked':
      value = task.blockedBy && task.blockedBy.length > 0
      break
    case 'hasDependencies':
      value = task.dependencies && task.dependencies.length > 0
      break
    default:
      value = task[filter.field as keyof Task]
  }

  // Handle null/undefined values
  if (value === null || value === undefined) {
    if (filter.operator === 'notEquals' || filter.operator === 'notContains') {
      return true
    }
    return false
  }

  // Apply operator logic based on type
  switch (filter.type) {
    case 'text':
      return applyTextFilter(value, filter.operator, filter.value)
    
    case 'number':
      return applyNumberFilter(value, filter.operator, filter.value, filter.value2)
    
    case 'date':
      return applyDateFilter(value, filter.operator, filter.value, filter.value2)
    
    case 'select':
      return applySelectFilter(value, filter.operator, filter.value)
    
    case 'boolean':
      return value === filter.value
    
    default:
      return true
  }
}

/**
 * Apply all filters to a task
 */
export function applyAllFilters(task: Task, filters: Filter[]): boolean {
  if (filters.length === 0) return true
  
  // Task must match ALL filters (AND logic)
  return filters.every(filter => applyFilter(task, filter))
}

/**
 * Text filter logic
 */
function applyTextFilter(value: any, operator: FilterOperator, filterValue: string): boolean {
  const textValue = String(value).toLowerCase()
  const searchValue = String(filterValue).toLowerCase()

  switch (operator) {
    case 'equals':
      return textValue === searchValue
    
    case 'notEquals':
      return textValue !== searchValue
    
    case 'contains':
      return textValue.includes(searchValue)
    
    case 'notContains':
      return !textValue.includes(searchValue)
    
    case 'startsWith':
      return textValue.startsWith(searchValue)
    
    case 'endsWith':
      return textValue.endsWith(searchValue)
    
    default:
      return true
  }
}

/**
 * Number filter logic
 */
function applyNumberFilter(value: any, operator: FilterOperator, filterValue: number, filterValue2?: number): boolean {
  const numValue = Number(value)
  if (isNaN(numValue)) return false

  switch (operator) {
    case 'equals':
      return numValue === filterValue
    
    case 'notEquals':
      return numValue !== filterValue
    
    case 'greaterThan':
      return numValue > filterValue
    
    case 'lessThan':
      return numValue < filterValue
    
    case 'between':
      if (filterValue2 === undefined) return false
      return numValue >= filterValue && numValue <= filterValue2
    
    default:
      return true
  }
}

/**
 * Date filter logic
 */
function applyDateFilter(value: any, operator: FilterOperator, filterValue: Date, filterValue2?: Date): boolean {
  const dateValue = value instanceof Date ? value : parseISO(String(value))
  if (!dateValue || isNaN(dateValue.getTime())) return false

  const compareDate = filterValue instanceof Date ? filterValue : parseISO(String(filterValue))
  if (!compareDate || isNaN(compareDate.getTime())) return false

  switch (operator) {
    case 'equals':
      return isEqual(dateValue, compareDate)
    
    case 'before':
      return isBefore(dateValue, compareDate)
    
    case 'after':
      return isAfter(dateValue, compareDate)
    
    case 'between':
      if (!filterValue2) return false
      const endDate = filterValue2 instanceof Date ? filterValue2 : parseISO(String(filterValue2))
      if (!endDate || isNaN(endDate.getTime())) return false
      return (isEqual(dateValue, compareDate) || isAfter(dateValue, compareDate)) &&
             (isEqual(dateValue, endDate) || isBefore(dateValue, endDate))
    
    default:
      return true
  }
}

/**
 * Select filter logic
 */
function applySelectFilter(value: any, operator: FilterOperator, filterValue: string): boolean {
  const stringValue = String(value)

  switch (operator) {
    case 'equals':
      return stringValue === filterValue
    
    case 'notEquals':
      return stringValue !== filterValue
    
    default:
      return true
  }
}

/**
 * Validate filter value
 */
export function validateFilterValue(filter: Filter): { isValid: boolean; errorMessage?: string } {
  // Check for required values
  if (filter.value === null || filter.value === undefined || filter.value === '') {
    return { isValid: false, errorMessage: 'Value is required' }
  }

  // Check for second value in 'between' operators
  if (filter.operator === 'between' && (filter.value2 === null || filter.value2 === undefined || filter.value2 === '')) {
    return { isValid: false, errorMessage: 'Second value is required for between operator' }
  }

  // Type-specific validation
  switch (filter.type) {
    case 'number':
      if (isNaN(Number(filter.value))) {
        return { isValid: false, errorMessage: 'Invalid number' }
      }
      if (filter.operator === 'between' && isNaN(Number(filter.value2))) {
        return { isValid: false, errorMessage: 'Invalid second number' }
      }
      if (filter.operator === 'between' && Number(filter.value) > Number(filter.value2)) {
        return { isValid: false, errorMessage: 'First value must be less than second value' }
      }
      break

    case 'date':
      const date1 = filter.value instanceof Date ? filter.value : new Date(filter.value)
      if (isNaN(date1.getTime())) {
        return { isValid: false, errorMessage: 'Invalid date' }
      }
      if (filter.operator === 'between') {
        const date2 = filter.value2 instanceof Date ? filter.value2 : new Date(filter.value2)
        if (isNaN(date2.getTime())) {
          return { isValid: false, errorMessage: 'Invalid second date' }
        }
        if (date1 > date2) {
          return { isValid: false, errorMessage: 'Start date must be before end date' }
        }
      }
      break
  }

  return { isValid: true }
}

/**
 * Format filter value for display
 */
export function formatFilterValue(filter: Filter): string {
  if (filter.value === null || filter.value === undefined) return ''

  switch (filter.type) {
    case 'boolean':
      return filter.value ? 'Yes' : 'No'
    
    case 'date':
      const date = filter.value instanceof Date ? filter.value : new Date(filter.value)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString()
    
    case 'select':
      // If we have options, find the label
      const option = filter.options?.find(opt => opt.value === filter.value)
      return option?.label || String(filter.value)
    
    default:
      return String(filter.value)
  }
}

/**
 * Get display text for a filter
 */
export function getFilterDisplayText(filter: Filter): string {
  const value1 = formatFilterValue(filter)
  
  if (filter.operator === 'between' && filter.value2) {
    const value2 = formatFilterValue({ ...filter, value: filter.value2 })
    return `${filter.label} is between ${value1} and ${value2}`
  }

  const operatorText = getOperatorDisplayText(filter.operator)
  return `${filter.label} ${operatorText} ${value1}`
}

/**
 * Get human-readable operator text
 */
function getOperatorDisplayText(operator: FilterOperator): string {
  const operatorMap: Record<FilterOperator, string> = {
    equals: 'is',
    notEquals: 'is not',
    contains: 'contains',
    notContains: 'does not contain',
    startsWith: 'starts with',
    endsWith: 'ends with',
    greaterThan: 'is greater than',
    lessThan: 'is less than',
    between: 'is between',
    before: 'is before',
    after: 'is after',
  }

  return operatorMap[operator] || operator
}