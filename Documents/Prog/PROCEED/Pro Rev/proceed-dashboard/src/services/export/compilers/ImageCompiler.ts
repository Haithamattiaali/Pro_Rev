import { UniversalExportRepresentation, ExportDocument } from '../core/types';

// Dynamic import for html2canvas to avoid build issues
let html2canvas: any = null;

export class ImageCompiler {
  private dashboardElement: HTMLElement | null = null;

  setDashboardElement(element: HTMLElement) {
    this.dashboardElement = element;
  }

  async compile(uer: UniversalExportRepresentation): Promise<ExportDocument> {
    try {
      // Dynamically import html2canvas if not already loaded
      if (!html2canvas) {
        const module = await import('html2canvas');
        html2canvas = module.default || module;
      }
      
      // Get the dashboard element
      const targetElement = this.dashboardElement || 
        document.querySelector('[data-dashboard="true"]') || 
        document.querySelector('.dashboard-container') ||
        document.querySelector('main');
      
      if (!targetElement) {
        throw new Error('Dashboard element not found for image export');
      }

      // Configure html2canvas options
      const options = {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: targetElement.scrollWidth,
        windowHeight: targetElement.scrollHeight,
        onclone: (clonedDoc: Document) => {
          // Hide any elements that shouldn't be in the export
          const elementsToHide = clonedDoc.querySelectorAll('.no-export, .export-button, button');
          elementsToHide.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });

          // Ensure all charts are visible
          const charts = clonedDoc.querySelectorAll('canvas, svg');
          charts.forEach(chart => {
            (chart as HTMLElement).style.opacity = '1';
          });
        }
      };

      // Capture the screenshot
      const canvas = await html2canvas(targetElement as HTMLElement, options);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png', 1.0);
      });

      return {
        format: 'image',
        content: blob,
        metadata: {
          filename: `proceed-dashboard-${new Date().toISOString().split('T')[0]}.png`,
          mimeType: 'image/png',
          size: blob.size,
          width: canvas.width,
          height: canvas.height,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Image compilation error:', error);
      throw error;
    }
  }

}

export default ImageCompiler;