/**
 * Universal Export Representation (UER) Translator
 * Converts Dashboard Virtual DOM to format-agnostic export representation
 */

import {
  DashboardVirtualDOM,
  DVDOMNode,
  UniversalExportRepresentation,
  ExportPage,
  ExportSection,
  ExportContent,
  ChartContent,
  TableContent,
  MetricContent,
  TextContent,
  ImageContent,
  ExportFormat,
  QualityLevel,
  Position,
  Size,
  Alignment,
  UserInfo,
  GlobalStyleDefinitions,
  DataResourceRegistry,
  MediaResourceRegistry,
  TemplateRegistry,
  InteractivityConfig,
  AccessibilityConfig,
  QualityConfig
} from '../core/types';

interface TranslationOptions {
  targetFormats: ExportFormat[];
  pageLayout: 'single' | 'multi' | 'auto';
  sectionGrouping: 'type' | 'position' | 'custom';
  quality: QualityLevel;
  preserveInteractivity: boolean;
}

export class UERTranslator {
  private options: TranslationOptions;
  private pageIdCounter: number = 0;
  private sectionIdCounter: number = 0;
  private resourceIdCounter: number = 0;

  constructor(options: Partial<TranslationOptions> = {}) {
    this.options = {
      targetFormats: ['pdf'],
      pageLayout: 'auto',
      sectionGrouping: 'type',
      quality: 'high',
      preserveInteractivity: false,
      ...options
    };
  }

  /**
   * Main translation method - converts DVDOM to UER
   */
  async translate(dvdom: DashboardVirtualDOM): Promise<UniversalExportRepresentation> {
    console.log('🔄 Translating DVDOM to UER...');

    try {
      // Extract document metadata
      const document = this.createDocument(dvdom);

      // Extract and organize pages
      const pages = await this.createPages(dvdom);

      // Extract global resources
      const resources = await this.extractResources(dvdom);

      // Create export configuration
      const exportConfig = this.createExportConfig();

      // Build UER
      const uer: UniversalExportRepresentation = {
        version: '2.0.0',
        document,
        pages,
        resources,
        exportConfig
      };

      console.log('✅ UER translation completed', {
        pages: pages.length,
        sections: pages.reduce((acc, page) => acc + page.sections.length, 0),
        resources: {
          styles: Object.keys(resources.styles).length,
          data: Object.keys(resources.data).length,
          media: Object.keys(resources.media).length,
          templates: Object.keys(resources.templates).length
        }
      });

      return uer;

    } catch (error) {
      console.error('❌ UER translation failed:', error);
      throw error;
    }
  }

  /**
   * Create document metadata
   */
  private createDocument(dvdom: DashboardVirtualDOM): UniversalExportRepresentation['document'] {
    const { metadata } = dvdom;

    return {
      title: this.extractTitle(dvdom) || 'Dashboard Export',
      description: this.extractDescription(dvdom) || '',
      author: this.extractAuthor(metadata.userContext),
      created: metadata.captureTimestamp,
      modified: metadata.captureTimestamp,
      tags: this.extractTags(dvdom)
    };
  }

  /**
   * Create pages from DVDOM structure
   */
  private async createPages(dvdom: DashboardVirtualDOM): Promise<ExportPage[]> {
    const pages: ExportPage[] = [];

    switch (this.options.pageLayout) {
      case 'single':
        // Everything on one page
        pages.push(await this.createSinglePage(dvdom));
        break;

      case 'multi':
        // Separate pages for different sections
        pages.push(...await this.createMultiplePages(dvdom));
        break;

      case 'auto':
      default:
        // Intelligent page breaking
        pages.push(...await this.createAutomaticPages(dvdom));
        break;
    }

    return pages;
  }

  /**
   * Create a single page with all content
   */
  private async createSinglePage(dvdom: DashboardVirtualDOM): Promise<ExportPage> {
    const page: ExportPage = {
      id: this.generatePageId(),
      title: 'Dashboard Overview',
      type: 'dashboard',
      layout: {
        type: 'flow',
        margins: { top: 20, right: 20, bottom: 20, left: 20 }
      },
      sections: [],
      metadata: {
        pageNumber: 1,
        tags: ['overview', 'complete'],
        notes: '',
        exportPriority: 1
      }
    };

    // Convert all nodes to sections
    page.sections = await this.convertNodesToSections(
      dvdom.structure.root.children,
      dvdom
    );

    return page;
  }

