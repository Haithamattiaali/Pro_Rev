/**
 * Dashboard Capture Engine
 * Core engine for capturing dashboard state and DOM structure
 */

import {
  DashboardVirtualDOM,
  DVDOMNode,
  AssetRegistry,
  DataBindingRegistry,
  InteractionRegistry,
  FilterState,
  SelectionState,
  ViewConfig,
  ThemeConfig,
  LayoutProperties,
  StyleProperties,
  ExportError as IExportError,
  ExportErrorCode,
  UserContext,
  EnvironmentContext,
  ImageAsset,
  FontAsset,
  IconAsset,
  DataAsset,
  ExportHints
} from '../core/types';

// Export Error class implementation
class ExportError extends Error implements IExportError {
  code: ExportErrorCode;
  phase: string;
  recoverable: boolean;
  context?: Record<string, any>;

  constructor(error: IExportError) {
    super(error.message);
    this.name = 'ExportError';
    this.code = error.code;
    this.phase = error.phase;
    this.recoverable = error.recoverable;
    this.context = error.context;
  }
}

interface CaptureConfig {
  includeStyles: boolean;
  includeInteractions: boolean;
  includeAnimations: boolean;
  captureViewport: boolean;
  quality: 'low' | 'medium' | 'high' | 'maximum';
}

interface TraversalContext {
  depth: number;
  parentId: string | null;
  index: number;
  path: string[];
}

export class DashboardCaptureEngine {
  private config: CaptureConfig;
  private assetRegistry: AssetRegistry;
  private dataBindingRegistry: DataBindingRegistry;
  private interactionRegistry: InteractionRegistry;
  private idCounter: number = 0;

  constructor(config: Partial<CaptureConfig> = {}) {
    this.config = {
      includeStyles: true,
      includeInteractions: true,
      includeAnimations: false,
      captureViewport: true,
      quality: 'high',
      ...config
    };

    this.assetRegistry = {
      images: {},
      fonts: {},
      icons: {},
      data: {}
    };

    this.dataBindingRegistry = {};
    this.interactionRegistry = {};
  }

  /**
   * Main capture method - orchestrates the complete capture process
   */
  async captureDashboard(
    rootElement: HTMLElement,
    dashboardState?: any
  ): Promise<DashboardVirtualDOM> {
    console.log('🚀 Starting dashboard capture...');

    try {
      // Phase 1: Pre-capture preparation
      await this.prepareForCapture();

      // Phase 2: Capture environment context
      const environmentContext = this.captureEnvironmentContext();

      // Phase 3: Capture user context
      const userContext = await this.captureUserContext();

      // Phase 4: DOM traversal and structure capture
      const root = await this.traverseElement(rootElement, {
        depth: 0,
        parentId: null,
        index: 0,
        path: ['root']
      });

      // Phase 5: State capture
      const state = await this.captureDashboardState(dashboardState);

      // Phase 6: Asset collection
      await this.collectAssets(root);

      // Phase 7: Visual capture using html2canvas
      await this.captureVisualSnapshot(rootElement, root);

      // Phase 7: Build DVDOM
      const dvdom: DashboardVirtualDOM = {
        version: '1.0.0',
        metadata: {
          captureTimestamp: new Date().toISOString(),
          dashboardId: this.extractDashboardId(rootElement),
          dashboardVersion: this.extractDashboardVersion(),
          userContext,
          environmentContext
        },
        structure: {
          root,
          assets: this.assetRegistry,
          dataBindings: this.dataBindingRegistry,
          interactions: this.interactionRegistry
        },
        state
      };

      console.log('✅ Dashboard capture completed', {
        nodes: this.countNodes(root),
        assets: Object.keys(this.assetRegistry.images).length,
        dataBindings: Object.keys(this.dataBindingRegistry).length,
        interactions: Object.keys(this.interactionRegistry).length
      });

      return dvdom;

    } catch (error) {
      console.error('❌ Dashboard capture failed:', error);
      throw new ExportError({
        code: ExportErrorCode.CAPTURE_TIMEOUT,
        message: 'Failed to capture dashboard',
        phase: 'capture',
        recoverable: false,
        context: { error: error.message }
      });
    }
  }

