/**
 * Core Type Definitions for Dashboard Export System
 * Based on the comprehensive technical implementation plan
 */

// Dashboard Virtual DOM (DVDOM) Types
export interface DashboardVirtualDOM {
  version: '1.0.0';
  metadata: {
    captureTimestamp: string;
    dashboardId: string;
    dashboardVersion: string;
    userContext: UserContext;
    environmentContext: EnvironmentContext;
  };
  
  structure: {
    root: DVDOMNode;
    assets: AssetRegistry;
    dataBindings: DataBindingRegistry;
    interactions: InteractionRegistry;
  };
  
  state: {
    filters: FilterState[];
    selections: SelectionState[];
    viewConfiguration: ViewConfig;
    themeConfiguration: ThemeConfig;
  };
}

export interface DVDOMNode {
  id: string;
  type: 'container' | 'widget' | 'element';
  subtype?: 'chart' | 'table' | 'metric' | 'text' | 'image' | 'filter';
  
  properties: {
    layout: LayoutProperties;
    style: StyleProperties;
    data?: DataProperties;
    content?: ContentProperties;
  };
  
  children: DVDOMNode[];
  
  metadata: {
    reactComponent?: string;
    dataBindingId?: string;
    interactionIds?: string[];
    exportHints?: ExportHints;
  };
}

// Universal Export Representation (UER) Types
export interface UniversalExportRepresentation {
  version: '2.0.0';
  
  document: {
    title: string;
    description: string;
    author: UserInfo;
    created: string;
    modified: string;
    tags: string[];
  };
  
  pages: ExportPage[];
  
  resources: {
    styles: GlobalStyleDefinitions;
    data: DataResourceRegistry;
    media: MediaResourceRegistry;
    templates: TemplateRegistry;
  };
  
  exportConfig: {
    targetFormats: ExportFormat[];
    qualitySettings: QualityConfig;
    interactivityLevel: InteractivityConfig;
    accessibility: AccessibilityConfig;
  };
}

export interface ExportPage {
  id: string;
  title: string;
  type: 'dashboard' | 'report' | 'slide';
  
  layout: {
    type: 'fixed' | 'flow' | 'grid';
    dimensions?: { width: number; height: number };
    margins: Margins;
    columns?: number;
    gap?: number;
  };
  
  sections: ExportSection[];
  
  metadata: {
    pageNumber?: number;
    tags: string[];
    notes: string;
    exportPriority: number;
  };
}

export interface ExportSection {
  id: string;
  type: SectionType;
  
  content: {
    primary: ExportContent;
    supporting?: ExportContent[];
    annotations?: Annotation[];
  };
  
  layout: {
    position: Position;
    size: Size;
    zIndex: number;
    alignment: Alignment;
    padding: Padding;
  };
  
  styling: {
    background: BackgroundStyle;
    border: BorderStyle;
    shadow: ShadowStyle;
    opacity: number;
    blendMode?: BlendMode;
  };
  
  behavior: {
    visibility: VisibilityRules;
    interactions: InteractionConfig[];
    animations: AnimationConfig[];
  };
}

// Export Content Types
export type ExportContent = 
  | ChartContent
  | TableContent
  | TextContent
  | MetricContent
  | ImageContent
  | CompositeContent;

export interface ChartContent {
  type: 'chart';
  chartType: string;
  data: ChartData;
  config: ChartConfiguration;
  fallback: {
    image?: string; // Base64 encoded fallback
    description: string;
  };
}

export interface TableContent {
  type: 'table';
  headers: TableHeader[];
  rows: TableRow[];
  config: TableConfiguration;
  styling: TableStyling;
}

export interface MetricContent {
  type: 'metric';
  label: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    percentage: boolean;
  };
  styling: MetricStyling;
}

// Asset Registry Types
export interface AssetRegistry {
  images: Record<string, ImageAsset>;
  fonts: Record<string, FontAsset>;
  icons: Record<string, IconAsset>;
  data: Record<string, DataAsset>;
}

export interface ImageAsset {
  originalUrl: string;
  base64Data?: string;
  mimeType: string;
  dimensions: { width: number; height: number };
  usage: AssetUsage[];
}

// Export Formats
export type ExportFormat = 'pdf' | 'powerpoint' | 'excel' | 'image' | 'html' | 'json';

