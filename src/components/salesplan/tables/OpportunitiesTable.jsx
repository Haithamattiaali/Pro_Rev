import React, { useState, useMemo, useEffect } from 'react'
import { ChevronUp, ChevronDown, MapPin } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'
import TableExportButton from '../../buttons/TableExportButton'
import dataService from '../../../services/dataService'

const OpportunitiesTable = ({ data }) => {
  const [sortField, setSortField] = useState('est_monthly_revenue')
  const [sortDirection, setSortDirection] = useState('desc')
  const [groupBy, setGroupBy] = useState('none')
  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const [locationData, setLocationData] = useState(null)
  
  // Fetch location insights
  useEffect(() => {
    dataService.getOpportunitiesByLocation().then(setLocationData).catch(console.error)
  }, [])
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!data?.opportunities || data.opportunities.length === 0) return []
    
    return [...data.opportunities].sort((a, b) => {
      const aValue = a[sortField] || 0
      const bValue = b[sortField] || 0
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      }
      return aValue < bValue ? 1 : -1
    })
  }, [data, sortField, sortDirection])
  
  // Group data
  const groupedData = useMemo(() => {
    if (groupBy === 'none') return { 'All Opportunities': sortedData }
    
    const groups = {}
    sortedData.forEach(opp => {
      const key = opp[groupBy] || 'Unspecified'
      if (!groups[key]) groups[key] = []
      groups[key].push(opp)
    })
    
    return groups
  }, [sortedData, groupBy])
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }
  
  const toggleGroup = (group) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    setExpandedGroups(newExpanded)
  }
  
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />
  }
  
  if (!data?.opportunities || data.opportunities.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No opportunities data available</p>
      </div>
    )
  }
  
  const totalRevenue = sortedData.reduce((sum, opp) => sum + (opp.est_monthly_revenue || 0), 0)
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-900">Opportunities Details</h4>
            {locationData && (
              <p className="text-sm text-gray-600 mt-1">
                {locationData.locations.length} key locations • {data.opportunities.length} total opportunities
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="none">No Grouping</option>
              <option value="location">Group by Location</option>
              <option value="service">Group by Service</option>
            </select>
            <TableExportButton
              data={sortedData.map(opp => ({
                'Project': opp.project,
                'Location': opp.location || 'N/A',
                'Service': opp.service,
                'Monthly Revenue': opp.est_monthly_revenue,
                'Annual Revenue': opp.est_monthly_revenue * 12,
                'GP %': opp.est_gp_percent
              }))}
              filename="opportunities-details"
              title="Opportunities Details"
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Project / Location
                </span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Service
                </span>
              </th>
              <th className="px-6 py-3 text-right">
                <button
                  onClick={() => handleSort('est_monthly_revenue')}
                  className="text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900"
                >
                  Revenue
                  <SortIcon field="est_monthly_revenue" />
                </button>
              </th>
              <th className="px-6 py-3 text-right">
                <button
                  onClick={() => handleSort('est_gp_percent')}
                  className="text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900"
                >
                  GP %
                  <SortIcon field="est_gp_percent" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(groupedData).map(([group, opportunities]) => (
              <React.Fragment key={group}>
                {groupBy !== 'none' && (
                  <tr 
                    className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
                    onClick={() => toggleGroup(group)}
                  >
                    <td colSpan="4" className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
                            !expandedGroups.has(group) ? '-rotate-90' : ''
                          }`} />
                          <span className="font-medium text-gray-900">{group}</span>
                          <span className="text-sm text-gray-600">({opportunities.length} opportunities)</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">
                            {formatCurrency(opportunities.reduce((sum, opp) => sum + (opp.est_monthly_revenue || 0), 0))}
                          </span>
                          <span className="text-gray-600"> total</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {(groupBy === 'none' || expandedGroups.has(group)) && opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opp.project}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{opp.location || 'Unspecified'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {opp.service}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(opp.est_monthly_revenue)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatCurrency(opp.est_monthly_revenue * 12)}/year
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-medium ${
                        opp.est_gp_percent >= 30 ? 'text-green-600' : 
                        opp.est_gp_percent >= 20 ? 'text-gray-900' : 'text-red-600'
                      }`}>
                        {opp.est_gp_percent?.toFixed(1) || '0.0'}%
                      </span>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 border-t-2 border-gray-300">
            <tr>
              <td colSpan="2" className="px-6 py-4">
                <span className="text-sm font-semibold text-gray-900">
                  Total ({data.opportunities.length} opportunities)
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div>
                  <p className="text-sm font-bold text-primary">
                    {formatCurrency(totalRevenue)}
                  </p>
                  <p className="text-xs font-semibold text-primary-dark">
                    {formatCurrency(totalRevenue * 12)}/year
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm font-medium text-gray-700">
                  {(data.summary?.avg_gp_percent || 0).toFixed(1)}% avg
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default OpportunitiesTable