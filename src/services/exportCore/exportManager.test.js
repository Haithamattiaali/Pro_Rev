import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import exportManager from './exportManager'
import * as captureService from './captureService'
import * as visualCaptureService from './visualCaptureService'
import * as designCompiler from './designCompiler'
import { ExportFormats } from './uirSchema'

// Mock dependencies
vi.mock('./captureService')
vi.mock('./visualCaptureService')
vi.mock('./designCompiler')
vi.mock('html2canvas')
vi.mock('jspdf')
vi.mock('pptxgenjs')

describe('ExportManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset export manager state
    exportManager.exports.clear()
    exportManager.activeExports.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('exportDashboard', () => {
    const mockOptions = {
      format: ExportFormats.PDF,
      captureOptions: {
        viewName: 'overview',
        includeData: true,
        includeStyles: true
      },
      exportOptions: {
        filters: {
          year: 2025,
          period: 'YTD'
        }
      }
    }

    const mockVirtualDOM = {
      elements: [],
      styles: {},
      data: {},
      metadata: {}
    }

    const mockExportResult = {
      format: ExportFormats.PDF,
      data: 'mock-pdf-data',
      filename: 'export.pdf'
    }

    it('should export dashboard successfully', async () => {
      captureService.captureDashboard = vi.fn().mockResolvedValue(mockVirtualDOM)
      designCompiler.compileDesign = vi.fn().mockResolvedValue(mockExportResult)

      const result = await exportManager.exportDashboard(mockOptions)

      expect(captureService.captureDashboard).toHaveBeenCalledWith(mockOptions.captureOptions)
      expect(designCompiler.compileDesign).toHaveBeenCalledWith(
        mockVirtualDOM,
        mockOptions.format,
        mockOptions.exportOptions
      )
      expect(result).toMatchObject({
        success: true,
        exportId: expect.any(String),
        format: ExportFormats.PDF,
        data: mockExportResult
      })
    })

    it('should handle visual capture when specified', async () => {
      const visualOptions = {
        ...mockOptions,
        captureOptions: {
          ...mockOptions.captureOptions,
          useVisualCapture: true
        }
      }

      visualCaptureService.captureVisual = vi.fn().mockResolvedValue(mockVirtualDOM)
      designCompiler.compileDesign = vi.fn().mockResolvedValue(mockExportResult)

      await exportManager.exportDashboard(visualOptions)

      expect(visualCaptureService.captureVisual).toHaveBeenCalled()
      expect(captureService.captureDashboard).not.toHaveBeenCalled()
    })

    it('should track active exports', async () => {
      captureService.captureDashboard = vi.fn().mockResolvedValue(mockVirtualDOM)
      designCompiler.compileDesign = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockExportResult), 100)
        })
      })

      const exportPromise = exportManager.exportDashboard(mockOptions)
      
      // Should be tracked as active
      expect(exportManager.activeExports.size).toBe(1)
      
      await exportPromise
      
      // Should be removed from active after completion
      expect(exportManager.activeExports.size).toBe(0)
    })

    it('should store export history', async () => {
      captureService.captureDashboard = vi.fn().mockResolvedValue(mockVirtualDOM)
      designCompiler.compileDesign = vi.fn().mockResolvedValue(mockExportResult)

      const result = await exportManager.exportDashboard(mockOptions)

      const exportRecord = exportManager.exports.get(result.exportId)
      expect(exportRecord).toBeDefined()
      expect(exportRecord.format).toBe(ExportFormats.PDF)
      expect(exportRecord.status).toBe('completed')
      expect(exportRecord.timestamp).toBeInstanceOf(Date)
    })

    it('should handle export errors', async () => {
      const error = new Error('Export failed')
      captureService.captureDashboard = vi.fn().mockRejectedValue(error)

      await expect(exportManager.exportDashboard(mockOptions)).rejects.toThrow('Export failed')
    })

    it('should support all export formats', async () => {
      captureService.captureDashboard = vi.fn().mockResolvedValue(mockVirtualDOM)
      designCompiler.compileDesign = vi.fn().mockResolvedValue(mockExportResult)

      const formats = [
        ExportFormats.PDF,
        ExportFormats.POWERPOINT,
        ExportFormats.EXCEL,
        ExportFormats.IMAGE,
        ExportFormats.HTML
      ]

      for (const format of formats) {
        const options = { ...mockOptions, format }
        const result = await exportManager.exportDashboard(options)
        
        expect(result.format).toBe(format)
        expect(designCompiler.compileDesign).toHaveBeenCalledWith(
          mockVirtualDOM,
          format,
          mockOptions.exportOptions
        )
      }
    })
  })

  describe('cancelExport', () => {
    it('should cancel an active export', async () => {
      const mockAbortController = new AbortController()
      const mockExportId = 'test-export-123'
      
      exportManager.activeExports.set(mockExportId, {
        id: mockExportId,
        controller: mockAbortController,
        promise: Promise.resolve()
      })

      const abortSpy = vi.spyOn(mockAbortController, 'abort')
      
      const result = exportManager.cancelExport(mockExportId)

      expect(result).toBe(true)
      expect(abortSpy).toHaveBeenCalled()
      expect(exportManager.activeExports.has(mockExportId)).toBe(false)
    })

    it('should return false for non-existent export', () => {
      const result = exportManager.cancelExport('non-existent-id')
      expect(result).toBe(false)
    })
  })

  describe('getExportStatus', () => {
    it('should return status for completed export', () => {
      const exportId = 'test-export-123'
      const exportRecord = {
        id: exportId,
        format: ExportFormats.PDF,
        status: 'completed',
        timestamp: new Date(),
        data: {}
      }
      
      exportManager.exports.set(exportId, exportRecord)
      
      const status = exportManager.getExportStatus(exportId)
      
      expect(status).toMatchObject({
        id: exportId,
        status: 'completed',
        format: ExportFormats.PDF,
        timestamp: expect.any(Date)
      })
    })

    it('should return null for non-existent export', () => {
      const status = exportManager.getExportStatus('non-existent-id')
      expect(status).toBeNull()
    })
  })

  describe('clearExportHistory', () => {
    it('should clear all export records', () => {
      // Add some export records
      exportManager.exports.set('export1', { id: 'export1' })
      exportManager.exports.set('export2', { id: 'export2' })
      
      expect(exportManager.exports.size).toBe(2)
      
      exportManager.clearExportHistory()
      
      expect(exportManager.exports.size).toBe(0)
    })
  })

  describe('getActiveExports', () => {
    it('should return list of active exports', () => {
      const activeExport1 = {
        id: 'active1',
        controller: new AbortController(),
        promise: Promise.resolve()
      }
      const activeExport2 = {
        id: 'active2',
        controller: new AbortController(),
        promise: Promise.resolve()
      }
      
      exportManager.activeExports.set('active1', activeExport1)
      exportManager.activeExports.set('active2', activeExport2)
      
      const activeList = exportManager.getActiveExports()
      
      expect(activeList).toHaveLength(2)
      expect(activeList).toContain('active1')
      expect(activeList).toContain('active2')
    })

    it('should return empty array when no active exports', () => {
      const activeList = exportManager.getActiveExports()
      expect(activeList).toEqual([])
    })
  })

  describe('exportWithProgress', () => {
    it('should track progress during export', async () => {
      const progressCallback = vi.fn()
      const mockVirtualDOM = { elements: [] }
      const mockExportResult = { format: ExportFormats.PDF, data: 'mock-data' }
      
      captureService.captureDashboard = vi.fn().mockImplementation(async () => {
        progressCallback({ stage: 'capture', progress: 50 })
        return mockVirtualDOM
      })
      
      designCompiler.compileDesign = vi.fn().mockImplementation(async () => {
        progressCallback({ stage: 'compile', progress: 100 })
        return mockExportResult
      })
      
      const options = {
        format: ExportFormats.PDF,
        captureOptions: {},
        exportOptions: {},
        onProgress: progressCallback
      }
      
      await exportManager.exportDashboard(options)
      
      expect(progressCallback).toHaveBeenCalledWith({ stage: 'capture', progress: 50 })
      expect(progressCallback).toHaveBeenCalledWith({ stage: 'compile', progress: 100 })
    })
  })

  describe('error handling', () => {
    it('should update export status on error', async () => {
      const error = new Error('Capture failed')
      captureService.captureDashboard = vi.fn().mockRejectedValue(error)
      
      try {
        await exportManager.exportDashboard({
          format: ExportFormats.PDF,
          captureOptions: {},
          exportOptions: {}
        })
      } catch (e) {
        // Expected error
      }
      
      // Check that failed export is tracked
      const exports = Array.from(exportManager.exports.values())
      const failedExport = exports.find(e => e.status === 'failed')
      
      expect(failedExport).toBeDefined()
      expect(failedExport.error).toBe(error.message)
    })
  })

  describe('concurrent exports', () => {
    it('should handle multiple concurrent exports', async () => {
      captureService.captureDashboard = vi.fn().mockResolvedValue({ elements: [] })
      designCompiler.compileDesign = vi.fn().mockResolvedValue({ data: 'mock' })
      
      const exports = await Promise.all([
        exportManager.exportDashboard({ format: ExportFormats.PDF }),
        exportManager.exportDashboard({ format: ExportFormats.EXCEL }),
        exportManager.exportDashboard({ format: ExportFormats.POWERPOINT })
      ])
      
      expect(exports).toHaveLength(3)
      expect(exports[0].format).toBe(ExportFormats.PDF)
      expect(exports[1].format).toBe(ExportFormats.EXCEL)
      expect(exports[2].format).toBe(ExportFormats.POWERPOINT)
    })
  })
})