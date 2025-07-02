/**
 * Export Manager
 * Orchestrates the complete export pipeline from capture to delivery
 */

import {
  DashboardVirtualDOM,
  UniversalExportRepresentation,
  ExportOptions,
  ExportSession,
  ExportStatus,
  ExportRequest,
  ExportResults,
  ExportDocument,
  ExportError as IExportError,
  ExportErrorCode,
  ExportProgress,
  ExportFormat
} from './core/types';

import { DashboardCaptureEngine } from './capture/DashboardCaptureEngine';
import { UERTranslator } from './translation/UERTranslator';
import { PowerPointCompiler } from './compilers/PowerPointCompiler';
import { PDFCompiler } from './compilers/PDFCompiler';

// Export Error class implementation
class ExportError extends Error implements IExportError {
  code: ExportErrorCode;
  phase: string;
  recoverable: boolean;
  context?: Record<string, any>;

  constructor(error: IExportError) {
    super(error.message);
    this.name = 'ExportError';
    this.code = error.code;
    this.phase = error.phase;
    this.recoverable = error.recoverable;
    this.context = error.context;
  }
}

// Compiler interface
interface Compiler {
  compile(uer: UniversalExportRepresentation): Promise<ExportDocument>;
}

// Export manager configuration
interface ExportManagerConfig {
  maxConcurrentExports: number;
  enableWorkers: boolean;
  cacheTimeout: number;
  retryAttempts: number;
  progressUpdateInterval: number;
}

// Session store type
type SessionStore = Map<string, ExportSession>;

export class ExportManager {
  private config: ExportManagerConfig;
  private sessions: SessionStore;
  private captureEngine: DashboardCaptureEngine;
  private translator: UERTranslator;
  private compilers: Map<ExportFormat, Compiler>;
  private activeExports: number = 0;
  private exportQueue: ExportRequest[] = [];
  private sessionIdCounter: number = 0;

  constructor(config: Partial<ExportManagerConfig> = {}) {
    this.config = {
      maxConcurrentExports: 3,
      enableWorkers: true,
      cacheTimeout: 300000, // 5 minutes
      retryAttempts: 3,
      progressUpdateInterval: 100,
      ...config
    };

    this.sessions = new Map();
    this.compilers = new Map();
    this.initializeComponents();
  }

  /**
   * Initialize core components
   */
  private initializeComponents(): void {
    // Initialize capture engine
    this.captureEngine = new DashboardCaptureEngine({
      includeStyles: true,
      includeInteractions: true,
      captureViewport: true,
      quality: 'high'
    });

    // Initialize translator
    this.translator = new UERTranslator({
      pageLayout: 'auto',
      sectionGrouping: 'type',
      quality: 'high'
    });

    // Register compilers
    this.registerCompilers();
  }

  /**
   * Register format-specific compilers
   */
  private registerCompilers(): void {
    this.compilers.set('pdf', new PDFCompiler());
    this.compilers.set('powerpoint', new PowerPointCompiler());
    
    // TODO: Add Excel, Image, HTML compilers
  }

  /**
   * Main export method - initiates the export process
   */
  async export(
    dashboardElement: HTMLElement,
    options: ExportOptions,
    dashboardState?: any
  ): Promise<string> {
    console.log('📤 Starting export process...');

    // Create export session
    const sessionId = this.createSession(options);
    const session = this.sessions.get(sessionId)!;

    // Queue or process immediately
    if (this.activeExports >= this.config.maxConcurrentExports) {
      console.log('⏳ Export queued, waiting for available slot...');
      this.exportQueue.push(session.request);
      return sessionId;
    }

    // Process export
    this.processExport(sessionId, dashboardElement, dashboardState);
    return sessionId;
  }