  /**
   * Create multiple pages based on content type
   */
  private async createMultiplePages(dvdom: DashboardVirtualDOM): Promise<ExportPage[]> {
    const pages: ExportPage[] = [];
    const nodesByType = this.groupNodesByType(dvdom.structure.root.children);

    // Overview page with metrics
    if (nodesByType.metric.length > 0) {
      pages.push({
        id: this.generatePageId(),
        title: 'Key Metrics',
        type: 'dashboard',
        layout: {
          type: 'grid',
          columns: 3,
          gap: 20,
          margins: { top: 20, right: 20, bottom: 20, left: 20 }
        },
        sections: await this.convertNodesToSections(nodesByType.metric, dvdom),
        metadata: {
          pageNumber: pages.length + 1,
          tags: ['metrics', 'kpi'],
          notes: '',
          exportPriority: 1
        }
      });
    }

    // Charts page
    if (nodesByType.chart.length > 0) {
      pages.push({
        id: this.generatePageId(),
        title: 'Analytics & Visualizations',
        type: 'dashboard',
        layout: {
          type: 'grid',
          columns: 2,
          gap: 20,
          margins: { top: 20, right: 20, bottom: 20, left: 20 }
        },
        sections: await this.convertNodesToSections(nodesByType.chart, dvdom),
        metadata: {
          pageNumber: pages.length + 1,
          tags: ['charts', 'analytics'],
          notes: '',
          exportPriority: 2
        }
      });
    }

    // Tables page
    if (nodesByType.table.length > 0) {
      pages.push({
        id: this.generatePageId(),
        title: 'Detailed Data',
        type: 'report',
        layout: {
          type: 'flow',
          margins: { top: 20, right: 20, bottom: 20, left: 20 }
        },
        sections: await this.convertNodesToSections(nodesByType.table, dvdom),
        metadata: {
          pageNumber: pages.length + 1,
          tags: ['tables', 'data'],
          notes: '',
          exportPriority: 3
        }
      });
    }

    return pages;
  }

  /**
   * Create pages with automatic layout optimization
   */
  private async createAutomaticPages(dvdom: DashboardVirtualDOM): Promise<ExportPage[]> {
    const pages: ExportPage[] = [];
    const sections = await this.convertNodesToSections(
      dvdom.structure.root.children,
      dvdom
    );

    // Group sections by visual hierarchy and size
    const sectionGroups = this.optimizeSectionLayout(sections);

    // Create pages from groups
    sectionGroups.forEach((group, index) => {
      pages.push({
        id: this.generatePageId(),
        title: this.generatePageTitle(group, index),
        type: 'dashboard',
        layout: this.determineOptimalLayout(group),
        sections: group,
        metadata: {
          pageNumber: index + 1,
          tags: this.generatePageTags(group),
          notes: '',
          exportPriority: index + 1
        }
      });
    });

    return pages;
  }

  /**
   * Convert DVDOM nodes to export sections
   */
  private async convertNodesToSections(
    nodes: DVDOMNode[],
    dvdom: DashboardVirtualDOM
  ): Promise<ExportSection[]> {
    const sections: ExportSection[] = [];

    for (const node of nodes) {
      if (this.shouldCreateSection(node)) {
        const section = await this.createSection(node, dvdom);
        if (section) {
          sections.push(section);
        }
      }

      // Process children if not already converted
      if (node.children.length > 0 && !this.isWidget(node)) {
        sections.push(...await this.convertNodesToSections(node.children, dvdom));
      }
    }

    return sections;
  }

