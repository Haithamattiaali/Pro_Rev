/**
 * PDF Export Handler
 * 
 * Transforms UIR document into PDF format using browser capabilities
 * or server-side rendering
 */

import { ExportFormats } from '../uirSchema';

class PDFExportHandler {
  constructor() {
    this.format = ExportFormats.PDF;
  }

  /**
   * Transform UIR document for PDF export
   */
  async transform(uirDocument, options = {}) {
    // For now, we'll prepare the document structure for PDF generation
    // In a full implementation, this would transform UIR to PDF-specific format
    
    const transformedDoc = {
      ...uirDocument,
      pdfMetadata: {
        title: options.title || `Dashboard Export - ${uirDocument.metadata.viewName}`,
        author: 'Proceed Dashboard',
        subject: 'Revenue Analytics Report',
        keywords: ['revenue', 'analytics', 'dashboard', 'report'],
        creator: 'Proceed Dashboard Export System',
        producer: 'Proceed Dashboard v1.0',
        creationDate: new Date(),
        modificationDate: new Date()
      },
      pdfOptions: {
        pageSize: options.pageSize || 'A4',
        orientation: options.orientation || 'portrait',
        margins: options.margins || { top: 20, right: 20, bottom: 20, left: 20 },
        fontSize: options.fontSize || 12,
        fontFamily: options.fontFamily || 'Verdana, sans-serif',
        includePageNumbers: options.includePageNumbers !== false,
        includeTimestamp: options.includeTimestamp !== false,
        includeLogo: options.includeLogo !== false
      }
    };

    return transformedDoc;
  }

