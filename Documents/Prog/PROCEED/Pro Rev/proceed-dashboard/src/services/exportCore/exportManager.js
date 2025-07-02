/**
 * Export Manager
 * 
 * Central orchestrator for the dashboard export functionality.
 * Manages the capture → transform → validate → generate → deliver pipeline.
 */

import dashboardCaptureService from './captureService';
import enhancedCaptureService from './enhancedCaptureService';
import designCompiler from './designCompiler';
import { createUIRDocument, validateUIRDocument, ExportFormats, TransformPipelineSchema } from './uirSchema';
import pdfHandler from './handlers/pdfHandler';
import enhancedPdfHandler from './handlers/enhancedPdfHandler';
import directPrintHandler from './handlers/directPrintHandler';
import architecturalPdfHandler from './handlers/architecturalPdfHandler';

class ExportManager {
  constructor() {
    this.exportHandlers = new Map();
    this.activeExports = new Map();
    this.exportHistory = [];
    this.initializeHandlers();
  }

  /**
   * Initialize default export handlers
   */
  initializeHandlers() {
    // Register export handlers
    this.registerHandler(ExportFormats.PDF, architecturalPdfHandler);
    
    // These will be implemented as separate modules
    this.registerHandler(ExportFormats.POWERPOINT, null);
    this.registerHandler(ExportFormats.EXCEL, null);
    this.registerHandler(ExportFormats.IMAGE, null);
    this.registerHandler(ExportFormats.HTML, null);
    this.registerHandler(ExportFormats.JSON, null);
  }

  /**
   * Register an export handler for a specific format
   */
  registerHandler(format, handler) {
    this.exportHandlers.set(format, handler);
  }

  /**
   * Main export method - initiates the export pipeline
   */
  async exportDashboard(options = {}) {
    console.log('🚀 ExportManager: Starting export with options:', options);
    
    const exportId = this.generateExportId();
    const pipeline = this.createPipeline(exportId, options);

    console.log('📋 Created pipeline:', pipeline);

    try {
      // Store active export
      this.activeExports.set(exportId, {
        id: exportId,
        status: 'processing',
        pipeline,
        options,
        startTime: new Date()
      });

      // Execute pipeline stages
      const result = await this.executePipeline(pipeline, options);

      console.log('✅ Export pipeline completed:', result);

      // Update export status
      this.activeExports.set(exportId, {
        ...this.activeExports.get(exportId),
        status: 'completed',
        result,
        endTime: new Date()
      });

      // Add to history
      this.addToHistory(exportId, 'success', result);

      return {
        success: true,
        exportId,
        result
      };

    } catch (error) {
      console.error('❌ Export failed:', error);

      // Update export status
      this.activeExports.set(exportId, {
        ...this.activeExports.get(exportId),
        status: 'failed',
        error: error.message,
        endTime: new Date()
      });

      // Add to history
      this.addToHistory(exportId, 'failed', null, error);

      throw error;
    }
  }

  /**
   * Execute the export pipeline
   */
  async executePipeline(pipeline, options) {
    const { format = ExportFormats.PDF, captureOptions = {}, exportOptions = {} } = options;

    // Stage 1: Capture
    this.updatePipelineStage(pipeline, 'capture', 'processing');
    const uirDocument = await this.captureStage(captureOptions);
    this.updatePipelineStage(pipeline, 'capture', 'completed', uirDocument);

    // Stage 2: Transform
    this.updatePipelineStage(pipeline, 'transform', 'processing');
    const transformedDocument = await this.transformStage(uirDocument, format, exportOptions);
    this.updatePipelineStage(pipeline, 'transform', 'completed', transformedDocument);

    // Stage 3: Validate
    this.updatePipelineStage(pipeline, 'validate', 'processing');
    const validationResult = await this.validateStage(transformedDocument, format);
    if (!validationResult.valid) {
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
    }
    this.updatePipelineStage(pipeline, 'validate', 'completed', validationResult);

    // Stage 4: Generate
    this.updatePipelineStage(pipeline, 'generate', 'processing');
    const generatedOutput = await this.generateStage(transformedDocument, format, exportOptions);
    this.updatePipelineStage(pipeline, 'generate', 'completed', generatedOutput);

    // Stage 5: Deliver
    this.updatePipelineStage(pipeline, 'deliver', 'processing');
    const deliveryResult = await this.deliverStage(generatedOutput, format, exportOptions);
    this.updatePipelineStage(pipeline, 'deliver', 'completed', deliveryResult);

    return deliveryResult;
  }

