import * as XLSX from 'xlsx'
import { Task, TaskType, TaskStatus, TaskAgility, CriticalityLevel, DependencyType, HealthIndicator } from '@/types/project'
import { calculateImpactScore, calculateRiskScore, calculateHealthIndicator, calculatePriorityScore } from './calculations'

export interface ColumnMapping {
  sourceColumn: string
  targetField: keyof Task
  transform?: (value: any) => any
}

export interface ParseResult {
  success: boolean
  tasks: Partial<Task>[]
  errors: string[]
  warnings: string[]
}

// Default column mappings based on our template
export const defaultColumnMappings: Record<keyof Task, string[]> = {
  id: ['Task ID', 'ID', 'Task_ID'],
  name: ['Task Name', 'Name', 'Title', 'Task'],
  type: ['Task Type', 'Type'],
  parentId: ['Parent Task ID', 'Parent ID', 'Parent'],
  wbsCode: ['WBS Code', 'WBS'],
  duration: ['Duration (Days)', 'Duration', 'Days'],
  startDate: ['Start Date', 'Start', 'Begin Date'],
  endDate: ['End Date', 'End', 'Finish Date'],
  actualStart: ['Actual Start', 'Actual Start Date'],
  actualEnd: ['Actual End', 'Actual End Date'],
  percentComplete: ['% Complete', 'Progress', 'Percent Complete'],
  agility: ['Task Agility', 'Agility'],
  dependencies: ['Dependencies', 'Predecessors'],
  dependencyType: ['Dependency Type', 'Dep Type'],
  lagLead: ['Lag/Lead', 'Lag', 'Lead'],
  criticalityLevel: ['Criticality Level', 'Criticality', 'Priority'],
  resourceAssignment: ['Resource Assignment', 'Resource', 'Assigned To'],
  resourceLoad: ['Resource Load %', 'Load %', 'Utilization'],
  costBudget: ['Cost Budget', 'Budget', 'Planned Cost'],
  actualCost: ['Actual Cost', 'Cost', 'Spent'],
  status: ['Status', 'Task Status'],
  milestone: ['Milestone', 'Is Milestone'],
  deliverables: ['Deliverables', 'Outputs'],
  blockingTasks: ['Blocking Tasks', 'Blocks'],
  blockedBy: ['Blocked By', 'Blocked'],
  notes: ['Notes', 'Comments', 'Description'],
  // Calculated fields - may not be in source
  impactScore: ['Impact Score'],
  riskScore: ['Risk Score'],
  healthIndicator: ['Health Indicator', 'Health'],
  priorityScore: ['Priority Score'],
  totalFloat: ['Total Float', 'Float'],
  freeFloat: ['Free Float'],
  criticalPath: ['Critical Path', 'Is Critical'],
  weightedProgress: ['Weighted Progress'],
  rolledUpProgress: ['Rolled Up Progress'],
  varianceDays: ['Variance Days', 'Variance'],
  spi: ['SPI', 'Schedule Performance'],
  cpi: ['CPI', 'Cost Performance'],
  riskMitigation: ['Risk Mitigation', 'Mitigation'],
  lessonsLearned: ['Lessons Learned', 'Lessons'],
  taskId: ['Task ID'], // Added missing fields
  projectId: ['Project ID'],
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
  const result: ParseResult = {
    success: false,
    tasks: [],
    errors: [],
    warnings: [],
  }

  try {
    // Read file
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array', cellDates: true })
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false })
    
    if (!jsonData.length) {
      result.errors.push('No data found in Excel file')
      return result
    }

    // Auto-detect columns
    const headers = Object.keys(jsonData[0])
    const mappings = autoDetectColumns(headers)
    
    // Parse each row
    jsonData.forEach((row: any, index: number) => {
      try {
        const task = parseRow(row, mappings, index + 2) // +2 for header row
        result.tasks.push(task)
      } catch (error) {
        result.warnings.push(`Row ${index + 2}: ${error}`)
      }
    })

    // Calculate derived fields
    result.tasks = calculateDerivedFields(result.tasks)
    
    // Validate data
    const validation = validateTasks(result.tasks)
    result.warnings.push(...validation.warnings)
    
    if (validation.errors.length > 0) {
      result.errors.push(...validation.errors)
    } else {
      result.success = true
    }
    
  } catch (error) {
    result.errors.push(`Failed to parse Excel file: ${error}`)
  }

  return result
}

