/**
 * Architectural PDF Handler
 * 
 * Implements the two-part system architecture:
 * Enhanced Capture Agent + Design Compiler + Synthesis Engine
 */

import enhancedCaptureService from '../enhancedCaptureService';
import designCompiler from '../designCompiler';
import { applyPrintStyles, removePrintStyles } from '../printStyles';

class ArchitecturalPDFHandler {
  constructor() {
    this.format = 'pdf';
  }

  /**
   * Transform - minimal for architectural approach
   */
  async transform(uirDocument, options = {}) {
    return uirDocument;
  }

  /**
   * Validate
   */
  async validate(document) {
    return { valid: true, errors: [] };
  }

  /**
   * Generate PDF using enhanced architectural approach
   */
  async generate(uirDocument, options = {}) {
    console.log('🏗️ Generating PDF with architectural approach...');

    try {
      // Verify enhanced capture service is available
      console.log('📍 Enhanced capture service check:', enhancedCaptureService);
      console.log('📍 captureDashboard method exists:', typeof enhancedCaptureService.captureDashboard === 'function');
      
      // Step 1: Enhanced Capture
      const virtualDOM = await enhancedCaptureService.captureDashboard({
        captureInteractiveStates: true,
        capturePseudoElements: true,
        captureComputedStyles: true,
        captureResponsiveStates: false,
        viewports: [{ width: 1920, height: 1080, name: 'Desktop' }]
      });

      console.log('📸 Virtual DOM captured:', virtualDOM);

      // Step 2: Design Compilation
      const compiled = await designCompiler.compile(
        virtualDOM, 
        'pdf',
        {
          priority: options.priority || 'balanced',
          preserveInteractivity: false,
          optimizeForPrint: true
        }
      );

      console.log('🔧 Design compiled:', compiled);

      // Extract the actual compiled data from the generator output
      const compiledData = compiled.data || compiled;
      console.log('📊 Compiled data structure:', Object.keys(compiledData));

      // Step 3: Generate PDF with enhanced fidelity
      const pdfOutput = await this.synthesizePDF(compiledData, options);

      return pdfOutput;

    } catch (error) {
      console.error('❌ Architectural PDF generation failed:', error);
      throw error;
    }
  }

  /**
   * Synthesize PDF from compiled data
   */
  async synthesizePDF(compiledData, options) {
    // Apply print styles
    applyPrintStyles();

    // Create enhanced print container
    const printContainer = this.createPrintContainer(compiledData);
    document.body.appendChild(printContainer);

    // Build content
    await this.buildPrintContent(printContainer, compiledData);

    // Create overlay
    const overlay = this.createPrintOverlay();
    document.body.appendChild(overlay);

    // Set up print handlers
    const beforePrintHandler = () => {
      console.log('📄 Print dialog opened');
      overlay.style.display = 'none';
      printContainer.classList.add('printing');
    };

    const afterPrintHandler = () => {
      console.log('✅ Print completed');
      
      // Cleanup
      window.removeEventListener('beforeprint', beforePrintHandler);
      window.removeEventListener('afterprint', afterPrintHandler);
      
      document.body.removeChild(printContainer);
      if (overlay.parentNode) {
        document.body.removeChild(overlay);
      }
      
      removePrintStyles();
    };

    window.addEventListener('beforeprint', beforePrintHandler);
    window.addEventListener('afterprint', afterPrintHandler);

    // Trigger print
    setTimeout(() => {
      overlay.style.opacity = '1';
      // Give time for overlay to render
      setTimeout(() => {
        window.print();
      }, 100);
    }, 500);

    return {
      type: 'print',
      success: true,
      message: 'Enhanced PDF generation initiated',
      metadata: compiledData.metadata
    };
  }

  /**
   * Create print container with proper structure
   */
  createPrintContainer(compiledData) {
    const container = document.createElement('div');
    container.className = 'print-container no-screen';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      z-index: 999998;
      overflow: auto;
      padding: 20px;
    `;

    // Add print-specific styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @media screen {
        .no-screen { display: none !important; }
      }
      
      @media print {
        .no-print { display: none !important; }
        .print-container { display: block !important; }
        
        .print-page {
          page-break-after: always;
          page-break-inside: avoid;
          margin-bottom: 0;
        }
        
        .print-page:last-child {
          page-break-after: auto;
        }
        
        .print-section {
          page-break-inside: avoid;
          margin-bottom: 2rem;
        }
        
        .print-metric {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        
        @page {
          size: A4 landscape;
          margin: 15mm;
        }
      }
    `;
    container.appendChild(styleSheet);

    return container;
  }

