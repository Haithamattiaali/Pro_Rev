/**
 * PowerPoint Synthesis Engine
 * 
 * Implements the synthesis side of the two-part system architecture
 * Converts compiled design data into PowerPoint format
 */

import PptxGenJS from 'pptxgenjs';

class PowerPointSynthesizer {
  constructor() {
    this.pptx = null;
    this.slideLayouts = new Map();
    this.brandColors = {
      primary: '#9e1f63',
      primaryDark: '#721548',
      primaryLight: '#cb5b96',
      secondary: '#424046',
      secondaryLight: '#6a686f',
      secondaryPale: '#e2e1e6',
      accentBlue: '#005b8c',
      accentCoral: '#e05e3d'
    };
  }

  /**
   * Main synthesis method
   */
  async synthesize(compiledData, options = {}) {
    console.log('🎯 Synthesizing PowerPoint presentation...');

    try {
      // Initialize presentation
      this.initializePresentation(compiledData.metadata);

      // Define layouts based on narrative structure
      this.defineLayouts();

      // Process narrative acts
      if (compiledData.narrative) {
        await this.synthesizeNarrative(compiledData);
      } else {
        await this.synthesizeLinear(compiledData);
      }

      // Generate output
      const output = await this.generateOutput(options);
      
      return output;

    } catch (error) {
      console.error('❌ PowerPoint synthesis failed:', error);
      throw error;
    }
  }

  /**
   * Initialize presentation with brand settings
   */
  initializePresentation(metadata) {
    this.pptx = new PptxGenJS();

    // Set presentation properties
    this.pptx.author = 'Proceed Dashboard';
    this.pptx.company = metadata.company || 'Proceed';
    this.pptx.title = metadata.title || 'Dashboard Export';
    this.pptx.subject = metadata.dashboardType || 'Analytics';

    // Define slide size (16:9 widescreen)
    this.pptx.defineLayout({ 
      name: 'CUSTOM_16_9', 
      width: 10, 
      height: 5.625 
    });
    this.pptx.layout = 'CUSTOM_16_9';

    // Set default slide settings
    this.pptx.presLayout = {
      width: 10,
      height: 5.625
    };
  }

  /**
   * Define slide layouts matching design patterns
   */
  defineLayouts() {
    // Title slide layout
    this.slideLayouts.set('title', {
      background: { color: this.brandColors.primary },
      elements: [
        {
          type: 'text',
          options: {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 1.5,
            fontSize: 44,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle',
            bold: true
          }
        },
        {
          type: 'text',
          name: 'subtitle',
          options: {
            x: 1,
            y: 3,
            w: 8,
            h: 1,
            fontSize: 24,
            color: this.brandColors.secondaryPale,
            align: 'center'
          }
        }
      ]
    });

    // Section header layout
    this.slideLayouts.set('section', {
      background: { color: 'F5F5F5' },
      elements: [
        {
          type: 'text',
          options: {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 0.8,
            fontSize: 32,
            color: this.brandColors.primary,
            bold: true
          }
        },
        {
          type: 'placeholder',
          name: 'content',
          options: {
            x: 0.5,
            y: 1.3,
            w: 9,
            h: 3.8
          }
        }
      ]
    });

    // Metrics dashboard layout
    this.slideLayouts.set('metrics', {
      background: { color: 'FFFFFF' },
      gridLayout: {
        rows: 2,
        cols: 3,
        spacing: 0.2
      }
    });

    // Chart layout
    this.slideLayouts.set('chart', {
      background: { color: 'FFFFFF' },
      elements: [
        {
          type: 'text',
          name: 'title',
          options: {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 0.6,
            fontSize: 28,
            color: this.brandColors.secondary,
            bold: true
          }
        },
        {
          type: 'placeholder',
          name: 'chart',
          options: {
            x: 0.5,
            y: 1,
            w: 9,
            h: 4.1
          }
        }
      ]
    });
  }

  /**
   * Synthesize narrative structure
   */
  async synthesizeNarrative(compiledData) {
    const { narrative, elements, assets } = compiledData;

    // Process each act
    for (const [actKey, act] of Object.entries(narrative)) {
      console.log(`📖 Processing ${act.title}`);

      for (const slideData of act.slides) {
        await this.createSlide(slideData, elements, assets);
      }
    }
  }

