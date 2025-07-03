'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, X, FileSpreadsheet, AlertCircle, 
  CheckCircle, ArrowRight, Loader2, Download
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { parseExcelFile, defaultColumnMappings } from '@/utils/excel-parser'
import { Task } from '@/types/project'
import toast from 'react-hot-toast'

interface ExcelImportProps {
  onImport: (tasks: Partial<Task>[]) => void
  onClose: () => void
  existingTasks?: Task[]
}

export function ExcelImport({ onImport, onClose, existingTasks = [] }: ExcelImportProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedData, setParsedData] = useState<{
    headers: string[]
    rows: any[]
    tasks: Partial<Task>[]
  } | null>(null)
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [parseResult, setParseResult] = useState<{
    success: boolean
    tasks: Partial<Task>[]
    errors: string[]
    warnings: string[]
  } | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setFile(file)
    setIsProcessing(true)

    try {
      const result = await parseExcelFile(file)
      setParseResult(result)
      
      if (result.success) {
        setParsedData({
          headers: Object.keys(result.tasks[0] || {}),
          rows: result.tasks,
          tasks: result.tasks,
        })
        
        // Auto-detect column mappings
        const detectedMappings: Record<string, string> = {}
        const headers = Object.keys(result.tasks[0] || {})
        
        headers.forEach(header => {
          Object.entries(defaultColumnMappings).forEach(([field, possibleNames]) => {
            if (possibleNames.some(name => 
              header.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(header.toLowerCase())
            )) {
              detectedMappings[field] = header
            }
          })
        })
        
        setColumnMappings(detectedMappings)
        setStep('mapping')
      } else {
        toast.error(result.errors.join(', '))
      }
    } catch (error) {
      toast.error('Failed to parse Excel file')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  })

  const handleMappingChange = (taskField: string, excelColumn: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [taskField]: excelColumn,
    }))
  }

  const handlePreview = () => {
    if (!parsedData) return
    
    // Apply column mappings to create tasks
    const mappedTasks = parsedData.rows.map((row, index) => {
      const task: Partial<Task> = {
        id: `imported-${index}`,
        projectId: '1', // Current project
      }
      
      Object.entries(columnMappings).forEach(([taskField, excelColumn]) => {
        if (row[excelColumn] !== undefined) {
          (task as any)[taskField] = row[excelColumn]
        }
      })
      
      return task
    })
    
    setParsedData(prev => prev ? { ...prev, tasks: mappedTasks } : null)
    setStep('preview')
  }

  const handleImport = () => {
    if (!parsedData) return
    
    onImport(parsedData.tasks)
    setStep('complete')
    
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  const downloadTemplate = () => {
    // Create a sample Excel template
    const templateData = [
      {
        'Task ID': 'T001',
        'Task Name': 'Sample Task',
        'Task Type': 'Child',
        'Parent Task ID': '',
        'WBS Code': '1.1',
        'Duration (Days)': 5,
        'Start Date': '2024-01-01',
        'End Date': '2024-01-05',
        '% Complete': 0,
        'Task Agility': 'Sequential',
        'Dependencies': '',
        'Criticality Level': 'Medium',
        'Resource Assignment': 'John Doe',
        'Resource Load %': 100,
        'Cost Budget': 10000,
        'Status': 'Not Started',
        'Milestone': 'No',
        'Deliverables': 'Sample deliverable',
        'Notes': 'Sample note',
      }
    ]
    
    // Convert to CSV for simplicity
    const headers = Object.keys(templateData[0])
    const csv = [
      headers.join(','),
      ...templateData.map(row => 
        headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'project_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Import Excel File</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-neutral-50">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {['Upload', 'Map Columns', 'Preview', 'Complete'].map((label, index) => {
              const steps = ['upload', 'mapping', 'preview', 'complete']
              const isActive = steps.indexOf(step) >= index
              const isCurrent = steps[index] === step
              
              return (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-500'
                    } ${isCurrent ? 'ring-4 ring-primary-50' : ''}`}>
                      {index + 1}
                    </div>
                    <span className={`text-sm mt-2 ${
                      isActive ? 'text-primary font-medium' : 'text-neutral-500'
                    }`}>
                      {label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className={`w-20 h-0.5 mx-2 transition-colors ${
                      steps.indexOf(step) > index ? 'bg-primary' : 'bg-neutral-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          <AnimatePresence mode="wait">
            {/* Upload Step */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium mb-2">Upload Your Excel File</h3>
                  <p className="text-neutral-600">
                    Support for .xlsx and .xls files. Maximum file size: 10MB
                  </p>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary-50' : 'border-neutral-300 hover:border-primary'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-neutral-700 mb-2">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop your Excel file here'}
                  </p>
                  <p className="text-sm text-neutral-500">
                    or <span className="text-primary font-medium">browse</span> to choose a file
                  </p>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={downloadTemplate}
                    className="text-primary hover:text-primary-dark font-medium inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>

                {isProcessing && (
                  <div className="mt-6 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-neutral-600">Processing file...</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Column Mapping Step */}
            {step === 'mapping' && parsedData && (
              <motion.div
                key="mapping"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Map Excel Columns to Task Fields</h3>
                  <p className="text-neutral-600">
                    We've auto-detected some mappings. Review and adjust as needed.
                  </p>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(defaultColumnMappings).map(([field, _]) => (
                    <div key={field} className="flex items-center gap-4">
                      <div className="w-1/3">
                        <label className="text-sm font-medium text-neutral-700">
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                      </div>
                      <select
                        value={columnMappings[field] || ''}
                        onChange={(e) => handleMappingChange(field, e.target.value)}
                        className="input flex-1"
                      >
                        <option value="">-- Not mapped --</option>
                        {parsedData.headers.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {parseResult?.warnings && parseResult.warnings.length > 0 && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Warnings</h4>
                        <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                          {parseResult.warnings.slice(0, 5).map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                          {parseResult.warnings.length > 5 && (
                            <li>• ...and {parseResult.warnings.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Preview Step */}
            {step === 'preview' && parsedData && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Preview Import</h3>
                  <p className="text-neutral-600">
                    Review the tasks that will be imported. You can make adjustments after import.
                  </p>
                </div>

                <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-600">Total Tasks:</span>
                      <span className="ml-2 font-medium">{parsedData.tasks.length}</span>
                    </div>
                    <div>
                      <span className="text-neutral-600">Parent Tasks:</span>
                      <span className="ml-2 font-medium">
                        {parsedData.tasks.filter(t => t.type === 'Parent').length}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-600">Milestones:</span>
                      <span className="ml-2 font-medium">
                        {parsedData.tasks.filter(t => t.milestone).length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-100">
                      <tr>
                        <th className="p-3 text-left font-medium">Task Name</th>
                        <th className="p-3 text-left font-medium">Type</th>
                        <th className="p-3 text-left font-medium">Duration</th>
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Resource</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.tasks.slice(0, 10).map((task, index) => (
                        <tr key={index} className="border-t hover:bg-neutral-50">
                          <td className="p-3">{task.name || 'Unnamed Task'}</td>
                          <td className="p-3">{task.type || 'Child'}</td>
                          <td className="p-3">{task.duration || 0} days</td>
                          <td className="p-3">{task.status || 'Not Started'}</td>
                          <td className="p-3">{task.resourceAssignment || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.tasks.length > 10 && (
                    <div className="p-3 text-center text-sm text-neutral-600 bg-neutral-50">
                      ...and {parsedData.tasks.length - 10} more tasks
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Complete Step */}
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-12"
              >
                <CheckCircle className="w-20 h-20 text-status-success mx-auto mb-4" />
                <h3 className="text-2xl font-medium mb-2">Import Successful!</h3>
                <p className="text-neutral-600 mb-4">
                  {parsedData?.tasks.length || 0} tasks have been imported successfully.
                </p>
                <p className="text-sm text-neutral-500">
                  Redirecting to task list...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step !== 'complete' && (
          <div className="flex justify-between gap-3 p-6 border-t bg-neutral-50">
            <button
              onClick={() => {
                if (step === 'mapping') setStep('upload')
                else if (step === 'preview') setStep('mapping')
              }}
              className="btn-secondary px-6 py-2"
              disabled={step === 'upload'}
            >
              Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="btn-secondary px-6 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (step === 'mapping') handlePreview()
                  else if (step === 'preview') handleImport()
                }}
                className="btn-primary px-6 py-2 flex items-center gap-2"
                disabled={
                  (step === 'upload' && !file) ||
                  (step === 'mapping' && Object.keys(columnMappings).length === 0)
                }
              >
                {step === 'preview' ? 'Import Tasks' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}