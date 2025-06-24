import React, { useState } from 'react'
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'
import apiService from '../services/api.service'

const Upload = () => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
        setError(null)
        setUploadResult(null)
      }
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
        setError(null)
        setUploadResult(null)
      }
    }
  }

  const validateFile = (file) => {
    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      setError('Please select a valid Excel file (.xlsx, .xls)')
      return false
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return false
    }

    return true
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setError(null)
    setUploadResult(null)

    try {
      const result = await apiService.uploadExcelFile(file)
      setUploadResult(result)
      setFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('file-input')
      if (fileInput) fileInput.value = ''
      
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setError(null)
    setUploadResult(null)
    
    // Reset file input
    const fileInput = document.getElementById('file-input')
    if (fileInput) fileInput.value = ''
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-dark tracking-tight">Data Upload</h1>
        <p className="text-neutral-mid mt-2">Upload Excel files to update revenue data</p>
      </div>

      <div className="grid gap-6">
        {/* File Requirements Card */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-light p-6">
          <h2 className="text-lg font-semibold text-primary-dark mb-4">File Requirements</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Excel files only (.xlsx, .xls)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Maximum file size: 10MB</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Required columns: Customer, Service_Type, Year, Month, Cost, Target, Revenue, Receivables Collected</span>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-light p-6">
          <h2 className="text-lg font-semibold text-primary-dark mb-4">Upload File</h2>
          
          {/* Drag and Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : file
                ? 'border-green-300 bg-green-50'
                : 'border-neutral-light hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-green-700">{file.name}</p>
                    <p className="text-sm text-green-600">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-1 hover:bg-red-100 rounded-full transition-colors"
                    disabled={uploading}
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
                
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-4 h-4" />
                      Upload File
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <UploadIcon className="w-12 h-12 text-neutral-mid mx-auto" />
                <div>
                  <p className="text-lg font-medium text-neutral-dark">
                    Drag and drop your Excel file here
                  </p>
                  <p className="text-sm text-neutral-mid mt-1">
                    or click to browse files
                  </p>
                </div>
                
                <label htmlFor="file-input" className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-light cursor-pointer transition-colors">
                  <FileSpreadsheet className="w-4 h-4" />
                  Choose File
                </label>
                
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700 font-medium">Upload Error</p>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {uploadResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-700 font-medium">Upload Successful</p>
              </div>
              <div className="text-sm text-green-600 space-y-1">
                <p>Total Records: {uploadResult.totalRecords}</p>
                <p>New Records: {uploadResult.inserted}</p>
                <p>Updated Records: {uploadResult.updated}</p>
                {uploadResult.errors > 0 && (
                  <p className="text-amber-600">Errors: {uploadResult.errors}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload History / Instructions */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-light p-6">
          <h2 className="text-lg font-semibold text-primary-dark mb-4">Data Format Guidelines</h2>
          <div className="space-y-4 text-sm text-neutral-dark">
            <div>
              <h3 className="font-medium mb-2">Required Columns:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Customer:</strong> Customer name (text)</li>
                <li><strong>Service_Type:</strong> Transportation or Warehouses</li>
                <li><strong>Year:</strong> Year (e.g., 2025)</li>
                <li><strong>Month:</strong> Month name (e.g., Jan, Feb, Mar)</li>
                <li><strong>Cost:</strong> Cost amount (number)</li>
                <li><strong>Target:</strong> Target amount (number)</li>
                <li><strong>Revenue:</strong> Revenue amount (number)</li>
                <li><strong>Receivables Collected:</strong> Receivables amount (number)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Important Notes:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Data will be merged based on Customer, Service_Type, Year, and Month</li>
                <li>Existing records will be updated with new values</li>
                <li>All numerical values should be provided without currency symbols</li>
                <li>Month names should be in short format (Jan, Feb, Mar, etc.)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Upload