function autoDetectColumns(headers: string[]): Map<keyof Task, string> {
  const mappings = new Map<keyof Task, string>()
  
  for (const [field, possibleNames] of Object.entries(defaultColumnMappings)) {
    for (const header of headers) {
      if (possibleNames.some(name => 
        header.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(header.toLowerCase())
      )) {
        mappings.set(field as keyof Task, header)
        break
      }
    }
  }
  
  return mappings
}

function parseRow(row: any, mappings: Map<keyof Task, string>, rowNum: number): Partial<Task> {
  const task: Partial<Task> = {}
  
  // Parse basic fields
  for (const [field, column] of mappings.entries()) {
    const value = row[column]
    if (value !== undefined && value !== null && value !== '') {
      task[field] = parseFieldValue(field, value)
    }
  }
  
  // Ensure required fields
  if (!task.id) {
    task.id = `TASK-${rowNum}`
  }
  
  if (!task.name) {
    throw new Error('Task name is required')
  }
  
  // Set defaults
  task.type = task.type || TaskType.CHILD
  task.status = task.status || TaskStatus.NOT_STARTED
  task.percentComplete = task.percentComplete || 0
  task.criticalityLevel = task.criticalityLevel || CriticalityLevel.MEDIUM
  task.agility = task.agility || TaskAgility.SEQUENTIAL
  
  return task
}

function parseFieldValue(field: string, value: any): any {
  // Handle special field types
  switch (field) {
    case 'startDate':
    case 'endDate':
    case 'actualStart':
    case 'actualEnd':
      return parseDate(value)
      
    case 'duration':
    case 'lagLead':
    case 'resourceLoad':
    case 'percentComplete':
    case 'totalFloat':
    case 'freeFloat':
    case 'varianceDays':
      return parseNumber(value)
      
    case 'costBudget':
    case 'actualCost':
      return parseCurrency(value)
      
    case 'spi':
    case 'cpi':
      return parseFloat(value) || 1.0
      
    case 'dependencies':
    case 'blockingTasks':
    case 'blockedBy':
      return parseList(value)
      
    case 'milestone':
    case 'criticalPath':
      return parseBoolean(value)
      
    case 'type':
      return parseTaskType(value)
      
    case 'status':
      return parseTaskStatus(value)
      
    case 'agility':
      return parseTaskAgility(value)
      
    case 'criticalityLevel':
      return parseCriticalityLevel(value)
      
    case 'dependencyType':
      return parseDependencyType(value)
      
    case 'healthIndicator':
      return parseHealthIndicator(value)
      
    default:
      return value
  }
}

function parseDate(value: any): Date | undefined {
  if (!value) return undefined
  
  // Excel serial date
  if (typeof value === 'number') {
    return new Date((value - 25569) * 86400 * 1000)
  }
  
  // String date
  const date = new Date(value)
  return isNaN(date.getTime()) ? undefined : date
}

function parseNumber(value: any): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Remove % sign and parse
    const cleaned = value.replace(/[%,]/g, '')
    return parseFloat(cleaned) || 0
  }
  return 0
}

function parseCurrency(value: any): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Remove currency symbols and parse
    const cleaned = value.replace(/[$,]/g, '')
    return parseFloat(cleaned) || 0
  }
  return 0
}

function parseList(value: any): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(s => s)
  }
  return []
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return value.toLowerCase() === 'yes' || value.toLowerCase() === 'true'
  }
  return false
}

function parseTaskType(value: any): TaskType {
  const val = String(value).toLowerCase()
  if (val.includes('parent')) return TaskType.PARENT
  if (val.includes('milestone')) return TaskType.MILESTONE
  if (val.includes('summary')) return TaskType.SUMMARY
  return TaskType.CHILD
}

