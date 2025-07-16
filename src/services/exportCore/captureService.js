/**
 * Dashboard State Capture Service
 * 
 * This service is responsible for capturing the current state of dashboard components
 * and converting them into a Universal Intermediate Representation (UIR) that can be
 * transformed into various export formats.
 */

class DashboardCaptureService {
  constructor() {
    this.capturedElements = [];
    this.metadata = {};
  }

  /**
   * Capture the current state of a dashboard view
   * @param {Object} options - Capture options
   * @returns {Object} Captured dashboard state in UIR format
   */
  async captureDashboard(options = {}) {
    const {
      viewName = 'dashboard',
      includeData = true,
      includeStyles = true,
      captureFilters = true,
      captureCharts = true,
      captureTables = true,
      captureMetrics = true
    } = options;

    console.log('🎯 Starting dashboard capture with options:', options);

    try {
      // Reset capture state
      this.capturedElements = [];
      this.metadata = {
        captureTimestamp: new Date().toISOString(),
        viewName,
        options,
        dimensions: this.getViewportDimensions()
      };

      console.log('📐 Viewport dimensions:', this.metadata.dimensions);

      // Capture global context (filters, period selection)
      if (captureFilters) {
        this.metadata.filters = await this.captureGlobalFilters();
        console.log('🔍 Captured filters:', this.metadata.filters);
      }

      // Capture dashboard components
      const dashboardRoot = document.querySelector('[data-export-root]') || 
                           document.querySelector('.dashboard-content') ||
                           document.querySelector('main');

      console.log('🏠 Dashboard root element:', dashboardRoot);

      if (!dashboardRoot) {
        throw new Error('Dashboard root element not found');
      }

      // Traverse and capture dashboard elements
      console.log('🚶 Starting DOM traversal...');
      await this.traverseAndCapture(dashboardRoot, {
        includeData,
        includeStyles,
        captureCharts,
        captureTables,
        captureMetrics
      });

      console.log(`✅ Captured ${this.capturedElements.length} elements`);

      // Build UIR structure
      const uir = this.buildUIR();
      console.log('📦 Built UIR document:', uir);

      return uir;
    } catch (error) {
      console.error('❌ Dashboard capture failed:', error);
      throw error;
    }
  }

