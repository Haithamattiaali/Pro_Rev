'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileSpreadsheet, RefreshCw, Download, Settings } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { ProjectPulse } from '@/components/dashboard/ProjectPulse'
import { ImpactMatrix } from '@/components/dashboard/ImpactMatrix'
import { ResourceOrchestra } from '@/components/dashboard/ResourceOrchestra'
import { TimelineRhythm } from '@/components/dashboard/TimelineRhythm'
import { DecisionCommand } from '@/components/dashboard/DecisionCommand'
import { PredictiveInsights } from '@/components/dashboard/PredictiveInsights'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { ExcelImport } from '@/components/excel/ExcelImport'
import { TeamCollaboration } from '@/components/team/TeamCollaboration'
import { ApprovalForm } from '@/components/team/ApprovalForm'
import { ReportBuilder } from '@/components/reports/ReportBuilder'
import { UserMenu } from '@/components/auth/UserMenu'
import { useProjectStore } from '@/store/projectStore'
import { Task, Project, TaskType, TaskStatus, TaskAgility, CriticalityLevel, HealthIndicator, User } from '@/types/project'
import { Report } from '@/types/report'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { emitTaskCreate, emitTaskUpdate, emitTaskDelete } from '@/lib/socket'

// Mock data for demonstration
const mockProject: Project = {
  id: '1',
  name: 'Digital Transformation Initiative',
  description: 'Company-wide digital transformation project',
  ownerId: 'user1',
  teamIds: ['team1', 'team2'],
  createdAt: new Date(),
  updatedAt: new Date(),
  healthScore: 76,
  status: 'ACTIVE' as any,
  settings: {
    approvalRequired: true,
    emailNotifications: true,
    dashboardLayout: [],
  },
}