  /**
   * Create an export section from a DVDOM node
   */
  private async createSection(
    node: DVDOMNode,
    dvdom: DashboardVirtualDOM
  ): Promise<ExportSection | null> {
    const content = await this.createContent(node, dvdom);
    if (!content) return null;

    const section: ExportSection = {
      id: this.generateSectionId(),
      type: this.determineSectionType(node),
      content: {
        primary: content,
        supporting: await this.extractSupportingContent(node, dvdom),
        annotations: this.extractAnnotations(node)
      },
      layout: this.extractLayout(node),
      styling: this.extractStyling(node),
      behavior: this.extractBehavior(node, dvdom)
    };

    return section;
  }

  /**
   * Create export content from node
   */
  private async createContent(
    node: DVDOMNode,
    dvdom: DashboardVirtualDOM
  ): Promise<ExportContent | null> {
    switch (node.subtype) {
      case 'chart':
        return this.createChartContent(node, dvdom);
      
      case 'table':
        return this.createTableContent(node, dvdom);
      
      case 'metric':
        return this.createMetricContent(node, dvdom);
      
      case 'text':
        return this.createTextContent(node, dvdom);
      
      case 'image':
        return this.createImageContent(node, dvdom);
      
      default:
        // Try to infer content type
        return this.inferContent(node, dvdom);
    }
  }

  /**
   * Create chart content
   */
  private createChartContent(node: DVDOMNode, dvdom: DashboardVirtualDOM): ChartContent {
    const chartData = node.properties.data?.chartData || {
      labels: [],
      datasets: []
    };

    const chartConfig = node.properties.data?.chartOptions || {};

    // Find associated image asset
    let fallbackImage: string | undefined;
    const imageAssets = Object.entries(dvdom.structure.assets.images);
    for (const [assetId, asset] of imageAssets) {
      if (asset.usage.some(u => u.nodeId === node.id)) {
        fallbackImage = asset.base64Data;
        break;
      }
    }

    return {
      type: 'chart',
      chartType: node.properties.data?.chartType || 'unknown',
      data: chartData,
      config: {
        type: node.properties.data?.chartType || 'bar',
        options: chartConfig,
        plugins: {}
      },
      fallback: {
        image: fallbackImage,
        description: `${node.properties.data?.chartType || 'Chart'} visualization`
      }
    };
  }

  /**
   * Create table content
   */
  private createTableContent(node: DVDOMNode, dvdom: DashboardVirtualDOM): TableContent {
    const headers = node.properties.data?.headers || [];
    const rows = node.properties.data?.rows || [];

    return {
      type: 'table',
      headers: headers.map((h: string, i: number) => ({
        key: `col_${i}`,
        label: h,
        sortable: true
      })),
      rows: rows.map((row: any, i: number) => ({
        id: `row_${i}`,
        cells: row
      })),
      config: {
        pageSize: 50,
        currentPage: 1
      },
      styling: {
        striped: true,
        bordered: true,
        hover: true,
        compact: false
      }
    };
  }

  /**
   * Create metric content
   */
  private createMetricContent(node: DVDOMNode, dvdom: DashboardVirtualDOM): MetricContent {
    const data = node.properties.data || {};
    
    return {
      type: 'metric',
      label: data.label || 'Metric',
      value: data.value || '0',
      unit: this.extractUnit(data.value),
      change: data.change ? {
        value: parseFloat(data.change) || 0,
        direction: data.change.includes('+') ? 'up' : 'down',
        percentage: data.change.includes('%')
      } : undefined,
      styling: {
        size: 'medium',
        color: node.properties.style?.color
      }
    };
  }

  /**
   * Create text content
   */
  private createTextContent(node: DVDOMNode, dvdom: DashboardVirtualDOM): TextContent {
    return {
      type: 'text',
      text: node.properties.content?.text || '',
      formatting: {
        fontSize: node.properties.style?.fontSize,
        fontFamily: node.properties.style?.fontFamily,
        color: node.properties.style?.color,
        bold: node.properties.style?.fontWeight === 'bold',
        alignment: 'left'
      }
    };
  }