  /**
   * Recursive element traversal with comprehensive data extraction
   */
  private async traverseElement(
    element: HTMLElement,
    context: TraversalContext
  ): Promise<DVDOMNode> {
    const nodeId = this.generateNodeId();
    
    // Skip non-visible elements
    if (!this.isElementVisible(element)) {
      return null;
    }

    // Create base node
    const node: DVDOMNode = {
      id: nodeId,
      type: this.determineNodeType(element),
      subtype: this.determineNodeSubtype(element),
      properties: {
        layout: this.extractLayoutProperties(element),
        style: this.config.includeStyles ? this.extractStyleProperties(element) : {},
        data: await this.extractDataProperties(element),
        content: this.extractContentProperties(element)
      },
      children: [],
      metadata: {
        reactComponent: this.extractReactComponent(element),
        dataBindingId: await this.extractDataBinding(element, nodeId),
        interactionIds: this.config.includeInteractions ? 
          await this.extractInteractions(element, nodeId) : [],
        exportHints: this.generateExportHints(element)
      }
    };

    // Handle special widget types
    if (node.subtype) {
      await this.handleSpecialWidget(node, element);
    }

    // Traverse children
    const children = Array.from(element.children);
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const childContext: TraversalContext = {
        depth: context.depth + 1,
        parentId: nodeId,
        index: i,
        path: [...context.path, nodeId]
      };

      const childNode = await this.traverseElement(child, childContext);
      if (childNode) {
        node.children.push(childNode);
      }
    }

