'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Clock, DollarSign, Flag, CheckSquare } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Task, User } from '@/types/project'
import toast from 'react-hot-toast'
import { notificationService } from '@/services/notificationService'
import { useAuth } from '@/hooks/useAuth'

const approvalSchema = z.object({
  taskId: z.string().min(1, 'Please select a task'),
  type: z.enum(['task_completion', 'budget_increase', 'timeline_extension', 'scope_change']),
  description: z.string().min(10, 'Please provide a detailed description'),
  currentValue: z.string().optional(),
  requestedValue: z.string().optional(),
  justification: z.string().min(20, 'Please provide justification for this request'),
  impact: z.string().optional(),
  alternatives: z.string().optional(),
})

type ApprovalFormData = z.infer<typeof approvalSchema>

interface ApprovalFormProps {
  tasks: Task[]
  approvers?: User[]
  onSubmit: (data: ApprovalFormData) => void
  onCancel: () => void
}

export function ApprovalForm({ tasks, approvers = [], onSubmit, onCancel }: ApprovalFormProps) {
  const [selectedType, setSelectedType] = useState<string>('')
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
  })

  const watchType = watch('type')

  const approvalTypes = [
    {
      value: 'task_completion',
      label: 'Task Completion',
      icon: CheckSquare,
      description: 'Mark a task as complete that requires approval',
      requiresValues: false,
    },
    {
      value: 'budget_increase',
      label: 'Budget Increase',
      icon: DollarSign,
      description: 'Request additional budget for a task',
      requiresValues: true,
      currentLabel: 'Current Budget',
      requestedLabel: 'Requested Budget',
    },
    {
      value: 'timeline_extension',
      label: 'Timeline Extension',
      icon: Clock,
      description: 'Request more time to complete a task',
      requiresValues: true,
      currentLabel: 'Current Duration',
      requestedLabel: 'Requested Duration',
    },
    {
      value: 'scope_change',
      label: 'Scope Change',
      icon: Flag,
      description: 'Request changes to task scope or deliverables',
      requiresValues: false,
    },
  ]

  const selectedTypeConfig = approvalTypes.find(t => t.value === watchType)

  const onFormSubmit = async (data: ApprovalFormData) => {
    try {
      // Submit the approval request
      onSubmit(data)
      
      // Find the task
      const task = tasks.find(t => t.id === data.taskId)
      if (!task || !user) {
        toast.error('Failed to send notifications')
        return
      }
      
      // Send notifications to approvers
      if (approvers.length > 0) {
        const updateId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await notificationService.notifyApprovalRequest(
          updateId,
          task,
          user,
          approvers
        )
      }
      
      toast.success('Approval request submitted and notifications sent')
    } catch (error) {
      console.error('Failed to submit approval request:', error)
      toast.error('Failed to submit approval request')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">New Approval Request</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Task Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Task *
              </label>
              <select
                {...register('taskId')}
                className="input w-full"
              >
                <option value="">-- Select a task --</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.wbsCode} - {task.name} ({task.status})
                  </option>
                ))}
              </select>
              {errors.taskId && (
                <p className="text-sm text-status-danger mt-1">{errors.taskId.message}</p>
              )}
            </div>

            {/* Approval Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Request Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {approvalTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <label
                      key={type.value}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        watchType === type.value
                          ? 'border-primary bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        {...register('type')}
                        type="radio"
                        value={type.value}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </div>
                        <p className="text-sm text-neutral-600 mt-1">
                          {type.description}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
              {errors.type && (
                <p className="text-sm text-status-danger mt-1">{errors.type.message}</p>
              )}
            </div>

            {/* Current and Requested Values */}
            {selectedTypeConfig?.requiresValues && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {selectedTypeConfig.currentLabel}
                  </label>
                  <input
                    {...register('currentValue')}
                    className="input w-full"
                    placeholder={selectedTypeConfig.value === 'budget_increase' ? '$0' : '0 days'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {selectedTypeConfig.requestedLabel}
                  </label>
                  <input
                    {...register('requestedValue')}
                    className="input w-full"
                    placeholder={selectedTypeConfig.value === 'budget_increase' ? '$0' : '0 days'}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description')}
                className="input w-full h-24 resize-none"
                placeholder="Provide a clear description of what you're requesting..."
              />
              {errors.description && (
                <p className="text-sm text-status-danger mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Justification */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Justification *
              </label>
              <textarea
                {...register('justification')}
                className="input w-full h-24 resize-none"
                placeholder="Explain why this request is necessary..."
              />
              {errors.justification && (
                <p className="text-sm text-status-danger mt-1">{errors.justification.message}</p>
              )}
            </div>

            {/* Impact Analysis */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Impact Analysis
              </label>
              <textarea
                {...register('impact')}
                className="input w-full h-20 resize-none"
                placeholder="Describe the impact on timeline, budget, and other tasks..."
              />
            </div>

            {/* Alternatives Considered */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Alternatives Considered
              </label>
              <textarea
                {...register('alternatives')}
                className="input w-full h-20 resize-none"
                placeholder="What other options were considered and why were they not suitable?"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-neutral-50">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary px-6 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onFormSubmit)}
            className="btn-primary px-6 py-2"
          >
            Submit Request
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}