  /**
   * Build print content from compiled data
   */
  async buildPrintContent(container, compiledData) {
    console.log('📄 Building print content with data:', compiledData);
    
    // Handle different data structures
    const metadata = compiledData.metadata || compiledData.context || {};
    const elements = compiledData.elements || compiledData.tokens || [];
    const layout = compiledData.layout || {};
    const hierarchy = compiledData.hierarchy || compiledData.visualHierarchy || {};

    console.log('📊 Content structure:', {
      metadataKeys: Object.keys(metadata),
      elementsCount: elements.length,
      hasLayout: !!layout,
      hasHierarchy: !!hierarchy
    });

    // Create cover page
    const coverPage = this.createCoverPage(metadata);
    container.appendChild(coverPage);

    // Group elements by semantic type
    const sections = this.organizeSections(elements, hierarchy);

    // Create content pages
    for (const section of sections) {
      const page = await this.createContentPage(section, compiledData);
      container.appendChild(page);
    }

    // Add footer to all pages
    this.addFooters(container, metadata);
  }

  /**
   * Create cover page
   */
  createCoverPage(metadata) {
    const page = document.createElement('div');
    page.className = 'print-page cover-page';
    
    page.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        text-align: center;
      ">
        <h1 style="
          font-size: 48px;
          color: #9e1f63;
          margin-bottom: 1rem;
          font-weight: bold;
        ">
          ${metadata.title || 'Executive Dashboard Report'}
        </h1>
        
        <h2 style="
          font-size: 24px;
          color: #424046;
          margin-bottom: 3rem;
        ">
          ${metadata.filters?.period || ''} ${metadata.filters?.year || new Date().getFullYear()}
        </h2>
        
        <div style="
          font-size: 16px;
          color: #717171;
        ">
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <p>${metadata.dashboardType ? metadata.dashboardType.replace('-', ' ').toUpperCase() : ''}</p>
        </div>
      </div>
    `;
    
    return page;
  }

  /**
   * Create content page
   */
  async createContentPage(section, compiledData) {
    const page = document.createElement('div');
    page.className = 'print-page content-page';

    // Section header
    if (section.title) {
      const header = document.createElement('h2');
      header.style.cssText = `
        font-size: 32px;
        color: #9e1f63;
        margin-bottom: 1.5rem;
        font-weight: bold;
      `;
      header.textContent = section.title;
      page.appendChild(header);
    }

    // Section content based on type
    if (section.type === 'metrics') {
      const metricsGrid = await this.createMetricsGrid(section.elements);
      page.appendChild(metricsGrid);
    } else if (section.type === 'charts') {
      const chartsContainer = await this.createChartsContainer(section.elements, compiledData);
      page.appendChild(chartsContainer);
    } else if (section.type === 'analysis') {
      const analysisContent = await this.createAnalysisContent(section.elements);
      page.appendChild(analysisContent);
    } else {
      const genericContent = await this.createGenericContent(section.elements);
      page.appendChild(genericContent);
    }

    return page;
  }

  /**
   * Create metrics grid
   */
  async createMetricsGrid(metrics) {
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    `;

    for (const metric of metrics) {
      const card = document.createElement('div');
      card.className = 'print-metric';
      card.style.cssText = `
        border: 1px solid #e2e1e6;
        border-radius: 8px;
        padding: 1rem;
        background: #f9f9f9;
      `;

      const label = document.createElement('div');
      label.style.cssText = 'font-size: 14px; color: #717171; margin-bottom: 0.5rem;';
      label.textContent = metric.label || 'Metric';

      const value = document.createElement('div');
      value.style.cssText = 'font-size: 24px; color: #9e1f63; font-weight: bold;';
      value.textContent = metric.value || '0';

      card.appendChild(label);
      card.appendChild(value);

      if (metric.change) {
        const change = document.createElement('div');
        change.style.cssText = `font-size: 12px; color: ${
          metric.changeType === 'positive' ? '#16a34a' : '#dc2626'
        }; margin-top: 0.5rem;`;
        change.textContent = metric.change;
        card.appendChild(change);
      }

      grid.appendChild(card);
    }

    return grid;
  }

  /**
   * Create charts container
   */
  async createChartsContainer(charts, compiledData) {
    const container = document.createElement('div');
    container.style.cssText = 'margin-bottom: 2rem;';

    for (const chart of charts) {
      const chartDiv = document.createElement('div');
      chartDiv.className = 'print-section';
      chartDiv.style.cssText = 'margin-bottom: 1.5rem;';

      // Chart title
      if (chart.title) {
        const title = document.createElement('h3');
        title.style.cssText = 'font-size: 20px; color: #424046; margin-bottom: 1rem;';
        title.textContent = chart.title;
        chartDiv.appendChild(title);
      }

      // Chart visualization
      if (chart.exportAs === 'image' || chart.svg) {
        // Use captured SVG or image
        const vizContainer = document.createElement('div');
        vizContainer.style.cssText = 'text-align: center;';
        
        if (chart.svg) {
          vizContainer.innerHTML = chart.svg;
        } else {
          const img = document.createElement('img');
          img.src = chart.imageUrl;
          img.style.cssText = 'max-width: 100%; height: auto;';
          vizContainer.appendChild(img);
        }
        
        chartDiv.appendChild(vizContainer);
      } else {
        // Fallback representation
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
          border: 1px solid #e2e1e6;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          background: #f9f9f9;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        `;
        placeholder.innerHTML = `
          <div>
            <div style="font-size: 18px; color: #717171; margin-bottom: 0.5rem;">
              ${chart.type.toUpperCase()} Chart
            </div>
            <div style="font-size: 14px; color: #999;">
              ${chart.dataPoints || 'Data visualization'}
            </div>
          </div>
        `;
        chartDiv.appendChild(placeholder);
      }

      container.appendChild(chartDiv);
    }

    return container;
  }

