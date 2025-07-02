/**
 * Universal Intermediate Representation (UIR) Schema
 * 
 * Defines the structure for dashboard exports that can be transformed
 * into multiple output formats (PDF, PowerPoint, Excel, etc.)
 */

export const UIR_VERSION = '1.0';

export const ComponentTypes = {
  CHART: 'chart',
  METRIC: 'metric',
  TABLE: 'table',
  SECTION_HEADER: 'section-header',
  FILTER: 'filter',
  TEXT: 'text',
  IMAGE: 'image',
  CONTAINER: 'container',
  GENERIC: 'generic'
};

export const ChartTypes = {
  GAUGE: 'gauge',
  PIE: 'pie',
  BAR: 'bar',
  LINE: 'line',
  AREA: 'area',
  SCATTER: 'scatter',
  COMBO: 'combo'
};

export const MetricTypes = {
  VALUE: 'value',
  PERCENTAGE: 'percentage',
  CURRENCY: 'currency',
  DELTA: 'delta',
  RATIO: 'ratio'
};

export const ExportFormats = {
  PDF: 'pdf',
  POWERPOINT: 'powerpoint',
  EXCEL: 'excel',
  IMAGE: 'image',
  HTML: 'html',
  JSON: 'json'
};

/**
 * UIR Document Schema
 */
export const UIRDocumentSchema = {
  version: UIR_VERSION,
  metadata: {
    captureTimestamp: null, // ISO 8601 timestamp
    source: 'proceed-dashboard',
    viewName: '', // e.g., 'overview', 'business-units'
    title: '',
    description: '',
    author: '',
    filters: {}, // Active filters at time of capture
    dimensions: {
      width: 0,
      height: 0
    },
    options: {} // Capture options used
  },
  structure: [], // Array of sections
  styles: {}, // Global styles
  data: {} // Additional data context
};

/**
 * Section Schema - Top-level container for related elements
 */
export const SectionSchema = {
  id: '',
  type: 'section',
  title: '',
  layout: 'vertical', // 'vertical', 'horizontal', 'grid'
  bounds: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  },
  elements: [], // Array of components
  styles: {},
  metadata: {}
};

/**
 * Base Component Schema - Common properties for all components
 */
export const BaseComponentSchema = {
  id: '',
  type: '', // One of ComponentTypes
  position: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  },
  dimensions: {
    width: 0,
    height: 0
  },
  visibility: true,
  styles: {},
  metadata: {}
};

/**
 * Chart Component Schema
 */
export const ChartComponentSchema = {
  ...BaseComponentSchema,
  componentType: ComponentTypes.CHART,
  chartConfig: {
    type: '', // One of ChartTypes
    title: '',
    subtitle: '',
    data: {
      series: [], // Array of data series
      categories: [], // X-axis categories
      values: [] // Raw data values
    },
    axes: {
      x: {
        label: '',
        type: 'category', // 'category', 'numeric', 'date'
        format: ''
      },
      y: {
        label: '',
        type: 'numeric',
        format: '',
        min: null,
        max: null
      }
    },
    legend: {
      show: true,
      position: 'bottom' // 'top', 'bottom', 'left', 'right'
    },
    colors: [], // Chart color palette
    dimensions: {
      width: 0,
      height: 0
    },
    svg: '', // SVG representation for high-fidelity export
    imageUrl: '' // Rasterized version URL if available
  }
};

/**
 * Metric Component Schema
 */
export const MetricComponentSchema = {
  ...BaseComponentSchema,
  componentType: ComponentTypes.METRIC,
  metricData: {
    label: '',
    value: '',
    formattedValue: '',
    numericValue: null,
    unit: '', // 'SAR', '%', etc.
    change: {
      value: null,
      percentage: null,
      direction: '', // 'up', 'down', 'neutral'
      formattedValue: ''
    },
    target: {
      value: null,
      percentage: null,
      achieved: false
    },
    sparkline: [], // Optional trend data
    icon: '', // Optional icon identifier
    color: '', // Metric color/status
    metricType: '' // One of MetricTypes
  }
};

/**
 * Table Component Schema
 */
export const TableComponentSchema = {
  ...BaseComponentSchema,
  componentType: ComponentTypes.TABLE,
  tableData: {
    title: '',
    headers: [
      {
        text: '',
        key: '',
        dataType: 'string', // 'string', 'number', 'currency', 'percentage', 'date'
        sortable: false,
        width: null,
        align: 'left' // 'left', 'center', 'right'
      }
    ],
    rows: [
      {
        id: '',
        cells: [
          {
            text: '',
            value: null, // Raw value
            formattedValue: '', // Display value
            html: '', // Rich content if needed
            style: {} // Cell-specific styling
          }
        ],
        metadata: {} // Row-level metadata
      }
    ],
    summary: {
      show: false,
      rows: [] // Summary/total rows
    },
    pagination: {
      enabled: false,
      currentPage: 1,
      totalPages: 1,
      pageSize: 10
    },
    sorting: {
      column: '',
      direction: 'asc'
    },
    filtering: {
      enabled: false,
      activeFilters: []
    }
  }
};