  /**
   * Validate PDF document structure
   */
  async validate(document) {
    const errors = [];

    if (!document.metadata) {
      errors.push('Document metadata is required');
    }

    if (!document.structure || !Array.isArray(document.structure)) {
      errors.push('Document structure must be an array');
    }

    // Validate sections
    if (document.structure) {
      document.structure.forEach((section, index) => {
        if (!section.elements || !Array.isArray(section.elements)) {
          errors.push(`Section ${index} must have elements array`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate PDF from transformed document
   */
  async generate(uirDocument, options = {}) {
    const { method = 'client' } = options;

    if (method === 'server') {
      return this.generateServerSide(uirDocument, options);
    } else {
      return this.generateClientSide(uirDocument, options);
    }
  }

  /**
   * Client-side PDF generation using browser print capabilities
   */
  async generateClientSide(uirDocument, options) {
    // Create a hidden iframe for PDF generation
    const iframe = window.document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    window.document.body.appendChild(iframe);

    try {
      // Build HTML content for PDF
      const htmlContent = this.buildHTMLForPDF(uirDocument);
      
      // Write content to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for content to load
      await new Promise(resolve => {
        iframe.onload = resolve;
        setTimeout(resolve, 100); // Fallback timeout
      });

      // Trigger print dialog
      iframe.contentWindow.print();

      // For download instead of print, we would need to use a library like jsPDF
      // or send to server for generation
      
      return {
        type: 'print',
        success: true,
        message: 'PDF generation initiated'
      };

    } finally {
      // Clean up iframe after a delay
      setTimeout(() => {
        window.document.body.removeChild(iframe);
      }, 1000);
    }
  }

  /**
   * Server-side PDF generation
   */
  async generateServerSide(uirDocument, options) {
    // This would send the document to the backend for PDF generation
    // For now, we'll use the existing Excel export endpoint as a reference
    
    const response = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document: uirDocument,
        options
      })
    });

    if (!response.ok) {
      throw new Error('Server-side PDF generation failed');
    }

    const blob = await response.blob();
    
    return {
      type: 'blob',
      data: blob,
      mimeType: 'application/pdf'
    };
  }

  /**
   * Build HTML content for PDF generation
   */
  buildHTMLForPDF(document) {
    const { metadata, structure, styles, pdfOptions } = document;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${metadata.title || 'Dashboard Export'}</title>
  <style>
    @page {
      size: ${pdfOptions.pageSize} ${pdfOptions.orientation};
      margin: ${pdfOptions.margins.top}mm ${pdfOptions.margins.right}mm ${pdfOptions.margins.bottom}mm ${pdfOptions.margins.left}mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${pdfOptions.fontFamily};
      font-size: ${pdfOptions.fontSize}pt;
      line-height: 1.5;
      color: #2d2d2d;
    }
    
    .header {
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #9e1f63;
    }
    
    .header h1 {
      color: #9e1f63;
      font-size: 24pt;
      margin-bottom: 5px;
    }
    
    .header .subtitle {
      color: #717171;
      font-size: 10pt;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .section-header {
      font-size: 16pt;
      color: #424046;
      margin-bottom: 15px;
      font-weight: bold;
    }
    
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .metric-card {
      border: 1px solid #e2e1e6;
      border-radius: 8px;
      padding: 15px;
      background: #f9f9f9;
    }
    
    .metric-label {
      color: #717171;
      font-size: 10pt;
      margin-bottom: 5px;
    }
    
    .metric-value {
      color: #2d2d2d;
      font-size: 18pt;
      font-weight: bold;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .table th {
      background-color: #f2f2f4;
      color: #424046;
      font-weight: bold;
      padding: 10px;
      text-align: left;
      border-bottom: 2px solid #e2e1e6;
    }
    
    .table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e1e6;
    }
    
    .chart-placeholder {
      border: 1px solid #e2e1e6;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      background: #f9f9f9;
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #717171;
    }
    
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9pt;
      color: #717171;
      padding: 10px 0;
      border-top: 1px solid #e2e1e6;
      background: white;
    }
    
    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  ${this.buildHeader(metadata, pdfOptions)}
  ${this.buildContent(structure)}
  ${pdfOptions.includeTimestamp ? this.buildFooter(metadata) : ''}
</body>
</html>
    `.trim();
  }

  /**
   * Build PDF header
   */
  buildHeader(metadata, options) {
    const periodInfo = metadata.filters ? 
      `${metadata.filters.period} ${metadata.filters.year}` : 
      new Date().getFullYear();
    
    const viewTitle = metadata.viewName === 'overview' ? 'Executive Overview' :
                     metadata.viewName === 'business-units' ? 'Business Units Performance' :
                     metadata.viewName === 'customers' ? 'Customer Analytics' :
                     'Dashboard Export';

    return `
      <div class="header">
        <h1>${viewTitle} - ${metadata.filters?.year || new Date().getFullYear()}</h1>
        <div class="subtitle">
          Period: ${metadata.filters?.period || 'Current'} | 
          Generated: ${new Date().toLocaleString()}
        </div>
      </div>
    `;
  }

  /**
   * Build PDF content from structure
   */
  buildContent(structure) {
    return structure.map(section => {
      let sectionContent = '';
      
      // Add section title if available
      const sectionHeader = section.elements.find(el => el.componentType === 'section');
      if (sectionHeader && sectionHeader.sectionData?.title) {
        sectionContent += `<h2 class="section-header">${sectionHeader.sectionData.title}</h2>`;
      }
      
      // Group metrics into a grid
      const metrics = section.elements.filter(el => el.componentType === 'metric');
      if (metrics.length > 0) {
        sectionContent += '<div class="metric-grid">';
        sectionContent += metrics.map(metric => this.buildMetricElement(metric)).join('');
        sectionContent += '</div>';
      }
      
      // Process other elements
      const otherElements = section.elements.filter(el => 
        el.componentType !== 'metric' && el.componentType !== 'section'
      );
      
      sectionContent += otherElements.map(element => {
        switch (element.componentType) {
          case 'table':
            return this.buildTableElement(element);
          case 'chart':
            return this.buildChartElement(element);
          case 'section-header':
            return this.buildHeaderElement(element);
          case 'business-unit-item':
            return this.buildBusinessUnitElement(element);
          default:
            return '';
        }
      }).join('');

      return `<div class="section">${sectionContent}</div>`;
    }).join('');
  }

  /**
   * Build metric element
   */
  buildMetricElement(element) {
    const { metricData } = element;
    return `
      <div class="metric-card">
        <div class="metric-label">${metricData.label}</div>
        <div class="metric-value">${metricData.formattedValue || metricData.value}</div>
      </div>
    `;
  }

  /**
   * Build table element
   */
  buildTableElement(element) {
    const { tableData } = element;
    const headers = tableData.headers.map(h => `<th>${h.text}</th>`).join('');
    const rows = tableData.rows.map(row => {
      const cells = row.cells.map(cell => `<td>${cell.text}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <table class="table">
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  /**
   * Build chart element
   */
  buildChartElement(element) {
    const { chartConfig } = element;
    
    if (chartConfig.type === 'gauge' && chartConfig.data) {
      const { percentage, currentAmount, targetAmount, title } = chartConfig.data;
      return `
        <div class="chart-placeholder">
          <h3 style="text-align: center; margin-bottom: 10px;">${title || 'Achievement'}</h3>
          <div style="text-align: center;">
            <div style="font-size: 36pt; font-weight: bold; color: #9e1f63;">${percentage}%</div>
            <div style="margin-top: 10px;">
              <div>Current: <strong>${currentAmount}</strong></div>
              <div>Target: <strong>${targetAmount}</strong></div>
            </div>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="chart-placeholder">
        <div>
          <strong>${chartConfig.title || 'Chart'}</strong><br>
          <small>Chart visualization</small>
        </div>
      </div>
    `;
  }

  /**
   * Build business unit element
   */
  buildBusinessUnitElement(element) {
    const { unitData } = element;
    const statusColor = unitData.achievementStatus === 'high' ? '#16a34a' :
                       unitData.achievementStatus === 'medium' ? '#ca8a04' : '#dc2626';
    
    return `
      <div style="border: 1px solid #e2e1e6; border-radius: 8px; padding: 12px; margin-bottom: 8px; background: #f9f9f9;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${unitData.name}</strong><br>
            <small>Revenue: ${unitData.revenue} | Target: ${unitData.target}</small>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16pt; font-weight: bold; color: ${statusColor};">
              ${unitData.achievement}
            </div>
            <small>Achievement</small>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Build header element
   */
  buildHeaderElement(element) {
    const { headerData } = element;
    return `<h${headerData.level} class="section-header">${headerData.text}</h${headerData.level}>`;
  }

  /**
   * Build PDF footer
   */
  buildFooter(metadata) {
    const timestamp = new Date().toLocaleString();
    return `
      <div class="footer">
        Generated on ${timestamp} | Proceed Dashboard
      </div>
    `;
  }
}

export default new PDFExportHandler();