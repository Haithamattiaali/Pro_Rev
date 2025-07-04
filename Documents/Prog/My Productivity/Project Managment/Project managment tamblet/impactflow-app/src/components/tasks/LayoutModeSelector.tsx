import React, { useState, useRef, useEffect } from 'react'
import { Columns, LayoutGrid, Maximize2, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

type LayoutMode = 'compact' | 'comfortable' | 'expanded'

interface LayoutModeSelectorProps {
  value: LayoutMode
  onChange: (mode: LayoutMode) => void
  className?: string
}

interface LayoutOption {
  value: LayoutMode
  label: string
  description: string
  icon: React.ReactNode
}

const layoutOptions: LayoutOption[] = [
  {
    value: 'compact',
    label: 'Compact',
    description: 'Minimal spacing, fields may truncate',
    icon: <Columns className="w-4 h-4" />
  },
  {
    value: 'comfortable',
    label: 'Comfortable',
    description: 'Balanced view with horizontal scroll',
    icon: <LayoutGrid className="w-4 h-4" />
  },
  {
    value: 'expanded',
    label: 'Expanded',
    description: 'Full width with field wrapping',
    icon: <Maximize2 className="w-4 h-4" />
  }
]

export const LayoutModeSelector: React.FC<LayoutModeSelectorProps> = ({ 
  value, 
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
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

  const currentOption = layoutOptions.find(opt => opt.value === value) || layoutOptions[1]

  return (
    <div ref={dropdownRef} className={clsx('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
          'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
        )}
      >
        {currentOption.icon}
        <span>Layout: {currentOption.label}</span>
        <ChevronDown className={clsx(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-neutral-200 z-50"
          >
            <div className="p-2">
              {layoutOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={clsx(
                    'w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left',
                    value === option.value
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-neutral-50'
                  )}
                >
                  <div className={clsx(
                    'p-1.5 rounded',
                    value === option.value
                      ? 'bg-primary text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  )}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {option.description}
                    </div>
                  </div>
                  {value === option.value && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50 rounded-b-lg">
              <div className="text-xs text-neutral-600">
                <strong>Tip:</strong> Use Expanded mode when you have many fields selected
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}