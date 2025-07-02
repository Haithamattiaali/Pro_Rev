/**
 * PowerPoint Compiler
 * Converts Universal Export Representation to PowerPoint format
 */

import PptxGenJS from 'pptxgenjs';
import {
  UniversalExportRepresentation,
  ExportPage,
  ExportSection,
  ExportContent,
  ChartContent,
  TableContent,
  MetricContent,
  TextContent,
  ImageContent,
  ExportDocument,
  ExportFormat
} from '../core/types';

interface PowerPointOptions {
  template?: string;
  theme?: PowerPointTheme;
  slideSize?: 'LAYOUT_16x9' | 'LAYOUT_16x10' | 'LAYOUT_4x3' | 'LAYOUT_WIDE';
  includeNotes?: boolean;
  embedFonts?: boolean;
  companyInfo?: {
    name?: string;
    logo?: string;
  };
}

interface PowerPointTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    title: string;
    body: string;
  };
}

export class PowerPointCompiler {
  private pptx: PptxGenJS;
  private options: PowerPointOptions;
  private slideLayouts: Map<string, any>;
  private currentSlideNumber: number = 0;

  constructor(options: PowerPointOptions = {}) {
    this.options = {
      slideSize: 'LAYOUT_16x9',
      includeNotes: true,
      embedFonts: true,
      theme: this.getDefaultTheme(),
      ...options
    };

    this.pptx = new PptxGenJS();
    this.slideLayouts = new Map();
    this.initializePresentation();
  }

  /**
   * Main compilation method
   */
  async compile(uer: UniversalExportRepresentation): Promise<ExportDocument> {
    console.log('📊 Compiling to PowerPoint format...');

    try {
      // Set presentation metadata
      this.setPresentationMetadata(uer);

      // Create master slides and layouts
      this.createMasterSlides();

      // Process pages
      for (const page of uer.pages) {
        await this.processPage(page, uer);
      }

      // Add end slide
      this.addEndSlide(uer);

      // Generate the presentation
      const blob = await this.pptx.write({ outputType: 'blob' });

      console.log('✅ PowerPoint compilation completed', {
        slides: this.currentSlideNumber,
        size: blob.size
      });

      return {
        format: 'powerpoint' as ExportFormat,
        data: blob,
        filename: `${uer.document.title.replace(/[^a-z0-9]/gi, '_')}.pptx`,
        size: blob.size,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };

    } catch (error) {
      console.error('❌ PowerPoint compilation failed:', error);
      throw error;
    }
  }

  /**
   * Initialize presentation settings
   */
  private initializePresentation(): void {
    // Set slide size
    this.pptx.layout = this.options.slideSize;

    // Set default font
    if (this.options.theme) {
      this.pptx.theme = {
        headFontFace: this.options.theme.fonts.title,
        bodyFontFace: this.options.theme.fonts.body
      };
    }

    // Define layouts
    this.defineLayouts();
  }

  /**
   * Set presentation metadata
   */
  private setPresentationMetadata(uer: UniversalExportRepresentation): void {
    this.pptx.title = uer.document.title;
    this.pptx.subject = uer.document.description;
    this.pptx.author = uer.document.author.name;
    this.pptx.company = this.options.companyInfo?.name || 'Proceed';
    this.pptx.revision = '1.0';
  }

  /**
   * Create master slides
   */
  private createMasterSlides(): void {
    // Title slide master
    this.pptx.defineSlideMaster({
      title: 'TITLE_SLIDE',
      background: { fill: this.options.theme.colors.primary },
      objects: [
        {
          placeholder: {
            options: {
              name: 'title',
              type: 'title',
              x: '10%',
              y: '35%',
              w: '80%',
              h: '20%',
              fontSize: 44,
              bold: true,
              color: 'FFFFFF',
              align: 'center',
              valign: 'middle'
            },
            text: 'Title Placeholder'
          }
        },
        {
          placeholder: {
            options: {
              name: 'subtitle',
              type: 'body',
              x: '10%',
              y: '60%',
              w: '80%',
              h: '10%',
              fontSize: 24,
              color: 'FFFFFF',
              align: 'center'
            },
            text: 'Subtitle Placeholder'
          }
        }
      ]
    });

    // Content slide master
    this.pptx.defineSlideMaster({
      title: 'CONTENT_SLIDE',
      background: { fill: 'FFFFFF' },
      objects: [
        {
          rect: {
            x: 0,
            y: 0,
            w: '100%',
            h: '12%',
            fill: { color: this.options.theme.colors.primary }
          }
        },
        {
          placeholder: {
            options: {
              name: 'title',
              type: 'title',
              x: '5%',
              y: '4%',
              w: '90%',
              h: '8%',
              fontSize: 32,
              bold: true,
              color: 'FFFFFF'
            },
            text: 'Slide Title'
          }
        }
      ]
    });
  }

  /**
   * Define slide layouts
   */
  private defineLayouts(): void {
    // Title layout
    this.slideLayouts.set('title', {
      master: 'TITLE_SLIDE'
    });

    // Single chart layout
    this.slideLayouts.set('single-chart', {
      master: 'CONTENT_SLIDE',
      chartArea: { x: 0.5, y: 1.5, w: 9, h: 4 }
    });

    // Two charts layout
    this.slideLayouts.set('two-charts', {
      master: 'CONTENT_SLIDE',
      chartAreas: [
        { x: 0.5, y: 1.5, w: 4.25, h: 3.5 },
        { x: 5.25, y: 1.5, w: 4.25, h: 3.5 }
      ]
    });

    // Metrics grid layout
    this.slideLayouts.set('metrics-grid', {
      master: 'CONTENT_SLIDE',
      gridConfig: {
        cols: 3,
        rows: 2,
        startX: 0.5,
        startY: 1.5,
        cellWidth: 3,
        cellHeight: 1.8,
        spacing: 0.25
      }
    });

    // Table layout
    this.slideLayouts.set('table', {
      master: 'CONTENT_SLIDE',
      tableArea: { x: 0.5, y: 1.5, w: 9, h: 4 }
    });
  }

  /**
   * Process a page into slides
   */
  private async processPage(page: ExportPage, uer: UniversalExportRepresentation): Promise<void> {
    // Check if we have a visual snapshot
    const visualSnapshot = Object.values(uer.resources.media).find(
      m => m.url === 'dashboard_snapshot'
    );

    if (visualSnapshot?.data) {
      // Create a slide with the visual snapshot
      const slide = this.pptx.addSlide();
      this.currentSlideNumber++;

      // Add title
      if (page.title) {
        slide.addText(page.title, {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.5,
          fontSize: 24,
          bold: true,
          color: this.options.theme.colors.primary
        });
      }

      // Add visual snapshot
      slide.addImage({
        data: visualSnapshot.data,
        x: 0.5,
        y: 1,
        w: 9,
        h: 5,
        sizing: { type: 'contain' }
      });

      return;
    }

    // Fallback to section-based slides
    // Determine how to split the page into slides
    const slideGroups = this.groupSectionsForSlides(page.sections);

    for (const group of slideGroups) {
      const slide = this.pptx.addSlide();
      this.currentSlideNumber++;

      // Apply appropriate layout
      const layout = this.selectLayout(group);
      if (layout.master) {
        slide.masterName = layout.master;
      }

      // Set slide title
      if (page.title) {
        slide.addText(page.title, {
          placeholder: 'title'
        });
      }

      // Process sections
      await this.processSections(slide, group, layout, uer);

      // Add notes
      if (this.options.includeNotes && page.metadata.notes) {
        slide.addNotes(page.metadata.notes);
      }
    }
  }