  /**
   * Stage 1: Capture dashboard state
   */
  async captureStage(options) {
    try {
      // Capture dashboard using the capture service
      const capturedData = await dashboardCaptureService.captureDashboard(options);

      // Create UIR document
      const uirDocument = createUIRDocument({
        metadata: capturedData.metadata,
        structure: capturedData.structure,
        styles: capturedData.styles,
        data: capturedData.data
      });

      return uirDocument;
    } catch (error) {
      throw new Error(`Capture stage failed: ${error.message}`);
    }
  }

  /**
   * Stage 2: Transform UIR to format-specific structure
   */
  async transformStage(uirDocument, format, options) {
    try {
      const handler = this.exportHandlers.get(format);
      
      if (!handler) {
        // For now, return the UIR document as-is for formats without handlers
        console.warn(`No handler registered for format: ${format}`);
        return uirDocument;
      }

      // Transform using format-specific handler
      const transformed = await handler.transform(uirDocument, options);
      return transformed;
    } catch (error) {
      throw new Error(`Transform stage failed: ${error.message}`);
    }
  }

  /**
   * Stage 3: Validate the transformed document
   */
  async validateStage(document, format) {
    try {
      // Basic UIR validation
      const uirValidation = validateUIRDocument(document);
      
      if (!uirValidation.valid) {
        return uirValidation;
      }

      // Format-specific validation
      const handler = this.exportHandlers.get(format);
      if (handler && handler.validate) {
        const formatValidation = await handler.validate(document);
        return formatValidation;
      }

      return { valid: true, errors: [] };
    } catch (error) {
      throw new Error(`Validation stage failed: ${error.message}`);
    }
  }

  /**
   * Stage 4: Generate the final output
   */
  async generateStage(document, format, options) {
    try {
      const handler = this.exportHandlers.get(format);
      
      if (!handler) {
        // Fallback: return document as JSON
        if (format === ExportFormats.JSON) {
          return {
            type: 'json',
            data: document,
            mimeType: 'application/json'
          };
        }
        throw new Error(`No handler available for format: ${format}`);
      }

      // Generate output using format-specific handler
      const output = await handler.generate(document, options);
      return output;
    } catch (error) {
      throw new Error(`Generate stage failed: ${error.message}`);
    }
  }

  /**
   * Stage 5: Deliver the generated output
   */
  async deliverStage(output, format, options) {
    try {
      const { deliveryMethod = 'download' } = options;

      switch (deliveryMethod) {
        case 'download':
          return await this.deliverAsDownload(output, format, options);
        
        case 'email':
          return await this.deliverAsEmail(output, format, options);
        
        case 'api':
          return await this.deliverToAPI(output, format, options);
        
        case 'preview':
          return await this.deliverAsPreview(output, format, options);
        
        default:
          throw new Error(`Unknown delivery method: ${deliveryMethod}`);
      }
    } catch (error) {
      throw new Error(`Delivery stage failed: ${error.message}`);
    }
  }