function parseTaskStatus(value: any): TaskStatus {
  const val = String(value).toLowerCase()
  if (val.includes('complete')) return TaskStatus.COMPLETE
  if (val.includes('progress')) return TaskStatus.IN_PROGRESS
  if (val.includes('planning')) return TaskStatus.PLANNING
  if (val.includes('testing')) return TaskStatus.TESTING
  if (val.includes('review')) return TaskStatus.REVIEW
  if (val.includes('hold')) return TaskStatus.ON_HOLD
  if (val.includes('cancel')) return TaskStatus.CANCELLED
  if (val.includes('delay')) return TaskStatus.DELAYED
  if (val.includes('block')) return TaskStatus.BLOCKED
  return TaskStatus.NOT_STARTED
}

function parseTaskAgility(value: any): TaskAgility {
  const val = String(value).toLowerCase()
  if (val.includes('parallel')) return TaskAgility.PARALLEL
  if (val.includes('start')) return TaskAgility.START_TO_START
  if (val.includes('finish')) return TaskAgility.FINISH_TO_FINISH
  return TaskAgility.SEQUENTIAL
}

function parseCriticalityLevel(value: any): CriticalityLevel {
  const val = String(value).toLowerCase()
  if (val.includes('critical')) return CriticalityLevel.CRITICAL
  if (val.includes('high')) return CriticalityLevel.HIGH
  if (val.includes('low')) return CriticalityLevel.LOW
  if (val.includes('minimal')) return CriticalityLevel.MINIMAL
  return CriticalityLevel.MEDIUM
}

function parseDependencyType(value: any): DependencyType | undefined {
  if (!value) return undefined
  const val = String(value).toUpperCase()
  return DependencyType[val as keyof typeof DependencyType]
}

function parseHealthIndicator(value: any): HealthIndicator {
  const val = String(value).toLowerCase()
  if (val.includes('green')) return HealthIndicator.GREEN
  if (val.includes('yellow')) return HealthIndicator.YELLOW
  if (val.includes('orange')) return HealthIndicator.ORANGE
  if (val.includes('red')) return HealthIndicator.RED
  if (val.includes('black')) return HealthIndicator.BLACK
  return HealthIndicator.YELLOW
}

function calculateDerivedFields(tasks: Partial<Task>[]): Partial<Task>[] {
  return tasks.map(task => {
    // Calculate impact score if not provided
    if (!task.impactScore) {
      task.impactScore = calculateImpactScore(task)
    }
    
    // Calculate risk score if not provided
    if (!task.riskScore) {
      task.riskScore = calculateRiskScore(task)
    }
    
    // Calculate health indicator if not provided
    if (!task.healthIndicator) {
      task.healthIndicator = calculateHealthIndicator(task)
    }
    
    // Calculate priority score
    task.priorityScore = calculatePriorityScore(task.impactScore, task.riskScore)
    
    // Set critical path if float is 0
    if (task.totalFloat === 0) {
      task.criticalPath = true
    }
    
    return task
  })
}

function validateTasks(tasks: Partial<Task>[]): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check for duplicate IDs
  const ids = new Set<string>()
  tasks.forEach(task => {
    if (task.id) {
      if (ids.has(task.id)) {
        errors.push(`Duplicate task ID: ${task.id}`)
      }
      ids.add(task.id)
    }
  })
  
  // Validate parent-child relationships
  const taskMap = new Map(tasks.map(t => [t.id, t]))
  tasks.forEach(task => {
    if (task.parentId && !taskMap.has(task.parentId)) {
      warnings.push(`Task ${task.id} references non-existent parent: ${task.parentId}`)
    }
    
    // Validate dependencies
    task.dependencies?.forEach(dep => {
      if (!taskMap.has(dep)) {
        warnings.push(`Task ${task.id} has dependency on non-existent task: ${dep}`)
      }
    })
  })
  
  // Check date logic
  tasks.forEach(task => {
    if (task.startDate && task.endDate && task.startDate > task.endDate) {
      warnings.push(`Task ${task.id}: End date is before start date`)
    }
  })
  
  return { errors, warnings }
}