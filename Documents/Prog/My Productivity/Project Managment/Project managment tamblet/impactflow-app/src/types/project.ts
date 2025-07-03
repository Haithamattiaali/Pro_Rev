export interface Project {
  id: string
  name: string
  description: string
  templateId?: string
  ownerId: string
  teamIds: string[]
  createdAt: Date
  updatedAt: Date
  healthScore: number
  status: ProjectStatus
  settings: ProjectSettings
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ProjectSettings {
  approvalRequired: boolean
  emailNotifications: boolean
  dashboardLayout: DashboardLayout[]
}

export interface DashboardLayout {
  widgetId: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export interface Task {
  id: string
  projectId: string
  parentId?: string
  taskId: string
  name: string
  type: TaskType
  wbsCode?: string
  duration: number
  startDate: Date
  endDate: Date
  actualStart?: Date
  actualEnd?: Date
  percentComplete: number
  agility: TaskAgility
  dependencies: string[]
  dependencyType?: DependencyType
  assigneeId?: string
  teamId?: string
  lagLead: number
  impactScore: number
  riskScore: number
  criticalityLevel: CriticalityLevel
  priorityScore: number
  resourceAssignment: string
  resourceLoad: number
  costBudget: number
  actualCost: number
  status: TaskStatus
  healthIndicator: HealthIndicator
  milestone: boolean
  deliverables: string
  blockingTasks: string[]
  blockedBy: string[]
  totalFloat: number
  freeFloat: number
  criticalPath: boolean
  weightedProgress: number
  rolledUpProgress: number
  varianceDays: number
  spi: number
  cpi: number
  riskMitigation?: string
  lessonsLearned?: string
  notes?: string
  customFields?: Record<string, any>
}

export enum TaskType {
  PARENT = 'Parent',
  CHILD = 'Child',
  MILESTONE = 'Milestone',
  SUMMARY = 'Summary',
}

export enum TaskAgility {
  PARALLEL = 'Parallel',
  SEQUENTIAL = 'Sequential',
  START_TO_START = 'Start-to-Start',
  FINISH_TO_FINISH = 'Finish-to-Finish',
}

export enum DependencyType {
  FS = 'FS',
  SS = 'SS',
  FF = 'FF',
  SF = 'SF',
  FS_PLUS = 'FS+',
  SS_PLUS = 'SS+',
  FF_PLUS = 'FF+',
  SF_PLUS = 'SF+',
}

export enum CriticalityLevel {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  MINIMAL = 'Minimal',
}

export enum TaskStatus {
  NOT_STARTED = 'Not Started',
  PLANNING = 'Planning',
  IN_PROGRESS = 'In Progress',
  TESTING = 'Testing',
  REVIEW = 'Review',
  COMPLETE = 'Complete',
  ON_HOLD = 'On Hold',
  CANCELLED = 'Cancelled',
  DELAYED = 'Delayed',
  BLOCKED = 'Blocked',
}

export enum HealthIndicator {
  GREEN = 'Green',
  YELLOW = 'Yellow',
  ORANGE = 'Orange',
  RED = 'Red',
  BLACK = 'Black',
}

export interface Update {
  id: string
  taskId: string
  userId: string
  type: UpdateType
  changes: Record<string, any>
  status: UpdateStatus
  approverId?: string
  comments: Comment[]
  createdAt: Date
}

export enum UpdateType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  PROGRESS_UPDATE = 'PROGRESS_UPDATE',
  DATE_CHANGE = 'DATE_CHANGE',
  RESOURCE_CHANGE = 'RESOURCE_CHANGE',
  CUSTOM_FIELD = 'CUSTOM_FIELD',
}

export enum UpdateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVERTED = 'REVERTED',
}

export interface Comment {
  id: string
  userId: string
  text: string
  createdAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  organizationId: string
  avatar?: string
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  TEAM_MEMBER = 'TEAM_MEMBER',
  STAKEHOLDER = 'STAKEHOLDER',
}