import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import dataService from '../../services/dataService'

const OpportunityManager = ({ opportunities, forecastConfig, onOpportunitiesChange, onConfigChange }) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newOpportunity, setNewOpportunity] = useState({
    customer: '',
    service_type: 'Transportation',
    target_value: '',
    probability: 0.5,
    start_month: 1,
    duration: 12,
    enabled: true
  })

  const handleAddOpportunity = async () => {
    try {
      const opportunity = await dataService.createForecastOpportunity({
        ...newOpportunity,
        target_value: parseFloat(newOpportunity.target_value.replace(/,/g, '')) || 0
      })
      onOpportunitiesChange([...opportunities, opportunity])
      setIsAdding(false)
      setNewOpportunity({
        customer: '',
        service_type: 'Transportation',
        target_value: '',
        probability: 0.5,
        start_month: 1,
        duration: 12,
        enabled: true
      })
    } catch (err) {
      console.error('Error adding opportunity:', err)
    }
  }

  const handleUpdateOpportunity = async (id, field, value) => {
    try {
      const updates = { [field]: value }
      if (field === 'target_value') {
        updates[field] = parseFloat(value.replace(/,/g, '')) || 0
      }
      
      await dataService.updateForecastOpportunity(id, updates)
      const updated = opportunities.map(opp => 
        opp.id === id ? { ...opp, ...updates } : opp
      )
      onOpportunitiesChange(updated)
    } catch (err) {
      console.error('Error updating opportunity:', err)
    }
  }

  const handleDeleteOpportunity = async (id) => {
    try {
      await dataService.deleteForecastOpportunity(id)
      onOpportunitiesChange(opportunities.filter(opp => opp.id !== id))
    } catch (err) {
      console.error('Error deleting opportunity:', err)
    }
  }

  const handleConfigUpdate = (field, value) => {
    const newConfig = { ...forecastConfig, [field]: value }
    onConfigChange(newConfig)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Opportunity Pipeline</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Opportunity
        </button>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {isAdding && (
          <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
            <div className="grid grid-cols-6 gap-4 items-end">
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Customer</label>
                <input
                  type="text"
                  value={newOpportunity.customer}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, customer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Service Type</label>
                <select
                  value={newOpportunity.service_type}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, service_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Transportation">Transportation</option>
                  <option value="Warehouses">Warehouses</option>
                  <option value="3PL" title="Total of Transportation + Warehouses">3PL (Total)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Opportunity Total Value</label>
                <input
                  type="text"
                  value={newOpportunity.target_value}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, target_value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="1,000,000"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Probability</label>
                <select
                  value={newOpportunity.probability}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, probability: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (
                    <option key={p} value={p/100}>{p}%</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAddOpportunity}
                  disabled={!newOpportunity.customer || !newOpportunity.target_value}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Month</label>
                <input
                  type="number"
                  value={newOpportunity.start_month}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, start_month: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                  min="1"
                  max="12"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Duration (months)</label>
                <input
                  type="number"
                  value={newOpportunity.duration}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, duration: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                  min="1"
                  max="36"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Monthly Value</label>
                <div className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                  {formatCurrency((parseFloat(newOpportunity.target_value.replace(/,/g, '')) || 0) / newOpportunity.duration)}
                </div>
              </div>
            </div>
          </div>
        )}

        {opportunities.map((opp) => (
          <div key={opp.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="grid grid-cols-6 gap-4 items-center">
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Customer</label>
                <input
                  type="text"
                  value={opp.customer}
                  onChange={(e) => handleUpdateOpportunity(opp.id, 'customer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Service Type</label>
                <select
                  value={opp.service_type}
                  onChange={(e) => handleUpdateOpportunity(opp.id, 'service_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Transportation">Transportation</option>
                  <option value="Warehouses">Warehouses</option>
                  <option value="3PL" title="Total of Transportation + Warehouses">3PL (Total)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Opportunity Total Value</label>
                <input
                  type="text"
                  value={opp.target_value.toLocaleString()}
                  onChange={(e) => handleUpdateOpportunity(opp.id, 'target_value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Probability</label>
                <select
                  value={opp.probability}
                  onChange={(e) => handleUpdateOpportunity(opp.id, 'probability', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (
                    <option key={p} value={p/100}>{p}%</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={opp.enabled}
                    onChange={(e) => handleUpdateOpportunity(opp.id, 'enabled', e.target.checked)}
                    className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="text-sm">Active</span>
                </label>
                <button
                  onClick={() => handleDeleteOpportunity(opp.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Month</label>
                <input
                  type="number"
                  value={opp.start_month}
                  onChange={(e) => handleUpdateOpportunity(opp.id, 'start_month', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                  min="1"
                  max="12"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Duration (months)</label>
                <input
                  type="number"
                  value={opp.duration}
                  onChange={(e) => handleUpdateOpportunity(opp.id, 'duration', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                  min="1"
                  max="36"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Monthly Value</label>
                <div className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                  {formatCurrency(opp.target_value / opp.duration)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Forecast Configuration */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecast Configuration</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forecast Period (months)
            </label>
            <input
              type="number"
              value={forecastConfig.periods}
              onChange={(e) => handleConfigUpdate('periods', parseInt(e.target.value) || 6)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              min="1"
              max="12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Include Opportunities
            </label>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={forecastConfig.includeOpportunities}
                onChange={(e) => handleConfigUpdate('includeOpportunities', e.target.checked)}
                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="text-sm">Include in forecast</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Probability
            </label>
            <input
              type="range"
              value={forecastConfig.probabilityThreshold}
              onChange={(e) => handleConfigUpdate('probabilityThreshold', parseFloat(e.target.value))}
              className="w-full"
              min="0"
              max="1"
              step="0.1"
            />
            <div className="text-center text-sm text-gray-600 mt-1">
              {(forecastConfig.probabilityThreshold * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpportunityManager