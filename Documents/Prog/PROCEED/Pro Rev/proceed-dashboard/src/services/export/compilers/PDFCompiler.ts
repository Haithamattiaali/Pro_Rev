/**
 * PDF Compiler
 * Converts Universal Export Representation to PDF format with high fidelity
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

interface PDFOptions {
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter' | 'a3';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  compress?: boolean;
  embedFonts?: boolean;
  watermark?: {
    text: string;
    opacity: number;
  };
  header?: {
    enabled: boolean;
    height: number;
    content?: (pageNumber: number, totalPages: number) => string;
  };
  footer?: {
    enabled: boolean;
    height: number;
    content?: (pageNumber: number, totalPages: number) => string;
  };
}

interface PDFTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    base: string;
    title: string;
    mono: string;
  };
}

export class PDFCompiler {
  private pdf: jsPDF;
  private options: PDFOptions;
  private theme: PDFTheme;
  private currentY: number = 0;
  private pageNumber: number = 0;
  private totalPages: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private contentHeight: number;
  private contentWidth: number;

  constructor(options: PDFOptions = {}) {
    this.options = {
      orientation: 'portrait',
      format: 'a4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      compress: true,
      embedFonts: true,
      header: { enabled: true, height: 15 },
      footer: { enabled: true, height: 15 },
      ...options
    };

    this.theme = this.getDefaultTheme();
    this.initializePDF();
  }

  /**
   * Main compilation method
   */
  async compile(uer: UniversalExportRepresentation): Promise<ExportDocument> {
    console.log('📄 Compiling to PDF format...');

    try {
      // Calculate total pages for pagination
      this.totalPages = uer.pages.length;

      // Add document metadata
      this.setDocumentMetadata(uer);

      // Process each page
      for (let i = 0; i < uer.pages.length; i++) {
        if (i > 0) {
          this.pdf.addPage();
        }
        this.pageNumber = i + 1;
        await this.processPage(uer.pages[i], uer);
      }

      // Apply compression if enabled
      if (this.options.compress) {
        this.pdf.compress = true;
      }

      // Generate PDF
      const pdfOutput = this.pdf.output('blob');

      console.log('✅ PDF compilation completed', {
        pages: this.pageNumber,
        size: pdfOutput.size
      });

      return {
        format: 'pdf' as ExportFormat,
        data: pdfOutput,
        filename: `${uer.document.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        size: pdfOutput.size,
        mimeType: 'application/pdf'
      };

    } catch (error) {
      console.error('❌ PDF compilation failed:', error);
      throw error;
    }
  }

  /**
   * Initialize PDF document
   */
  private initializePDF(): void {
    this.pdf = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.format,
      compress: this.options.compress
    });

    // Calculate dimensions
    const pageSize = this.pdf.internal.pageSize;
    this.pageWidth = pageSize.getWidth();
    this.pageHeight = pageSize.getHeight();
    this.contentWidth = this.pageWidth - this.options.margins.left - this.options.margins.right;
    this.contentHeight = this.pageHeight - this.options.margins.top - this.options.margins.bottom;

    if (this.options.header?.enabled) {
      this.contentHeight -= this.options.header.height;
    }
    if (this.options.footer?.enabled) {
      this.contentHeight -= this.options.footer.height;
    }

    // Load fonts
    this.loadFonts();
  }

  /**
   * Load custom fonts
   */
  private loadFonts(): void {
    // Add custom fonts if needed
    // For now, using built-in fonts
    this.pdf.setFont('helvetica');
  }

  /**
   * Set document metadata
   */
  private setDocumentMetadata(uer: UniversalExportRepresentation): void {
    this.pdf.setProperties({
      title: uer.document.title,
      subject: uer.document.description,
      author: uer.document.author.name,
      keywords: uer.document.tags.join(', '),
      creator: 'Proceed Dashboard Export'
    });
  }

  /**
   * Process a page
   */
  private async processPage(page: ExportPage, uer: UniversalExportRepresentation): Promise<void> {
    // Check if we have a visual snapshot
    const visualSnapshot = Object.values(uer.resources.media).find(
      m => m.url === 'dashboard_snapshot'
    );

    if (visualSnapshot?.data) {
      // Use visual snapshot for the page
      await this.addVisualSnapshot(visualSnapshot.data);
      
      // Add footer if needed
      if (this.options.footer?.enabled) {
        this.addFooter(page);
      }
      return;
    }

    // Fallback to section-based rendering
    // Reset Y position
    this.currentY = this.options.margins.top;

    // Add header
    if (this.options.header?.enabled) {
      this.addHeader(page);
      this.currentY += this.options.header.height;
    }

    // Add watermark
    if (this.options.watermark) {
      this.addWatermark();
    }

    // Add page title
    if (page.title) {
      this.addPageTitle(page.title);
    }

    // Process sections
    for (const section of page.sections) {
      await this.processSection(section, uer);
    }

    // Add footer
    if (this.options.footer?.enabled) {
      this.addFooter(page);
    }
  }

  /**
   * Add page header
   */
  private addHeader(page: ExportPage): void {
    const y = this.options.margins.top - 5;

    // Header line
    this.pdf.setDrawColor(this.theme.colors.primary);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(
      this.options.margins.left,
      y + this.options.header.height,
      this.pageWidth - this.options.margins.right,
      y + this.options.header.height
    );

    // Header content
    if (this.options.header.content) {
      const content = this.options.header.content(this.pageNumber, this.totalPages);
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(this.theme.colors.secondary);
      this.pdf.text(content, this.options.margins.left, y + 10);
    }
  }

  /**
   * Add page footer
   */
  private addFooter(page: ExportPage): void {
    const y = this.pageHeight - this.options.margins.bottom + 5;

    // Footer line
    this.pdf.setDrawColor(this.theme.colors.secondary);
    this.pdf.setLineWidth(0.25);
    this.pdf.line(
      this.options.margins.left,
      y - 5,
      this.pageWidth - this.options.margins.right,
      y - 5
    );

    // Page number
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(this.theme.colors.secondary);
    this.pdf.text(
      `Page ${this.pageNumber} of ${this.totalPages}`,
      this.pageWidth / 2,
      y,
      { align: 'center' }
    );

    // Footer content
    if (this.options.footer.content) {
      const content = this.options.footer.content(this.pageNumber, this.totalPages);
      this.pdf.text(content, this.options.margins.left, y);
    }
  }

  /**
   * Add watermark
   */
  private addWatermark(): void {
    if (!this.options.watermark) return;

    this.pdf.saveGraphicsState();
    this.pdf.setGState(new this.pdf.GState({ opacity: this.options.watermark.opacity }));
    this.pdf.setFontSize(60);
    this.pdf.setTextColor(200, 200, 200);
    
    // Rotate and center watermark
    const textWidth = this.pdf.getTextWidth(this.options.watermark.text);
    const angle = -45;
    const rad = angle * Math.PI / 180;
    
    this.pdf.text(
      this.options.watermark.text,
      this.pageWidth / 2,
      this.pageHeight / 2,
      {
        angle: angle,
        align: 'center',
        baseline: 'middle'
      }
    );
    
    this.pdf.restoreGraphicsState();
  }

  /**
   * Add page title
   */
  private addPageTitle(title: string): void {
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(this.theme.colors.primary);
    
    const lines = this.pdf.splitTextToSize(title, this.contentWidth);
    this.pdf.text(lines, this.options.margins.left, this.currentY + 10);
    
    this.currentY += 15 + (lines.length - 1) * 8;
  }

  /**
   * Process a section
   */
  private async processSection(section: ExportSection, uer: UniversalExportRepresentation): Promise<void> {
    // Check if we need a new page
    const sectionHeight = this.estimateSectionHeight(section);
    if (this.currentY + sectionHeight > this.pageHeight - this.options.margins.bottom - (this.options.footer?.enabled ? this.options.footer.height : 0)) {
      this.pdf.addPage();
      this.pageNumber++;
      this.currentY = this.options.margins.top + (this.options.header?.enabled ? this.options.header.height : 0);
    }

    // Process content based on type
    const content = section.content.primary;
    
    switch (content.type) {
      case 'chart':
        await this.addChart(content as ChartContent, section, uer);
        break;
        
      case 'table':
        await this.addTable(content as TableContent, section);
        break;
        
      case 'metric':
        await this.addMetric(content as MetricContent, section);
        break;
        
      case 'text':
        await this.addText(content as TextContent, section);
        break;
        
      case 'image':
        await this.addImage(content as ImageContent, section, uer);
        break;
    }

    // Add spacing between sections
    this.currentY += 10;
  }

  /**
   * Add chart to PDF
   */
  private async addChart(
    chart: ChartContent,
    section: ExportSection,
    uer: UniversalExportRepresentation
  ): Promise<void> {
    const width = this.contentWidth;
    const height = 80; // Fixed height for charts

    if (chart.fallback?.image) {
      // Use fallback image
      try {
        this.pdf.addImage(
          chart.fallback.image,
          'PNG',
          this.options.margins.left,
          this.currentY,
          width,
          height,
          undefined,
          'FAST'
        );
      } catch (error) {
        console.warn('Failed to add chart image:', error);
        this.addChartPlaceholder(chart, width, height);
      }
    } else {
      // Create chart placeholder
      this.addChartPlaceholder(chart, width, height);
    }

    this.currentY += height;
  }

  /**
   * Add chart placeholder
   */
  private addChartPlaceholder(chart: ChartContent, width: number, height: number): void {
    // Draw border
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.rect(this.options.margins.left, this.currentY, width, height);

    // Add chart type text
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(150, 150, 150);
    this.pdf.text(
      `${chart.chartType.toUpperCase()} Chart`,
      this.options.margins.left + width / 2,
      this.currentY + height / 2,
      { align: 'center', baseline: 'middle' }
    );

    // Add description
    if (chart.fallback?.description) {
      this.pdf.setFontSize(10);
      this.pdf.text(
        chart.fallback.description,
        this.options.margins.left + width / 2,
        this.currentY + height / 2 + 10,
        { align: 'center', baseline: 'middle' }
      );
    }
  }

  /**
   * Add table to PDF
   */
  private async addTable(table: TableContent, section: ExportSection): Promise<void> {
    const startY = this.currentY;
    const cellPadding = 3;
    const fontSize = 9;
    const headerHeight = 10;
    const rowHeight = 8;

    // Set font
    this.pdf.setFontSize(fontSize);

    // Calculate column widths
    const colWidths = this.calculateColumnWidths(table);

    // Draw header
    this.pdf.setFillColor(this.theme.colors.primary);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.rect(
      this.options.margins.left,
      this.currentY,
      this.contentWidth,
      headerHeight,
      'F'
    );

    // Header text
    let xPos = this.options.margins.left;
    table.headers.forEach((header, index) => {
      this.pdf.text(
        header.label,
        xPos + cellPadding,
        this.currentY + headerHeight / 2 + 1,
        { baseline: 'middle' }
      );
      xPos += colWidths[index];
    });

    this.currentY += headerHeight;

    // Draw rows
    this.pdf.setTextColor(this.theme.colors.text);
    const maxRows = Math.floor((this.contentHeight - (this.currentY - startY)) / rowHeight);
    const rowsToShow = Math.min(table.rows.length, maxRows);

    for (let i = 0; i < rowsToShow; i++) {
      const row = table.rows[i];
      
      // Alternate row colors
      if (i % 2 === 1) {
        this.pdf.setFillColor(245, 245, 245);
        this.pdf.rect(
          this.options.margins.left,
          this.currentY,
          this.contentWidth,
          rowHeight,
          'F'
        );
      }

      // Row data
      xPos = this.options.margins.left;
      table.headers.forEach((header, index) => {
        const text = String(row.cells[header.key] || '');
        const lines = this.pdf.splitTextToSize(text, colWidths[index] - cellPadding * 2);
        
        this.pdf.text(
          lines[0], // Show only first line
          xPos + cellPadding,
          this.currentY + rowHeight / 2 + 1,
          { baseline: 'middle' }
        );
        xPos += colWidths[index];
      });

      this.currentY += rowHeight;
    }

    // Draw table border
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.rect(
      this.options.margins.left,
      startY,
      this.contentWidth,
      this.currentY - startY
    );

    // Draw vertical lines
    xPos = this.options.margins.left;
    for (let i = 0; i < colWidths.length - 1; i++) {
      xPos += colWidths[i];
      this.pdf.line(xPos, startY, xPos, this.currentY);
    }

    // Add note if truncated
    if (table.rows.length > rowsToShow) {
      this.currentY += 2;
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.text(
        `Showing ${rowsToShow} of ${table.rows.length} rows`,
        this.options.margins.left,
        this.currentY
      );
      this.currentY += 5;
    }
  }

  /**
   * Add metric to PDF
   */
  private async addMetric(metric: MetricContent, section: ExportSection): Promise<void> {
    const boxWidth = 60;
    const boxHeight = 30;
    const x = this.options.margins.left;

    // Draw metric box
    this.pdf.setFillColor(248, 248, 248);
    this.pdf.setDrawColor(224, 224, 224);
    this.pdf.roundedRect(x, this.currentY, boxWidth, boxHeight, 3, 3, 'FD');

    // Label
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(metric.label, x + 5, this.currentY + 8);

    // Value
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(this.theme.colors.primary);
    this.pdf.text(
      String(metric.value),
      x + boxWidth / 2,
      this.currentY + 20,
      { align: 'center' }
    );

    // Change indicator
    if (metric.change) {
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'normal');
      const changeColor = metric.change.direction === 'up' ? [22, 163, 74] : [220, 38, 38];
      this.pdf.setTextColor(changeColor[0], changeColor[1], changeColor[2]);
      
      const arrow = metric.change.direction === 'up' ? '↑' : '↓';
      const changeText = `${arrow} ${Math.abs(metric.change.value)}${metric.change.percentage ? '%' : ''}`;
      
      this.pdf.text(changeText, x + boxWidth - 5, this.currentY + boxHeight - 5, { align: 'right' });
    }

    this.currentY += boxHeight;
  }

  /**
   * Add text to PDF
   */
  private async addText(text: TextContent, section: ExportSection): Promise<void> {
    // Set font properties
    const fontSize = parseInt(text.formatting?.fontSize || '11');
    this.pdf.setFontSize(fontSize);
    
    if (text.formatting?.bold && text.formatting?.italic) {
      this.pdf.setFont('helvetica', 'bolditalic');
    } else if (text.formatting?.bold) {
      this.pdf.setFont('helvetica', 'bold');
    } else if (text.formatting?.italic) {
      this.pdf.setFont('helvetica', 'italic');
    } else {
      this.pdf.setFont('helvetica', 'normal');
    }

    // Set text color
    if (text.formatting?.color) {
      const rgb = this.hexToRgb(text.formatting.color);
      if (rgb) {
        this.pdf.setTextColor(rgb.r, rgb.g, rgb.b);
      }
    } else {
      this.pdf.setTextColor(this.theme.colors.text);
    }

    // Split text into lines
    const lines = this.pdf.splitTextToSize(text.text, this.contentWidth);

    // Add text with alignment
    const align = text.formatting?.alignment || 'left';
    let x = this.options.margins.left;
    
    if (align === 'center') {
      x = this.pageWidth / 2;
    } else if (align === 'right') {
      x = this.pageWidth - this.options.margins.right;
    }

    lines.forEach((line, index) => {
      this.pdf.text(line, x, this.currentY + (index + 1) * fontSize * 0.5, { align });
    });

    this.currentY += lines.length * fontSize * 0.5 + 5;
  }

  /**
   * Add image to PDF
   */
  private async addImage(
    image: ImageContent,
    section: ExportSection,
    uer: UniversalExportRepresentation
  ): Promise<void> {
    try {
      let imageData = image.src;
      
      // Look up in resources if needed
      if (!imageData.startsWith('data:')) {
        const resource = Object.values(uer.resources.media).find(r => r.url === image.src);
        if (resource?.data) {
          imageData = resource.data;
        }
      }

      // Calculate dimensions
      const maxWidth = this.contentWidth;
      const maxHeight = 100;
      let width = image.dimensions?.width || maxWidth;
      let height = image.dimensions?.height || maxHeight;

      // Scale to fit
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height *= ratio;
      }
      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width *= ratio;
      }

      // Add image
      this.pdf.addImage(
        imageData,
        'PNG',
        this.options.margins.left,
        this.currentY,
        width,
        height
      );

      this.currentY += height;

    } catch (error) {
      console.warn('Failed to add image:', error);
      // Add placeholder
      this.pdf.setFillColor(240, 240, 240);
      this.pdf.rect(this.options.margins.left, this.currentY, 100, 60, 'F');
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.text('Image', this.options.margins.left + 50, this.currentY + 30, { align: 'center' });
      this.currentY += 60;
    }
  }

  /**
   * Utility methods
   */

  private getDefaultTheme(): PDFTheme {
    return {
      colors: {
        primary: '#9e1f63',
        secondary: '#424046',
        accent: '#005b8c',
        text: '#000000',
        background: '#ffffff'
      },
      fonts: {
        base: 'helvetica',
        title: 'helvetica',
        mono: 'courier'
      }
    };
  }

  private estimateSectionHeight(section: ExportSection): number {
    const content = section.content.primary;
    
    switch (content.type) {
      case 'chart':
        return 90;
      case 'table':
        return 100; // Will be adjusted based on rows
      case 'metric':
        return 40;
      case 'text':
        return 30; // Will be adjusted based on text length
      case 'image':
        return 110;
      default:
        return 50;
    }
  }

  private calculateColumnWidths(table: TableContent): number[] {
    const totalWidth = this.contentWidth;
    const numColumns = table.headers.length;
    
    // For now, equal width columns
    const colWidth = totalWidth / numColumns;
    return table.headers.map(() => colWidth);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    // Remove # if present
    hex = hex.replace('#', '');
    
    if (hex.length !== 6) return null;
    
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }

  private async addVisualSnapshot(imageData: string): Promise<void> {
    try {
      // Calculate dimensions to fit the page
      const maxWidth = this.pageWidth - this.options.margins.left - this.options.margins.right;
      const maxHeight = this.pageHeight - this.options.margins.top - this.options.margins.bottom;
      
      // Get image dimensions from the data URL
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });

      let width = img.width;
      let height = img.height;
      
      // Scale to fit page
      const scale = Math.min(maxWidth / width, maxHeight / height, 1);
      width *= scale;
      height *= scale;

      // Center on page
      const x = this.options.margins.left + (maxWidth - width) / 2;
      const y = this.options.margins.top;

      // Add image to PDF
      this.pdf.addImage(
        imageData,
        'PNG',
        x,
        y,
        width,
        height
      );

      console.log('Added visual snapshot to PDF', { width, height, scale });

    } catch (error) {
      console.error('Failed to add visual snapshot:', error);
      // Fall back to text
      this.pdf.setFontSize(14);
      this.pdf.text(
        'Dashboard Export',
        this.pageWidth / 2,
        this.pageHeight / 2,
        { align: 'center' }
      );
    }
  }
}