const mockTasks: Task[] = [
  {
    id: 'P001',
    projectId: '1',
    taskId: 'P001',
    name: 'Digital Transformation Initiative',
    type: 'Parent' as any,
    wbsCode: '1',
    duration: 120,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-17'),
    actualStart: new Date('2024-01-01'),
    percentComplete: 35,
    agility: 'Sequential' as any,
    dependencies: [],
    lagLead: 0,
    impactScore: 70,
    riskScore: 30,
    criticalityLevel: 'Critical' as any,
    priorityScore: 54,
    resourceAssignment: 'Program Management',
    resourceLoad: 100,
    costBudget: 5000000,
    actualCost: 1750000,
    status: 'In Progress' as any,
    healthIndicator: 'Yellow' as any,
    milestone: false,
    deliverables: 'Complete digital transformation',
    blockingTasks: [],
    blockedBy: [],
    totalFloat: 0,
    freeFloat: 0,
    criticalPath: true,
    weightedProgress: 35,
    rolledUpProgress: 35,
    varianceDays: 0,
    spi: 0.8,
    cpi: 1.0,
    notes: 'Strategic initiative for 2024',
  },
  {
    id: 'C003',
    projectId: '1',
    taskId: 'C003',
    name: 'Future State Design',
    type: 'Child' as any,
    parentId: 'P002',
    wbsCode: '1.1.3',
    duration: 7,
    startDate: new Date('2024-01-07'),
    endDate: new Date('2024-01-17'),
    actualStart: new Date('2024-01-07'),
    actualEnd: new Date('2024-01-13'),
    percentComplete: 100,
    agility: 'Sequential' as any,
    dependencies: ['C001', 'C002'],
    dependencyType: 'FS' as any,
    lagLead: 0,
    impactScore: 86,
    riskScore: 0,
    criticalityLevel: 'Critical' as any,
    priorityScore: 51,
    resourceAssignment: 'Solution Architects',
    resourceLoad: 100,
    costBudget: 100000,
    actualCost: 98000,
    status: 'Complete' as any,
    healthIndicator: 'Green' as any,
    milestone: false,
    deliverables: 'To-be architecture',
    blockingTasks: ['C004'],
    blockedBy: ['C001', 'C002'],
    totalFloat: 0,
    freeFloat: 0,
    criticalPath: true,
    weightedProgress: 100,
    rolledUpProgress: 100,
    varianceDays: 0,
    spi: 1.0,
    cpi: 0.98,
    notes: 'Microservices architecture approved',
  },
  {
    id: 'C004',
    projectId: '1',
    taskId: 'C004',
    name: 'Infrastructure Setup',
    type: 'Child' as any,
    parentId: 'P002',
    wbsCode: '1.1.4',
    duration: 14,
    startDate: new Date('2024-01-14'),
    endDate: new Date('2024-01-31'),
    actualStart: new Date('2024-01-14'),
    percentComplete: 85,
    agility: 'Parallel' as any,
    dependencies: ['C003'],
    dependencyType: 'FS' as any,
    lagLead: 0,
    impactScore: 78,
    riskScore: 45,
    criticalityLevel: 'High' as any,
    priorityScore: 62,
    resourceAssignment: 'DevOps Team, Cloud Architects',
    resourceLoad: 120,
    costBudget: 250000,
    actualCost: 280000,
    status: 'In Progress' as any,
    healthIndicator: 'Yellow' as any,
    milestone: false,
    deliverables: 'Cloud infrastructure, CI/CD pipeline',
    blockingTasks: ['C005', 'C006'],
    blockedBy: ['C003'],
    totalFloat: 5,
    freeFloat: 2,
    criticalPath: false,
    weightedProgress: 85,
    rolledUpProgress: 85,
    varianceDays: 3,
    spi: 0.75,
    cpi: 0.89,
    notes: 'Cost overrun due to additional security requirements',
  },
  {
    id: 'C005',
    projectId: '1',
    taskId: 'C005',
    name: 'API Development',
    type: 'Child' as any,
    parentId: 'P003',
    wbsCode: '1.2.1',
    duration: 21,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-28'),
    percentComplete: 40,
    agility: 'Parallel' as any,
    dependencies: ['C004'],
    dependencyType: 'FS' as any,
    lagLead: 0,
    impactScore: 82,
    riskScore: 55,
    criticalityLevel: 'Critical' as any,
    priorityScore: 68,
    resourceAssignment: 'Backend Team',
    resourceLoad: 100,
    costBudget: 180000,
    actualCost: 72000,
    status: 'Blocked' as any,
    healthIndicator: 'Red' as any,
    milestone: false,
    deliverables: 'REST APIs, GraphQL endpoints',
    blockingTasks: ['C007'],
    blockedBy: ['C004'],
    totalFloat: 0,
    freeFloat: 0,
    criticalPath: true,
    weightedProgress: 40,
    rolledUpProgress: 40,
    varianceDays: 5,
    spi: 0.6,
    cpi: 1.0,
    notes: 'Blocked due to infrastructure dependencies',
  },
  {
    id: 'C006',
    projectId: '1',
    taskId: 'C006',
    name: 'UI Component Library',
    type: 'Child' as any,
    parentId: 'P003',
    wbsCode: '1.2.2',
    duration: 14,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-20'),
    percentComplete: 65,
    agility: 'Parallel' as any,
    dependencies: [],
    lagLead: 0,
    impactScore: 70,
    riskScore: 25,
    criticalityLevel: 'Medium' as any,
    priorityScore: 48,
    resourceAssignment: 'UI/UX Team, Frontend Team',
    resourceLoad: 80,
    costBudget: 120000,
    actualCost: 78000,
    status: 'In Progress' as any,
    healthIndicator: 'Green' as any,
    milestone: false,
    deliverables: 'Design system, React components',
    blockingTasks: ['C008'],
    blockedBy: [],
    totalFloat: 10,
    freeFloat: 5,
    criticalPath: false,
    weightedProgress: 65,
    rolledUpProgress: 65,
    varianceDays: 0,
    spi: 0.95,
    cpi: 1.0,
    notes: 'On track with minor adjustments',
  },
  {
    id: 'M001',
    projectId: '1',
    taskId: 'M001',
    name: 'Phase 1 Complete',
    type: 'Milestone' as any,
    wbsCode: '1.1.99',
    duration: 0,
    startDate: new Date('2024-01-31'),
    endDate: new Date('2024-01-31'),
    percentComplete: 75,
    agility: 'Sequential' as any,
    dependencies: ['C004'],
    impactScore: 95,
    riskScore: 60,
    criticalityLevel: 'Critical' as any,
    priorityScore: 77,
    resourceAssignment: 'Program Management',
    resourceLoad: 0,
    costBudget: 0,
    actualCost: 0,
    status: 'Delayed' as any,
    healthIndicator: 'Orange' as any,
    milestone: true,
    deliverables: 'Phase 1 sign-off',
    blockingTasks: [],
    blockedBy: ['C004'],
    totalFloat: 0,
    freeFloat: 0,
    criticalPath: true,
    weightedProgress: 75,
    rolledUpProgress: 75,
    varianceDays: 7,
    spi: 0.7,
    cpi: 1.0,
    notes: 'Delayed due to infrastructure issues',
  },
  {
    id: 'C007',
    projectId: '1',
    taskId: 'C007',
    name: 'Database Schema Design',
    type: 'Child' as any,
    parentId: 'P003',
    wbsCode: '1.2.3',
    duration: 7,
    startDate: new Date('2024-02-05'),
    endDate: new Date('2024-02-13'),
    percentComplete: 90,
    agility: 'Sequential' as any,
    dependencies: [],
    impactScore: 88,
    riskScore: 20,
    criticalityLevel: 'High' as any,
    priorityScore: 54,
    resourceAssignment: 'Database Team, Solution Architects',
    resourceLoad: 60,
    costBudget: 50000,
    actualCost: 45000,
    status: 'Review' as any,
    healthIndicator: 'Green' as any,
    milestone: false,
    deliverables: 'Database design document, migration scripts',
    blockingTasks: ['C005', 'C009'],
    blockedBy: [],
    totalFloat: 0,
    freeFloat: 0,
    criticalPath: true,
    weightedProgress: 90,
    rolledUpProgress: 90,
    varianceDays: 0,
    spi: 1.0,
    cpi: 1.1,
    notes: 'Pending approval from architecture board',
  },
]