  /**
   * Group sections for optimal slide layout
   */
  private groupSectionsForSlides(sections: ExportSection[]): ExportSection[][] {
    const groups: ExportSection[][] = [];
    let currentGroup: ExportSection[] = [];

    for (const section of sections) {
      const contentType = section.content.primary.type;

      // Tables get their own slide
      if (contentType === 'table') {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
        groups.push([section]);
        continue;
      }

      // Charts: max 2 per slide
      if (contentType === 'chart') {
        if (currentGroup.filter(s => s.content.primary.type === 'chart').length >= 2) {
          groups.push(currentGroup);
          currentGroup = [section];
        } else {
          currentGroup.push(section);
        }
        continue;
      }

      // Metrics: max 6 per slide
      if (contentType === 'metric') {
        if (currentGroup.filter(s => s.content.primary.type === 'metric').length >= 6) {
          groups.push(currentGroup);
          currentGroup = [section];
        } else {
          currentGroup.push(section);
        }
        continue;
      }

      // Default: add to current group
      currentGroup.push(section);
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Select appropriate layout for section group
   */
  private selectLayout(sections: ExportSection[]): any {
    const contentTypes = sections.map(s => s.content.primary.type);
    const uniqueTypes = new Set(contentTypes);

    // Single table
    if (uniqueTypes.size === 1 && uniqueTypes.has('table')) {
      return this.slideLayouts.get('table');
    }

    // All metrics
    if (uniqueTypes.size === 1 && uniqueTypes.has('metric')) {
      return this.slideLayouts.get('metrics-grid');
    }

    // Single chart
    if (contentTypes.length === 1 && uniqueTypes.has('chart')) {
      return this.slideLayouts.get('single-chart');
    }

    // Two charts
    if (contentTypes.length === 2 && uniqueTypes.size === 1 && uniqueTypes.has('chart')) {
      return this.slideLayouts.get('two-charts');
    }

    // Default content layout
    return { master: 'CONTENT_SLIDE' };
  }

  /**
   * Process sections into slide content
   */
  private async processSections(
    slide: any,
    sections: ExportSection[],
    layout: any,
    uer: UniversalExportRepresentation
  ): Promise<void> {
    // Handle specific layouts
    if (layout === this.slideLayouts.get('metrics-grid')) {
      await this.processMetricsGrid(slide, sections, layout);
      return;
    }

    if (layout === this.slideLayouts.get('single-chart') || 
        layout === this.slideLayouts.get('two-charts')) {
      await this.processCharts(slide, sections, layout, uer);
      return;
    }

    if (layout === this.slideLayouts.get('table')) {
      await this.processTable(slide, sections[0], layout);
      return;
    }

    // Default processing
    let yOffset = 1.5;
    for (const section of sections) {
      await this.processSection(slide, section, { x: 0.5, y: yOffset }, uer);
      yOffset += 2;
    }
  }

  /**
   * Process individual section
   */
  private async processSection(
    slide: any,
    section: ExportSection,
    position: { x: number; y: number },
    uer: UniversalExportRepresentation
  ): Promise<void> {
    const content = section.content.primary;

    switch (content.type) {
      case 'chart':
        await this.addChart(slide, content as ChartContent, position, uer);
        break;

      case 'table':
        await this.addTable(slide, content as TableContent, position);
        break;

      case 'metric':
        await this.addMetric(slide, content as MetricContent, position);
        break;

      case 'text':
        await this.addText(slide, content as TextContent, position);
        break;

      case 'image':
        await this.addImage(slide, content as ImageContent, position, uer);
        break;
    }
  }

  /**
   * Process metrics grid layout
   */
  private async processMetricsGrid(
    slide: any,
    sections: ExportSection[],
    layout: any
  ): Promise<void> {
    const { gridConfig } = layout;
    const metrics = sections.filter(s => s.content.primary.type === 'metric');

    metrics.forEach((section, index) => {
      const col = index % gridConfig.cols;
      const row = Math.floor(index / gridConfig.cols);
      
      const x = gridConfig.startX + (col * (gridConfig.cellWidth + gridConfig.spacing));
      const y = gridConfig.startY + (row * (gridConfig.cellHeight + gridConfig.spacing));

      this.addMetricCard(slide, section.content.primary as MetricContent, {
        x, y,
        w: gridConfig.cellWidth,
        h: gridConfig.cellHeight
      });
    });
  }

  /**
   * Process charts layout
   */
  private async processCharts(
    slide: any,
    sections: ExportSection[],
    layout: any,
    uer: UniversalExportRepresentation
  ): Promise<void> {
    const charts = sections.filter(s => s.content.primary.type === 'chart');

    if (layout.chartArea) {
      // Single chart
      await this.addChart(slide, charts[0].content.primary as ChartContent, 
        layout.chartArea, uer);
    } else if (layout.chartAreas) {
      // Multiple charts
      charts.forEach(async (section, index) => {
        if (index < layout.chartAreas.length) {
          await this.addChart(slide, section.content.primary as ChartContent,
            layout.chartAreas[index], uer);
        }
      });
    }
  }

  /**
   * Process table layout
   */
  private async processTable(
    slide: any,
    section: ExportSection,
    layout: any
  ): Promise<void> {
    await this.addTable(slide, section.content.primary as TableContent, 
      layout.tableArea);
  }

  /**
   * Add chart to slide
   */
  private async addChart(
    slide: any,
    chart: ChartContent,
    position: any,
    uer: UniversalExportRepresentation
  ): Promise<void> {
    // Try native PowerPoint chart first
    if (this.canUseNativeChart(chart)) {
      await this.addNativeChart(slide, chart, position);
    } else if (chart.fallback?.image) {
      // Use fallback image
      slide.addImage({
        data: chart.fallback.image,
        x: position.x,
        y: position.y,
        w: position.w || 4,
        h: position.h || 3
      });
    } else {
      // Create placeholder
      slide.addShape('rect', {
        x: position.x,
        y: position.y,
        w: position.w || 4,
        h: position.h || 3,
        fill: { color: 'F5F5F5' },
        line: { color: 'CCCCCC', width: 1 }
      });
      
      slide.addText('Chart: ' + chart.chartType, {
        x: position.x,
        y: position.y + ((position.h || 3) / 2) - 0.25,
        w: position.w || 4,
        h: 0.5,
        align: 'center',
        valign: 'middle',
        color: '666666'
      });
    }
  }

  /**
   * Add native PowerPoint chart
   */
  private async addNativeChart(
    slide: any,
    chart: ChartContent,
    position: any
  ): Promise<void> {
    const chartData = [];
    const chartOptions: any = {
      x: position.x,
      y: position.y,
      w: position.w || 4,
      h: position.h || 3,
      showLegend: true,
      showTitle: false
    };

    // Convert chart data to PowerPoint format
    if (chart.chartType === 'bar' || chart.chartType === 'column') {
      chartData.push({
        name: chart.data.datasets[0]?.label || 'Series 1',
        labels: chart.data.labels,
        values: chart.data.datasets[0]?.data || []
      });

      // Add additional series
      for (let i = 1; i < chart.data.datasets.length; i++) {
        chartData.push({
          name: chart.data.datasets[i].label || `Series ${i + 1}`,
          labels: chart.data.labels,
          values: chart.data.datasets[i].data || []
        });
      }

      slide.addChart('bar', chartData, {
        ...chartOptions,
        barDir: chart.chartType === 'column' ? 'col' : 'bar',
        barGrouping: 'clustered',
        chartColors: this.getChartColors()
      });
    } else if (chart.chartType === 'line') {
      chart.data.datasets.forEach((dataset, i) => {
        chartData.push({
          name: dataset.label || `Series ${i + 1}`,
          labels: chart.data.labels,
          values: dataset.data || []
        });
      });

      slide.addChart('line', chartData, {
        ...chartOptions,
        lineDataSymbol: 'circle',
        lineDataSymbolSize: 3,
        chartColors: this.getChartColors()
      });
    } else if (chart.chartType === 'pie' || chart.chartType === 'doughnut') {
      chartData.push({
        name: chart.data.datasets[0]?.label || 'Values',
        labels: chart.data.labels,
        values: chart.data.datasets[0]?.data || []
      });

      slide.addChart(chart.chartType, chartData, {
        ...chartOptions,
        holeSize: chart.chartType === 'doughnut' ? 50 : 0,
        chartColors: this.getChartColors()
      });
    }
  }

  /**
   * Add table to slide
   */
  private async addTable(
    slide: any,
    table: TableContent,
    position: any
  ): Promise<void> {
    // Prepare table data
    const rows = [];

    // Add headers
    const headerRow = table.headers.map(h => ({
      text: h.label,
      options: {
        bold: true,
        color: 'FFFFFF',
        fill: { color: this.options.theme.colors.primary },
        align: 'center',
        valign: 'middle'
      }
    }));
    rows.push(headerRow);

    // Add data rows
    table.rows.slice(0, 20).forEach((row, rowIndex) => { // Limit to 20 rows
      const dataRow = table.headers.map(header => ({
        text: String(row.cells[header.key] || ''),
        options: {
          fill: { color: rowIndex % 2 === 0 ? 'FFFFFF' : 'F5F5F5' },
          valign: 'middle'
        }
      }));
      rows.push(dataRow);
    });

    // Add table
    slide.addTable(rows, {
      x: position.x || 0.5,
      y: position.y || 1.5,
      w: position.w || 9,
      colW: table.headers.map(() => position.w ? position.w / table.headers.length : 9 / table.headers.length),
      border: { pt: 0.5, color: 'CCCCCC' },
      autoPage: false,
      fontSize: 10
    });

    // Add note if table is truncated
    if (table.rows.length > 20) {
      slide.addText(`Note: Showing first 20 of ${table.rows.length} rows`, {
        x: position.x || 0.5,
        y: (position.y || 1.5) + (position.h || 3.5) + 0.1,
        fontSize: 8,
        italic: true,
        color: '666666'
      });
    }
  }

  /**
   * Add metric to slide
   */
  private addMetric(
    slide: any,
    metric: MetricContent,
    position: any
  ): Promise<void> {
    this.addMetricCard(slide, metric, {
      x: position.x,
      y: position.y,
      w: 3,
      h: 1.5
    });
    return Promise.resolve();
  }

  /**
   * Add metric card
   */
  private addMetricCard(
    slide: any,
    metric: MetricContent,
    bounds: { x: number; y: number; w: number; h: number }
  ): void {
    // Card background
    slide.addShape('rect', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      fill: { color: 'F8F8F8' },
      line: { color: 'E0E0E0', width: 1 },
      rectRadius: 0.1
    });

    // Label
    slide.addText(metric.label, {
      x: bounds.x + 0.1,
      y: bounds.y + 0.1,
      w: bounds.w - 0.2,
      h: 0.4,
      fontSize: 12,
      color: '666666'
    });

    // Value
    slide.addText(String(metric.value), {
      x: bounds.x + 0.1,
      y: bounds.y + 0.5,
      w: bounds.w - 0.2,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: this.options.theme.colors.primary,
      align: 'center',
      valign: 'middle'
    });

    // Change indicator
    if (metric.change) {
      const changeColor = metric.change.direction === 'up' ? '16A34A' : 'DC2626';
      const arrow = metric.change.direction === 'up' ? '↑' : '↓';
      const changeText = `${arrow} ${Math.abs(metric.change.value)}${metric.change.percentage ? '%' : ''}`;

      slide.addText(changeText, {
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
   * Add text to slide
   */
  private addText(
    slide: any,
    text: TextContent,
    position: any
  ): Promise<void> {
    slide.addText(text.text, {
      x: position.x,
      y: position.y,
      w: position.w || 9,
      h: position.h || 0.5,
      fontSize: parseInt(text.formatting?.fontSize || '12'),
      bold: text.formatting?.bold,
      italic: text.formatting?.italic,
      color: this.colorToHex(text.formatting?.color),
      fontFace: text.formatting?.fontFamily,
      align: text.formatting?.alignment as any || 'left'
    });
    return Promise.resolve();
  }

  /**
   * Add image to slide
   */
  private async addImage(
    slide: any,
    image: ImageContent,
    position: any,
    uer: UniversalExportRepresentation
  ): Promise<void> {
    // Find image in resources
    let imageData = image.src;
    
    if (!imageData.startsWith('data:')) {
      // Look up in media resources
      const mediaResource = Object.values(uer.resources.media).find(
        m => m.url === image.src
      );
      if (mediaResource?.data) {
        imageData = mediaResource.data;
      }
    }

    slide.addImage({
      data: imageData,
      x: position.x,
      y: position.y,
      w: position.w || 4,
      h: position.h || 3,
      sizing: { type: 'contain' }
    });
  }

  /**
   * Add end slide
   */
  private addEndSlide(uer: UniversalExportRepresentation): void {
    const slide = this.pptx.addSlide({ masterName: 'TITLE_SLIDE' });
    this.currentSlideNumber++;

    slide.addText('Thank You', {
      placeholder: 'title'
    });

    slide.addText(
      `Generated from ${uer.document.title}\n${new Date().toLocaleDateString()}`,
      {
        placeholder: 'subtitle'
      }
    );
  }

  /**
   * Utility methods
   */

  private getDefaultTheme(): PowerPointTheme {
    return {
      colors: {
        primary: '9E1F63',
        secondary: '424046',
        accent: '005B8C',
        background: 'FFFFFF',
        text: '000000'
      },
      fonts: {
        title: 'Verdana',
        body: 'Verdana'
      }
    };
  }

  private canUseNativeChart(chart: ChartContent): boolean {
    const supportedTypes = ['bar', 'column', 'line', 'pie', 'doughnut'];
    return supportedTypes.includes(chart.chartType) && 
           chart.data.labels.length > 0 &&
           chart.data.datasets.length > 0;
  }

  private getChartColors(): string[] {
    return [
      this.options.theme.colors.primary,
      this.options.theme.colors.secondary,
      this.options.theme.colors.accent,
      'E05E3D',
      '6B7280',
      '10B981'
    ];
  }

  private colorToHex(color?: string): string {
    if (!color) return '000000';
    
    // Remove # if present
    if (color.startsWith('#')) {
      return color.substring(1);
    }
    
    // Convert rgb to hex
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
      return r + g + b;
    }
    
    return '000000';
  }
}