  /**
   * Traverse DOM and capture exportable elements
   */
  async traverseAndCapture(element, options) {
    // Skip non-exportable elements
    if (element.hasAttribute('data-export-ignore')) {
      console.log('⏭️ Skipping element with data-export-ignore');
      return;
    }

    // Check for specific component types
    const componentType = this.identifyComponentType(element);
    
    if (componentType) {
      console.log(`🔎 Found component type: ${componentType}`, element);
      const capturedComponent = await this.captureComponent(element, componentType, options);
      if (capturedComponent) {
        this.capturedElements.push(capturedComponent);
        console.log(`📸 Captured ${componentType} component:`, capturedComponent);
      }
    }

    // Recursively capture children
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      await this.traverseAndCapture(children[i], options);
    }
  }

  /**
   * Identify the type of dashboard component
   */
  identifyComponentType(element) {
    // Check for data attributes first
    if (element.hasAttribute('data-export-type')) {
      return element.getAttribute('data-export-type');
    }

    // Check for chart containers (Recharts)
    if (element.querySelector('.recharts-wrapper')) {
      return 'chart';
    }

    // Check for metric cards - look for the specific structure
    if (element.classList.contains('bg-white') && 
        element.classList.contains('rounded-lg') &&
        element.classList.contains('shadow-md') &&
        element.querySelector('.text-2xl.font-bold')) {
      return 'metric';
    }

    // Check for dashboard card sections
    if (element.classList.contains('dashboard-card')) {
      // Check if it contains a chart
      if (element.querySelector('.recharts-wrapper')) {
        return 'chart';
      }
      // Otherwise it's a section container
      return 'section';
    }

    // Check for business unit performance items
    if (element.classList.contains('bg-secondary-pale') && 
        element.classList.contains('rounded-lg') &&
        element.querySelector('.font-semibold.text-neutral-dark')) {
      return 'business-unit-item';
    }

    // Check for tables
    if (element.tagName === 'TABLE' || element.querySelector('table')) {
      return 'table';
    }

    // Check for section headers with title class
    if (element.classList.contains('section-title') || 
        (element.querySelector('h1, h2, h3') && 
         element.querySelector('.section-title'))) {
      return 'section-header';
    }

    // Check for filter components
    if (element.classList.contains('period-filter') || 
        element.hasAttribute('data-filter-component')) {
      return 'filter';
    }

    return null;
  }

  /**
   * Capture a specific component based on its type
   */
  async captureComponent(element, type, options) {
    const baseCapture = {
      id: this.generateId(),
      type,
      position: this.getElementPosition(element),
      dimensions: this.getElementDimensions(element),
      visibility: this.isElementVisible(element)
    };

    // Skip invisible elements
    if (!baseCapture.visibility) {
      return null;
    }

    // Add styles if requested
    if (options.includeStyles) {
      baseCapture.styles = this.captureStyles(element);
    }

    // Capture type-specific data
    switch (type) {
      case 'chart':
        if (options.captureCharts) {
          return await this.captureChart(element, baseCapture);
        }
        break;

      case 'metric':
        if (options.captureMetrics) {
          return this.captureMetric(element, baseCapture);
        }
        break;

      case 'table':
        if (options.captureTables) {
          return this.captureTable(element, baseCapture);
        }
        break;

      case 'section-header':
        return this.captureSectionHeader(element, baseCapture);

      case 'filter':
        return this.captureFilter(element, baseCapture);

      case 'business-unit-item':
        return this.captureBusinessUnitItem(element, baseCapture);

      case 'section':
        return this.captureSectionContainer(element, baseCapture);

      default:
        return this.captureGenericElement(element, baseCapture);
    }

    return null;
  }

  /**
   * Capture chart component data and configuration
   */
  async captureChart(element, baseCapture) {
    const chartWrapper = element.querySelector('.recharts-wrapper');
    if (!chartWrapper) return null;

    // Extract chart type from class names or data attributes
    const chartType = this.detectChartType(element);
    
    // Get chart title
    const title = this.extractTitle(element);
    
    // For gauge charts, extract the percentage and values
    let chartData = {};
    if (chartType === 'gauge') {
      const percentageText = element.querySelector('.text-3xl.font-bold')?.textContent || '';
      const percentage = parseFloat(percentageText.replace('%', ''));
      
      // Extract current and target amounts from text
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
      
      chartData = {
        type: 'gauge',
        percentage,
        currentAmount,
        targetAmount,
        title
      };
    }
    
    // Capture chart configuration
    const chartConfig = {
      type: chartType,
      title,
      data: chartData,
      dimensions: {
        width: chartWrapper.clientWidth,
        height: chartWrapper.clientHeight
      },
      // Capture SVG for high-fidelity export
      svg: chartWrapper.querySelector('svg')?.outerHTML
    };

    return {
      ...baseCapture,
      componentType: 'chart',
      chartConfig
    };
  }

  /**
   * Capture metric/KPI card data
   */
  captureMetric(element, baseCapture) {
    // Look for metric card structure
    const titleElement = element.querySelector('.text-sm.font-medium.text-neutral-mid') || 
                        element.querySelector('h3');
    const valueElement = element.querySelector('.text-2xl.font-bold') || 
                        element.querySelector('.metric-value');
    const trendElement = element.querySelector('.text-xs.flex.items-center.gap-1');
    
    const metricData = {
      label: titleElement?.textContent?.trim() || '',
      value: valueElement?.textContent?.trim() || '',
      formattedValue: valueElement?.textContent?.trim() || '',
      change: trendElement?.textContent?.trim() || null,
      changeType: trendElement?.querySelector('.text-green-600') ? 'positive' : 
                  trendElement?.querySelector('.text-red-600') ? 'negative' : 'neutral',
      unit: this.detectUnit(valueElement?.textContent)
    };

    // Look for icon to determine metric type
    const iconElement = element.querySelector('[class*="lucide"]');
    if (iconElement) {
      metricData.icon = iconElement.className;
    }

    return {
      ...baseCapture,
      componentType: 'metric',
      metricData
    };
  }

  /**
   * Capture table data and structure
   */
  captureTable(element, baseCapture) {
    const table = element.tagName === 'TABLE' ? element : element.querySelector('table');
    if (!table) return null;

    const tableData = {
      headers: [],
      rows: [],
      title: this.extractTitle(element),
      sortable: table.hasAttribute('data-sortable'),
      filterable: table.hasAttribute('data-filterable')
    };

    // Extract headers
    const headerRow = table.querySelector('thead tr');
    if (headerRow) {
      tableData.headers = Array.from(headerRow.querySelectorAll('th')).map(th => ({
        text: th.textContent.trim(),
        sortable: th.hasAttribute('data-sortable'),
        dataType: th.getAttribute('data-type') || 'string'
      }));
    }

    // Extract rows
    const bodyRows = table.querySelectorAll('tbody tr');
    tableData.rows = Array.from(bodyRows).map(row => {
      return Array.from(row.querySelectorAll('td')).map(td => ({
        text: td.textContent.trim(),
        html: td.innerHTML,
        dataValue: td.getAttribute('data-value') || td.textContent.trim()
      }));
    });

    return {
      ...baseCapture,
      componentType: 'table',
      tableData
    };
  }

  /**
   * Capture section headers for document structure
   */
  captureSectionHeader(element, baseCapture) {
    const headerElement = element.querySelector('h1, h2, h3, h4, h5, h6') || element;
    
    return {
      ...baseCapture,
      componentType: 'section-header',
      headerData: {
        text: headerElement.textContent.trim(),
        level: parseInt(headerElement.tagName.charAt(1)) || 2,
        id: headerElement.id || this.generateId('header')
      }
    };
  }

  /**
   * Capture filter component state
   */
  captureFilter(element, baseCapture) {
    // This will be populated from FilterContext
    return {
      ...baseCapture,
      componentType: 'filter',
      filterData: {
        type: element.getAttribute('data-filter-type') || 'period',
        value: element.getAttribute('data-filter-value') || '',
        options: this.extractFilterOptions(element)
      }
    };
  }

  /**
   * Capture business unit item
   */
  captureBusinessUnitItem(element, baseCapture) {
    const nameElement = element.querySelector('.font-semibold.text-neutral-dark.text-lg');
    const revenueElement = element.querySelector('.text-green-600, .text-amber-600');
    const targetElement = element.querySelector('.text-accent-blue');
    const percentageElement = element.querySelector('.text-lg.font-bold');
    
    const unitData = {
      name: nameElement?.textContent?.trim() || '',
      revenue: revenueElement?.textContent?.trim() || '',
      target: targetElement?.textContent?.trim() || '',
      achievement: percentageElement?.textContent?.trim() || '',
      achievementStatus: percentageElement?.classList.contains('text-green-600') ? 'high' :
                        percentageElement?.classList.contains('text-yellow-600') ? 'medium' : 'low'
    };

    return {
      ...baseCapture,
      componentType: 'business-unit-item',
      unitData
    };
  }

  /**
   * Capture section container
   */
  captureSectionContainer(element, baseCapture) {
    const title = element.querySelector('.section-title')?.textContent?.trim() || '';
    
    return {
      ...baseCapture,
      componentType: 'section',
      sectionData: {
        title,
        hasChart: !!element.querySelector('.recharts-wrapper'),
        childCount: element.children.length
      }
    };
  }

  /**
   * Capture generic element
   */
  captureGenericElement(element, baseCapture) {
    return {
      ...baseCapture,
      componentType: 'generic',
      content: {
        html: element.innerHTML,
        text: element.textContent.trim()
      }
    };
  }

  /**
   * Build Universal Intermediate Representation from captured elements
   */
  buildUIR() {
    return {
      version: '1.0',
      metadata: this.metadata,
      structure: this.organizeElements(this.capturedElements),
      styles: this.extractGlobalStyles(),
      data: {
        timestamp: new Date().toISOString(),
        source: 'proceed-dashboard'
      }
    };
  }

  /**
   * Organize captured elements into hierarchical structure
   */
  organizeElements(elements) {
    // Sort elements by position (top to bottom, left to right)
    const sorted = elements.sort((a, b) => {
      if (Math.abs(a.position.top - b.position.top) > 10) {
        return a.position.top - b.position.top;
      }
      return a.position.left - b.position.left;
    });

    // Group elements into sections based on proximity
    const sections = [];
    let currentSection = null;

    sorted.forEach(element => {
      if (!currentSection || 
          element.position.top - currentSection.bounds.bottom > 50) {
        // Start new section
        currentSection = {
          id: this.generateId('section'),
          type: 'section',
          bounds: {
            top: element.position.top,
            bottom: element.position.bottom,
            left: element.position.left,
            right: element.position.right
          },
          elements: []
        };
        sections.push(currentSection);
      }

      // Add element to current section
      currentSection.elements.push(element);
      
      // Update section bounds
      currentSection.bounds.bottom = Math.max(
        currentSection.bounds.bottom, 
        element.position.bottom
      );
      currentSection.bounds.right = Math.max(
        currentSection.bounds.right, 
        element.position.right
      );
    });

    return sections;
  }

  // Utility methods
  getViewportDimensions() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      bottom: rect.bottom + window.scrollY,
      right: rect.right + window.scrollX
    };
  }

  getElementDimensions(element) {
    return {
      width: element.offsetWidth,
      height: element.offsetHeight
    };
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  captureStyles(element) {
    const computedStyle = window.getComputedStyle(element);
    const relevantProperties = [
      'color', 'backgroundColor', 'fontSize', 'fontWeight', 'fontFamily',
      'padding', 'margin', 'border', 'borderRadius', 'boxShadow'
    ];

    const styles = {};
    relevantProperties.forEach(prop => {
      styles[prop] = computedStyle.getPropertyValue(prop);
    });

    return styles;
  }

  extractGlobalStyles() {
    // Extract relevant CSS variables and theme settings
    const root = document.documentElement;
    const rootStyle = window.getComputedStyle(root);
    
    return {
      colors: {
        primary: rootStyle.getPropertyValue('--color-primary') || '#9e1f63',
        secondary: rootStyle.getPropertyValue('--color-secondary') || '#424046',
        background: rootStyle.getPropertyValue('--color-background') || '#ffffff'
      },
      fonts: {
        primary: rootStyle.getPropertyValue('--font-primary') || 'Verdana, sans-serif'
      }
    };
  }

  async captureGlobalFilters() {
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

  detectChartType(element) {
    const classes = element.className;
    if (classes.includes('pie-chart') || classes.includes('gauge')) return 'gauge';
    if (classes.includes('bar-chart')) return 'bar';
    if (classes.includes('line-chart')) return 'line';
    return 'unknown';
  }

  async extractChartData(element) {
    // This will be enhanced to extract actual chart data
    // For now, return placeholder
    return {
      series: [],
      categories: []
    };
  }

  extractTitle(element) {
    const titleElement = element.querySelector('h1, h2, h3, h4, .chart-title, .section-title');
    return titleElement ? titleElement.textContent.trim() : '';
  }

  detectUnit(valueText) {
    if (!valueText) return null;
    if (valueText.includes('%')) return 'percentage';
    if (valueText.includes('SAR') || valueText.includes('$')) return 'currency';
    return 'number';
  }

  extractFilterOptions(element) {
    const options = [];
    const optionElements = element.querySelectorAll('option, [role="option"], .filter-option');
    
    optionElements.forEach(opt => {
      options.push({
        value: opt.value || opt.getAttribute('data-value'),
        label: opt.textContent.trim()
      });
    });

    return options;
  }

  generateId(prefix = 'element') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
const dashboardCaptureService = new DashboardCaptureService();

export default dashboardCaptureService;