  /**
   * Create image content
   */
  private createImageContent(node: DVDOMNode, dvdom: DashboardVirtualDOM): ImageContent | null {
    // Find associated image asset
    const imageAssets = Object.entries(dvdom.structure.assets.images);
    for (const [assetId, asset] of imageAssets) {
      if (asset.usage.some(u => u.nodeId === node.id)) {
        return {
          type: 'image',
          src: asset.base64Data || asset.originalUrl,
          alt: node.properties.content?.text || '',
          dimensions: asset.dimensions
        };
      }
    }

    return null;
  }

  /**
   * Extract global resources
   */
  private async extractResources(dvdom: DashboardVirtualDOM): Promise<UniversalExportRepresentation['resources']> {
    return {
      styles: this.extractGlobalStyles(dvdom),
      data: this.extractDataResources(dvdom),
      media: this.extractMediaResources(dvdom),
      templates: this.extractTemplates(dvdom)
    };
  }

  /**
   * Extract global styles
   */
  private extractGlobalStyles(dvdom: DashboardVirtualDOM): GlobalStyleDefinitions {
    const theme = dvdom.state.themeConfiguration;
    
    return {
      colors: {
        primary: '#9e1f63',
        secondary: '#424046',
        accent: '#005b8c',
        ...theme?.colors
      },
      fonts: {
        primary: 'Verdana',
        secondary: 'Tahoma',
        ...theme?.fonts
      },
      spacing: {
        small: '8px',
        medium: '16px',
        large: '24px',
        xlarge: '32px'
      },
      breakpoints: {
        mobile: 640,
        tablet: 768,
        desktop: 1024,
        wide: 1280
      }
    };
  }

  /**
   * Extract data resources
   */
  private extractDataResources(dvdom: DashboardVirtualDOM): DataResourceRegistry {
    const resources: DataResourceRegistry = {};

    // Extract data from data assets
    Object.entries(dvdom.structure.assets.data).forEach(([id, asset]) => {
      resources[id] = {
        type: asset.type,
        data: asset.content,
        metadata: {
          schema: asset.schema
        }
      };
    });

    // Extract data from state
    if (dvdom.state.filters.length > 0) {
      resources['filters'] = {
        type: 'filters',
        data: dvdom.state.filters,
        metadata: {
          appliedAt: dvdom.metadata.captureTimestamp
        }
      };
    }

    return resources;
  }

  /**
   * Extract media resources
   */
  private extractMediaResources(dvdom: DashboardVirtualDOM): MediaResourceRegistry {
    const resources: MediaResourceRegistry = {};

    // Images
    Object.entries(dvdom.structure.assets.images).forEach(([id, asset]) => {
      resources[id] = {
        type: 'image',
        url: asset.originalUrl,
        data: asset.base64Data,
        metadata: {
          dimensions: asset.dimensions,
          mimeType: asset.mimeType
        }
      };
    });

    // Icons
    Object.entries(dvdom.structure.assets.icons).forEach(([id, asset]) => {
      resources[id] = {
        type: 'icon',
        url: '',
        data: asset.data,
        metadata: {
          iconType: asset.type,
          size: asset.size
        }
      };
    });

    return resources;
  }

  /**
   * Extract templates
   */
  private extractTemplates(dvdom: DashboardVirtualDOM): TemplateRegistry {
    // This would extract reusable templates from the dashboard
    return {
      'default-chart': {
        name: 'Default Chart Template',
        type: 'chart',
        content: {
          layout: 'standard',
          colors: ['#9e1f63', '#424046', '#005b8c']
        },
        variables: ['title', 'data']
      },
      'default-metric': {
        name: 'Default Metric Template',
        type: 'metric',
        content: {
          layout: 'card',
          showChange: true
        },
        variables: ['label', 'value', 'change']
      }
    };
  }

  /**
   * Create export configuration
   */
  private createExportConfig(): UniversalExportRepresentation['exportConfig'] {
    return {
      targetFormats: this.options.targetFormats,
      qualitySettings: this.getQualitySettings(),
      interactivityLevel: this.getInteractivityLevel(),
      accessibility: this.getAccessibilityConfig()
    };
  }