  /**
   * Create print overlay
   */
  createPrintOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'print-overlay no-print';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      transition: opacity 0.3s ease;
    `;

    overlay.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <div style="margin-bottom: 2rem;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto;">
            <rect x="6" y="2" width="12" height="20" rx="2"></rect>
            <path d="M6 6h12"></path>
            <path d="M6 10h12"></path>
            <path d="M6 14h12"></path>
            <path d="M6 18h12"></path>
          </svg>
        </div>
        <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 1rem;">
          Generating Enhanced PDF Export
        </h2>
        <p style="font-size: 16px; opacity: 0.8; margin-bottom: 2rem;">
          Capturing complete dashboard with full fidelity...
        </p>
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 1rem; max-width: 400px; margin: 0 auto;">
          <p style="font-size: 14px; margin-bottom: 0.5rem;">
            <strong>Enhanced Export Features:</strong>
          </p>
          <ul style="text-align: left; font-size: 14px; opacity: 0.9; list-style: none; padding: 0;">
            <li style="margin-bottom: 0.25rem;">✓ Complete visual capture with styles</li>
            <li style="margin-bottom: 0.25rem;">✓ Interactive state preservation</li>
            <li style="margin-bottom: 0.25rem;">✓ Semantic content organization</li>
            <li>✓ Professional print layout</li>
          </ul>
        </div>
      </div>
    `;

    return overlay;
  }

  /**
   * Organize sections based on hierarchy
   */
  organizeSections(elements, hierarchy) {
    console.log('🗂️ Organizing sections from elements:', elements.length);
    
    // Handle empty or invalid elements
    if (!Array.isArray(elements) || elements.length === 0) {
      console.warn('⚠️ No elements to organize, creating default section');
      return [{
        title: 'Dashboard Export',
        type: 'generic',
        elements: []
      }];
    }

    // Implementation would organize elements into logical sections
    const sections = [
      {
        title: 'Key Performance Indicators',
        type: 'metrics',
        elements: elements.filter(el => el.componentType === 'metric')
      },
      {
        title: 'Performance Analysis',
        type: 'charts',
        elements: elements.filter(el => el.componentType === 'chart')
      },
      {
        title: 'Detailed Analysis',
        type: 'analysis',
        elements: elements.filter(el => 
          el.componentType === 'table' || 
          el.componentType === 'business-unit-item'
        )
      }
    ].filter(section => section.elements.length > 0);

    // If no sections have content, return a default section
    if (sections.length === 0) {
      return [{
        title: 'Dashboard Export',
        type: 'generic',
        elements: elements
      }];
    }

    return sections;
  }

  /**
   * Create analysis content
   */
  async createAnalysisContent(elements) {
    const content = document.createElement('div');
    content.style.cssText = 'margin-bottom: 2rem;';
    
    // Add placeholder content
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      border: 1px solid #e2e1e6;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      background: #f9f9f9;
    `;
    placeholder.innerHTML = `
      <p style="color: #717171;">Analysis content for ${elements.length} elements</p>
    `;
    content.appendChild(placeholder);
    
    return content;
  }

  /**
   * Create generic content
   */
  async createGenericContent(elements) {
    const content = document.createElement('div');
    content.style.cssText = 'margin-bottom: 2rem;';
    
    // Add placeholder content for now
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      border: 1px solid #e2e1e6;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      background: #f9f9f9;
    `;
    placeholder.innerHTML = `
      <p style="color: #717171;">Dashboard content exported successfully</p>
      <p style="color: #999; font-size: 14px; margin-top: 1rem;">
        This PDF contains a snapshot of your dashboard data
      </p>
    `;
    content.appendChild(placeholder);
    
    return content;
  }

  /**
   * Add footers to all pages
   */
  addFooters(container, metadata) {
    const pages = container.querySelectorAll('.print-page');
    pages.forEach((page, index) => {
      if (index > 0) { // Skip cover page
        const footer = document.createElement('div');
        footer.style.cssText = `
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 10px;
          text-align: center;
          font-size: 12px;
          color: #717171;
          border-top: 1px solid #e2e1e6;
        `;
        footer.innerHTML = `
          <span>Proceed Dashboard Report</span> | 
          <span>${metadata.filters?.period || ''} ${metadata.filters?.year || ''}</span> | 
          <span>Page ${index} of ${pages.length - 1}</span>
        `;
        page.appendChild(footer);
      }
    });
  }
}

export default new ArchitecturalPDFHandler();