import React, { useState, useRef, useEffect } from 'react'
import { Task } from '@/types/project'
import { TASK_FIELD_CONFIGS, FIELD_CATEGORIES, getFieldsByCategory, getDefaultVisibleFields } from '@/config/taskFieldConfig'
import { Settings2, Check, RotateCcw, X } from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

interface FieldSelectorProps {
  selectedFields: (keyof Task)[]
  onFieldsChange: (fields: (keyof Task)[]) => void
  className?: string
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({ 
  selectedFields, 
  onFieldsChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleField = (field: keyof Task) => {
    if (selectedFields.includes(field)) {
      onFieldsChange(selectedFields.filter(f => f !== field))
    } else {
      onFieldsChange([...selectedFields, field])
    }
  }

  const resetToDefaults = () => {
    onFieldsChange(getDefaultVisibleFields())
  }

  const selectAll = () => {
    onFieldsChange(TASK_FIELD_CONFIGS.map(config => config.key))
  }

  const deselectAll = () => {
    onFieldsChange([])
  }

  const filteredConfigs = TASK_FIELD_CONFIGS.filter(config =>
    config.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div ref={dropdownRef} className={clsx('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
          isOpen 
            ? 'bg-primary text-white border-primary' 
            : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
        )}
      >
        <Settings2 className="w-4 h-4" />
        <span>Configure Columns</span>
        <span className="text-xs opacity-70">({selectedFields.length})</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-neutral-200 z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-neutral-900">
                  Select Columns
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-neutral-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Search */}
              <input
                type="text"
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-b border-neutral-200 flex items-center gap-2">
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary-50 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Default
              </button>
              <button
                onClick={selectAll}
                className="px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
              >
                Deselect All
              </button>
            </div>

            {/* Field List */}
            <div className="max-h-96 overflow-y-auto p-2">
              {searchQuery ? (
                // Show filtered results
                <div className="space-y-1">
                  {filteredConfigs.length > 0 ? (
                    filteredConfigs.map(config => (
                      <label
                        key={config.key}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(config.key)}
                          onChange={() => toggleField(config.key)}
                          className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary"
                        />
                        <span className="flex-1 text-sm text-neutral-700">
                          {config.label}
                        </span>
                        {config.tooltip && (
                          <span className="text-xs text-neutral-500">
                            ({config.tooltip})
                          </span>
                        )}
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500 text-center py-4">
                      No fields found matching "{searchQuery}"
                    </p>
                  )}
                </div>
              ) : (
                // Show categorized fields
                FIELD_CATEGORIES.map(category => {
                  const categoryFields = getFieldsByCategory(category.id)
                  if (categoryFields.length === 0) return null

                  return (
                    <div key={category.id} className="mb-4">
                      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-2 mb-1">
                        {category.label}
                      </h4>
                      <div className="space-y-1">
                        {categoryFields.map(config => (
                          <label
                            key={config.key}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFields.includes(config.key)}
                              onChange={() => toggleField(config.key)}
                              className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary"
                            />
                            <span className="flex-1 text-sm text-neutral-700">
                              {config.label}
                            </span>
                            {selectedFields.includes(config.key) && (
                              <Check className="w-3 h-3 text-primary" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-neutral-200 bg-neutral-50 rounded-b-lg">
              <p className="text-xs text-neutral-600 text-center">
                {selectedFields.length} column{selectedFields.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}