    return node;
  }

  /**
   * Extract computed layout properties
   */
  private extractLayoutProperties(element: HTMLElement): LayoutProperties {
    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return {
      display: computed.display,
      position: computed.position,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      margin: computed.margin,
      padding: computed.padding,
      flex: computed.flex,
      grid: computed.grid
    };
  }

  /**
   * Extract computed style properties
   */
  private extractStyleProperties(element: HTMLElement): StyleProperties {
    const computed = window.getComputedStyle(element);

    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontSize: computed.fontSize,
      fontFamily: computed.fontFamily,
      fontWeight: computed.fontWeight,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      opacity: parseFloat(computed.opacity),
      transform: computed.transform
    };
  }

  /**
   * Extract data properties from element
   */
  private async extractDataProperties(element: HTMLElement): Promise<any> {
    // Check for data attributes
    const dataAttributes: Record<string, any> = {};
    for (const attr of Array.from(element.attributes)) {
      if (attr.name.startsWith('data-')) {
        dataAttributes[attr.name.substring(5)] = attr.value;
      }
    }

    // Extract from React props if available
    const reactProps = await this.extractReactProps(element);

    return {
      attributes: dataAttributes,
      props: reactProps
    };
  }

  /**
   * Extract content properties
   */
  private extractContentProperties(element: HTMLElement): any {
    return {
      text: element.textContent?.trim(),
      html: element.innerHTML,
      value: (element as HTMLInputElement).value
    };
  }

  /**
   * Handle special widget types (charts, tables, metrics)
   */
  private async handleSpecialWidget(node: DVDOMNode, element: HTMLElement): Promise<void> {
    switch (node.subtype) {
      case 'chart':
        await this.extractChartData(node, element);
        break;
      case 'table':
        await this.extractTableData(node, element);
        break;
      case 'metric':
        await this.extractMetricData(node, element);
        break;
    }
  }

  /**
   * Extract chart data and configuration
   */
  private async extractChartData(node: DVDOMNode, element: HTMLElement): Promise<void> {
    // Look for Recharts elements
    const svg = element.querySelector('svg.recharts-surface');
    if (svg) {
      // Register SVG as an asset
      const assetId = this.generateAssetId();
      this.assetRegistry.images[assetId] = {
        originalUrl: '',
        base64Data: await this.svgToBase64(svg as SVGElement),
        mimeType: 'image/svg+xml',
        dimensions: {
          width: parseFloat(svg.getAttribute('width') || '0'),
          height: parseFloat(svg.getAttribute('height') || '0')
        },
        usage: [{ nodeId: node.id, property: 'chart' }]
      };

      // Extract chart configuration from React props
      const chartConfig = await this.extractChartConfig(element);
      if (chartConfig) {
        node.properties.data = {
          ...node.properties.data,
          chartType: chartConfig.type,
          chartData: chartConfig.data,
          chartOptions: chartConfig.options
        };
      }
    }
  }

  /**
   * Extract table data
   */
  private async extractTableData(node: DVDOMNode, element: HTMLElement): Promise<void> {
    const table = element.querySelector('table') || element;
    if (table.tagName === 'TABLE') {
      const headers: string[] = [];
      const rows: any[] = [];

      // Extract headers
      const headerCells = table.querySelectorAll('thead th');
      headerCells.forEach(cell => {
        headers.push(cell.textContent?.trim() || '');
      });

      // Extract rows
      const bodyRows = table.querySelectorAll('tbody tr');
      bodyRows.forEach(row => {
        const rowData: any = {};
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
          rowData[headers[index] || `col_${index}`] = cell.textContent?.trim() || '';
        });
        rows.push(rowData);
      });

      node.properties.data = {
        ...node.properties.data,
        headers,
        rows,
        totalRows: rows.length
      };
    }
  }

  /**
   * Extract metric data
   */
  private async extractMetricData(node: DVDOMNode, element: HTMLElement): Promise<void> {
    // Look for common metric patterns
    const labelElement = element.querySelector('.metric-label, .text-sm');
    const valueElement = element.querySelector('.metric-value, .text-2xl');
    const changeElement = element.querySelector('.metric-change, .text-xs');

    node.properties.data = {
      ...node.properties.data,
      label: labelElement?.textContent?.trim() || '',
      value: valueElement?.textContent?.trim() || '',
      change: changeElement?.textContent?.trim() || null
    };
  }

  /**
   * Capture dashboard state
   */
  private async captureDashboardState(dashboardState?: any): Promise<any> {
    // Extract filters from URL or state
    const filters = this.extractFilters();

    // Extract selections
    const selections = this.extractSelections();

    // Extract view configuration
    const viewConfig = this.extractViewConfig();

    // Extract theme
    const themeConfig = this.extractThemeConfig();

    return {
      filters,
      selections,
      viewConfiguration: viewConfig,
      themeConfiguration: themeConfig,
      customState: dashboardState
    };
  }

  /**
   * Collect and register all assets
   */
  private async collectAssets(root: DVDOMNode): Promise<void> {
    // Collect images
    await this.collectImages(root);

    // Collect fonts
    await this.collectFonts();

    // Collect icons
    await this.collectIcons(root);
  }

  /**
   * Utility methods
   */

  private prepareForCapture(): Promise<void> {
    // Wait for any pending renders
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }

  private captureEnvironmentContext(): EnvironmentContext {
    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      devicePixelRatio: window.devicePixelRatio,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      locale: navigator.language
    };
  }

  private async captureUserContext(): Promise<UserContext> {
    // This would integrate with your auth system
    return {
      userId: 'current-user',
      permissions: ['export', 'view'],
      preferences: {}
    };
  }

  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  private determineNodeType(element: HTMLElement): DVDOMNode['type'] {
    if (element.classList.contains('dashboard-container') || 
        element.classList.contains('grid') ||
        element.classList.contains('flex')) {
      return 'container';
    }

    if (this.isWidget(element)) {
      return 'widget';
    }

    return 'element';
  }

  private determineNodeSubtype(element: HTMLElement): DVDOMNode['subtype'] {
    // Check for Recharts
    if (element.querySelector('.recharts-wrapper')) {
      return 'chart';
    }

    // Check for tables
    if (element.tagName === 'TABLE' || element.querySelector('table')) {
      return 'table';
    }

    // Check for metrics
    if (element.classList.contains('metric-card') ||
        (element.querySelector('.metric-value') && element.querySelector('.metric-label'))) {
      return 'metric';
    }

    // Check for filters
    if (element.classList.contains('filter') || 
        element.querySelector('select, input[type="checkbox"], input[type="radio"]')) {
      return 'filter';
    }

    return undefined;
  }

  private isWidget(element: HTMLElement): boolean {
    return !!(
      element.querySelector('.recharts-wrapper') ||
      element.querySelector('table') ||
      element.classList.contains('metric-card') ||
      element.classList.contains('widget')
    );
  }

  private extractReactComponent(element: HTMLElement): string | undefined {
    // Access React fiber if available
    const fiber = this.getReactFiber(element);
    return fiber?.elementType?.name || fiber?.elementType?.displayName;
  }

  private getReactFiber(element: HTMLElement): any {
    const key = Object.keys(element).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'));
    return key ? (element as any)[key] : null;
  }

  private async extractReactProps(element: HTMLElement): Promise<any> {
    const fiber = this.getReactFiber(element);
    return fiber?.memoizedProps || {};
  }

  private async extractDataBinding(element: HTMLElement, nodeId: string): Promise<string | undefined> {
    const dataSource = element.getAttribute('data-source');
    if (dataSource) {
      const bindingId = `binding_${this.idCounter++}`;
      this.dataBindingRegistry[bindingId] = {
        source: dataSource,
        target: nodeId
      };
      return bindingId;
    }
    return undefined;
  }

  private async extractInteractions(element: HTMLElement, nodeId: string): Promise<string[]> {
    const interactionIds: string[] = [];

    // Check for click handlers
    if (element.onclick || element.hasAttribute('data-clickable')) {
      const interactionId = `interaction_${this.idCounter++}`;
      this.interactionRegistry[interactionId] = {
        type: 'click',
        trigger: 'click',
        action: 'custom'
      };
      interactionIds.push(interactionId);
    }

    // Check for hover effects
    if (element.classList.contains('hover:')) {
      const interactionId = `interaction_${this.idCounter++}`;
      this.interactionRegistry[interactionId] = {
        type: 'hover',
        trigger: 'hover',
        action: 'style-change'
      };
      interactionIds.push(interactionId);
    }

    return interactionIds;
  }

  private generateExportHints(element: HTMLElement): ExportHints | undefined {
    const hints: ExportHints = {};

    // Preserve aspect ratio for images and charts
    if (element.tagName === 'IMG' || element.querySelector('.recharts-wrapper')) {
      hints.preserveAspectRatio = true;
    }

    // Minimum size for readability
    const rect = element.getBoundingClientRect();
    if (rect.width < 100 || rect.height < 50) {
      hints.minSize = { width: 100, height: 50 };
    }

    return Object.keys(hints).length > 0 ? hints : undefined;
  }

  private async svgToBase64(svg: SVGElement): Promise<string> {
    const svgString = new XMLSerializer().serializeToString(svg);
    const base64 = btoa(unescape(encodeURIComponent(svgString)));
    return `data:image/svg+xml;base64,${base64}`;
  }

  private async extractChartConfig(element: HTMLElement): Promise<any> {
    const props = await this.extractReactProps(element);
    return props.chart || props.data || null;
  }

  private extractFilters(): FilterState[] {
    // Extract from URL params or global state
    const urlParams = new URLSearchParams(window.location.search);
    const filters: FilterState[] = [];

    urlParams.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        filters.push({
          filterId: key,
          value: value,
          appliedAt: new Date().toISOString()
        });
      }
    });

    return filters;
  }

  private extractSelections(): SelectionState[] {
    // This would integrate with your selection system
    return [];
  }

  private extractViewConfig(): ViewConfig {
    return {
      zoom: 1,
      scroll: { x: window.scrollX, y: window.scrollY },
      layout: 'default'
    };
  }

  private extractThemeConfig(): ThemeConfig {
    const computedStyle = window.getComputedStyle(document.documentElement);
    return {
      name: 'default',
      colors: {
        primary: computedStyle.getPropertyValue('--color-primary') || '#9e1f63',
        secondary: computedStyle.getPropertyValue('--color-secondary') || '#424046'
      },
      fonts: {
        primary: computedStyle.fontFamily || 'Verdana'
      }
    };
  }

  private async collectImages(node: DVDOMNode): Promise<void> {
    // Walk the tree and collect all image references
    const collectFromNode = async (n: DVDOMNode) => {
      // Check for images in style
      const bgImage = n.properties.style?.backgroundImage;
      if (bgImage && bgImage.includes('url(')) {
        const url = bgImage.match(/url\(['"]?(.+?)['"]?\)/)?.[1];
        if (url) {
          await this.registerImageAsset(url, n.id);
        }
      }

      // Check for img elements
      if (n.properties.content?.html?.includes('<img')) {
        const imgMatch = n.properties.content.html.match(/src=['"](.+?)['"]/);
        if (imgMatch) {
          await this.registerImageAsset(imgMatch[1], n.id);
        }
      }

      // Recurse
      for (const child of n.children) {
        await collectFromNode(child);
      }
    };

    await collectFromNode(node);
  }

  private async registerImageAsset(url: string, nodeId: string): Promise<void> {
    const assetId = this.generateAssetId();
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);

      this.assetRegistry.images[assetId] = {
        originalUrl: url,
        base64Data: base64,
        mimeType: blob.type,
        dimensions: await this.getImageDimensions(url),
        usage: [{ nodeId, property: 'image' }]
      };
    } catch (error) {
      console.warn(`Failed to collect image asset: ${url}`, error);
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = url;
    });
  }

  private async collectFonts(): Promise<void> {
    // Collect all unique font families used
    const fonts = new Set<string>();
    document.querySelectorAll('*').forEach(element => {
      const fontFamily = window.getComputedStyle(element).fontFamily;
      if (fontFamily) {
        fonts.add(fontFamily);
      }
    });

    fonts.forEach(fontFamily => {
      const assetId = this.generateAssetId();
      this.assetRegistry.fonts[assetId] = {
        family: fontFamily,
        variants: [
          { weight: 400, style: 'normal' },
          { weight: 700, style: 'normal' }
        ],
        source: 'system',
        fallbacks: ['Arial', 'sans-serif']
      };
    });
  }

  private async collectIcons(node: DVDOMNode): Promise<void> {
    // This would collect SVG icons and icon fonts
    // Implementation depends on your icon system
  }

  private extractDashboardId(element: HTMLElement): string {
    return element.getAttribute('data-dashboard-id') || 'dashboard';
  }

  private extractDashboardVersion(): string {
    return '1.0.0';
  }

  private countNodes(node: DVDOMNode): number {
    let count = 1;
    for (const child of node.children) {
      count += this.countNodes(child);
    }
    return count;
  }

  private generateNodeId(): string {
    return `node_${this.idCounter++}_${Date.now()}`;
  }

  private generateAssetId(): string {
    return `asset_${this.idCounter++}_${Date.now()}`;
  }

  private async captureVisualSnapshot(element: HTMLElement, rootNode: DVDOMNode): Promise<void> {
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2, // High quality
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      });

      // Convert to base64
      const base64Data = canvas.toDataURL('image/png');
      
      // Register as primary visual asset
      const assetId = 'visual_snapshot_main';
      this.assetRegistry.images[assetId] = {
        originalUrl: 'dashboard_snapshot',
        base64Data: base64Data,
        mimeType: 'image/png',
        dimensions: {
          width: canvas.width,
          height: canvas.height
        },
        usage: [{ nodeId: rootNode.id, property: 'visual_snapshot' }]
      };

      // Store reference in root node
      rootNode.metadata.visualSnapshotId = assetId;
      
      console.log('✅ Visual snapshot captured', {
        width: canvas.width,
        height: canvas.height,
        size: Math.round(base64Data.length / 1024) + 'KB'
      });

    } catch (error) {
      console.warn('Failed to capture visual snapshot:', error);
      // Don't fail the entire capture if visual snapshot fails
    }
  }
}