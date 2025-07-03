'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar, Users, Flag, Link2, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { 
  Task, TaskType, TaskStatus, TaskAgility, 
  CriticalityLevel, DependencyType, HealthIndicator 
} from '@/types/project'
import { calculateImpactScore, calculateRiskScore, calculateHealthIndicator } from '@/utils/calculations'

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  type: z.nativeEnum(TaskType),
  parentId: z.string().optional(),
  wbsCode: z.string().optional(),
  duration: z.number().min(0, 'Duration must be positive'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  percentComplete: z.number().min(0).max(100),
  agility: z.nativeEnum(TaskAgility),
  dependencies: z.array(z.string()).optional(),
  dependencyType: z.nativeEnum(DependencyType).optional(),
  lagLead: z.number().optional(),
  criticalityLevel: z.nativeEnum(CriticalityLevel),
  resourceAssignment: z.string().optional(),
  resourceLoad: z.number().min(0).max(100).optional(),
  costBudget: z.number().min(0).optional(),
  status: z.nativeEnum(TaskStatus),
  milestone: z.boolean(),
  deliverables: z.string().optional(),
  notes: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  task?: Partial<Task>
  tasks: Task[]
  onSave: (data: Partial<Task>) => void
  onCancel: () => void
}

export function TaskForm({ task, tasks, onSave, onCancel }: TaskFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const isEditing = !!task?.id

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: task?.name || '',
      type: task?.type || TaskType.CHILD,
      parentId: task?.parentId || '',
      wbsCode: task?.wbsCode || '',
      duration: task?.duration || 1,
      startDate: task?.startDate ? format(task.startDate, 'yyyy-MM-dd') : '',
      endDate: task?.endDate ? format(task.endDate, 'yyyy-MM-dd') : '',
      percentComplete: task?.percentComplete || 0,
      agility: task?.agility || TaskAgility.SEQUENTIAL,
      dependencies: task?.dependencies || [],
      dependencyType: task?.dependencyType || DependencyType.FS,
      lagLead: task?.lagLead || 0,
      criticalityLevel: task?.criticalityLevel || CriticalityLevel.MEDIUM,
      resourceAssignment: task?.resourceAssignment || '',
      resourceLoad: task?.resourceLoad || 100,
      costBudget: task?.costBudget || 0,
      status: task?.status || TaskStatus.NOT_STARTED,
      milestone: task?.milestone || false,
      deliverables: task?.deliverables || '',
      notes: task?.notes || '',
    },
  })

  const watchedData = watch()

  // Calculate derived fields
  useEffect(() => {
    if (watchedData.startDate && watchedData.duration) {
      const start = new Date(watchedData.startDate)
      const end = new Date(start)
      end.setDate(end.getDate() + watchedData.duration)
      setValue('endDate', format(end, 'yyyy-MM-dd'))
    }
  }, [watchedData.startDate, watchedData.duration, setValue])

  const onSubmit = (data: TaskFormData) => {
    // Convert form data to task format
    const taskData: Partial<Task> = {
      ...task,
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    }

    // Calculate derived fields
    taskData.impactScore = calculateImpactScore(taskData)
    taskData.riskScore = calculateRiskScore(taskData)
    taskData.healthIndicator = calculateHealthIndicator(taskData)

    onSave(taskData)
  }

  // Get parent tasks for dropdown
  const parentTasks = tasks.filter(t => 
    t.type === TaskType.PARENT || t.type === TaskType.SUMMARY
  )

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
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="col-span-2">
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Task Name *
                  </label>
                  <input
                    {...register('name')}
                    className="input w-full"
                    placeholder="Enter task name"
                  />
                  {errors.name && (
                    <p className="text-sm text-status-danger mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Task Type
                  </label>
                  <select {...register('type')} className="input w-full">
                    {Object.values(TaskType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Parent Task
                  </label>
                  <select {...register('parentId')} className="input w-full">
                    <option value="">No parent (top-level)</option>
                    {parentTasks.map(parent => (
                      <option key={parent.id} value={parent.id}>
                        {parent.wbsCode} - {parent.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    WBS Code
                  </label>
                  <input
                    {...register('wbsCode')}
                    className="input w-full"
                    placeholder="1.2.3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Status
                  </label>
                  <select {...register('status')} className="input w-full">
                    {Object.values(TaskStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="col-span-2">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-neutral-500" />
                Schedule
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Duration (Days) *
                  </label>
                  <input
                    {...register('duration', { valueAsNumber: true })}
                    type="number"
                    className="input w-full"
                    min={0}
                  />
                  {errors.duration && (
                    <p className="text-sm text-status-danger mt-1">{errors.duration.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Start Date
                  </label>
                  <input
                    {...register('startDate')}
                    type="date"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    End Date
                  </label>
                  <input
                    {...register('endDate')}
                    type="date"
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Progress & Resources */}
            <div className="col-span-2">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-neutral-500" />
                Progress & Resources
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Progress (%)
                  </label>
                  <input
                    {...register('percentComplete', { valueAsNumber: true })}
                    type="number"
                    className="input w-full"
                    min={0}
                    max={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Resource Assignment
                  </label>
                  <input
                    {...register('resourceAssignment')}
                    className="input w-full"
                    placeholder="John Doe, Jane Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Resource Load (%)
                  </label>
                  <input
                    {...register('resourceLoad', { valueAsNumber: true })}
                    type="number"
                    className="input w-full"
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </div>

            {/* Risk & Priority */}
            <div className="col-span-2">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-neutral-500" />
                Risk & Priority
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Criticality Level
                  </label>
                  <select {...register('criticalityLevel')} className="input w-full">
                    {Object.values(CriticalityLevel).map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Task Agility
                  </label>
                  <select {...register('agility')} className="input w-full">
                    {Object.values(TaskAgility).map(agility => (
                      <option key={agility} value={agility}>{agility}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 mt-6">
                    <input
                      {...register('milestone')}
                      type="checkbox"
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="text-sm font-medium text-neutral-700">
                      This is a milestone
                    </span>
                    <Flag className="w-4 h-4 text-primary" />
                  </label>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="col-span-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-primary hover:text-primary-dark font-medium text-sm"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>
            </div>

            {showAdvanced && (
              <>
                {/* Dependencies */}
                <div className="col-span-2">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-neutral-500" />
                    Dependencies
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Depends On
                      </label>
                      <select 
                        multiple
                        {...register('dependencies')}
                        className="input w-full h-24"
                      >
                        {tasks.filter(t => t.id !== task?.id).map(t => (
                          <option key={t.id} value={t.id}>
                            {t.wbsCode} - {t.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-neutral-500 mt-1">
                        Hold Ctrl/Cmd to select multiple
                      </p>
                    </div>

                    <div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Dependency Type
                        </label>
                        <select {...register('dependencyType')} className="input w-full">
                          {Object.values(DependencyType).map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Lag/Lead (days)
                        </label>
                        <input
                          {...register('lagLead', { valueAsNumber: true })}
                          type="number"
                          className="input w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Cost Budget
                  </label>
                  <input
                    {...register('costBudget', { valueAsNumber: true })}
                    type="number"
                    className="input w-full"
                    min={0}
                  />
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Deliverables
                  </label>
                  <textarea
                    {...register('deliverables')}
                    className="input w-full h-20 resize-none"
                    placeholder="List of deliverables..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    className="input w-full h-20 resize-none"
                    placeholder="Additional notes..."
                  />
                </div>
              </>
            )}
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
            onClick={handleSubmit(onSubmit)}
            className="btn-primary px-6 py-2"
          >
            {isEditing ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}