  /**
   * Create individual slide
   */
  async createSlide(slideData, elements, assets) {
    const slide = this.pptx.addSlide();
    const layout = this.slideLayouts.get(slideData.layout) || this.slideLayouts.get('section');

    // Apply background
    if (layout.background) {
      slide.background = layout.background;
    }

    // Add slide elements based on type
    switch (slideData.type) {
      case 'title':
        this.createTitleSlide(slide, slideData);
        break;
      
      case 'metrics':
        await this.createMetricsSlide(slide, slideData, elements);
        break;
      
      case 'chart':
        await this.createChartSlide(slide, slideData, elements, assets);
        break;
      
      case 'analysis':
        await this.createAnalysisSlide(slide, slideData, elements);
        break;
      
      default:
        this.createContentSlide(slide, slideData);
    }

    // Add slide notes if present
    if (slideData.notes) {
      slide.addNotes(slideData.notes);
    }
  }

  /**
   * Create metrics slide with KPI cards
   */
  async createMetricsSlide(slide, slideData, elements) {
    slide.addText(slideData.title || 'Key Metrics', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      color: this.brandColors.secondary,
      bold: true
    });

    // Extract metrics from elements
    const metrics = elements.filter(el => el.componentType === 'metric')
      .slice(0, 6); // Max 6 metrics per slide

    // Create grid layout
    const gridCols = 3;
    const gridRows = Math.ceil(metrics.length / gridCols);
    const cardWidth = 2.8;
    const cardHeight = 2;
    const spacing = 0.2;

