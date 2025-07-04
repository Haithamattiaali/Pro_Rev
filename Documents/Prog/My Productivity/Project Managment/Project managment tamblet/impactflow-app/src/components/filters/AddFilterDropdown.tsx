'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, ChevronDown, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FilterConfig } from '@/config/taskFilters'
import { Filter } from '@/types/filter'
import clsx from 'clsx'

interface AddFilterDropdownProps {
  availableFilters: FilterConfig[]
  activeFilters: Filter[]
  onAddFilter: (filterConfig: FilterConfig) => void
  className?: string
}

export function AddFilterDropdown({ 
  availableFilters, 
  activeFilters, 
  onAddFilter, 
  className 
}: AddFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter out already active filters
  const activeFilterFields = activeFilters.map(f => f.field)
  const availableToAdd = availableFilters.filter(
    config => !activeFilterFields.includes(config.field as any)
  )

  // Apply search filter
  const filteredOptions = availableToAdd.filter(config =>
    config.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group filters by category
  const groupedFilters = filteredOptions.reduce((groups, filter) => {
    let category = 'Other'
    
    if (['status', 'type', 'criticalityLevel', 'healthIndicator'].includes(filter.field)) {
      category = 'Status & Type'
    } else if (['resourceAssignment', 'assigneeId', 'teamId'].includes(filter.field)) {
      category = 'Assignment'
    } else if (['impactScore', 'riskScore', 'priorityScore', 'percentComplete'].includes(filter.field)) {
      category = 'Metrics'
    } else if (filter.field.includes('Date') || filter.field.includes('date')) {
      category = 'Dates'
    } else if (['costBudget', 'actualCost', 'spi', 'cpi'].includes(filter.field)) {
      category = 'Cost & Performance'
    } else if (['name', 'deliverables', 'notes', 'wbsCode'].includes(filter.field)) {
      category = 'Text Fields'
    } else if (filter.type === 'boolean') {
      category = 'Flags'
    }

    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(filter)
    return groups
  }, {} as Record<string, FilterConfig[]>)

  const handleAddFilter = (config: FilterConfig) => {
    onAddFilter(config)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div ref={dropdownRef} className={clsx('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all',
          'border border-neutral-300 hover:border-neutral-400',
          'bg-white hover:bg-neutral-50',
          isOpen && 'ring-2 ring-primary ring-offset-1'
        )}
      >
        <Plus className="w-4 h-4" />
        <span>Add Filter</span>
        <ChevronDown className={clsx(
          'w-3 h-3 transition-transform',
          isOpen && 'rotate-180'
        )} />
        {availableToAdd.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-neutral-200 rounded-full">
            {availableToAdd.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 z-50"
          >
            {/* Search */}
            <div className="p-3 border-b border-neutral-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search filters..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Filter Options */}
            <div className="max-h-96 overflow-y-auto">
              {Object.keys(groupedFilters).length === 0 ? (
                <div className="p-4 text-center text-sm text-neutral-500">
                  {searchQuery ? 'No filters match your search' : 'All filters are currently active'}
                </div>
              ) : (
                Object.entries(groupedFilters).map(([category, filters]) => (
                  <div key={category}>
                    <div className="px-3 py-2 text-xs font-medium text-neutral-500 bg-neutral-50">
                      {category}
                    </div>
                    {filters.map(config => (
                      <button
                        key={config.field}
                        onClick={() => handleAddFilter(config)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 transition-colors flex items-center justify-between group"
                      >
                        <span className="text-neutral-700 group-hover:text-neutral-900">
                          {config.label}
                        </span>
                        <span className="text-xs text-neutral-400 group-hover:text-neutral-500">
                          {config.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {availableToAdd.length > 5 && (
              <div className="p-2 border-t border-neutral-200 text-center">
                <span className="text-xs text-neutral-500">
                  {filteredOptions.length} of {availableToAdd.length} available filters
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}