// Export Options
export interface ExportOptions {
  scope: ExportScope;
  formats: ExportFormat[];
  quality: QualityLevel;
  includeInteractions: boolean;
  includeAnimations: boolean;
  preserveLinks: boolean;
  watermark?: WatermarkConfig;
  security?: SecurityConfig;
}

export interface ExportScope {
  type: 'full' | 'selection' | 'page' | 'custom';
  selectionIds?: string[];
  pageIds?: string[];
  customRange?: CustomRange;
}

// Quality Levels
export type QualityLevel = 'low' | 'medium' | 'high' | 'maximum';

// Supporting Types
export interface LayoutProperties {
  display: string;
  position: string;
  top?: string | number;
  left?: string | number;
  width: string | number;
  height: string | number;
  margin: string;
  padding: string;
  flex?: string;
  grid?: string;
}

export interface StyleProperties {
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  opacity?: number;
  transform?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Export Session Management
export interface ExportSession {
  id: string;
  status: ExportStatus;
  request: ExportRequest;
  progress: ExportProgress;
  results?: ExportResults;
  errors?: ExportError[];
}

export type ExportStatus = 
  | 'initiated'
  | 'capturing'
  | 'translating'
  | 'compiling'
  | 'delivering'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ExportProgress {
  phase: string;
  percentage: number;
  message: string;
  estimatedTimeRemaining?: number;
}

// Error Types
export interface ExportError {
  code: ExportErrorCode;
  message: string;
  phase: string;
  recoverable: boolean;
  context?: Record<string, any>;
}

export enum ExportErrorCode {
  // Capture errors (1xxx)
  CAPTURE_TIMEOUT = 1001,
  CAPTURE_MEMORY_EXCEEDED = 1002,
  CAPTURE_ELEMENT_NOT_FOUND = 1003,
  CAPTURE_STATE_MISMATCH = 1004,
  
  // Translation errors (2xxx)
  TRANSLATION_SCHEMA_INVALID = 2001,
  TRANSLATION_DATA_CORRUPTED = 2002,
  TRANSLATION_VERSION_MISMATCH = 2003,
  
  // Compilation errors (3xxx)
  COMPILATION_UNSUPPORTED_FEATURE = 3001,
  COMPILATION_RESOURCE_NOT_FOUND = 3002,
  COMPILATION_FORMAT_ERROR = 3003,
  
  // Delivery errors (4xxx)
  DELIVERY_STORAGE_FULL = 4001,
  DELIVERY_NETWORK_ERROR = 4002,
  DELIVERY_PERMISSION_DENIED = 4003,
  
