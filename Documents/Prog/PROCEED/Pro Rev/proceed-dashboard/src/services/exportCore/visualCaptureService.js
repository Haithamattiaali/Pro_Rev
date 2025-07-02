/**
 * Visual Capture Service
 * 
 * Captures the complete visual representation of the dashboard
 * including charts, styling, and layout
 */

class VisualCaptureService {
  constructor() {
    this.capturedSections = [];
  }

  /**
   * Capture complete dashboard visually
   */
  async captureCompleteView(options = {}) {
    console.log('📸 Starting visual capture of dashboard...');

    try {
      // Find the main dashboard container
      const dashboardRoot = document.querySelector('[data-export-root]') || 
                           document.querySelector('.space-y-6') ||
                           document.querySelector('main');

      if (!dashboardRoot) {
        throw new Error('Dashboard root not found');
      }

      // Clone the entire dashboard for manipulation
      const clonedDashboard = dashboardRoot.cloneNode(true);
      
      // Remove non-exportable elements
      this.cleanupClone(clonedDashboard);

      // Create a temporary container for rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = dashboardRoot.offsetWidth + 'px';
      container.style.background = 'white';
      
      // Copy all computed styles to ensure visual fidelity
      await this.copyComputedStyles(dashboardRoot, clonedDashboard);
      
      container.appendChild(clonedDashboard);
      document.body.appendChild(container);

      // Capture sections
      const sections = await this.captureSections(clonedDashboard);

      // Build complete HTML document
      const htmlDocument = this.buildCompleteHTML(sections);

      // Cleanup
      document.body.removeChild(container);

      return {
        html: htmlDocument,
        sections: sections,
        metadata: {
          captureTime: new Date().toISOString(),
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          url: window.location.href
        }
      };

    } catch (error) {
      console.error('❌ Visual capture failed:', error);
      throw error;
    }
  }

  /**
   * Clean up cloned elements
   */
  cleanupClone(element) {
    // Remove buttons and interactive elements
    const buttonsToRemove = element.querySelectorAll(
      'button:not(.period-filter button), [data-export-ignore]'
    );
    buttonsToRemove.forEach(btn => btn.remove());

    // Remove tooltips and popovers
    const tooltips = element.querySelectorAll('[role="tooltip"], .tooltip, .popover');
    tooltips.forEach(tooltip => tooltip.remove());
  }

  /**
   * Copy computed styles recursively
   */
  async copyComputedStyles(source, target) {
    const sourceStyles = window.getComputedStyle(source);
    const targetStyles = target.style;

    // Copy all computed styles
    for (let i = 0; i < sourceStyles.length; i++) {
      const prop = sourceStyles[i];
      targetStyles.setProperty(prop, sourceStyles.getPropertyValue(prop));
    }

    // Process children
    const sourceChildren = source.children;
    const targetChildren = target.children;

    for (let i = 0; i < sourceChildren.length; i++) {
      if (targetChildren[i]) {
        await this.copyComputedStyles(sourceChildren[i], targetChildren[i]);
      }
    }

    // Special handling for SVG elements (charts)
    if (source.tagName === 'svg' || source.querySelector('svg')) {
      await this.processSVGElements(source, target);
    }
  }

  /**
   * Process SVG elements for proper export
   */
  async processSVGElements(source, target) {
    const sourceSVGs = source.tagName === 'svg' ? [source] : source.querySelectorAll('svg');
    const targetSVGs = target.tagName === 'svg' ? [target] : target.querySelectorAll('svg');

    for (let i = 0; i < sourceSVGs.length; i++) {
      if (targetSVGs[i]) {
        // Clone SVG attributes
        Array.from(sourceSVGs[i].attributes).forEach(attr => {
          targetSVGs[i].setAttribute(attr.name, attr.value);
        });

        // Ensure SVG has proper dimensions
        if (!targetSVGs[i].getAttribute('width')) {
          targetSVGs[i].setAttribute('width', sourceSVGs[i].getBoundingClientRect().width);
        }
        if (!targetSVGs[i].getAttribute('height')) {
          targetSVGs[i].setAttribute('height', sourceSVGs[i].getBoundingClientRect().height);
        }
      }
    }
  }

