/**
 * Enhanced Dashboard Capture Service
 * 
 * Based on HTML-to-Figma architectural patterns, this service implements
 * a sophisticated two-part system: Capture Agent + Virtual DOM serialization
 */

class EnhancedCaptureService {
  constructor() {
    this.capturedNodes = [];
    this.assetRegistry = new Map();
    this.pseudoElements = [];
    this.interactiveStates = new Map();
    this.semanticContext = {};
    
    // Bind methods to ensure proper context
    this.captureDashboard = this.captureDashboard.bind(this);
    this.analyzeSemanticContext = this.analyzeSemanticContext.bind(this);
    this.inferPurpose = this.inferPurpose.bind(this);
    this.captureActiveFilters = this.captureActiveFilters.bind(this);
  }

  /**
   * Main capture method - orchestrates the complete capture process
   */
  async captureDashboard(options = {}) {
    console.log('🚀 Enhanced capture starting with options:', options);
    console.log('📍 Service instance check - this:', this);
    console.log('📍 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this)));
    
    const {
      captureInteractiveStates = true,
      capturePseudoElements = true,
      captureComputedStyles = true,
      captureResponsiveStates = false,
      viewports = [{ width: 1920, height: 1080, name: 'Desktop' }]
    } = options;

    try {
      // Reset state
      this.reset();

      // Phase 1: Semantic Context Analysis
      await this.analyzeSemanticContext();

      // Phase 2: DOM Traversal and Capture
      const results = [];
      for (const viewport of viewports) {
        if (captureResponsiveStates && viewports.length > 1) {
          await this.setViewport(viewport);
          await this.waitForReflow();
        }

        const captureResult = await this.captureViewport({
          ...options,
          viewport
        });

        results.push({
          viewport,
          capture: captureResult
        });
      }

      // Phase 3: Build Virtual DOM
      const virtualDOM = this.buildVirtualDOM(
        captureResponsiveStates ? results : results[0].capture
      );

      return virtualDOM;

    } catch (error) {
      console.error('❌ Enhanced capture failed:', error);
      throw error;
    }
  }

  /**
   * Analyze semantic context of the dashboard
   */
  async analyzeSemanticContext() {
    console.log('🧠 Analyzing semantic context...');

    try {
      // Identify dashboard type and purpose
      const title = document.querySelector('h1')?.textContent || '';
      const isOverview = window.location.pathname.includes('overview');
      const isBusinessUnits = window.location.pathname.includes('business-units');
      const isCustomers = window.location.pathname.includes('customers');

      console.log('📍 Context check - this:', this);
      console.log('📍 inferPurpose method exists:', typeof this.inferPurpose === 'function');
      
      let purpose = 'Display dashboard analytics and metrics';
      try {
        purpose = this.inferPurpose(title, isOverview, isBusinessUnits, isCustomers);
      } catch (purposeError) {
        console.error('❌ Error calling inferPurpose:', purposeError);
        console.error('Stack:', purposeError.stack);
      }

      this.semanticContext = {
        dashboardType: isOverview ? 'executive-overview' : 
                       isBusinessUnits ? 'business-analysis' :
                       isCustomers ? 'customer-insights' : 'generic',
        title,
        purpose,
        timestamp: new Date().toISOString(),
        filters: await this.captureActiveFilters()
      };

      console.log('📊 Semantic context:', this.semanticContext);
    } catch (error) {
      console.error('❌ Error in analyzeSemanticContext:', error);
      throw error;
    }
  }

  /**
   * Capture a specific viewport
   */
  async captureViewport(options) {
    const { viewport } = options;
    console.log(`📐 Capturing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

    const rootElement = this.findDashboardRoot();
    if (!rootElement) {
      throw new Error('Dashboard root element not found');
    }

    // Recursive traversal with enhanced capture
    const captured = await this.traverseElement(rootElement, {
      ...options,
      depth: 0,
      parentContext: null
    });

    return captured;
  }

  /**
   * Enhanced recursive DOM traversal
   */
  async traverseElement(element, context) {
    const { depth, parentContext, captureComputedStyles, 
            capturePseudoElements, captureInteractiveStates } = context;

    // Skip non-visible elements
    if (!this.isElementVisible(element)) {
      return null;
    }

    // Create node representation
    const node = {
      id: this.generateNodeId(),
      type: 'ELEMENT',
      tagName: element.tagName,
      attributes: this.extractAttributes(element),
      bounds: this.getElementBounds(element),
      depth,
      children: []
    };

    // Capture computed styles
    if (captureComputedStyles) {
      node.computedStyle = await this.extractComputedStyles(element);
    }

    // Semantic analysis
    node.semanticType = this.identifySemanticType(element, parentContext);
    node.componentType = this.identifyComponentType(element);

    // Special handling for different component types
    switch (node.componentType) {
      case 'chart':
        node.chartData = await this.extractChartData(element);
        break;
      case 'metric':
        node.metricData = this.extractMetricData(element);
        break;
      case 'table':
        node.tableData = this.extractTableData(element);
        break;
    }

    // Capture pseudo-elements
    if (capturePseudoElements) {
      const pseudos = await this.capturePseudoElements(element);
      if (pseudos.length > 0) {
        node.pseudoElements = pseudos;
      }
    }

    // Capture interactive states
    if (captureInteractiveStates && this.isInteractive(element)) {
      node.interactiveStates = await this.captureInteractiveStates(element);
    }

    // Process assets
    await this.processAssets(element, node);

    // Traverse children
    const children = Array.from(element.children);
    for (const child of children) {
      const childNode = await this.traverseElement(child, {
        ...context,
        depth: depth + 1,
        parentContext: node
      });
      
      if (childNode) {
        node.children.push(childNode);
      }
    }

    // Handle text content
    const textContent = this.extractTextContent(element);
    if (textContent && node.children.length === 0) {
      node.children.push({
        id: this.generateNodeId(),
        type: 'TEXT',
        content: textContent,
        computedStyle: captureComputedStyles ? 
          await this.extractTextStyles(element) : null
      });
    }

    return node;
  }

  /**
   * Extract computed styles with normalization
   */
  async extractComputedStyles(element) {
    const computed = window.getComputedStyle(element);
    const styles = {};

    // Critical style properties for high-fidelity export
    const criticalProperties = [
      // Layout
      'display', 'position', 'top', 'left', 'right', 'bottom',
      'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'flexDirection', 'justifyContent', 'alignItems', 'gap', 'flexGrow',
      
      // Visual
      'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition',
      'color', 'opacity', 'visibility',
      'border', 'borderRadius', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
      'boxShadow', 'filter',
      
      // Typography
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight',
      'letterSpacing', 'textAlign', 'textDecoration', 'textTransform',
      
      // Transform
      'transform', 'transformOrigin',
      
      // Z-index
      'zIndex', 'overflow'
    ];

    // Extract and normalize values
    criticalProperties.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'normal' && value !== '0px') {
        styles[prop] = this.normalizeStyleValue(prop, value);
      }
    });

    // Extract CSS variables (design tokens)
    const cssVariables = this.extractCSSVariables(element);
    if (Object.keys(cssVariables).length > 0) {
      styles.cssVariables = cssVariables;
    }

    return styles;
  }

  /**
   * Capture pseudo-elements
   */
  async capturePseudoElements(element) {
    const pseudos = [];
    
    for (const pseudo of ['::before', '::after']) {
      const computed = window.getComputedStyle(element, pseudo);
      const content = computed.getPropertyValue('content');
      
      if (content && content !== 'none' && content !== '""') {
        const bounds = this.getPseudoElementBounds(element, pseudo);
        
        pseudos.push({
          type: pseudo,
          content: content.replace(/['"]/g, ''),
          computedStyle: await this.extractComputedStyles(element, pseudo),
          bounds
        });
      }
    }
    
    return pseudos;
  }

  /**
   * Capture interactive states
   */
  async captureInteractiveStates(element) {
    const states = {};
    const interactiveEvents = ['hover', 'focus', 'active'];
    
    for (const state of interactiveEvents) {
      try {
        // Trigger the state
        await this.triggerInteractiveState(element, state);
        
        // Capture styles in that state
        const stateStyles = await this.extractComputedStyles(element);
        
        // Reset state
        await this.resetInteractiveState(element, state);
        
        // Only store if different from default
        if (this.hasStyleDifferences(element.computedStyle, stateStyles)) {
          states[state] = stateStyles;
        }
      } catch (error) {
        console.warn(`Failed to capture ${state} state:`, error);
      }
    }
    
    return states;
  }

  /**
   * Extract chart data from visualization components
   */
  async extractChartData(element) {
    const chartData = {
      type: this.detectChartType(element),
      title: element.querySelector('.chart-title')?.textContent || '',
      data: null,
      config: {}
    };

    // Extract from Recharts
    const svg = element.querySelector('svg.recharts-surface');
    if (svg) {
      chartData.svg = svg.outerHTML;
      chartData.dimensions = {
        width: parseFloat(svg.getAttribute('width')),
        height: parseFloat(svg.getAttribute('height'))
      };

      // Try to extract data from chart elements
      if (chartData.type === 'gauge') {
        chartData.data = this.extractGaugeData(element);
      } else if (chartData.type === 'bar') {
        chartData.data = this.extractBarChartData(element);
      }
    }

    return chartData;
  }

  /**
   * Build Virtual DOM structure
   */
  buildVirtualDOM(captureData) {
    const isMultiViewport = Array.isArray(captureData);
    
    const virtualDOM = {
      version: '2.0',
      metadata: {
        ...this.semanticContext,
        captureTimestamp: new Date().toISOString(),
        isResponsive: isMultiViewport,
        assetCount: this.assetRegistry.size
      },
      structure: isMultiViewport ? 
        this.buildResponsiveStructure(captureData) : 
        this.buildSingleStructure(captureData),
      assets: Array.from(this.assetRegistry.entries()).map(([id, asset]) => ({
        id,
        ...asset
      })),
      designTokens: this.extractDesignTokens(),
      exportHints: this.generateExportHints()
    };

    console.log('📦 Built Virtual DOM:', virtualDOM);
    return virtualDOM;
  }

  /**
   * Generate export hints for synthesis engine
   */
  generateExportHints() {
    return {
      recommendedFormat: this.semanticContext.dashboardType === 'executive-overview' ? 
        'presentation' : 'document',
      narrativeStructure: this.suggestNarrativeStructure(),
      keyMetrics: this.identifyKeyMetrics(),
      visualHierarchy: this.analyzeVisualHierarchy()
    };
  }

  // Utility methods
  reset() {
    this.capturedNodes = [];
    this.assetRegistry.clear();
    this.pseudoElements = [];
    this.interactiveStates.clear();
    this.semanticContext = {};
  }

  findDashboardRoot() {
    return document.querySelector('[data-export-root]') || 
           document.querySelector('.space-y-6') ||
           document.querySelector('main');
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           rect.top < window.innerHeight &&
           rect.bottom > 0;
  }

  getElementBounds(element) {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    return {
      x: rect.left + scrollLeft,
      y: rect.top + scrollTop,
      width: rect.width,
      height: rect.height,
      absoluteX: rect.left,
      absoluteY: rect.top
    };
  }

  identifySemanticType(element, parentContext) {
    try {
      // Semantic analysis based on content and context
      const classes = typeof element.className === 'string' ? element.className : element.className?.toString() || '';
      const role = element.getAttribute('role');
      const ariaLabel = element.getAttribute('aria-label');
      
      if (classes.includes('metric-card')) return 'kpi-metric';
      if (classes.includes('dashboard-card')) return 'section-container';
      
      // Safely check for child elements
      try {
        if (element.querySelector('.recharts-wrapper')) return 'data-visualization';
      } catch (e) {
        // Ignore querySelector errors
      }
      
      if (element.tagName === 'TABLE') return 'data-table';
      if (classes.includes('section-title')) return 'section-header';
      
      return 'generic';
    } catch (error) {
      console.warn('Error in identifySemanticType:', error);
      return 'generic';
    }
  }

  generateNodeId() {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Infer the purpose of the dashboard
   */
  inferPurpose(title, isOverview, isBusinessUnits, isCustomers) {
    if (isOverview) {
      return 'Provide executive summary of key performance metrics';
    } else if (isBusinessUnits) {
      return 'Analyze business unit performance and comparisons';
    } else if (isCustomers) {
      return 'Track customer metrics and engagement insights';
    }
    return 'Display dashboard analytics and metrics';
  }

  /**
   * Capture active filters from the UI
   */
  async captureActiveFilters() {
    // Try to get the active filter button
    const activeFilterButton = document.querySelector('.bg-primary.text-white');
    const period = activeFilterButton?.textContent?.trim() || 'MTD';
    
    // Try to extract year from the page title
    const pageTitle = document.querySelector('.text-3xl.font-bold.text-primary-dark');
    const yearMatch = pageTitle?.textContent?.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
    
    return {
      period,
      year,
      month: new Date().getMonth() + 1,
      quarter: Math.ceil((new Date().getMonth() + 1) / 3)
    };
  }

  /**
   * Extract attributes from element
   */
  extractAttributes(element) {
    const attributes = {};
    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }
    return attributes;
  }

  /**
   * Identify component type from element
   */
  identifyComponentType(element) {
    try {
      // Check for data attributes first
      if (element.hasAttribute && element.hasAttribute('data-export-type')) {
        return element.getAttribute('data-export-type');
      }

      // Check for chart containers (Recharts)
      try {
        if (element.querySelector && element.querySelector('.recharts-wrapper')) {
          return 'chart';
        }
      } catch (e) {
        // Ignore querySelector errors
      }

      // Check for metric cards
      if (element.classList && 
          element.classList.contains('bg-white') && 
          element.classList.contains('rounded-lg') &&
          element.classList.contains('shadow-md')) {
        try {
          if (element.querySelector('.text-2xl.font-bold')) {
            return 'metric';
          }
        } catch (e) {
          // Still might be a metric even without the specific selector
          return 'metric';
        }
      }

      // Check for tables
      if (element.tagName === 'TABLE') {
        return 'table';
      }
      
      try {
        if (element.querySelector && element.querySelector('table')) {
          return 'table';
        }
      } catch (e) {
        // Ignore querySelector errors
      }

      return null;
    } catch (error) {
      console.warn('Error in identifyComponentType:', error);
      return null;
    }
  }

  /**
   * Extract text content from element
   */
  extractTextContent(element) {
    // Get direct text nodes only, not from children
    const textNodes = Array.from(element.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent.trim())
      .filter(text => text.length > 0);
    
    return textNodes.join(' ') || null;
  }

  /**
   * Extract text styles
   */
  async extractTextStyles(element) {
    const computed = window.getComputedStyle(element);
    return {
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      fontStyle: computed.fontStyle,
      color: computed.color,
      textAlign: computed.textAlign,
      lineHeight: computed.lineHeight,
      letterSpacing: computed.letterSpacing
    };
  }

  /**
   * Process assets in element
   */
  async processAssets(element, node) {
    // Check for images
    if (element.tagName === 'IMG') {
      const src = element.src;
      if (src) {
        const assetId = this.generateNodeId();
        this.assetRegistry.set(assetId, {
          type: 'image',
          url: src,
          nodeId: node.id
        });
        node.assetId = assetId;
      }
    }

    // Check for background images
    const bgImage = node.computedStyle?.backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const urlMatch = bgImage.match(/url\(["']?(.+?)["']?\)/);
      if (urlMatch) {
        const assetId = this.generateNodeId();
        this.assetRegistry.set(assetId, {
          type: 'background-image',
          url: urlMatch[1],
          nodeId: node.id
        });
        node.bgAssetId = assetId;
      }
    }

    // Check for SVG content
    if (element.tagName === 'svg') {
      const assetId = this.generateNodeId();
      this.assetRegistry.set(assetId, {
        type: 'svg',
        content: element.outerHTML,
        nodeId: node.id
      });
      node.svgAssetId = assetId;
    }
  }

  /**
   * Check if element is interactive
   */
  isInteractive(element) {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    
    return tagName === 'button' || 
           tagName === 'a' || 
           tagName === 'input' || 
           tagName === 'select' ||
           role === 'button' ||
           element.classList.contains('clickable') ||
           element.classList.contains('interactive');
  }

  /**
   * Trigger interactive state
   */
  async triggerInteractiveState(element, state) {
    switch (state) {
      case 'hover':
        element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        break;
      case 'focus':
        element.focus();
        break;
      case 'active':
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        break;
    }
    // Wait for styles to update
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Reset interactive state
   */
  async resetInteractiveState(element, state) {
    switch (state) {
      case 'hover':
        element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
        break;
      case 'focus':
        element.blur();
        break;
      case 'active':
        element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        break;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Check if styles have differences
   */
  hasStyleDifferences(style1, style2) {
    if (!style1 || !style2) return true;
    
    const keys1 = Object.keys(style1);
    const keys2 = Object.keys(style2);
    
    if (keys1.length !== keys2.length) return true;
    
    return keys1.some(key => style1[key] !== style2[key]);
  }

  /**
   * Extract metric data from element
   */
  extractMetricData(element) {
    const titleElement = element.querySelector('.text-sm.font-medium.text-neutral-mid') || 
                        element.querySelector('h3');
    const valueElement = element.querySelector('.text-2xl.font-bold') || 
                        element.querySelector('.metric-value');
    const trendElement = element.querySelector('.text-xs.flex.items-center.gap-1');
    
    return {
      label: titleElement?.textContent?.trim() || '',
      value: valueElement?.textContent?.trim() || '',
      formattedValue: valueElement?.textContent?.trim() || '',
      change: trendElement?.textContent?.trim() || null,
      changeType: trendElement?.querySelector('.text-green-600') ? 'positive' : 
                  trendElement?.querySelector('.text-red-600') ? 'negative' : 'neutral',
      unit: this.detectUnit(valueElement?.textContent)
    };
  }

  /**
   * Extract table data from element
   */
  extractTableData(element) {
    const table = element.tagName === 'TABLE' ? element : element.querySelector('table');
    if (!table) return null;

    const data = {
      headers: [],
      rows: []
    };

    // Extract headers
    const headerRow = table.querySelector('thead tr');
    if (headerRow) {
      data.headers = Array.from(headerRow.querySelectorAll('th')).map(th => ({
        text: th.textContent.trim(),
        sortable: th.hasAttribute('data-sortable'),
        dataType: th.getAttribute('data-type') || 'string'
      }));
    }

    // Extract rows
    const bodyRows = table.querySelectorAll('tbody tr');
    data.rows = Array.from(bodyRows).map(row => {
      return Array.from(row.querySelectorAll('td')).map(td => ({
        text: td.textContent.trim(),
        html: td.innerHTML,
        dataValue: td.getAttribute('data-value') || td.textContent.trim()
      }));
    });

    return data;
  }

  /**
   * Detect chart type from element
   */
  detectChartType(element) {
    const classes = typeof element.className === 'string' ? element.className : element.className?.toString() || '';
    if (classes.includes('pie-chart') || classes.includes('gauge')) return 'gauge';
    if (classes.includes('bar-chart')) return 'bar';
    if (classes.includes('line-chart')) return 'line';
    return 'unknown';
  }

  /**
   * Extract gauge data
   */
  extractGaugeData(element) {
    const percentageText = element.querySelector('.text-3xl.font-bold')?.textContent || '';
    const percentage = parseFloat(percentageText.replace('%', ''));
    
    // Extract current and target amounts
    const amountTexts = Array.from(element.querySelectorAll('.text-xs.text-neutral-mid'));
    let currentAmount = '';
    let targetAmount = '';
    
    amountTexts.forEach(text => {
      const content = text.textContent;
      if (content.includes('Current:')) {
        currentAmount = text.nextSibling?.textContent?.trim() || '';
      } else if (content.includes('Target:')) {
        targetAmount = text.nextSibling?.textContent?.trim() || '';
      }
    });
    
    return {
      percentage,
      currentAmount,
      targetAmount
    };
  }

  /**
   * Extract bar chart data
   */
  extractBarChartData(element) {
    // This would extract data from bar chart elements
    // For now, return placeholder
    return {
      labels: [],
      values: []
    };
  }

  /**
   * Detect unit from value text
   */
  detectUnit(valueText) {
    if (!valueText) return null;
    if (valueText.includes('%')) return 'percentage';
    if (valueText.includes('SAR') || valueText.includes('$')) return 'currency';
    return 'number';
  }

  /**
   * Get pseudo element bounds
   */
  getPseudoElementBounds(element, pseudo) {
    // Pseudo elements don't have getBoundingClientRect
    // Estimate based on parent element
    const parentBounds = element.getBoundingClientRect();
    return {
      x: parentBounds.x,
      y: parentBounds.y,
      width: parentBounds.width,
      height: 20 // Estimate
    };
  }

  /**
   * Extract CSS variables
   */
  extractCSSVariables(element) {
    const computed = window.getComputedStyle(element);
    const variables = {};
    
    // Get CSS custom properties from computed styles
    Array.from(computed).forEach(prop => {
      if (prop.startsWith('--')) {
        variables[prop] = computed.getPropertyValue(prop);
      }
    });
    
    return variables;
  }

  /**
   * Normalize units
   */
  normalizeUnit(value) {
    // Convert to consistent units
    if (value.includes('px')) {
      return parseFloat(value);
    }
    return value;
  }

  /**
   * Build responsive structure
   */
  buildResponsiveStructure(captureData) {
    return {
      viewports: captureData.map(data => ({
        ...data.viewport,
        structure: data.capture
      }))
    };
  }

  /**
   * Build single structure
   */
  buildSingleStructure(captureData) {
    return captureData;
  }

  /**
   * Suggest narrative structure
   */
  suggestNarrativeStructure() {
    const { dashboardType } = this.semanticContext;
    
    if (dashboardType === 'executive-overview') {
      return 'three-act-executive';
    } else if (dashboardType === 'business-analysis') {
      return 'problem-solution-impact';
    }
    return 'linear-report';
  }

  /**
   * Identify key metrics
   */
  identifyKeyMetrics() {
    return this.capturedNodes
      .filter(node => node.componentType === 'metric')
      .map(node => ({
        label: node.metricData?.label,
        value: node.metricData?.value,
        importance: node.semanticType === 'kpi-metric' ? 'high' : 'normal'
      }));
  }

  /**
   * Analyze visual hierarchy
   */
  analyzeVisualHierarchy() {
    // Analyze based on size, position, and styling
    return {
      primaryElements: this.capturedNodes.filter(node => 
        node.bounds.y < 300 && node.bounds.width > 200
      ).length,
      secondaryElements: this.capturedNodes.filter(node => 
        node.bounds.y >= 300 && node.bounds.y < 600
      ).length,
      tertiaryElements: this.capturedNodes.filter(node => 
        node.bounds.y >= 600
      ).length
    };
  }

  normalizeStyleValue(property, value) {
    // Normalize units and values for better cross-platform compatibility
    if (property.includes('Color') || property === 'color') {
      return this.normalizeColor(value);
    }
    
    if (property.includes('font-size') || property.includes('Width') || 
        property.includes('Height') || property.includes('margin') || 
        property.includes('padding')) {
      return this.normalizeUnit(value);
    }
    
    return value;
  }

  normalizeColor(color) {
    // Convert all colors to consistent format
    if (color.startsWith('rgb')) {
      return this.rgbToHex(color);
    }
    return color;
  }

  rgbToHex(rgb) {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match;
      return '#' + [r, g, b].map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }
    return rgb;
  }

  extractDesignTokens() {
    // Extract design system variables
    const root = document.documentElement;
    const computed = window.getComputedStyle(root);
    const tokens = {};

    // Extract CSS custom properties
    const customProps = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules);
        } catch (e) {
          return [];
        }
      })
      .filter(rule => rule.selectorText === ':root')
      .flatMap(rule => Array.from(rule.style));

    customProps.forEach(prop => {
      if (prop.startsWith('--')) {
        tokens[prop] = computed.getPropertyValue(prop);
      }
    });

    // Extract brand colors from Tailwind config
    tokens.colors = {
      primary: '#9e1f63',
      'primary-dark': '#721548',
      'primary-light': '#cb5b96',
      secondary: '#424046',
      'secondary-light': '#6a686f',
      'secondary-pale': '#e2e1e6'
    };

    return tokens;
  }

  async setViewport(viewport) {
    // For testing different viewport sizes
    if (window.innerWidth !== viewport.width) {
      window.resizeTo(viewport.width, viewport.height);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async waitForReflow() {
    // Wait for browser reflow after viewport change
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  }
}

// Create and validate singleton instance
const enhancedCaptureServiceInstance = new EnhancedCaptureService();

// Validate that all required methods exist
const requiredMethods = [
  'captureDashboard',
  'analyzeSemanticContext', 
  'inferPurpose',
  'captureActiveFilters',
  'captureViewport',
  'traverseElement',
  'extractComputedStyles',
  'buildVirtualDOM'
];

requiredMethods.forEach(method => {
  if (typeof enhancedCaptureServiceInstance[method] !== 'function') {
    console.error(`❌ Method ${method} is not defined on EnhancedCaptureService instance`);
  }
});

console.log('✅ EnhancedCaptureService initialized with methods:', 
  Object.getOwnPropertyNames(Object.getPrototypeOf(enhancedCaptureServiceInstance))
    .filter(name => typeof enhancedCaptureServiceInstance[name] === 'function')
);

export default enhancedCaptureServiceInstance;