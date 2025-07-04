'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, CheckCircle } from 'lucide-react'
import { TaskStatus } from '@/types/project'
import { StatusBadge } from './StatusBadge'
import toast from 'react-hot-toast'

interface BulkStatusModalProps {
  taskCount: number
  currentStatuses: TaskStatus[]
  onConfirm: (newStatus: TaskStatus) => Promise<void>
  onClose: () => void
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; description: string }[] = [
  { 
    value: TaskStatus.NOT_STARTED, 
    label: 'Not Started',
    description: 'Tasks have not begun yet'
  },
  { 
    value: TaskStatus.IN_PROGRESS, 
    label: 'In Progress',
    description: 'Tasks are actively being worked on'
  },
  { 
    value: TaskStatus.COMPLETE, 
    label: 'Completed',
    description: 'Tasks have been finished'
  },
  { 
    value: TaskStatus.BLOCKED, 
    label: 'Blocked',
    description: 'Tasks are waiting on dependencies'
  },
  { 
    value: TaskStatus.REVIEW, 
    label: 'In Review',
    description: 'Tasks are awaiting approval'
  }
]

export function BulkStatusModal({ 
  taskCount, 
  currentStatuses, 
  onConfirm, 
  onClose 
}: BulkStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleConfirm = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status')
      return
    }

    setIsLoading(true)
    try {
      await onConfirm(selectedStatus)
      toast.success(`Updated ${taskCount} tasks to ${selectedStatus.replace('_', ' ').toLowerCase()}`)
      onClose()
    } catch (error) {
      toast.error('Failed to update task statuses')
      console.error('Bulk status update error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get unique current statuses
  const uniqueCurrentStatuses = Array.from(new Set(currentStatuses))
  const hasMultipleStatuses = uniqueCurrentStatuses.length > 1

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b bg-neutral-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Update Task Status</h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Change status for {taskCount} selected task{taskCount !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Current Status Info */}
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <span className="font-medium">Current status{hasMultipleStatuses ? 'es' : ''}:</span>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {uniqueCurrentStatuses.map(status => (
                    <StatusBadge key={status} status={status} size="sm" />
                  ))}
                  {hasMultipleStatuses && (
                    <span className="text-xs text-amber-600">(mixed)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Options */}
          <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedStatus === option.value
                      ? 'border-primary bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={option.value} size="sm" />
                      <div>
                        <div className="font-medium text-neutral-900">
                          {option.label}
                        </div>
                        <div className="text-sm text-neutral-600">
                          {option.description}
                        </div>
                      </div>
                    </div>
                    {selectedStatus === option.value && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-neutral-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-600">
                {selectedStatus && (
                  <span>
                    Will update to: <StatusBadge status={selectedStatus} size="sm" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedStatus || isLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    `Update ${taskCount} Task${taskCount !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}