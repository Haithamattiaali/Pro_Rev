import React, { useState, useEffect } from 'react'
import { ChevronRight, AlertCircle, CheckCircle, Clock, Building2, Package, MapPin, TrendingUp, PlayCircle, FileText, PenTool, XCircle } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'

const OpportunityPipelineFlow = ({ pipeline }) => {
  const [selectedStage, setSelectedStage] = useState(null)
  const [allOpportunities, setAllOpportunities] = useState([])
  const [filterStage, setFilterStage] = useState('all') // 'all', 'running', 'contract review', 'signing', 'no status'
  const [filterCity, setFilterCity] = useState('all')
  const [filterService, setFilterService] = useState('all') // 'all', '2PL', '3PL'
  
  useEffect(() => {
    // Fetch all opportunities for the cards
    fetch(`${import.meta.env.VITE_API_URL}/opportunities`)
      .then(r => r.json())
      .then(data => {
        if (data?.opportunities) {
          setAllOpportunities(data.opportunities)
        }
      })
      .catch(console.error)
  }, [])
  
  if (!pipeline?.pipeline || pipeline?.totals?.total_opportunities === 0) {
    return (
      <div className="mt-12 bg-gradient-to-br from-white to-secondary-pale/20 rounded-2xl shadow-lg border border-secondary-light/30 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-pale flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Opportunities Data Available</h3>
          <p className="text-gray-500 mb-4">Upload opportunities data to see pipeline analysis and insights</p>
          <p className="text-sm text-gray-400">
            Include opportunities data in the "Opportunities" sheet of your Excel upload
          </p>
        </div>
      </div>
    )
  }
  
  // Sort pipeline stages in the desired order
  const sortStages = (stages) => {
    const stageOrder = ['running', 'contract review', 'signing', 'no status']
    
    return [...stages].sort((a, b) => {
      const aName = a.stage?.toLowerCase() || ''
      const bName = b.stage?.toLowerCase() || ''
      
      // Find index in desired order
      let aIndex = stageOrder.findIndex(s => aName.includes(s))
      let bIndex = stageOrder.findIndex(s => bName.includes(s))
      
      // If not found, put at the end
      if (aIndex === -1) aIndex = stageOrder.length
      if (bIndex === -1) bIndex = stageOrder.length
      
      return aIndex - bIndex
    })
  }
  
  const sortedPipeline = sortStages(pipeline.pipeline)
  
  // Get unique cities and service types from opportunities
  const uniqueCities = [...new Set(allOpportunities.map(opp => opp.location || 'Unknown').filter(loc => loc !== 'Unknown'))].sort()
  const serviceTypes = ['2PL', '3PL']
  
  // Filter opportunities based on all active filters
  const filteredOpportunities = allOpportunities.filter(opp => {
    // Stage filter
    if (filterStage !== 'all') {
      const currentStage = sortedPipeline.find(stage => 
        stage.projects?.some(p => p.project === opp.project)
      )
      if (currentStage?.stage?.toLowerCase() !== filterStage) return false
    }
    
    // City filter
    if (filterCity !== 'all' && opp.location !== filterCity) return false
    
    // Service filter
    if (filterService !== 'all') {
      const is2PL = opp.service?.includes('2PL')
      const is3PL = !is2PL
      if (filterService === '2PL' && !is2PL) return false
      if (filterService === '3PL' && !is3PL) return false
    }
    
    return true
  })
  
  // Calculate dynamic analytics for filtered data
  const filteredAnalytics = {
    totalValue: filteredOpportunities.reduce((sum, opp) => sum + (opp.est_monthly_revenue || 0), 0),
    avgGP: filteredOpportunities.length > 0 
      ? filteredOpportunities.reduce((sum, opp) => sum + (opp.est_gp_percent || 0), 0) / filteredOpportunities.length
      : 0,
    count: filteredOpportunities.length
  }
  
  // Define stage colors and icons using brand colors
  const getStageStyle = (stage) => {
    // Map stages based on their name instead of order for better clarity
    const stageName = stage.stage?.toLowerCase() || ''
    
    if (stageName.includes('running')) {
      return {
        color: 'bg-primary',
        lightColor: 'bg-primary-light/10',
        borderColor: 'border-primary/30',
        textColor: 'text-primary',
        icon: PlayCircle
      }
    } else if (stageName.includes('contract') || stageName.includes('review')) {
      return {
        color: 'bg-accent-blue',
        lightColor: 'bg-accent-blue/10',
        borderColor: 'border-accent-blue/30',
        textColor: 'text-accent-blue',
        icon: FileText
      }
    } else if (stageName.includes('signing') || stageName.includes('sign')) {
      return {
        color: 'bg-secondary',
        lightColor: 'bg-secondary-pale',
        borderColor: 'border-secondary/30',
        textColor: 'text-secondary',
        icon: PenTool
      }
    } else if (stageName.includes('no status') || stageName === 'no status') {
      return {
        color: 'bg-neutral-mid',
        lightColor: 'bg-neutral-light',
        borderColor: 'border-neutral-mid/30',
        textColor: 'text-neutral-mid',
        icon: XCircle
      }
    } else {
      // Default fallback
      return {
        color: 'bg-neutral-mid',
        lightColor: 'bg-neutral-light',
        borderColor: 'border-neutral-mid/30',
        textColor: 'text-neutral-mid',
        icon: AlertCircle
      }
    }
  }
  
  const getGPColor = (gp) => {
    if (gp >= 30) return 'text-primary'
    if (gp >= 20) return 'text-accent-blue'
    return 'text-accent-coral'
  }
  
  return (
    <div className="space-y-6">
      {/* Pipeline Flow Visualization */}
      <div className="bg-gradient-to-br from-white via-secondary-pale/20 to-primary-light/10 rounded-2xl shadow-xl p-8 border border-secondary-light/20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-blue rounded-full blur-3xl"></div>
        </div>
        
        {/* Header Section */}
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-secondary mb-3">Opportunity Pipeline Status Flow</h3>
              <p className="text-base text-neutral-mid">Track opportunities through each stage of the pipeline</p>
            </div>
            
            {/* Pipeline Metrics Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-secondary-light/30">
                <p className="text-xs text-neutral-mid font-medium">Total Pipeline</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(sortedPipeline.reduce((sum, stage) => sum + (stage.total_revenue || 0), 0))}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-secondary-light/30">
                <p className="text-xs text-neutral-mid font-medium">Opportunities</p>
                <p className="text-lg font-bold text-secondary">
                  {sortedPipeline.reduce((sum, stage) => sum + (stage.count || 0), 0)}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-secondary-light/30">
                <p className="text-xs text-neutral-mid font-medium">Avg Deal Size</p>
                <p className="text-lg font-bold text-accent-blue">
                  {formatCurrency(
                    sortedPipeline.reduce((sum, stage) => sum + (stage.total_revenue || 0), 0) / 
                    Math.max(sortedPipeline.reduce((sum, stage) => sum + (stage.count || 0), 0), 1)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pipeline Stages */}
        <div className="relative bg-white rounded-xl p-6 shadow-inner border border-secondary-light/10">
          {/* SVG Curved Paths */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }} viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9e1f63" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#9e1f63" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#9e1f63" stopOpacity="0.1" />
              </linearGradient>
              <filter id="pathGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {sortedPipeline.map((stage, index) => {
              if (index < sortedPipeline.length - 1) {
                const startX = (100 / sortedPipeline.length) * index + (50 / sortedPipeline.length)
                const endX = (100 / sortedPipeline.length) * (index + 1) + (50 / sortedPipeline.length)
                const curveHeight = 30
                const isActive = stage.count > 0
                
                return (
                  <g key={`path-${index}`}>
                    {/* Background Path */}
                    <path
                      d={`M ${startX} 50 Q ${(startX + endX) / 2} ${50 - curveHeight} ${endX} 50`}
                      fill="none"
                      stroke="#e2e1e6"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity="0.5"
                    />
                    {/* Active Path */}
                    {isActive && (
                      <path
                        d={`M ${startX} 50 Q ${(startX + endX) / 2} ${50 - curveHeight} ${endX} 50`}
                        fill="none"
                        stroke="url(#pathGradient)"
                        strokeWidth="3"
                        filter="url(#pathGlow)"
                        className="animate-pulse"
                      />
                    )}
                    {/* Flow Particles */}
                    {isActive && (
                      <circle r="4" fill="#9e1f63" opacity="0.8">
                        <animateMotion
                          dur="3s"
                          repeatCount="indefinite"
                          path={`M ${startX} 50 Q ${(startX + endX) / 2} ${50 - curveHeight} ${endX} 50`}
                        />
                      </circle>
                    )}
                  </g>
                )
              }
              return null
            })}
          </svg>
          
          <div className="flex items-center justify-between mb-8 relative" style={{ zIndex: 10 }}>
            {sortedPipeline.map((stage, index) => {
              const style = getStageStyle(stage)
              const Icon = style.icon
              const isSelected = selectedStage === index
              
              return (
                <div key={index} className="flex-1 relative">
                  {/* Stage Card */}
                  <button
                    onClick={() => setSelectedStage(isSelected ? null : index)}
                    className={`relative z-10 w-full max-w-[200px] mx-auto cursor-pointer transition-all ${
                      isSelected ? 'scale-110' : 'hover:scale-105'
                    }`}
                  >
                    <div className={`relative overflow-hidden ${style.lightColor} rounded-2xl p-5 border-2 ${style.borderColor} backdrop-blur-sm ${
                      isSelected ? 'shadow-2xl ring-2 ring-primary/30' : 'shadow-lg hover:shadow-xl'
                    } transition-all duration-300`}>
                      {/* Background decoration */}
                      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-xl"></div>
                      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-gradient-to-tr from-accent-blue/10 to-transparent blur-lg"></div>
                      
                      {/* Stage Progress Indicator */}
                      <div className="absolute top-2 right-2">
                        <div className="relative w-8 h-8">
                          <svg className="w-8 h-8 transform -rotate-90">
                            <circle
                              cx="16"
                              cy="16"
                              r="14"
                              stroke="#e2e1e6"
                              strokeWidth="2"
                              fill="none"
                            />
                            <circle
                              cx="16"
                              cy="16"
                              r="14"
                              stroke={style.color.replace('bg-primary', '#9e1f63').replace('bg-secondary', '#424046').replace('bg-accent-blue', '#005b8c').replace('bg-neutral-mid', '#717171')}
                              strokeWidth="2"
                              fill="none"
                              strokeDasharray={`${(((index + 1) / sortedPipeline.length) * 88)} 88`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-secondary">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-center mb-3">
                          <div className={`w-16 h-16 rounded-2xl ${style.color} bg-gradient-to-br from-white/30 to-transparent flex items-center justify-center shadow-xl transform ${
                            isSelected ? 'rotate-6 scale-110' : 'hover:rotate-3'
                          } transition-all duration-300`}>
                            <Icon className="w-7 h-7 text-white drop-shadow-lg" />
                          </div>
                        </div>
                        
                        <h4 className={`font-bold ${style.textColor} text-lg mb-1 text-center`}>
                          {stage.stage}
                        </h4>
                        <p className="text-xs text-neutral-mid text-center mb-3">
                          Stage {index + 1} of {sortedPipeline.length}
                        </p>
                        
                        <div className="space-y-3">
                          <div className="text-center">
                            <p className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent leading-none">
                              {stage.count || 0}
                            </p>
                            <p className="text-xs text-neutral-mid font-medium mt-1">opportunities</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-secondary-light/20">
                              <p className="text-xs text-neutral-mid mb-1 font-medium">Pipeline Value</p>
                              <p className="text-base font-bold text-secondary">
                                {formatCurrency(stage.total_revenue || 0)}
                              </p>
                            </div>
                            
                            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-secondary-light/20">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-neutral-mid font-medium">Avg GP</span>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    stage.avg_gp_percent >= 0.3 ? 'bg-primary' : 
                                    stage.avg_gp_percent >= 0.2 ? 'bg-accent-blue' : 'bg-accent-coral'
                                  }`}></div>
                                  <span className={`text-sm font-bold ${getGPColor(stage.avg_gp_percent)}`}>
                                    {((stage.avg_gp_percent || 0) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Conversion Rate to Next Stage */}
                          {index < sortedPipeline.length - 1 && stage.count > 0 && (
                            <div className="pt-2 border-t border-secondary-light/20">
                              <p className="text-xs text-neutral-mid text-center">
                                {sortedPipeline[index + 1].count > 0 ? 
                                  `${((sortedPipeline[index + 1].count / stage.count) * 100).toFixed(0)}% to next` : 
                                  'No conversion'
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
          
          {/* Stage Details - Enhanced with Animation */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            selectedStage !== null && sortedPipeline[selectedStage].projects?.length > 0 ? 'max-h-[600px] opacity-100 mt-6' : 'max-h-0 opacity-0'
          }`}>
            {selectedStage !== null && sortedPipeline[selectedStage].projects?.length > 0 && (
              <div className="bg-gradient-to-br from-secondary-pale to-white rounded-xl p-6 border border-secondary-light/30 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className="text-lg font-bold text-secondary">
                      Projects in {sortedPipeline[selectedStage].stage}
                    </h5>
                    <p className="text-sm text-neutral-mid mt-1">
                      {sortedPipeline[selectedStage].projects.length} opportunities in this stage
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedStage(null)}
                    className="text-neutral-mid hover:text-secondary transition-colors p-2 hover:bg-secondary-pale rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {sortedPipeline[selectedStage].projects.map((project, idx) => {
                    const ServiceIcon = project.service?.includes('2PL') ? Package : Building2
                    const gpClass = project.est_gp_percent >= 0.3 ? 'bg-primary/10 text-primary' : 
                                  project.est_gp_percent >= 0.2 ? 'bg-accent-blue/10 text-accent-blue' : 
                                  'bg-accent-coral/10 text-accent-coral'
                    
                    return (
                      <div 
                        key={idx} 
                        className="group bg-white rounded-xl p-4 border border-secondary-light/30 hover:border-primary/30 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                        style={{
                          animationDelay: `${idx * 50}ms`,
                          animation: 'slideIn 0.5s ease-out forwards'
                        }}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-secondary-pale flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                                <ServiceIcon className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
                              </div>
                              <div>
                                <p className="font-bold text-secondary group-hover:text-primary transition-colors">{project.project}</p>
                                <p className="text-sm text-neutral-mid">{project.service}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="w-3 h-3 text-neutral-mid" />
                                  <p className="text-xs text-neutral-mid">{project.location || 'No location specified'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div>
                              <p className="text-xs text-neutral-mid">Monthly Revenue</p>
                              <p className="font-bold text-primary">
                                {formatCurrency(project.est_monthly_revenue)}
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-sm font-bold ${gpClass}`}>
                              {(project.est_gp_percent * 100).toFixed(1)}% GP
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          
          <style>{`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 3px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #d1d5db;
              border-radius: 3px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #9ca3af;
            }
          `}</style>
        </div>
      </div>
      
      {/* All Opportunity Cards with Filters */}
      <div className="mt-12 bg-gradient-to-br from-white to-secondary-pale/20 rounded-2xl shadow-lg border border-secondary-light/30 p-8">
        {/* Dynamic Analytics Bar */}
        <div className="mb-6 bg-gradient-to-r from-primary/10 via-accent-blue/10 to-secondary/10 rounded-xl p-4 border border-primary/20">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-neutral-mid font-medium">Filtered Value</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(filteredAnalytics.totalValue)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-mid font-medium">Average GP</p>
              <p className="text-2xl font-bold text-accent-blue">{(filteredAnalytics.avgGP * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-neutral-mid font-medium">Opportunities</p>
              <p className="text-2xl font-bold text-secondary">{filteredAnalytics.count}</p>
            </div>
          </div>
        </div>
        
        {/* Header with Filters */}
        <div className="mb-8">
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-2xl font-bold text-secondary">All Opportunities</h3>
              <p className="text-sm text-neutral-mid mt-1">Use filters to analyze specific segments</p>
            </div>
            
            {/* Filter Sections */}
            <div className="space-y-4">
              {/* Stage Filters */}
              <div>
                <p className="text-sm font-semibold text-primary mb-2">Pipeline Stage</p>
                <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStage('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  filterStage === 'all' 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'bg-white text-primary border border-primary/30 hover:border-primary hover:shadow-md hover:bg-primary/5'
                }`}
              >
                All Stages
                <span className="ml-2 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  {allOpportunities.length}
                </span>
              </button>
              
              {sortedPipeline.map((stage) => {
                const style = getStageStyle(stage)
                const Icon = style.icon
                const stageName = stage.stage?.toLowerCase() || ''
                const count = allOpportunities.filter(opp => {
                  const oppStage = sortedPipeline.find(s => 
                    s.projects?.some(p => p.project === opp.project)
                  )
                  return oppStage?.stage?.toLowerCase() === stageName
                }).length
                
                return (
                  <button
                    key={stage.stage}
                    onClick={() => setFilterStage(stageName)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                      filterStage === stageName 
                        ? `${style.color} text-white shadow-lg` 
                        : `bg-white ${style.textColor} border ${style.borderColor} hover:${style.lightColor} hover:shadow-md`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {stage.stage}
                    <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      filterStage === stageName ? 'bg-white/20' : style.lightColor
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
                </div>
              </div>
              
              {/* Service Type Filters */}
              <div>
                <p className="text-sm font-semibold text-primary mb-2">Service Type</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterService('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      filterService === 'all' 
                        ? 'bg-primary text-white shadow-lg' 
                        : 'bg-white text-primary border border-primary/30 hover:border-primary hover:shadow-md hover:bg-primary/5'
                    }`}
                  >
                    All Services
                  </button>
                  {serviceTypes.map(service => {
                    const count = allOpportunities.filter(opp => {
                      const is2PL = opp.service?.includes('2PL')
                      return service === '2PL' ? is2PL : !is2PL
                    }).length
                    const serviceColor = service === '2PL' ? 'primary' : 'accent-blue'
                    
                    return (
                      <button
                        key={service}
                        onClick={() => setFilterService(service)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                          filterService === service 
                            ? `bg-${serviceColor} text-white shadow-lg` 
                            : `bg-white text-${serviceColor} border border-${serviceColor}/30 hover:bg-${serviceColor}/10 hover:shadow-md`
                        }`}
                      >
                        {service === '2PL' ? <Package className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                        {service}
                        <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                          filterService === service ? 'bg-white/20' : `bg-${serviceColor}/10`
                        }`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* City Filters */}
              <div>
                <p className="text-sm font-semibold text-primary mb-2">Location</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterCity('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      filterCity === 'all' 
                        ? 'bg-primary text-white shadow-lg' 
                        : 'bg-white text-primary border border-primary/30 hover:border-primary hover:shadow-md hover:bg-primary/5'
                    }`}
                  >
                    All Locations
                  </button>
                  {uniqueCities.map(city => {
                    const count = allOpportunities.filter(opp => opp.location === city).length
                    
                    return (
                      <button
                        key={city}
                        onClick={() => setFilterCity(city)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                          filterCity === city 
                            ? 'bg-primary text-white shadow-lg' 
                            : 'bg-white text-primary border border-primary/30 hover:border-primary hover:shadow-md hover:bg-primary/5'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                        {city}
                        <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                          filterCity === city ? 'bg-white/20' : 'bg-primary/10'
                        }`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Opportunities Grid with Better Separation */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOpportunities.map((opp, index) => {
            // Find which stage this opportunity belongs to
            const currentStage = sortedPipeline.find(stage => 
              stage.projects?.some(p => p.project === opp.project)
            )
            const stageIndex = currentStage ? sortedPipeline.indexOf(currentStage) : -1
            const stageStyle = currentStage ? getStageStyle(currentStage) : getStageStyle({ order: 0 })
            
            // Get service icon
            const ServiceIcon = opp.service?.includes('2PL') ? Package : Building2
            
            // GP color (est_gp_percent is stored as decimal, e.g., 0.30 = 30%)
            const gpColorClass = opp.est_gp_percent >= 0.30 ? 'text-primary bg-primary-light/20' : 
                               opp.est_gp_percent >= 0.20 ? 'text-accent-blue bg-accent-blue/10' : 
                               'text-accent-coral bg-accent-coral/10'
            
            return (
              <div 
                key={index} 
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-secondary-light/30 transform hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 0.5s ease-out forwards'
                }}
              >
                {/* Status Bar */}
                <div className={`h-1 ${stageStyle.color}`}></div>
                
                {/* Card Content */}
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-secondary">{opp.project}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <ServiceIcon className="w-4 h-4 text-neutral-mid" />
                        <span className="text-sm text-neutral-mid">{opp.service}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${stageStyle.lightColor} ${stageStyle.textColor}`}>
                      {currentStage?.stage || 'Unknown'}
                    </div>
                  </div>
                  
                  {/* Revenue Section */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm text-neutral-mid font-medium">Monthly Revenue</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(opp.est_monthly_revenue)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-neutral-mid">Annual Potential</span>
                      <span className="text-sm font-bold text-secondary">
                        {formatCurrency(opp.est_monthly_revenue * 12)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Metrics Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-secondary-light/30">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-neutral-mid" />
                      <span className="text-sm text-neutral-mid">{opp.location || 'No location'}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-md text-sm font-bold ${gpColorClass}`}>
                      {(opp.est_gp_percent * 100).toFixed(1)}% GP
                    </div>
                  </div>
                  
                  {/* Pipeline Progress */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-neutral-mid mb-2">
                      <span>Pipeline Progress</span>
                      <span>{stageIndex >= 0 ? `Stage ${stageIndex + 1} of ${sortedPipeline.length}` : 'Not Started'}</span>
                    </div>
                    <div className="w-full bg-secondary-pale rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${stageStyle.color}`}
                        style={{ 
                          width: stageIndex >= 0 ? `${((stageIndex + 1) / sortedPipeline.length) * 100}%` : '0%' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* No Results Message */}
        {filteredOpportunities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-mid text-lg">No opportunities found matching your filters</p>
            <button 
              onClick={() => {
                setFilterStage('all')
                setFilterCity('all')
                setFilterService('all')
              }}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default OpportunityPipelineFlow