  /**
   * Process export through the pipeline
   */
  private async processExport(
    sessionId: string,
    dashboardElement: HTMLElement,
    dashboardState?: any
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.activeExports++;

    try {
      // Phase 1: Capture
      await this.executeCapture(session, dashboardElement, dashboardState);

      // Phase 2: Translate
      await this.executeTranslation(session);

      // Phase 3: Compile
      await this.executeCompilation(session);

      // Phase 4: Deliver
      await this.executeDelivery(session);

      // Mark as completed
      this.updateSessionStatus(sessionId, 'completed');
      console.log('✅ Export completed successfully', { sessionId });

    } catch (error) {
      console.error('❌ Export failed:', error);
      this.handleExportError(sessionId, error);
    } finally {
      this.activeExports--;
      this.processNextInQueue();
    }
  }

  /**
   * Execute capture phase
   */
  private async executeCapture(
    session: ExportSession,
    dashboardElement: HTMLElement,
    dashboardState?: any
  ): Promise<void> {
    this.updateSessionStatus(session.id, 'capturing');
    this.updateProgress(session.id, {
      phase: 'capture',
      percentage: 0,
      message: 'Capturing dashboard structure...'
    });

    try {
      const dvdom = await this.captureEngine.captureDashboard(
        dashboardElement,
        dashboardState
      );

      // Store DVDOM in session
      (session as any).dvdom = dvdom;

      this.updateProgress(session.id, {
        phase: 'capture',
        percentage: 100,
        message: 'Dashboard captured successfully'
      });

    } catch (error) {
      throw new ExportError({
        code: ExportErrorCode.CAPTURE_TIMEOUT,
        message: 'Failed to capture dashboard',
        phase: 'capture',
        recoverable: false,
        context: { error: error.message }
      });
    }
  }

  /**
   * Execute translation phase
   */
  private async executeTranslation(session: ExportSession): Promise<void> {
    this.updateSessionStatus(session.id, 'translating');
    this.updateProgress(session.id, {
      phase: 'translation',
      percentage: 0,
      message: 'Translating to export format...'
    });

    try {
      const dvdom = (session as any).dvdom as DashboardVirtualDOM;
      const uer = await this.translator.translate(dvdom);

      // Store UER in session
      (session as any).uer = uer;

      this.updateProgress(session.id, {
        phase: 'translation',
        percentage: 100,
        message: 'Translation completed'
      });

    } catch (error) {
      throw new ExportError({
        code: ExportErrorCode.TRANSLATION_SCHEMA_INVALID,
        message: 'Failed to translate dashboard',
        phase: 'translation',
        recoverable: false,
        context: { error: error.message }
      });
    }
  }

  /**
   * Execute compilation phase
   */
  private async executeCompilation(session: ExportSession): Promise<void> {
    this.updateSessionStatus(session.id, 'compiling');
    this.updateProgress(session.id, {
      phase: 'compilation',
      percentage: 0,
      message: 'Compiling export documents...'
    });

    try {
      const uer = (session as any).uer as UniversalExportRepresentation;
      const documents: ExportDocument[] = [];
      const formats = session.request.options.formats;

      // Compile for each requested format
      for (let i = 0; i < formats.length; i++) {
        const format = formats[i];
        const compiler = this.compilers.get(format);

        if (!compiler) {
          console.warn(`No compiler found for format: ${format}`);
          continue;
        }

        this.updateProgress(session.id, {
          phase: 'compilation',
          percentage: (i / formats.length) * 100,
          message: `Compiling ${format} document...`
        });

        const document = await compiler.compile(uer);
        documents.push(document);
      }

      // Store results
      session.results = {
        documents,
        metadata: {
          totalTime: Date.now() - new Date(session.request.timestamp).getTime(),
          captureTime: 0, // TODO: Track individual phase times
          translationTime: 0,
          compilationTime: 0,
          elementsProcessed: this.countElements((session as any).dvdom),
          warnings: []
        }
      };

      this.updateProgress(session.id, {
        phase: 'compilation',
        percentage: 100,
        message: 'Compilation completed'
      });

    } catch (error) {
      throw new ExportError({
        code: ExportErrorCode.COMPILATION_FORMAT_ERROR,
        message: 'Failed to compile export',
        phase: 'compilation',
        recoverable: true,
        context: { error: error.message }
      });
    }
  }

