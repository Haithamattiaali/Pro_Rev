/**
 * Enhanced PDF Export Handler
 * 
 * Uses visual capture to create high-fidelity PDF exports
 */

import visualCaptureService from '../visualCaptureService';

class EnhancedPDFHandler {
  constructor() {
    this.format = 'pdf';
  }

  /**
   * Transform UIR document for PDF export
   */
  async transform(uirDocument, options = {}) {
    // For visual capture, we don't need much transformation
    return {
      ...uirDocument,
      pdfOptions: {
        pageSize: options.pageSize || 'A4',
        orientation: options.orientation || 'landscape', // Better for dashboards
        margins: options.margins || { top: 10, right: 10, bottom: 10, left: 10 }
      }
    };
  }

  /**
   * Validate document
   */
  async validate(document) {
    return { valid: true, errors: [] };
  }

  /**
   * Generate PDF from dashboard
   */
  async generate(uirDocument, options = {}) {
    console.log('🖨️ Generating enhanced PDF...');

    try {
      // Use visual capture service to get complete HTML
      const captureResult = await visualCaptureService.captureCompleteView(options);
      
      // Create iframe for printing
      const iframe = window.document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.zIndex = '999999';
      iframe.style.backgroundColor = 'white';
      iframe.style.border = 'none';
      
      window.document.body.appendChild(iframe);

      // Write captured HTML to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(captureResult.html);
      iframeDoc.close();

      // Wait for content and styles to load
      await new Promise(resolve => {
        iframe.onload = () => {
          // Additional delay for Tailwind to process
          setTimeout(resolve, 1000);
        };
      });

      // Add print-specific styles
      const printStyles = iframeDoc.createElement('style');
      printStyles.textContent = `
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          /* Ensure backgrounds print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Page breaks */
          .dashboard-card {
            page-break-inside: avoid;
          }
          
          .section {
            page-break-inside: avoid;
          }
          
          /* Hide scrollbars */
          ::-webkit-scrollbar {
            display: none;
          }
        }
        
        /* Ensure iframe content fills the page */
        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: visible;
        }
      `;
      iframeDoc.head.appendChild(printStyles);

      // Create print preview overlay
      const overlay = this.createPrintOverlay();
      window.document.body.appendChild(overlay);

      // Set up print handlers
      const printHandler = () => {
        console.log('🖨️ Print dialog opened');
      };

      const afterPrintHandler = () => {
        console.log('✅ Print dialog closed');
        // Cleanup
        window.removeEventListener('beforeprint', printHandler);
        window.removeEventListener('afterprint', afterPrintHandler);
        
        setTimeout(() => {
          window.document.body.removeChild(iframe);
          if (overlay.parentNode) {
            window.document.body.removeChild(overlay);
          }
        }, 100);
      };

      iframe.contentWindow.addEventListener('beforeprint', printHandler);
      iframe.contentWindow.addEventListener('afterprint', afterPrintHandler);

      // Trigger print dialog
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 500);

      return {
        type: 'print',
        success: true,
        message: 'PDF generation initiated',
        captureMetadata: captureResult.metadata
      };

    } catch (error) {
      console.error('❌ Enhanced PDF generation failed:', error);
      throw error;
    }
  }

  /**
   * Create print preview overlay
   */
  createPrintOverlay() {
    const overlay = window.document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 10px;">
          🖨️ Preparing PDF Export
        </div>
        <div style="font-size: 16px; opacity: 0.8;">
          The print dialog will open shortly...
        </div>
        <div style="margin-top: 20px; font-size: 14px; opacity: 0.6;">
          Select "Save as PDF" in the print dialog
        </div>
      </div>
    `;

    // Auto-hide after a delay
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.style.transition = 'opacity 0.3s';
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }
    }, 3000);

    return overlay;
  }
}

export default new EnhancedPDFHandler();