/**
 * Section Header Component Schema
 */
export const SectionHeaderSchema = {
  ...BaseComponentSchema,
  componentType: ComponentTypes.SECTION_HEADER,
  headerData: {
    text: '',
    level: 1, // 1-6 (H1-H6)
    id: '', // For linking/navigation
    icon: '',
    subtext: ''
  }
};

/**
 * Filter Component Schema
 */
export const FilterComponentSchema = {
  ...BaseComponentSchema,
  componentType: ComponentTypes.FILTER,
  filterData: {
    type: '', // 'period', 'date-range', 'select', 'multi-select'
    label: '',
    value: null,
    options: [
      {
        value: '',
        label: '',
        selected: false
      }
    ],
    configuration: {} // Filter-specific config
  }
};

/**
 * Text Component Schema
 */
export const TextComponentSchema = {
  ...BaseComponentSchema,
  componentType: ComponentTypes.TEXT,
  content: {
    text: '',
    html: '',
    markdown: '',
    format: 'plain' // 'plain', 'html', 'markdown'
  }
};

/**
 * Export Configuration Schema
 */
export const ExportConfigSchema = {
  format: '', // One of ExportFormats
  options: {
    // Common options
    includeMetadata: true,
    includeFilters: true,
    includeTimestamp: true,
    includeLogo: true,
    includePageNumbers: true,
    
    // PDF specific
    pdfOptions: {
      pageSize: 'A4', // 'A4', 'Letter', 'Legal'
      orientation: 'portrait', // 'portrait', 'landscape'
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      },
      headerHeight: 50,
      footerHeight: 30
    },
    
    // PowerPoint specific
    pptOptions: {
      slideSize: 'standard', // 'standard', 'widescreen'
      theme: 'default',
      includeNotes: false,
      slideTransitions: false
    },
    
    // Excel specific
    excelOptions: {
      includeCharts: true,
      separateSheets: true,
      includeFormulas: false,
      autoFilter: true
    },
    
    // Image specific
    imageOptions: {
      format: 'png', // 'png', 'jpeg', 'svg'
      quality: 90,
      scale: 2 // For retina displays
    }
  }
};

/**
 * Transform Pipeline Schema
 */
export const TransformPipelineSchema = {
  id: '',
  name: '',
  stages: [
    {
      name: 'capture',
      status: 'pending', // 'pending', 'processing', 'completed', 'failed'
      startTime: null,
      endTime: null,
      output: null,
      error: null
    },
    {
      name: 'transform',
      status: 'pending',
      startTime: null,
      endTime: null,
      output: null,
      error: null
    },
    {
      name: 'validate',
      status: 'pending',
      startTime: null,
      endTime: null,
      output: null,
      error: null
    },
    {
      name: 'generate',
      status: 'pending',
      startTime: null,
      endTime: null,
      output: null,
      error: null
    },
    {
      name: 'deliver',
      status: 'pending',
      startTime: null,
      endTime: null,
      output: null,
      error: null
    }
  ],
  metadata: {}
};

/**
 * Validation rules for UIR components
 */
export const UIRValidationRules = {
  document: {
    requiredFields: ['version', 'metadata', 'structure'],
    metadata: {
      requiredFields: ['captureTimestamp', 'source', 'viewName']
    }
  },
  component: {
    requiredFields: ['id', 'type', 'componentType'],
    typeValidation: {
      chart: ['chartConfig'],
      metric: ['metricData'],
      table: ['tableData'],
      'section-header': ['headerData'],
      filter: ['filterData']
    }
  }
};

/**
 * Helper function to create a new UIR document
 */
export function createUIRDocument(options = {}) {
  return {
    ...UIRDocumentSchema,
    metadata: {
      ...UIRDocumentSchema.metadata,
      captureTimestamp: new Date().toISOString(),
      ...options.metadata
    },
    structure: options.structure || [],
    styles: options.styles || {},
    data: options.data || {}
  };
}

/**
 * Helper function to validate UIR document
 */
export function validateUIRDocument(document) {
  const errors = [];

  // Check version
  if (document.version !== UIR_VERSION) {
    errors.push(`Invalid UIR version: ${document.version}`);
  }

  // Check required fields
  UIRValidationRules.document.requiredFields.forEach(field => {
    if (!document[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate metadata
  if (document.metadata) {
    UIRValidationRules.document.metadata.requiredFields.forEach(field => {
      if (!document.metadata[field]) {
        errors.push(`Missing required metadata field: ${field}`);
      }
    });
  }

  // Validate structure
  if (Array.isArray(document.structure)) {
    document.structure.forEach((section, index) => {
      if (!section.id) {
        errors.push(`Section at index ${index} missing id`);
      }
      if (!Array.isArray(section.elements)) {
        errors.push(`Section ${section.id} missing elements array`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}