  // System errors (5xxx)
  SYSTEM_OUT_OF_MEMORY = 5001,
  SYSTEM_WORKER_CRASHED = 5002,
  SYSTEM_QUEUE_FULL = 5003
}

// Placeholder types (to be expanded)
export interface UserContext {
  userId: string;
  permissions: string[];
  preferences: Record<string, any>;
}

export interface EnvironmentContext {
  viewport: { width: number; height: number };
  devicePixelRatio: number;
  colorScheme: 'light' | 'dark';
  locale: string;
}

export interface FilterState {
  filterId: string;
  value: any;
  appliedAt: string;
}

export interface SelectionState {
  elementId: string;
  selected: boolean;
  timestamp: string;
}

export interface ViewConfig {
  zoom: number;
  scroll: Position;
  layout: string;
}

export interface ThemeConfig {
  name: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
}

export interface DataBindingRegistry {
  [bindingId: string]: {
    source: string;
    target: string;
    transform?: string;
  };
}

export interface InteractionRegistry {
  [interactionId: string]: {
    type: string;
    trigger: string;
    action: string;
    parameters?: Record<string, any>;
  };
}

export interface ExportHints {
  preferredLayout?: string;
  preserveAspectRatio?: boolean;
  minSize?: Size;
  maxSize?: Size;
}

export interface UserInfo {
  id: string;
  name: string;
  email?: string;
}

export type SectionType = 'header' | 'content' | 'footer' | 'sidebar';

export interface Annotation {
  id: string;
  type: 'note' | 'comment' | 'warning';
  text: string;
  author?: string;
  timestamp?: string;
}

export interface Alignment {
  horizontal: 'left' | 'center' | 'right';
  vertical: 'top' | 'middle' | 'bottom';
}

export type Padding = string | { top: number; right: number; bottom: number; left: number };

export interface BackgroundStyle {
  color?: string;
  image?: string;
  gradient?: string;
}

export interface BorderStyle {
  width: string;
  style: string;
  color: string;
  radius?: string;
}

export interface ShadowStyle {
  x: number;
  y: number;
  blur: number;
  spread?: number;
  color: string;
}

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay';

export interface VisibilityRules {
  condition?: string;
  showOnPrint?: boolean;
  showOnScreen?: boolean;
}

export interface InteractionConfig {
  type: 'click' | 'hover' | 'focus';
  action: string;
  target?: string;
  parameters?: Record<string, any>;
}

export interface AnimationConfig {
  type: string;
  duration: number;
  delay?: number;
  easing?: string;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
  metadata?: Record<string, any>;
}

export interface Dataset {
  label: string;
  data: (number | null)[];
  color?: string;
  type?: string;
}

export interface ChartConfiguration {
  type: string;
  options: Record<string, any>;
  plugins?: Record<string, any>;
}

export interface TableHeader {
  key: string;
  label: string;
  type?: string;
  sortable?: boolean;
  width?: string | number;
}

export interface TableRow {
  id: string;
  cells: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface TableConfiguration {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  pageSize?: number;
  currentPage?: number;
}

export interface TableStyling {
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  compact?: boolean;
}

export interface MetricStyling {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  icon?: string;
}

export interface AssetUsage {
  nodeId: string;
  property: string;
}

export interface FontAsset {
  family: string;
  variants: FontVariant[];
  source: 'system' | 'custom' | 'webfont';
  fallbacks: string[];
}

export interface FontVariant {
  weight: number;
  style: 'normal' | 'italic';
  url?: string;
}

export interface IconAsset {
  type: 'svg' | 'font' | 'image';
  data: string;
  size: Size;
}

export interface DataAsset {
  type: 'csv' | 'json' | 'api';
  content: any;
  schema?: Record<string, any>;
}

export interface GlobalStyleDefinitions {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  breakpoints: Record<string, number>;
}

export interface DataResourceRegistry {
  [resourceId: string]: {
    type: string;
    data: any;
    metadata?: Record<string, any>;
  };
}

export interface MediaResourceRegistry {
  [resourceId: string]: {
    type: string;
    url: string;
    data?: string;
    metadata?: Record<string, any>;
  };
}

export interface TemplateRegistry {
  [templateId: string]: {
    name: string;
    type: string;
    content: any;
    variables?: string[];
  };
}

export interface QualityConfig {
  resolution: number;
  compression?: number;
  colorDepth?: number;
  antialiasing?: boolean;
}

export interface InteractivityConfig {
  level: 'none' | 'basic' | 'full';
  preserveLinks?: boolean;
  preserveTooltips?: boolean;
  preserveAnimations?: boolean;
}

export interface AccessibilityConfig {
  includeAltText: boolean;
  includeAriaLabels: boolean;
  includeKeyboardNav: boolean;
  contrastLevel?: 'AA' | 'AAA';
}

export interface WatermarkConfig {
  text: string;
  position: Position;
  opacity: number;
  fontSize?: number;
  color?: string;
}

export interface SecurityConfig {
  encryption?: boolean;
  password?: string;
  permissions?: string[];
  expiryDate?: string;
}

export interface CustomRange {
  start: Position;
  end: Position;
}

export interface ExportRequest {
  dashboardId: string;
  userId: string;
  options: ExportOptions;
  timestamp: string;
}

export interface ExportResults {
  documents: ExportDocument[];
  metadata: ExportMetadata;
}

export interface ExportDocument {
  format: ExportFormat;
  data: Blob | string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface ExportMetadata {
  totalTime: number;
  captureTime: number;
  translationTime: number;
  compilationTime: number;
  elementsProcessed: number;
  warnings: string[];
}

export interface TextContent {
  type: 'text';
  text: string;
  formatting?: TextFormatting;
}

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: string;
  fontFamily?: string;
  color?: string;
  alignment?: string;
}

export interface ImageContent {
  type: 'image';
  src: string;
  alt?: string;
  dimensions?: Size;
  crop?: CropConfig;
}

export interface CropConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CompositeContent {
  type: 'composite';
  layout: 'horizontal' | 'vertical' | 'grid';
  items: ExportContent[];
  spacing?: number;
}

export interface DataProperties {
  source?: string;
  query?: string;
  refresh?: number;
  cache?: boolean;
}

export interface ContentProperties {
  text?: string;
  html?: string;
  markdown?: string;
}