  /**
   * Execute delivery phase
   */
  private async executeDelivery(session: ExportSession): Promise<void> {
    this.updateSessionStatus(session.id, 'delivering');
    this.updateProgress(session.id, {
      phase: 'delivery',
      percentage: 0,
      message: 'Preparing documents for delivery...'
    });

    // In a real implementation, this would handle:
    // - File system saves
    // - Cloud uploads
    // - Email delivery
    // - Direct downloads

    this.updateProgress(session.id, {
      phase: 'delivery',
      percentage: 100,
      message: 'Export ready for download'
    });
  }

  /**
   * Get export session status
   */
  getSession(sessionId: string): ExportSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get export progress
   */
  getProgress(sessionId: string): ExportProgress | undefined {
    return this.sessions.get(sessionId)?.progress;
  }

  /**
   * Cancel export
   */
  async cancelExport(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (session.status === 'completed' || session.status === 'failed') {
      return false;
    }

    this.updateSessionStatus(sessionId, 'cancelled');
    // TODO: Implement actual cancellation logic
    return true;
  }

  /**
   * Download export results
   */
  async downloadResults(sessionId: string, format?: ExportFormat): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.results) {
      throw new Error('Export results not available');
    }

    const documents = format
      ? session.results.documents.filter(d => d.format === format)
      : session.results.documents;

    // Trigger downloads
    for (const doc of documents) {
      this.downloadDocument(doc);
    }
  }

  /**
   * Utility methods
   */

  private createSession(options: ExportOptions): string {
    const sessionId = `export_${this.sessionIdCounter++}_${Date.now()}`;
    const session: ExportSession = {
      id: sessionId,
      status: 'initiated',
      request: {
        dashboardId: 'dashboard', // TODO: Get from context
        userId: 'user', // TODO: Get from auth
        options,
        timestamp: new Date().toISOString()
      },
      progress: {
        phase: 'initiated',
        percentage: 0,
        message: 'Export initiated'
      }
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  private updateSessionStatus(sessionId: string, status: ExportStatus): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
    }
  }

  private updateProgress(sessionId: string, progress: ExportProgress): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.progress = {
        ...progress,
        estimatedTimeRemaining: this.estimateTimeRemaining(session, progress)
      };
    }
  }

  private handleExportError(sessionId: string, error: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.updateSessionStatus(sessionId, 'failed');
    session.errors = session.errors || [];
    session.errors.push(
      error instanceof ExportError
        ? error
        : {
            code: ExportErrorCode.SYSTEM_OUT_OF_MEMORY,
            message: error.message || 'Unknown error',
            phase: session.status,
            recoverable: false
          }
    );
  }

  private processNextInQueue(): void {
    if (this.exportQueue.length === 0) return;
    if (this.activeExports >= this.config.maxConcurrentExports) return;

    const nextRequest = this.exportQueue.shift();
    if (nextRequest) {
      // Find the session for this request
      for (const [sessionId, session] of this.sessions) {
        if (session.request === nextRequest) {
          // TODO: Get dashboard element reference
          // this.processExport(sessionId, dashboardElement);
          break;
        }
      }
    }
  }

  private countElements(dvdom: DashboardVirtualDOM): number {
    const count = (node: any): number => {
      let total = 1;
      if (node.children) {
        for (const child of node.children) {
          total += count(child);
        }
      }
      return total;
    };
    return count(dvdom.structure.root);
  }

  private estimateTimeRemaining(session: ExportSession, progress: ExportProgress): number {
    // Simple estimation based on progress
    const elapsed = Date.now() - new Date(session.request.timestamp).getTime();
    if (progress.percentage === 0) return 0;
    const total = elapsed / (progress.percentage / 100);
    return Math.max(0, total - elapsed);
  }

  private downloadDocument(doc: ExportDocument): void {
    // Create blob and trigger download
    const blob = doc.data instanceof Blob ? doc.data : new Blob([doc.data]);
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = doc.filename;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clear old sessions
    const now = Date.now();
    for (const [sessionId, session] of this.sessions) {
      const age = now - new Date(session.request.timestamp).getTime();
      if (age > this.config.cacheTimeout) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Export singleton instance
export const exportManager = new ExportManager();