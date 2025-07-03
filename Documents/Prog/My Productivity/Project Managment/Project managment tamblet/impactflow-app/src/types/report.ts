export interface ReportWidget {
  id: string
  type: WidgetType
  title: string
  description?: string
  position: { x: number; y: number }
  size: { w: number; h: number }
  config: WidgetConfig
  data?: any
}

export enum WidgetType {
  PROJECT_OVERVIEW = 'PROJECT_OVERVIEW',
  TASK_PROGRESS = 'TASK_PROGRESS',
  RESOURCE_UTILIZATION = 'RESOURCE_UTILIZATION',
  BUDGET_BURNDOWN = 'BUDGET_BURNDOWN',
  RISK_HEATMAP = 'RISK_HEATMAP',
  MILESTONE_TIMELINE = 'MILESTONE_TIMELINE',
  TEAM_PERFORMANCE = 'TEAM_PERFORMANCE',
  CRITICAL_PATH = 'CRITICAL_PATH',
}

export interface WidgetConfig {
  projectId?: string
  dateRange?: DateRange
  filters?: Record<string, any>
  chartOptions?: any
  displayOptions?: DisplayOptions
}

export interface DateRange {
  start: Date
  end: Date
}

export interface DisplayOptions {
  showLegend?: boolean
  showTooltips?: boolean
  showLabels?: boolean
  colorScheme?: string
  height?: number
}

export interface Report {
  id: string
  name: string
  description?: string
  projectId: string
  widgets: ReportWidget[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  isTemplate?: boolean
  templateType?: ReportTemplateType
}

export enum ReportTemplateType {
  EXECUTIVE_SUMMARY = 'EXECUTIVE_SUMMARY',
  WEEKLY_STATUS = 'WEEKLY_STATUS',
  RESOURCE_PLANNING = 'RESOURCE_PLANNING',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  CUSTOM = 'CUSTOM',
}

export interface WidgetLibraryItem {
  type: WidgetType
  name: string
  description: string
  icon: string
  defaultSize: { w: number; h: number }
  minSize: { w: number; h: number }
  maxSize: { w: number; h: number }
}