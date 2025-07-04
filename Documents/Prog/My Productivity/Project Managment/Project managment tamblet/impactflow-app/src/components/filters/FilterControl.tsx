'use client'

import { useState, useEffect } from 'react'
import { X, Calendar } from 'lucide-react'
import { Filter, FilterOperator, FilterChangeEvent } from '@/types/filter'
import { format } from 'date-fns'
import clsx from 'clsx'

interface FilterControlProps {
  filter: Filter
  onChange: (event: FilterChangeEvent) => void
  onRemove: (filterId: string) => void
  onOperatorChange?: (filterId: string, operator: FilterOperator) => void
  className?: string
}

export function FilterControl({ filter, onChange, onRemove, onOperatorChange, className }: FilterControlProps) {
  const [localValue, setLocalValue] = useState(filter.value)
  const [localValue2, setLocalValue2] = useState(filter.value2)

  // Update local state when filter value changes externally
  useEffect(() => {
    setLocalValue(filter.value)
    setLocalValue2(filter.value2)
  }, [filter.value, filter.value2])

  const handleValueChange = (newValue: any, isSecondValue = false) => {
    if (isSecondValue) {
      setLocalValue2(newValue)
      onChange({ filterId: filter.id, value: localValue, value2: newValue })
    } else {
      setLocalValue(newValue)
      onChange({ filterId: filter.id, value: newValue, value2: localValue2 })
    }
  }

  const renderOperatorSelect = () => {
    const operators = getOperatorsForType(filter.type)
    
    return (
      <select
        value={filter.operator}
        onChange={(e) => {
          const newOperator = e.target.value as FilterOperator
          if (onOperatorChange) {
            onOperatorChange(filter.id, newOperator)
          }
          // Clear value2 when changing from 'between' to another operator
          if (filter.operator === 'between' && newOperator !== 'between') {
            onChange({ 
              filterId: filter.id, 
              value: localValue, 
              value2: undefined 
            })
          }
        }}
        className="text-xs px-2 py-1 border border-neutral-200 rounded bg-white"
      >
        {operators.map(op => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>
    )
  }

  const renderValueInput = () => {
    switch (filter.type) {
      case 'select':
        return (
          <select
            value={localValue || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="text-sm px-2 py-1 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select...</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'text':
        return (
          <input
            type="text"
            value={localValue || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={`Enter ${filter.label.toLowerCase()}`}
            className="text-sm px-2 py-1 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary w-32"
          />
        )

      case 'number':
        return (
          <>
            <input
              type="number"
              value={localValue || ''}
              onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
              placeholder="Value"
              className="text-sm px-2 py-1 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary w-20"
            />
            {filter.operator === 'between' && (
              <>
                <span className="text-xs text-neutral-500">and</span>
                <input
                  type="number"
                  value={localValue2 || ''}
                  onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0, true)}
                  placeholder="Value"
                  className="text-sm px-2 py-1 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary w-20"
                />
              </>
            )}
          </>
        )

      case 'date':
        return (
          <>
            <input
              type="date"
              value={localValue ? format(new Date(localValue), 'yyyy-MM-dd') : ''}
              onChange={(e) => handleValueChange(e.target.value ? new Date(e.target.value) : null)}
              className="text-sm px-2 py-1 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {filter.operator === 'between' && (
              <>
                <span className="text-xs text-neutral-500">and</span>
                <input
                  type="date"
                  value={localValue2 ? format(new Date(localValue2), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleValueChange(e.target.value ? new Date(e.target.value) : null, true)}
                  className="text-sm px-2 py-1 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </>
            )}
          </>
        )

      case 'boolean':
        return (
          <select
            value={localValue === true ? 'true' : localValue === false ? 'false' : ''}
            onChange={(e) => handleValueChange(e.target.value === 'true')}
            className="text-sm px-2 py-1 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        )

      default:
        return null
    }
  }

  return (
    <div className={clsx(
      'flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg border border-neutral-200',
      className
    )}>
      <span className="text-sm font-medium text-neutral-700">{filter.label}</span>
      
      {filter.type !== 'boolean' && renderOperatorSelect()}
      
      {renderValueInput()}
      
      <button
        onClick={() => onRemove(filter.id)}
        className="ml-1 p-0.5 hover:bg-neutral-200 rounded transition-colors"
        title="Remove filter"
      >
        <X className="w-3 h-3 text-neutral-500" />
      </button>
    </div>
  )
}

function getOperatorsForType(type: string): Array<{ value: FilterOperator; label: string }> {
  const operatorLabels: Record<FilterOperator, string> = {
    equals: 'is',
    notEquals: 'is not',
    contains: 'contains',
    notContains: 'does not contain',
    startsWith: 'starts with',
    endsWith: 'ends with',
    greaterThan: '>',
    lessThan: '<',
    between: 'between',
    before: 'before',
    after: 'after',
  }

  let operators: FilterOperator[] = []

  switch (type) {
    case 'select':
      operators = ['equals', 'notEquals']
      break
    case 'text':
      operators = ['contains', 'equals', 'startsWith', 'endsWith', 'notContains']
      break
    case 'number':
      operators = ['equals', 'greaterThan', 'lessThan', 'between', 'notEquals']
      break
    case 'date':
      operators = ['equals', 'before', 'after', 'between']
      break
    case 'boolean':
      operators = ['equals']
      break
    default:
      operators = ['equals']
  }

  return operators.map(op => ({ value: op, label: operatorLabels[op] }))
}