  /**
   * Deliver output as file download
   */
  async deliverAsDownload(output, format, options) {
    const { filename = this.generateFilename(format) } = options;

    // Create blob from output
    let blob;
    if (output.type === 'blob') {
      blob = output.data;
    } else if (output.type === 'json') {
      blob = new Blob([JSON.stringify(output.data, null, 2)], { 
        type: 'application/json' 
      });
    } else if (output.type === 'text') {
      blob = new Blob([output.data], { 
        type: output.mimeType || 'text/plain' 
      });
    } else if (output.type === 'base64') {
      const byteCharacters = atob(output.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: output.mimeType });
    } else {
      throw new Error(`Unsupported output type: ${output.type}`);
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    return {
      method: 'download',
      filename,
      size: blob.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Deliver output via email (placeholder)
   */
  async deliverAsEmail(output, format, options) {
    // This would integrate with email service
    throw new Error('Email delivery not implemented');
  }

  /**
   * Deliver output to API endpoint (placeholder)
   */
  async deliverToAPI(output, format, options) {
    // This would send to configured API
    throw new Error('API delivery not implemented');
  }

  /**
   * Deliver output as preview
   */
  async deliverAsPreview(output, format, options) {
    // Open in new window/tab for preview
    if (output.type === 'blob' || output.type === 'base64') {
      const blob = output.type === 'blob' 
        ? output.data 
        : this.base64ToBlob(output.data, output.mimeType);
      
      const url = URL.createObjectURL(blob);
      const previewWindow = window.open(url, '_blank');
      
      // Cleanup after preview window is closed
      if (previewWindow) {
        previewWindow.addEventListener('beforeunload', () => {
          URL.revokeObjectURL(url);
        });
      }

      return {
        method: 'preview',
        url,
        timestamp: new Date().toISOString()
      };
    }

    throw new Error('Preview not supported for this output type');
  }

  /**
   * Get export status
   */
  getExportStatus(exportId) {
    return this.activeExports.get(exportId) || null;
  }

  /**
   * Cancel an active export
   */
  cancelExport(exportId) {
    const activeExport = this.activeExports.get(exportId);
    if (activeExport && activeExport.status === 'processing') {
      activeExport.status = 'cancelled';
      activeExport.endTime = new Date();
      this.addToHistory(exportId, 'cancelled');
      return true;
    }
    return false;
  }

  /**
   * Get export history
   */
  getExportHistory(limit = 10) {
    return this.exportHistory.slice(-limit);
  }

  /**
   * Clear export history
   */
  clearExportHistory() {
    this.exportHistory = [];
  }

  // Utility methods
  createPipeline(exportId, options) {
    return {
      ...TransformPipelineSchema,
      id: exportId,
      name: `Export ${options.format || 'PDF'}`,
      metadata: {
        options,
        createdAt: new Date().toISOString()
      }
    };
  }

  updatePipelineStage(pipeline, stageName, status, output = null, error = null) {
    const stage = pipeline.stages.find(s => s.name === stageName);
    if (stage) {
      stage.status = status;
      if (status === 'processing') {
        stage.startTime = new Date().toISOString();
      } else if (status === 'completed' || status === 'failed') {
        stage.endTime = new Date().toISOString();
      }
      if (output) stage.output = output;
      if (error) stage.error = error;
    }
  }

  generateExportId() {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateFilename(format) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = this.getFileExtension(format);
    return `proceed_dashboard_export_${timestamp}.${extension}`;
  }

  getFileExtension(format) {
    const extensions = {
      [ExportFormats.PDF]: 'pdf',
      [ExportFormats.POWERPOINT]: 'pptx',
      [ExportFormats.EXCEL]: 'xlsx',
      [ExportFormats.IMAGE]: 'png',
      [ExportFormats.HTML]: 'html',
      [ExportFormats.JSON]: 'json'
    };
    return extensions[format] || 'dat';
  }

  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  addToHistory(exportId, status, result = null, error = null) {
    const historyEntry = {
      id: exportId,
      timestamp: new Date().toISOString(),
      status,
      result,
      error: error ? error.message : null
    };
    
    this.exportHistory.push(historyEntry);
    
    // Keep only last 100 entries
    if (this.exportHistory.length > 100) {
      this.exportHistory = this.exportHistory.slice(-100);
    }
  }
}

// Create singleton instance
const exportManager = new ExportManager();

export default exportManager;