  /**
   * Capture individual sections
   */
  async captureSections(container) {
    const sections = [];

    // Capture header/title section
    const headerSection = container.querySelector('.flex.justify-between.items-start');
    if (headerSection) {
      sections.push({
        type: 'header',
        html: headerSection.outerHTML,
        title: headerSection.querySelector('h1')?.textContent || ''
      });
    }

    // Capture metrics grid
    const metricsGrid = container.querySelector('[data-export-type="metrics-grid"]');
    if (metricsGrid) {
      sections.push({
        type: 'metrics',
        html: metricsGrid.outerHTML,
        title: 'Key Metrics'
      });
    }

    // Capture achievement section with gauge
    const achievementSection = container.querySelector('[data-export-type="achievement-section"]');
    if (achievementSection) {
      sections.push({
        type: 'achievement',
        html: achievementSection.outerHTML,
        title: 'Overall Achievement'
      });
    }

    // Capture summary section
    const summarySection = container.querySelector('[data-export-type="summary-section"]');
    if (summarySection) {
      sections.push({
        type: 'summary',
        html: summarySection.outerHTML,
        title: 'Achievement Summary'
      });
    }

    // Capture any remaining dashboard cards
    const dashboardCards = container.querySelectorAll('.dashboard-card:not([data-export-type])');
    dashboardCards.forEach((card, index) => {
      sections.push({
        type: 'card',
        html: card.outerHTML,
        title: card.querySelector('.section-title')?.textContent || `Section ${index + 1}`
      });
    });

    return sections;
  }

  /**
   * Build complete HTML document
   */
  buildCompleteHTML(sections) {
    const tailwindCSS = this.getTailwindStyles();
    const customCSS = this.getCustomStyles();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Export</title>
  ${tailwindCSS}
  ${customCSS}
  <style>
    @media print {
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
      
      body {
        margin: 0;
        padding: 0;
      }
      
      .no-print {
        display: none !important;
      }
      
      .section {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .dashboard-card {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
    
    /* Ensure charts render properly */
    .recharts-wrapper {
      width: 100% !important;
    }
    
    svg {
      max-width: 100%;
      height: auto;
    }
    
    /* Fix metric card layouts */
    .metric-card {
      min-height: 120px;
    }
    
    /* Ensure proper spacing */
    .space-y-6 > * + * {
      margin-top: 1.5rem;
    }
  </style>
</head>
<body class="bg-white">
  <div class="container mx-auto p-4">
    ${sections.map(section => `
      <div class="section mb-6">
        ${section.html}
      </div>
    `).join('')}
  </div>
</body>
</html>`;
  }

  /**
   * Get Tailwind styles
   */
  getTailwindStyles() {
    // Extract key Tailwind classes being used
    return `
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#9e1f63',
              'primary-dark': '#721548',
              'primary-light': '#cb5b96',
              secondary: '#424046',
              'secondary-light': '#6a686f',
              'secondary-pale': '#e2e1e6',
              'accent-blue': '#005b8c',
              'accent-coral': '#e05e3d',
              'neutral-dark': '#2d2d2d',
              'neutral-mid': '#717171',
              'neutral-light': '#f2f2f4'
            }
          }
        }
      }
    </script>
    `;
  }

  /**
   * Get custom styles
   */
  getCustomStyles() {
    return `
    <style>
      /* Import fonts */
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      body {
        font-family: Verdana, 'Inter', sans-serif;
        color: #2d2d2d;
      }
      
      /* Dashboard card styles */
      .dashboard-card {
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      }
      
      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #424046;
        margin-bottom: 1rem;
      }
      
      /* Metric card styles */
      .metric-card {
        background: white;
        border-radius: 0.5rem;
        padding: 1.25rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      /* Gauge chart container */
      .recharts-wrapper {
        margin: 0 auto;
      }
      
      /* Business unit items */
      .bg-secondary-pale {
        background-color: #e2e1e6;
      }
      
      /* Status colors */
      .text-green-600 { color: #16a34a; }
      .text-yellow-600 { color: #ca8a04; }
      .text-red-600 { color: #dc2626; }
      .text-amber-600 { color: #d97706; }
    </style>
    `;
  }
}

export default new VisualCaptureService();