// Mock current user - in a real app this would come from auth context
const mockCurrentUser: User = {
  id: 'user1',
  email: 'john.doe@example.com',
  name: 'John Doe',
  role: 'PROJECT_MANAGER' as any,
  organizationId: 'org1',
}

export default function ProjectDashboard() {
  const params = useParams()
  const { user } = useAuth()
  const { currentProject, tasks, setCurrentProject, setTasks, addTask, updateTask, deleteTask } = useProjectStore()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [showExcelImport, setShowExcelImport] = useState(false)
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const currentUser = user || mockCurrentUser
  
  // Initialize Socket.io connection
  const { isConnected } = useSocket({
    projectId: params.id as string,
    user: currentUser,
    autoConnect: true,
  })

  useEffect(() => {
    // In a real app, fetch project and tasks from API
    setCurrentProject(mockProject)
    setTasks(mockTasks)
  }, [params.id, setCurrentProject, setTasks])

  // Handle task operations with real-time sync
  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates)
    emitTaskUpdate(taskId, updates)
  }

  const handleTaskDelete = (taskId: string) => {
    deleteTask(taskId)
    emitTaskDelete(taskId)
  }

  const handleTaskCreate = (task: Task) => {
    console.log('Creating task:', task)
    try {
      addTask(task)
      console.log('Task added to store')
      emitTaskCreate(task)
      console.log('Task emitted via socket')
      setShowTaskForm(false)
      toast.success('Task created successfully')
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task. Please try again.')
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'team', label: 'Team' },
    { id: 'reports', label: 'Reports' },
  ]

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  {currentProject.name}
                </h1>
                <p className="text-sm text-neutral-600 mt-1">
                  {currentProject.description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isConnected && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                    <span>Connected</span>
                  </div>
                )}
                <NotificationCenter projectId={params.id as string} user={currentUser} />
                <button 
                  onClick={() => setShowExcelImport(true)}
                  className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Import Excel
                </button>
                <button className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Sync
                </button>
                <button className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <Link
                  href="/settings"
                  className="btn-secondary p-2 inline-flex"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <UserMenu />
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <div className="text-sm text-neutral-600 mb-1">Total Tasks</div>
                <div className="text-3xl font-bold">{tasks.length}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  {tasks.filter(t => t.status === 'Complete').length} completed
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <div className="text-sm text-neutral-600 mb-1">Overall Progress</div>
                <div className="text-3xl font-bold">
                  {Math.round(tasks.reduce((sum, t) => sum + t.percentComplete, 0) / tasks.length)}%
                </div>
                <div className="text-xs text-status-success mt-1">↑ 5% this week</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <div className="text-sm text-neutral-600 mb-1">At Risk</div>
                <div className="text-3xl font-bold text-status-danger">
                  {tasks.filter(t => t.riskScore > 60).length}
                </div>
                <div className="text-xs text-neutral-500 mt-1">tasks need attention</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <div className="text-sm text-neutral-600 mb-1">Budget Used</div>
                <div className="text-3xl font-bold">42%</div>
                <div className="text-xs text-neutral-500 mt-1">$1.8M of $4.2M</div>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-2 gap-6">
              <ProjectPulse tasks={tasks} projectId={params.id as string} currentUser={currentUser} />
              <ImpactMatrix tasks={tasks} />
              <ResourceOrchestra tasks={tasks} />
              <TimelineRhythm tasks={tasks} />
              <DecisionCommand tasks={tasks} />
              <PredictiveInsights tasks={tasks} />
            </div>
          </motion.div>
        )}

        {activeTab === 'tasks' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TaskList 
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onTaskCreate={() => {
                setEditingTask(undefined)
                setShowTaskForm(true)
              }}
              onTaskEdit={(task) => {
                setEditingTask(task)
                setShowTaskForm(true)
              }}
              onTaskCopy={(taskCopy) => {
                setEditingTask(taskCopy)
                setShowTaskForm(true)
              }}
              projectId={params.id as string}
              currentUser={currentUser}
            />
          </motion.div>
        )}

        {activeTab === 'team' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TeamCollaboration 
              tasks={tasks}
              currentUser={currentUser as any}
              projectId={params.id as string}
            />
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ReportBuilder 
              projectId={params.id as string}
              currentUser={currentUser}
              onSave={(report: Report) => {
                // Save report logic
                console.log('Saving report:', report)
                toast.success('Report saved successfully')
              }}
            />
          </motion.div>
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          tasks={tasks}
          onSave={(taskData) => {
            console.log('onSave called with taskData:', taskData)
            
            // Check if this is a copy operation (editingTask has 'copy-' prefix in ID)
            const isCopyOperation = editingTask?.id?.startsWith('copy-')
            
            if (editingTask && !isCopyOperation) {
              // Update existing task
              handleTaskUpdate(editingTask.id, taskData)
              toast.success('Task updated successfully!')
            } else {
              // Create new task (or copy)
              const newTask: Task = {
                ...taskData,
                id: `T${Date.now()}`,
                projectId: currentProject?.id || '1',
                taskId: `T${Date.now()}`,
              } as Task
              console.log('New task object:', newTask)
              handleTaskCreate(newTask)
              // Note: handleTaskCreate already shows a success toast
            }
            
            // Close the form and reset state
            setShowTaskForm(false)
            setEditingTask(undefined)
          }}
          onCancel={() => {
            setShowTaskForm(false)
            setEditingTask(undefined)
          }}
        />
      )}

      {/* Excel Import Modal */}
      {showExcelImport && (
        <ExcelImport
          existingTasks={tasks}
          onImport={(importedTasks) => {
            // Add imported tasks to the project
            const newTasks = importedTasks.map((task, index) => ({
              ...task,
              id: task.id || `imported-${Date.now()}-${index}`,
              projectId: currentProject?.id || '1',
              taskId: task.taskId || `imported-${Date.now()}-${index}`,
            } as Task))
            
            setTasks([...tasks, ...newTasks])
            toast.success(`Successfully imported ${newTasks.length} tasks`)
            setActiveTab('tasks') // Switch to tasks tab
          }}
          onClose={() => setShowExcelImport(false)}
        />
      )}
    </div>
  )
}