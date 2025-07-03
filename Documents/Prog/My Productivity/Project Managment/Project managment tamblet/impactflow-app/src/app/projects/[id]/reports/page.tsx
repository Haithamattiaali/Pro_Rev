'use client'

import { ReportBuilder } from '@/components/reports/ReportBuilder'
import { useParams } from 'next/navigation'
import { useProjectStore } from '@/store/projectStore'
import { Report } from '@/types/report'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const params = useParams()
  const projectId = params.id as string
  const { currentProject } = useProjectStore()

  const handleSaveReport = (report: Report) => {
    // In a real app, this would save to a backend
    console.log('Saving report:', report)
    
    // For demo purposes, save to localStorage
    const savedReports = localStorage.getItem('project-reports') || '{}'
    const reports = JSON.parse(savedReports)
    
    if (!reports[projectId]) {
      reports[projectId] = []
    }
    
    const existingIndex = reports[projectId].findIndex((r: Report) => r.id === report.id)
    if (existingIndex >= 0) {
      reports[projectId][existingIndex] = report
    } else {
      reports[projectId].push(report)
    }
    
    localStorage.setItem('project-reports', JSON.stringify(reports))
    toast.success('Report saved successfully')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ReportBuilder 
        projectId={projectId}
        onSave={handleSaveReport}
      />
    </div>
  )
}