  /**
   * Get quality settings based on quality level
   */
  private getQualitySettings(): QualityConfig {
    const qualityMap: Record<QualityLevel, QualityConfig> = {
      low: {
        resolution: 72,
        compression: 80,
        antialiasing: false
      },
      medium: {
        resolution: 150,
        compression: 90,
        antialiasing: true
      },
      high: {
        resolution: 300,
        compression: 95,
        antialiasing: true
      },
      maximum: {
        resolution: 600,
        compression: 100,
        antialiasing: true
      }
    };

    return qualityMap[this.options.quality];
  }

  /**
   * Get interactivity configuration
   */
  private getInteractivityLevel(): InteractivityConfig {
    return {
      level: this.options.preserveInteractivity ? 'full' : 'none',
      preserveLinks: this.options.preserveInteractivity,
      preserveTooltips: this.options.preserveInteractivity,
      preserveAnimations: false
    };
  }

  /**
   * Get accessibility configuration
   */
  private getAccessibilityConfig(): AccessibilityConfig {
    return {
      includeAltText: true,
      includeAriaLabels: true,
      includeKeyboardNav: false,
      contrastLevel: 'AA'
    };
  }

  /**
   * Utility methods
   */

  private extractTitle(dvdom: DashboardVirtualDOM): string {
    // Try to find a title in the DOM
    const titleNode = this.findNodeByType(dvdom.structure.root, 'text', (node) => 
      node.properties.style?.fontSize?.includes('2') || 
      node.properties.style?.fontSize?.includes('3')
    );
    
    return titleNode?.properties.content?.text || '';
  }

  private extractDescription(dvdom: DashboardVirtualDOM): string {
    // Extract from metadata or find subtitle
    return '';
  }

  private extractAuthor(userContext: UserContext): UserInfo {
    return {
      id: userContext.userId,
      name: 'Dashboard User',
      email: undefined
    };
  }

  private extractTags(dvdom: DashboardVirtualDOM): string[] {
    const tags: string[] = ['dashboard', 'export'];
    
    // Add tags based on content types
    if (this.hasCharts(dvdom.structure.root)) tags.push('charts');
    if (this.hasTables(dvdom.structure.root)) tags.push('tables');
    if (this.hasMetrics(dvdom.structure.root)) tags.push('metrics');
    
    return tags;
  }

  private groupNodesByType(nodes: DVDOMNode[]): Record<string, DVDOMNode[]> {
    const groups: Record<string, DVDOMNode[]> = {
      metric: [],
      chart: [],
      table: [],
      text: [],
      other: []
    };

    const categorize = (node: DVDOMNode) => {
      const type = node.subtype || 'other';
      if (groups[type]) {
        groups[type].push(node);
      } else {
        groups.other.push(node);
      }

      // Recurse for containers
      if (!node.subtype && node.children.length > 0) {
        node.children.forEach(categorize);
      }
    };

    nodes.forEach(categorize);
    return groups;
  }

  private optimizeSectionLayout(sections: ExportSection[]): ExportSection[][] {
    // Simple pagination - could be made more sophisticated
    const maxSectionsPerPage = 6;
    const pages: ExportSection[][] = [];
    
    for (let i = 0; i < sections.length; i += maxSectionsPerPage) {
      pages.push(sections.slice(i, i + maxSectionsPerPage));
    }

    return pages;
  }

