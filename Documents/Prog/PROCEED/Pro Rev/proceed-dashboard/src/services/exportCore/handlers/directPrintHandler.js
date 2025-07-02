/**
 * Direct Print Handler
 * 
 * Uses the current page directly for printing with optimized styles
 */

import { applyPrintStyles, prepareDashboardForPrint, restoreDashboardAfterPrint } from '../printStyles';

class DirectPrintHandler {
  constructor() {
    this.format = 'pdf';
  }

  /**
   * Transform - minimal for direct print
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
   * Generate PDF using direct print
   */
  async generate(uirDocument, options = {}) {
    console.log('🖨️ Initiating direct print...');

    try {
      // Prepare dashboard for printing
      prepareDashboardForPrint();

      // Create a print overlay
      const overlay = this.createPrintOverlay();
      document.body.appendChild(overlay);

      // Set up print event handlers
      const beforePrintHandler = () => {
        console.log('📄 Print dialog opened');
        // Hide overlay during print
        overlay.style.display = 'none';
      };

      const afterPrintHandler = () => {
        console.log('✅ Print completed');
        
        // Cleanup
        window.removeEventListener('beforeprint', beforePrintHandler);
        window.removeEventListener('afterprint', afterPrintHandler);
        
        // Restore dashboard
        restoreDashboardAfterPrint();
        
        // Remove overlay
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      };

      // Add event listeners
      window.addEventListener('beforeprint', beforePrintHandler);
      window.addEventListener('afterprint', afterPrintHandler);

      // Add escape key handler to cancel
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          window.removeEventListener('keydown', escapeHandler);
          afterPrintHandler();
        }
      };
      window.addEventListener('keydown', escapeHandler);

      // Trigger print after a short delay
      setTimeout(() => {
        overlay.style.opacity = '0';
        window.print();
      }, 1000);

      return {
        type: 'print',
        success: true,
        message: 'Print dialog opened'
      };

    } catch (error) {
      console.error('❌ Direct print failed:', error);
      restoreDashboardAfterPrint();
      throw error;
    }
  }

  /**
   * Create print preparation overlay
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
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto;">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
        </div>
        <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 0.5rem;">
          Preparing Dashboard for Export
        </h2>
        <p style="font-size: 16px; opacity: 0.8; margin-bottom: 2rem;">
          The print dialog will open in a moment...
        </p>
        <div style="
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          max-width: 400px;
          margin: 0 auto;
        ">
          <p style="font-size: 14px; margin-bottom: 0.5rem;">
            💡 <strong>Tip:</strong> In the print dialog:
          </p>
          <ul style="text-align: left; font-size: 14px; opacity: 0.9; list-style: none; padding: 0;">
            <li style="margin-bottom: 0.25rem;">• Select "Save as PDF" as the destination</li>
            <li style="margin-bottom: 0.25rem;">• Choose "Landscape" orientation</li>
            <li style="margin-bottom: 0.25rem;">• Enable "Background graphics" for colors</li>
            <li>• Set margins to "Default" or "Custom" (0.5")</li>
          </ul>
        </div>
        <p style="font-size: 12px; opacity: 0.6; margin-top: 1rem;">
          Press ESC to cancel
        </p>
      </div>
    `;

    return overlay;
  }
}

export default new DirectPrintHandler();