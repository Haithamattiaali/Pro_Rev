'use client'

import React, { useMemo, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { GitBranch, AlertTriangle, Clock } from 'lucide-react'
import { ReportWidget } from '@/types/report'
import { useProjectStore } from '@/store/projectStore'
import { Task } from '@/types/project'

interface CriticalPathDiagramProps {
  widget: ReportWidget
  onUpdate: (updates: Partial<ReportWidget>) => void
  isEditing: boolean
}

interface NetworkNode {
  id: string
  name: string
  x?: number
  y?: number
  duration: number
  earlyStart: number
  earlyFinish: number
  lateStart: number
  lateFinish: number
  float: number
  isCritical: boolean
  task: Task
}

interface NetworkLink {
  source: string
  target: string
  type: string
}

export function CriticalPathDiagram({ widget, onUpdate, isEditing }: CriticalPathDiagramProps) {
  const { tasks } = useProjectStore()
  const svgRef = useRef<SVGSVGElement>(null)
  
  const networkData = useMemo(() => {
    // Build network from tasks
    const nodes: NetworkNode[] = []
    const links: NetworkLink[] = []
    
    // Create nodes
    tasks.forEach(task => {
      nodes.push({
        id: task.id,
        name: task.name,
        duration: task.duration,
        earlyStart: 0, // Will be calculated
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        float: task.totalFloat || 0,
        isCritical: task.criticalPath,
        task,
      })
    })
    
    // Create links from dependencies
    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        links.push({
          source: depId,
          target: task.id,
          type: task.dependencyType || 'FS',
        })
      })
    })
    
    // Calculate critical path metrics
    const criticalTasks = tasks.filter(t => t.criticalPath)
    const criticalDuration = criticalTasks.reduce((sum, t) => sum + t.duration, 0)
    const totalFloat = tasks.reduce((sum, t) => sum + (t.totalFloat || 0), 0)
    const avgFloat = tasks.length > 0 ? totalFloat / tasks.length : 0
    
    return {
      nodes,
      links,
      criticalCount: criticalTasks.length,
      criticalDuration,
      avgFloat,
      totalTasks: tasks.length,
    }
  }, [tasks])
  
  useEffect(() => {
    if (!svgRef.current || isEditing) return
    
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    const margin = { top: 20, right: 20, bottom: 20, left: 20 }
    
    // Create force simulation
    const simulation = d3.forceSimulation(networkData.nodes as any)
      .force('link', d3.forceLink(networkData.links)
        .id((d: any) => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50))
    
    // Create arrow markers
    svg.append('defs').selectAll('marker')
      .data(['critical', 'normal'])
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 25)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', d => d === 'critical' ? '#ef4444' : '#9ca3af')
    
    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(networkData.links)
      .enter().append('line')
      .attr('stroke', d => {
        const sourceNode = networkData.nodes.find(n => n.id === d.source)
        const targetNode = networkData.nodes.find(n => n.id === d.target)
        return sourceNode?.isCritical && targetNode?.isCritical ? '#ef4444' : '#d1d5db'
      })
      .attr('stroke-width', d => {
        const sourceNode = networkData.nodes.find(n => n.id === d.source)
        const targetNode = networkData.nodes.find(n => n.id === d.target)
        return sourceNode?.isCritical && targetNode?.isCritical ? 3 : 2
      })
      .attr('marker-end', d => {
        const sourceNode = networkData.nodes.find(n => n.id === d.source)
        const targetNode = networkData.nodes.find(n => n.id === d.target)
        return sourceNode?.isCritical && targetNode?.isCritical 
          ? 'url(#arrow-critical)' 
          : 'url(#arrow-normal)'
      })
    
    // Create nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(networkData.nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
    
    // Node rectangles
    node.append('rect')
      .attr('width', 120)
      .attr('height', 60)
      .attr('x', -60)
      .attr('y', -30)
      .attr('rx', 8)
      .attr('fill', d => d.isCritical ? '#fee2e2' : '#f3f4f6')
      .attr('stroke', d => d.isCritical ? '#ef4444' : '#d1d5db')
      .attr('stroke-width', d => d.isCritical ? 2 : 1)
    
    // Node text
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -10)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name)
    
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 5)
      .attr('font-size', '10px')
      .attr('fill', '#6b7280')
      .text(d => `Duration: ${d.duration}d`)
    
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 20)
      .attr('font-size', '10px')
      .attr('fill', d => d.float === 0 ? '#ef4444' : '#6b7280')
      .text(d => `Float: ${d.float}d`)
    
    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)
      
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })
    
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }
    
    return () => {
      simulation.stop()
    }
  }, [networkData, isEditing])
  
  if (isEditing) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Critical Path Diagram shows task dependencies and identifies the critical path.
          Drag nodes to rearrange the network visualization.
        </p>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Critical Path Network</span>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-400 rounded" />
            <span className="text-gray-600">Critical Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-400 rounded" />
            <span className="text-gray-600">Non-Critical</span>
          </div>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <div className="text-lg font-semibold text-red-600">
            {networkData.criticalCount}
          </div>
          <div className="text-xs text-gray-500">Critical Tasks</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-lg font-semibold text-orange-600">
            {networkData.criticalDuration}d
          </div>
          <div className="text-xs text-gray-500">Critical Duration</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-semibold text-blue-600">
            {networkData.avgFloat.toFixed(1)}d
          </div>
          <div className="text-xs text-gray-500">Avg Float</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-600">
            {networkData.totalTasks}
          </div>
          <div className="text-xs text-gray-500">Total Tasks</div>
        </div>
      </div>
      
      {/* Network Diagram */}
      <div className="flex-1 min-h-0 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
      
      {/* Legend */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-medium text-amber-800 mb-1">Critical Path Analysis</p>
            <p className="text-amber-700">
              Tasks on the critical path have zero float and directly impact project completion.
              Any delay in these tasks will delay the entire project.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}