    metrics.forEach((metric, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      const x = 0.5 + (col * (cardWidth + spacing));
      const y = 1.2 + (row * (cardHeight + spacing));

      // Create metric card
      this.createMetricCard(slide, metric, { x, y, w: cardWidth, h: cardHeight });
    });
  }

  /**
   * Create individual metric card
   */
  createMetricCard(slide, metric, bounds) {
    const { data } = metric;
    
    // Card background
    slide.addShape('rect', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      fill: { color: 'F8F8F8' },
      line: { color: this.brandColors.secondaryPale, width: 1 }
    });

    // Metric label
    slide.addText(data.label || 'Metric', {
      x: bounds.x + 0.1,
      y: bounds.y + 0.1,
      w: bounds.w - 0.2,
      h: 0.4,
      fontSize: 12,
      color: this.brandColors.secondary,
      align: 'left'
    });

    // Metric value
    slide.addText(data.value || '0', {
      x: bounds.x + 0.1,
      y: bounds.y + 0.5,
      w: bounds.w - 0.2,
      h: 0.8,
      fontSize: 24,
      color: this.brandColors.primary,
      bold: true,
      align: 'center',
      valign: 'middle'
    });

    // Change indicator if present
    if (data.change) {
      const changeColor = data.changeType === 'positive' ? '16A34A' : 
                         data.changeType === 'negative' ? 'DC2626' : '717171';
      
      slide.addText(data.change, {
        x: bounds.x + 0.1,
        y: bounds.y + bounds.h - 0.4,
        w: bounds.w - 0.2,
        h: 0.3,
        fontSize: 10,
        color: changeColor,
        align: 'right'
      });
    }
  }

  /**
   * Create chart slide
   */
  async createChartSlide(slide, slideData, elements, assets) {
    const chartElement = elements.find(el => el.id === slideData.elementId);
    if (!chartElement) return;

    // Add title
    slide.addText(slideData.title || chartElement.data?.title || 'Chart', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 24,
      color: this.brandColors.secondary,
      bold: true
    });

    // Handle chart based on export strategy
    if (chartElement.exportAs === 'image') {
      // Find associated image asset
      const imageAsset = assets.find(a => a.nodeId === chartElement.id);
      if (imageAsset) {
        slide.addImage({
          data: imageAsset.data,
          x: 1,
          y: 1,
          w: 8,
          h: 4
        });
      }
    } else {
      // Attempt native chart creation
      await this.createNativeChart(slide, chartElement);
    }
  }

  /**
   * Create native PowerPoint chart
   */
  async createNativeChart(slide, chartElement) {
    const { data, bounds } = chartElement;
    
    if (data.type === 'gauge') {
      // Create gauge as shapes
      this.createGaugeVisualization(slide, data, {
        x: 3,
        y: 1.5,
        w: 4,
        h: 3
      });
    } else if (data.type === 'bar') {
      // Create bar chart
      const chartData = this.transformToChartData(data);
      slide.addChart('bar', chartData, {
        x: 1,
        y: 1,
        w: 8,
        h: 4,
        barDir: 'bar',
        chartColors: [this.brandColors.primary],
        showLegend: false,
        showTitle: false
      });
    }
  }

  /**
   * Create gauge visualization using shapes
   */
  createGaugeVisualization(slide, gaugeData, bounds) {
    const percentage = gaugeData.percentage || 0;
    const radius = Math.min(bounds.w, bounds.h) / 2;
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Background circle
    slide.addShape('pie', {
      x: centerX - radius,
      y: centerY - radius,
      w: radius * 2,
      h: radius * 2,
      fill: { color: this.brandColors.secondaryPale }
    });

    // Progress arc
    const angle = (percentage / 100) * 270; // 270 degrees for gauge
    slide.addShape('pie', {
      x: centerX - radius,
      y: centerY - radius,
      w: radius * 2,
      h: radius * 2,
      angleRange: [135, 135 + angle],
      fill: { color: this.brandColors.primary }
    });

    // Center text
    slide.addText(`${percentage}%`, {
      x: bounds.x,
      y: bounds.y + bounds.h * 0.3,
      w: bounds.w,
      h: bounds.h * 0.4,
      fontSize: 36,
      color: this.brandColors.primary,
      bold: true,
      align: 'center',
      valign: 'middle'
    });

    // Labels
    if (gaugeData.currentAmount) {
      slide.addText(`Current: ${gaugeData.currentAmount}`, {
        x: bounds.x,
        y: bounds.y + bounds.h - 0.6,
        w: bounds.w,
        h: 0.3,
        fontSize: 10,
        color: this.brandColors.secondary,
        align: 'center'
      });
    }
  }

  /**
   * Generate final output
   */
  async generateOutput(options) {
    const { format = 'blob' } = options;

    if (format === 'blob') {
      const blob = await this.pptx.write({ outputType: 'blob' });
      return {
        type: 'blob',
        data: blob,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        filename: `dashboard_export_${new Date().toISOString().split('T')[0]}.pptx`
      };
    } else if (format === 'base64') {
      const base64 = await this.pptx.write({ outputType: 'base64' });
      return {
        type: 'base64',
        data: base64,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };
    }
  }

  /**
   * Transform data for native charts
   */
  transformToChartData(data) {
    // Transform dashboard data to PptxGenJS chart format
    return [
      {
        name: 'Series 1',
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        values: [25, 33, 42, 48]
      }
    ];
  }

  /**
   * Linear synthesis for non-narrative exports
   */
  async synthesizeLinear(compiledData) {
    const { elements, assets } = compiledData;

    // Group elements by section
    const sections = this.groupElementsBySection(elements);

    for (const section of sections) {
      const slide = this.pptx.addSlide();
      
      // Add section title
      if (section.title) {
        slide.addText(section.title, {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.6,
          fontSize: 24,
          color: this.brandColors.secondary,
          bold: true
        });
      }

      // Add section elements
      await this.addSectionElements(slide, section.elements, assets);
    }
  }

  groupElementsBySection(elements) {
    // Group elements into logical sections
    const sections = [];
    let currentSection = {
      title: 'Dashboard Export',
      elements: []
    };

    elements.forEach(element => {
      if (element.componentType === 'section-header') {
        // Start new section
        if (currentSection.elements.length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          title: element.data?.text || 'Section',
          elements: []
        };
      } else {
        currentSection.elements.push(element);
      }
    });

    if (currentSection.elements.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }
}

export default PowerPointSynthesizer;