  private generatePageTitle(sections: ExportSection[], index: number): string {
    // Analyze content types in sections
    const types = new Set(sections.map(s => s.content.primary.type));
    
    if (types.size === 1) {
      const type = Array.from(types)[0];
      return `${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    }
    
    return `Dashboard Page ${index + 1}`;
  }

  private determineOptimalLayout(sections: ExportSection[]): ExportPage['layout'] {
    const hasOnlyMetrics = sections.every(s => s.content.primary.type === 'metric');
    const hasOnlyCharts = sections.every(s => s.content.primary.type === 'chart');
    
    if (hasOnlyMetrics) {
      return {
        type: 'grid',
        columns: 3,
        gap: 16,
        margins: { top: 20, right: 20, bottom: 20, left: 20 }
      };
    }
    
    if (hasOnlyCharts) {
      return {
        type: 'grid',
        columns: 2,
        gap: 20,
        margins: { top: 20, right: 20, bottom: 20, left: 20 }
      };
    }
    
    return {
      type: 'flow',
      margins: { top: 20, right: 20, bottom: 20, left: 20 }
    };
  }

  private generatePageTags(sections: ExportSection[]): string[] {
    const types = new Set(sections.map(s => s.content.primary.type));
    return Array.from(types);
  }

  private shouldCreateSection(node: DVDOMNode): boolean {
    return node.type === 'widget' || node.subtype !== undefined;
  }

  private isWidget(node: DVDOMNode): boolean {
    return node.type === 'widget';
  }

  private determineSectionType(node: DVDOMNode): ExportSection['type'] {
    if (node.properties.layout?.position === 'fixed' && 
        node.properties.layout.top === 0) {
      return 'header';
    }
    
    if (node.properties.layout?.position === 'fixed' && 
        node.properties.layout.left === 0) {
      return 'sidebar';
    }
    
    return 'content';
  }

  private async extractSupportingContent(
    node: DVDOMNode, 
    dvdom: DashboardVirtualDOM
  ): Promise<ExportContent[]> {
    // Extract legends, labels, etc.
    return [];
  }

  private extractAnnotations(node: DVDOMNode): any[] {
    // Extract any annotations or notes
    return [];
  }

  private extractLayout(node: DVDOMNode): ExportSection['layout'] {
    const layout = node.properties.layout;
    
    return {
      position: {
        x: Number(layout?.left) || 0,
        y: Number(layout?.top) || 0
      },
      size: {
        width: Number(layout?.width) || 100,
        height: Number(layout?.height) || 100
      },
      zIndex: parseInt(node.properties.style?.zIndex || '0'),
      alignment: {
        horizontal: 'left',
        vertical: 'top'
      },
      padding: layout?.padding || '0'
    };
  }

  private extractStyling(node: DVDOMNode): ExportSection['styling'] {
    const style = node.properties.style || {};
    
    return {
      background: {
        color: style.backgroundColor
      },
      border: {
        width: '1px',
        style: 'solid',
        color: '#e0e0e0'
      },
      shadow: {
        x: 0,
        y: 2,
        blur: 4,
        color: 'rgba(0,0,0,0.1)'
      },
      opacity: style.opacity || 1
    };
  }

  private extractBehavior(node: DVDOMNode, dvdom: DashboardVirtualDOM): ExportSection['behavior'] {
    return {
      visibility: {
        showOnPrint: true,
        showOnScreen: true
      },
      interactions: node.metadata.interactionIds?.map(id => {
        const interaction = dvdom.structure.interactions[id];
        return {
          type: interaction?.type as any || 'click',
          action: interaction?.action || '',
          parameters: interaction?.parameters
        };
      }) || [],
      animations: []
    };
  }

  private inferContent(node: DVDOMNode, dvdom: DashboardVirtualDOM): ExportContent | null {
    // Try to infer content type from node properties
    if (node.properties.content?.text) {
      return this.createTextContent(node, dvdom);
    }
    
    return null;
  }

  private extractUnit(value: string): string | undefined {
    if (value.includes('%')) return '%';
    if (value.includes('$')) return '$';
    if (value.includes('€')) return '€';
    return undefined;
  }

  private findNodeByType(
    root: DVDOMNode, 
    type: string, 
    predicate?: (node: DVDOMNode) => boolean
  ): DVDOMNode | null {
    if (root.subtype === type && (!predicate || predicate(root))) {
      return root;
    }
    
    for (const child of root.children) {
      const found = this.findNodeByType(child, type, predicate);
      if (found) return found;
    }
    
    return null;
  }

  private hasCharts(root: DVDOMNode): boolean {
    return !!this.findNodeByType(root, 'chart');
  }

  private hasTables(root: DVDOMNode): boolean {
    return !!this.findNodeByType(root, 'table');
  }

  private hasMetrics(root: DVDOMNode): boolean {
    return !!this.findNodeByType(root, 'metric');
  }

  private generatePageId(): string {
    return `page_${this.pageIdCounter++}`;
  }

  private generateSectionId(): string {
    return `section_${this.sectionIdCounter++}`;
  }
}